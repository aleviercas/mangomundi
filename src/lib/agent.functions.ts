import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ChatInput = z.object({
  sessionId: z.string().min(1).max(128),
  message: z.string().min(1).max(2000),
});

const LeadInput = z.object({
  email: z.string().email().max(255),
  featureSource: z.string().min(1).max(120),
});

const HistoryInput = z.object({
  sessionId: z.string().min(1).max(128),
});

// Pattern: "500 GBP to ARS", "1,000 USD -> MXN", "1000 EUR → USD"
const FX_PATTERN = /(\d[\d,\.]*)\s*([A-Za-z]{3})\s*(?:to|→|->|a|en)\s*([A-Za-z]{3})/i;

// Loose amount detection for business heuristic (any number in the message)
const AMOUNT_ANY = /(\d[\d,\.]{2,})/g;

const BUSINESS_KEYWORDS =
  /\b(finanzas?|equipo|empresa|empresarial|treasury|tesorer[ií]a|corporate|corporativ\w*|volumen|enterprise|business|mesa\s+de\s+cambio|n[oó]mina|payroll|b2b)\b/i;

// Rough USD-equivalents for the business threshold
const USD_EQUIV: Record<string, number> = {
  USD: 1, EUR: 1.08, GBP: 1.27, CHF: 1.12, CAD: 0.73, AUD: 0.66,
  MXN: 0.058, BRL: 0.2, ARS: 0.001, CLP: 0.001, COP: 0.00025, PEN: 0.27,
  JPY: 0.0064,
};

function toUsd(amount: number, ccy?: string): number {
  if (!ccy) return amount;
  const rate = USD_EQUIV[ccy.toUpperCase()];
  return rate ? amount * rate : amount;
}

function detectBusiness(message: string, amount?: number, from?: string): boolean {
  if (BUSINESS_KEYWORDS.test(message)) return true;
  if (amount && from && toUsd(amount, from) >= 10000) return true;
  // Fallback: any large standalone number in message
  if (!amount) {
    const matches = message.match(AMOUNT_ANY) || [];
    for (const m of matches) {
      const n = parseFloat(m.replace(/,/g, ""));
      if (!isNaN(n) && n >= 10000) return true;
    }
  }
  return false;
}

interface RateRow {
  provider_slug: string;
  rate: number;
  fee: number;
}

function businessReply(amount: number | null, from: string | null, to: string | null): string {
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const pair = from && to ? ` para **${from} → ${to}**` : "";
  const volumeLine =
    amount && from
      ? `Sobre un volumen de **${fmt(amount)} ${from}**, eso representa aproximadamente **${fmt(amount * 0.008)} ${from}** que se quedan en spreads ocultos de la banca tradicional.`
      : `En operaciones corporativas, los spreads ocultos de la banca tradicional erosionan en promedio **~0.8%** vs. mid-market.`;

  return [
    `Detectamos una consulta de **perfil corporativo / treasury**${pair}.`,
    "",
    volumeLine,
    "",
    `Con **mangoglobal** optimizamos tu mesa de cambio a **tasa interbancaria pura**, ejecución multi-proveedor y reporting consolidado — eliminando el costo invisible del FX.`,
    "",
    `Te abrimos acceso prioritario al **Copilot B2B** en la siguiente ventana →`,
  ].join("\n");
}

async function fxMarkdown(
  amount: number,
  from: string,
  to: string,
  rates: RateRow[],
): Promise<string> {
  if (rates.length === 0) {
    return `No tengo cotizaciones cargadas para **${from} → ${to}** todavía. Probá con GBP→ARS, USD→ARS, EUR→USD o USD→MXN.`;
  }
  const ranked = rates
    .map((r) => ({
      provider: r.provider_slug,
      net: amount * Number(r.rate) - Number(r.fee),
      rate: Number(r.rate),
      fee: Number(r.fee),
    }))
    .sort((a, b) => b.net - a.net);

  const top = ranked.slice(0, 3);
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  const lines = [
    `Para enviar **${fmt(amount)} ${from} → ${to}** hoy, el mejor neto es:`,
    "",
    ...top.map((r, i) => {
      const badge = i === 0 ? " 🏆" : "";
      return `${i + 1}. **${r.provider}**${badge} — recibís **${fmt(r.net)} ${to}** _(tasa ${r.rate}, fee ${r.fee})_`;
    }),
    "",
    `Diferencia entre #1 y #${top.length}: **${fmt(top[0].net - top[top.length - 1].net)} ${to}**.`,
  ];
  return lines.join("\n");
}

async function callLovableAI(messages: { role: string; content: string }[]): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    return "El motor IA no está configurado. Pediles a un admin que active Lovable AI.";
  }
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            "Sos el copiloto FX neutral de mangoglobal. Respondés en el idioma del usuario (ES/EN/PT). Tono ejecutivo, conciso. Ayudás a comparar proveedores FX (Wise, Revolut, Western Union, Xoom, etc.), explicar spreads, fees y corridors retail/B2B. Si el usuario pide una cotización con monto+par de divisas, sugerile que escriba 'monto FROM to TO' (ej: '500 GBP to ARS'). Nunca prometés tasas en vivo: trabajás con las cotizaciones cargadas en la plataforma.",
        },
        ...messages,
      ],
    }),
  });
  if (!res.ok) {
    if (res.status === 429) return "Demasiadas consultas en este momento. Probá de nuevo en un minuto.";
    if (res.status === 402) return "Se agotó el crédito de IA. Avisale al equipo.";
    return "No pude procesar la consulta ahora. Probá reformulando.";
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() || "Sin respuesta.";
}

export const chatTurn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Resolve or create conversation
    const { data: existing } = await supabaseAdmin
      .from("chat_conversations")
      .select("id")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let convId = existing?.id as string | undefined;
    if (!convId) {
      const { data: created, error } = await supabaseAdmin
        .from("chat_conversations")
        .insert({ session_id: data.sessionId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      convId = created.id;
    }

    // Persist user message
    await supabaseAdmin.from("chat_messages").insert({
      conversation_id: convId,
      role: "user",
      content: data.message,
    });

    // Try regex FX match first
    let reply = "";
    const match = data.message.match(FX_PATTERN);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ""));
      const from = match[2].toUpperCase();
      const to = match[3].toUpperCase();
      const { data: rates } = await supabaseAdmin
        .from("fx_rates")
        .select("provider_slug, rate, fee")
        .eq("from_currency", from)
        .eq("to_currency", to);
      reply = await fxMarkdown(amount, from, to, (rates as RateRow[]) || []);
    } else {
      // Recent history (last 8 turns)
      const { data: history } = await supabaseAdmin
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
        .limit(16);
      const cleaned = (history || [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));
      reply = await callLovableAI(cleaned);
    }

    // Persist assistant reply
    await supabaseAdmin.from("chat_messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: reply,
    });

    return { reply };
  });

export const getChatHistory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => HistoryInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conv } = await supabaseAdmin
      .from("chat_conversations")
      .select("id")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!conv) return { messages: [] as { role: string; content: string }[] };
    const { data: messages } = await supabaseAdmin
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    return { messages: (messages || []) as { role: string; content: string }[] };
  });

export const captureEnterpriseLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LeadInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("enterprise_leads").insert({
      email: data.email,
      feature_source: data.featureSource,
      status: "beta_pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
