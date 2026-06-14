import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Locale = "en" | "es" | "pt";

const ChatInput = z.object({
  sessionId: z.string().min(1).max(128),
  message: z.string().min(1).max(4000),
  locale: z.enum(["en", "es", "pt"]).default("en"),
});

const LeadInput = z.object({
  email: z.string().email().max(255),
  featureSource: z.string().min(1).max(120),
  consent: z.literal(true),
});

const BusinessLeadInput = z.object({
  email: z.string().trim().email().max(255),
  monthlyVolume: z.number().positive().finite().max(1e15),
  sector: z.string().trim().min(2).max(120),
  fromCurrency: z.string().length(3).regex(/^[A-Z]{3}$/),
  toCurrency: z.string().length(3).regex(/^[A-Z]{3}$/),
  sendingCountry: z.string().length(2),
  receivingCountry: z.string().length(2),
  locale: z.string().min(2).max(5),
  consent: z.literal(true),
  topProviders: z.array(z.string().trim().min(1).max(120)).max(2).default([]),
});

const InquiryInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10).max(2000),
});

// In-memory rate limit (best-effort; resets on worker recycle).
const RATE_BUCKETS = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20; // requests per window per session
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = RATE_BUCKETS.get(key);
  if (!bucket || bucket.resetAt < now) {
    RATE_BUCKETS.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count += 1;
  return true;
}

const HistoryInput = z.object({
  sessionId: z.string().min(1).max(128),
});

// Pattern: "500 GBP to ARS", "1,000 USD -> MXN", "1000 EUR → USD"
const FX_PATTERN = /(\d[\d,\.]*)\s*([A-Za-z]{3})\s*(?:to|→|->|a|en|para)\s*([A-Za-z]{3})/i;

// Loose amount detection for business heuristic (any number in the message)
const AMOUNT_ANY = /(\d[\d,\.]{2,})/g;

const BUSINESS_KEYWORDS =
  /\b(finanzas?|equipo|empresa|empresarial|treasury|tesorer[ií]a|corporate|corporativ\w*|volumen|enterprise|business|mesa\s+de\s+cambio|n[oó]mina|payroll|b2b|empresarial|institucional)\b/i;

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

const BUSINESS_THRESHOLD_USD = 10_000;

function detectBusiness(message: string, amount?: number, from?: string): boolean {
  if (BUSINESS_KEYWORDS.test(message)) return true;
  if (amount && from && toUsd(amount, from) >= BUSINESS_THRESHOLD_USD) return true;
  if (!amount) {
    const matches = message.match(AMOUNT_ANY) || [];
    for (const m of matches) {
      const n = parseFloat(m.replace(/,/g, ""));
      if (!isNaN(n) && n >= BUSINESS_THRESHOLD_USD) return true;
    }
  }
  return false;
}

interface RateRow {
  provider_slug: string;
  rate: number;
  fee: number;
}

const T = {
  noRates: {
    en: (from: string, to: string) =>
      `No live rates loaded for **${from} → ${to}** yet. Try GBP→ARS, USD→ARS, EUR→USD or USD→MXN.`,
    es: (from: string, to: string) =>
      `Aún no hay tasas cargadas para **${from} → ${to}**. Probá con GBP→ARS, USD→ARS, EUR→USD o USD→MXN.`,
    pt: (from: string, to: string) =>
      `Ainda não há taxas carregadas para **${from} → ${to}**. Tente GBP→ARS, USD→ARS, EUR→USD ou USD→MXN.`,
  },
  quote: {
    en: (amt: string, from: string, to: string) =>
      `To send **${amt} ${from} → ${to}** today, the best net is:`,
    es: (amt: string, from: string, to: string) =>
      `Para enviar **${amt} ${from} → ${to}** hoy, el mejor neto es:`,
    pt: (amt: string, from: string, to: string) =>
      `Para enviar **${amt} ${from} → ${to}** hoje, o melhor líquido é:`,
  },
  receives: {
    en: (n: string, ccy: string, rate: number, fee: number) =>
      `recipient gets **${n} ${ccy}** _(rate ${rate}, fee ${fee})_`,
    es: (n: string, ccy: string, rate: number, fee: number) =>
      `recibís **${n} ${ccy}** _(tasa ${rate}, fee ${fee})_`,
    pt: (n: string, ccy: string, rate: number, fee: number) =>
      `o destinatário recebe **${n} ${ccy}** _(taxa ${rate}, fee ${fee})_`,
  },
  diff: {
    en: (n: string, ccy: string, k: number) =>
      `Difference between #1 and #${k}: **${n} ${ccy}**.`,
    es: (n: string, ccy: string, k: number) =>
      `Diferencia entre #1 y #${k}: **${n} ${ccy}**.`,
    pt: (n: string, ccy: string, k: number) =>
      `Diferença entre #1 e #${k}: **${n} ${ccy}**.`,
  },
};

function rfqReply(amount: number | null, from: string | null, to: string | null, locale: Locale): string {
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const pair = from && to ? ` **${from} → ${to}**` : "";
  const vol = amount && from ? ` (≈ ${fmt(amount)} ${from})` : "";

  if (locale === "es") {
    return [
      `🛰️ **Aviso de Cumplimiento — Mesa de Cotización Directa (RFQ)**`,
      ``,
      `Tu solicitud${pair}${vol} supera el umbral retail de 10,000 USD.`,
      `Debido a la volatilidad del mercado mayorista interbancario, se requiere una **Solicitud de Cotización Directa (RFQ)** no pública.`,
      ``,
      `Iniciaremos un protocolo de licitación privada con las mesas de dinero autorizadas. Las cotizaciones vinculantes llegarán a tu correo institucional en **< 2 horas**.`,
      ``,
      `👉 Activá el terminal RFQ en la siguiente ventana.`,
    ].join("\n");
  }
  if (locale === "pt") {
    return [
      `🛰️ **Aviso de Compliance — Mesa de Cotação Direta (RFQ)**`,
      ``,
      `Sua solicitação${pair}${vol} ultrapassa o limite retail de 10.000 USD.`,
      `Devido à volatilidade do mercado atacadista interbancário, é necessária uma **Solicitação de Cotação Direta (RFQ)** não pública.`,
      ``,
      `Iniciaremos um protocolo de licitação privada com as mesas autorizadas. Cotações vinculantes chegarão ao seu email institucional em **< 2 horas**.`,
      ``,
      `👉 Ative o terminal RFQ na próxima janela.`,
    ].join("\n");
  }
  return [
    `🛰️ **Compliance Notice — Direct Quotation Desk (RFQ)**`,
    ``,
    `Your request${pair}${vol} exceeds the 10,000 USD retail threshold.`,
    `Due to wholesale interbank volatility a non-public **Direct Quotation Request (RFQ)** is required.`,
    ``,
    `We will run a private bidding protocol with authorised money desks. Binding quotes will reach your corporate inbox within **< 2 hours**.`,
    ``,
    `👉 Activate the RFQ terminal in the next window.`,
  ].join("\n");
}

async function fxMarkdown(
  amount: number,
  from: string,
  to: string,
  rates: RateRow[],
  locale: Locale,
): Promise<string> {
  if (rates.length === 0) return T.noRates[locale](from, to);
  const ranked = rates
    .map((r) => ({
      provider: r.provider_slug,
      net: amount * Number(r.rate) - Number(r.fee),
      rate: Number(r.rate),
      fee: Number(r.fee),
    }))
    .sort((a, b) => b.net - a.net);

  const top = ranked.slice(0, 3);
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  const lines = [
    T.quote[locale](fmt(amount), from, to),
    "",
    ...top.map((r, i) => {
      const badge = i === 0 ? " 🏆" : "";
      return `${i + 1}. **${r.provider}**${badge} — ${T.receives[locale](fmt(r.net), to, r.rate, r.fee)}`;
    }),
    "",
    T.diff[locale](fmt(top[0].net - top[top.length - 1].net), to, top.length),
  ];
  return lines.join("\n");
}

const SYSTEM_PROMPTS: Record<Locale, string> = {
  en: "You are the mangoglobal FX copilot. ALWAYS respond strictly in English. Never mix languages. Executive, concise tone. You help compare neutral FX providers (Wise, Revolut, Western Union, Xoom, etc.), explain spreads, fees and retail/B2B corridors. If the user wants a quote, ask them to write 'amount FROM to TO' (e.g. '500 GBP to ARS'). Never invent live rates — only work with the rates loaded on the platform.",
  es: "Sos el copiloto FX de mangoglobal. Respondé SIEMPRE en español, sin mezclar idiomas. Tono ejecutivo, conciso. Ayudás a comparar proveedores FX neutrales (Wise, Revolut, Western Union, Xoom, etc.), explicar spreads, fees y corredores retail/B2B. Si piden una cotización con monto+par, indicales que escriban 'monto FROM to TO' (ej: '500 GBP to ARS'). Nunca inventés tasas en vivo — trabajás con las cargadas en la plataforma.",
  pt: "Você é o copiloto FX da mangoglobal. Responda SEMPRE em português, sem misturar idiomas. Tom executivo e conciso. Ajuda a comparar provedores FX neutros (Wise, Revolut, Western Union, Xoom, etc.), explicar spreads, taxas e corredores retail/B2B. Se pedirem uma cotação, oriente a digitar 'valor FROM to TO' (ex: '500 GBP to ARS'). Nunca invente taxas ao vivo — trabalha com as carregadas na plataforma.",
};

async function callLovableAI(
  messages: { role: string; content: string }[],
  locale: Locale,
): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    return locale === "es"
      ? "El motor IA no está configurado."
      : locale === "pt"
        ? "O motor de IA não está configurado."
        : "The AI engine is not configured.";
  }
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: SYSTEM_PROMPTS[locale] }, ...messages],
    }),
  });
  if (!res.ok) {
    if (res.status === 429)
      return locale === "es"
        ? "Demasiadas consultas. Probá en un minuto."
        : locale === "pt"
          ? "Muitas consultas. Tente em um minuto."
          : "Too many requests. Try again in a minute.";
    if (res.status === 402)
      return locale === "es"
        ? "Se agotó el crédito de IA."
        : locale === "pt"
          ? "Crédito de IA esgotado."
          : "AI credit exhausted.";
    return locale === "es"
      ? "No pude procesar la consulta."
      : locale === "pt"
        ? "Não consegui processar a consulta."
        : "Couldn't process the request.";
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() || "—";
}

export const chatTurn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    if (!checkRateLimit(`chat:${data.sessionId}`)) {
      const locale = data.locale as Locale;
      const msg =
        locale === "es"
          ? "Demasiadas consultas. Probá en un minuto."
          : locale === "pt"
            ? "Muitas consultas. Tente em um minuto."
            : "Too many requests. Try again in a minute.";
      return { reply: msg, segment: "retail" as const, context: {} };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const locale = data.locale as Locale;

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

    await supabaseAdmin.from("chat_messages").insert({
      conversation_id: convId,
      role: "user",
      content: data.message,
    });

    let reply = "";
    let segment: "retail" | "business" | "rfq" = "retail";
    let context: {
      amount?: number;
      fromCurrency?: string;
      toCurrency?: string;
    } = {};

    const match = data.message.match(FX_PATTERN);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ""));
      const from = match[2].toUpperCase();
      const to = match[3].toUpperCase();
      context = { amount, fromCurrency: from, toCurrency: to };

      if (detectBusiness(data.message, amount, from)) {
        segment = "rfq";
        reply = rfqReply(amount, from, to, locale);
      } else {
        const { data: rates } = await supabaseAdmin
          .from("fx_rates")
          .select("provider_slug, rate, fee")
          .eq("from_currency", from)
          .eq("to_currency", to);
        reply = await fxMarkdown(amount, from, to, (rates as RateRow[]) || [], locale);
      }
    } else if (detectBusiness(data.message)) {
      segment = "rfq";
      reply = rfqReply(null, null, null, locale);
    } else {
      const { data: history } = await supabaseAdmin
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
        .limit(16);
      const cleaned = (history || [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));
      reply = await callLovableAI(cleaned, locale);
    }

    await supabaseAdmin.from("chat_messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: reply,
    });

    return { reply, segment, context };
  });

export const getChatHistory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => HistoryInput.parse(input))
  .handler(async ({ data }) => {
    if (!checkRateLimit(`hist:${data.sessionId}`)) {
      return { messages: [] as { role: string; content: string }[] };
    }
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
      privacy_consent: true,
      consent_timestamp: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const captureBusinessLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BusinessLeadInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const consentAt = new Date().toISOString();
    const requestId = `B2B-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const { error } = await supabaseAdmin.from("enterprise_leads").insert({
      email: data.email,
      feature_source: "comparator_conversational_agent",
      status: "pending",
      request_id: requestId,
      from_currency: data.fromCurrency,
      to_currency: data.toCurrency,
      amount: data.monthlyVolume,
      monthly_volume: data.monthlyVolume,
      sector: data.sector,
      segment: "business",
      sending_country: data.sendingCountry,
      receiving_country: data.receivingCountry,
      locale: data.locale,
      privacy_consent: true,
      consent_timestamp: consentAt,
    });
    if (error) throw new Error(error.message);

    const webhookUrl = process.env.RFQ_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "enterprise_lead.created",
            request_id: requestId,
            email: data.email,
            monthly_volume: data.monthlyVolume,
            sector: data.sector,
            from_currency: data.fromCurrency,
            to_currency: data.toCurrency,
            sending_country: data.sendingCountry,
            receiving_country: data.receivingCountry,
            consent_at: consentAt,
            top_providers: data.topProviders,
          }),
        });
      } catch (error) {
        console.error("[enterprise-lead] webhook dispatch failed", error);
      }
    }
    return { ok: true, requestId, emailQueued: false };
  });

export const captureGeneralInquiry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InquiryInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("leads").insert({
      name: data.name,
      email: data.email,
      company: data.company ?? null,
      message: data.message,
      source: "about_contact_form",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
