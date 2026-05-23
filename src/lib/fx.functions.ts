import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---------- Types ----------
export interface Provider {
  slug: string;
  name: string;
  logo_emoji: string | null;
  segment: "retail" | "business" | "both";
  fee_percent: number;
  fee_fixed: number;
  spread_percent: number;
  speed_hours: number;
  affiliate_url: string;
  featured: boolean;
  notes: string | null;
}

export interface ComparisonRow {
  slug: string;
  name: string;
  logo_emoji: string | null;
  segment: string;
  featured: boolean;
  notes: string | null;
  affiliate_url: string;
  rate: number;
  fee_total: number;
  received: number;
  speed_hours: number;
}

export interface ComparisonResult {
  market_rate: number;
  base: string;
  quote: string;
  amount: number;
  segment: string;
  rows: ComparisonRow[];
  fetched_at: string;
}

// ---------- Rates cache (per worker instance, 10 min) ----------
let ratesCache: { data: Record<string, number>; base: string; ts: number } | null = null;
const RATES_TTL_MS = 10 * 60 * 1000;

async function fetchRates(): Promise<{ data: Record<string, number>; base: string }> {
  if (ratesCache && Date.now() - ratesCache.ts < RATES_TTL_MS) {
    return { data: ratesCache.data, base: ratesCache.base };
  }
  const appId = process.env.OPENEXCHANGE_APP_ID;
  if (!appId) throw new Error("OPENEXCHANGE_APP_ID not configured");
  const res = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${appId}`);
  if (!res.ok) throw new Error(`Rates API ${res.status}`);
  const json = (await res.json()) as { base: string; rates: Record<string, number> };
  ratesCache = { data: json.rates, base: json.base, ts: Date.now() };
  return { data: json.rates, base: json.base };
}

// ---------- getProviders ----------
export const getProviders = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("providers")
    .select("*")
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Provider[];
});

// ---------- compareProviders ----------
const compareSchema = z.object({
  amount: z.number().min(1).max(10_000_000),
  from: z.string().length(3).regex(/^[A-Z]{3}$/),
  to: z.string().length(3).regex(/^[A-Z]{3}$/),
  segment: z.enum(["retail", "business"]).default("retail"),
});

export const compareProviders = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => compareSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: providers, error } = await supabaseAdmin
      .from("providers")
      .select("*")
      .eq("active", true)
      .in("segment", [data.segment, "both"]);
    if (error) throw new Error(error.message);

    const { data: rates, base } = await fetchRates();
    const fromRate = data.from === base ? 1 : rates[data.from];
    const toRate = data.to === base ? 1 : rates[data.to];
    if (!fromRate || !toRate) throw new Error(`Currency not supported: ${data.from}/${data.to}`);
    const marketRate = toRate / fromRate;

    const rows: ComparisonRow[] = (providers as Provider[]).map((p) => {
      const fee = (p.fee_percent / 100) * data.amount + Number(p.fee_fixed);
      const rate = marketRate * (1 - p.spread_percent / 100);
      const received = Math.max(0, (data.amount - fee) * rate);
      return {
        slug: p.slug,
        name: p.name,
        logo_emoji: p.logo_emoji,
        segment: p.segment,
        featured: p.featured,
        notes: p.notes,
        affiliate_url: p.affiliate_url,
        rate,
        fee_total: fee,
        received,
        speed_hours: Number(p.speed_hours),
      };
    });
    rows.sort((a, b) => b.received - a.received);

    return {
      market_rate: marketRate,
      base: data.from,
      quote: data.to,
      amount: data.amount,
      segment: data.segment,
      rows,
      fetched_at: new Date().toISOString(),
    } satisfies ComparisonResult;
  });

// ---------- trackAffiliateClick ----------
const trackSchema = z.object({
  provider_slug: z.string().min(1).max(64),
  amount: z.number().nullable().optional(),
  from_currency: z.string().length(3).optional(),
  to_currency: z.string().length(3).optional(),
  segment: z.string().max(32).optional(),
  referrer: z.string().max(512).optional(),
});

export const trackAffiliateClick = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => trackSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("affiliate_clicks").insert({
      provider_slug: data.provider_slug,
      amount: data.amount ?? null,
      from_currency: data.from_currency ?? null,
      to_currency: data.to_currency ?? null,
      segment: data.segment ?? null,
      referrer: data.referrer ?? null,
    });
    if (error) console.error("track click failed", error);
    return { ok: true };
  });

// ---------- captureLead ----------
const leadSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  company: z.string().max(200).optional(),
  monthly_volume: z.string().max(64).optional(),
  message: z.string().max(2000).optional(),
});

export const captureLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => leadSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("leads").insert({
      name: data.name,
      email: data.email,
      company: data.company ?? null,
      monthly_volume: data.monthly_volume ?? null,
      message: data.message ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- aiRecommend (one-shot Gemini insight) ----------
const aiSchema = z.object({
  amount: z.number(),
  from: z.string().length(3),
  to: z.string().length(3),
  segment: z.enum(["retail", "business"]),
  urgency: z.enum(["urgent", "standard", "flexible"]).default("standard"),
  top: z
    .array(
      z.object({
        name: z.string(),
        received: z.number(),
        fee_total: z.number(),
        speed_hours: z.number(),
      }),
    )
    .min(1)
    .max(5),
});

export const aiRecommend = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => aiSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { text: "AI insight unavailable: missing API key.", error: true };
    }
    const top = data.top
      .map(
        (r, i) =>
          `${i + 1}. ${r.name} — receives ${r.received.toFixed(2)} ${data.to}, fee ${r.fee_total.toFixed(2)} ${data.from}, ETA ~${r.speed_hours}h`,
      )
      .join("\n");

    const prompt = `You are Mango, a neutral FX decision engine. The user wants to send ${data.amount} ${data.from} to ${data.to} as a ${data.segment} client with ${data.urgency} urgency.

Top providers ordered by amount received:
${top}

In 3-4 sentences (no bullet lists), recommend ONE provider as the best for this specific case and explain why (consider trade-off between received amount, speed, and urgency). End with one short caveat about what to verify (regulation, account requirements, or hidden costs) for this corridor. Keep it concise, factual, and neutral. Do not use markdown headings.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("ai gateway error", res.status, t);
        if (res.status === 429) return { text: "AI insight rate-limited. Try again in a moment.", error: true };
        if (res.status === 402) return { text: "AI insight credits exhausted.", error: true };
        return { text: "AI insight unavailable right now.", error: true };
      }
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = json.choices?.[0]?.message?.content?.trim() ?? "No recommendation generated.";
      return { text, error: false };
    } catch (e) {
      console.error(e);
      return { text: "AI insight unavailable right now.", error: true };
    }
  });
