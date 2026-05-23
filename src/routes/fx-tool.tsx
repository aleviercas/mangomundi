import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, Clock, TrendingUp, Loader2, ExternalLink } from "lucide-react";
import {
  compareProviders,
  trackAffiliateClick,
  aiRecommend,
  type ComparisonResult,
} from "@/lib/fx.functions";

export const Route = createFileRoute("/fx-tool")({
  head: () => ({
    meta: [
      { title: "FX Comparator & Calculator — MangoGlobal" },
      {
        name: "description",
        content:
          "Compare live FX rates across 8+ providers in one click. Neutral AI recommendation, real mid-market rates, and the best route for your transfer — retail or business.",
      },
      { property: "og:title", content: "FX Comparator & Calculator — MangoGlobal" },
      {
        property: "og:description",
        content:
          "Compare 8+ money-transfer providers with live rates and a neutral AI recommendation.",
      },
    ],
  }),
  component: FxToolPage,
});

const CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "HKD", "SGD",
  "INR", "MXN", "BRL", "NGN", "PHP", "ZAR", "AED", "TRY", "PLN", "SEK",
] as const;

type Segment = "retail" | "business";
type Urgency = "urgent" | "standard" | "flexible";

function FxToolPage() {
  const [amount, setAmount] = useState<number>(1000);
  const [from, setFrom] = useState("GBP");
  const [to, setTo] = useState("EUR");
  const [segment, setSegment] = useState<Segment>("retail");
  const [urgency, setUrgency] = useState<Urgency>("standard");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [aiText, setAiText] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  const compareFn = useServerFn(compareProviders);
  const trackFn = useServerFn(trackAffiliateClick);
  const aiFn = useServerFn(aiRecommend);

  const compareMut = useMutation({
    mutationFn: () => compareFn({ data: { amount, from, to, segment } }),
    onSuccess: async (data) => {
      setResult(data);
      setAiText("");
      setAiLoading(true);
      try {
        const ai = await aiFn({
          data: {
            amount,
            from,
            to,
            segment,
            urgency,
            top: data.rows.slice(0, 5).map((r) => ({
              name: r.name,
              received: r.received,
              fee_total: r.fee_total,
              speed_hours: r.speed_hours,
            })),
          },
        });
        setAiText(ai.text);
      } catch {
        setAiText("AI insight unavailable right now.");
      } finally {
        setAiLoading(false);
      }
    },
  });

  // Auto-run on first load
  useEffect(() => {
    compareMut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAffiliateClick = (slug: string, url: string) => {
    trackFn({
      data: {
        provider_slug: slug,
        amount,
        from_currency: from,
        to_currency: to,
        segment,
        referrer: typeof window !== "undefined" ? window.location.href : undefined,
      },
    }).catch(() => {});
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Live rates · Neutral AI insight
          </div>
          <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Compare every FX route. <span className="text-primary">In one click.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
            Real mid-market rates against 8+ providers — retail and business. Mango's AI tells
            you which one actually wins for your case.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="You send">
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 0))}
                className="input"
              />
            </Field>
            <Field label="From">
              <select value={from} onChange={(e) => setFrom(e.target.value)} className="input">
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="To">
              <select value={to} onChange={(e) => setTo(e.target.value)} className="input">
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Segment">
              <div className="flex h-10 items-center gap-1 rounded-lg border border-border bg-background p-1">
                {(["retail", "business"] as Segment[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSegment(s)}
                    className={`flex-1 rounded-md px-2 text-xs font-semibold capitalize transition ${
                      segment === s
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Urgency">
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Urgency)}
                className="input"
              >
                <option value="urgent">Urgent (minutes)</option>
                <option value="standard">Standard (today)</option>
                <option value="flexible">Flexible (days)</option>
              </select>
            </Field>
          </div>

          <button
            onClick={() => compareMut.mutate()}
            disabled={compareMut.isPending}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
          >
            {compareMut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Comparing…
              </>
            ) : (
              <>
                Compare providers <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* AI panel */}
        {(aiLoading || aiText) && (
          <div className="mt-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-heading text-sm font-bold uppercase tracking-wider text-primary">
                Mango recommends
              </span>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your case…
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground sm:text-base">{aiText}</p>
            )}
          </div>
        )}

        {/* Results */}
        {compareMut.isError && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Couldn't load rates right now. Please try again.
          </div>
        )}

        {result && (
          <div className="mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Mid-market rate · 1 {result.base} = {result.market_rate.toFixed(4)} {result.quote}
              </span>
              <span>Updated {new Date(result.fetched_at).toLocaleTimeString()}</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="hidden grid-cols-12 gap-2 border-b border-border bg-surface-elevated px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:grid">
                <div className="col-span-3">Provider</div>
                <div className="col-span-3 text-right">Recipient gets</div>
                <div className="col-span-2 text-right">Total fee</div>
                <div className="col-span-2 text-right">Speed</div>
                <div className="col-span-2 text-right">Action</div>
              </div>
              {result.rows.map((row, i) => (
                <div
                  key={row.slug}
                  className={`grid grid-cols-1 gap-2 border-b border-border px-4 py-4 last:border-b-0 sm:grid-cols-12 sm:items-center ${
                    i === 0 ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="col-span-3 flex items-center gap-3">
                    <span className="text-2xl" aria-hidden>{row.logo_emoji ?? "💱"}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{row.name}</span>
                        {i === 0 && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                            Best
                          </span>
                        )}
                        {row.featured && i !== 0 && (
                          <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Featured
                          </span>
                        )}
                      </div>
                      {row.notes && (
                        <div className="text-xs text-muted-foreground">{row.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-3 sm:text-right">
                    <div className="text-lg font-bold text-foreground tabular-nums">
                      {row.received.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                      <span className="text-xs font-normal text-muted-foreground">{result.quote}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      <TrendingUp className="mr-1 inline h-3 w-3" />
                      rate {row.rate.toFixed(4)}
                    </div>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground tabular-nums sm:text-right">
                    {row.fee_total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {result.base}
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground sm:text-right">
                    <Clock className="mr-1 inline h-3 w-3" />
                    {row.speed_hours < 1
                      ? "<1h"
                      : row.speed_hours <= 24
                      ? `${Math.round(row.speed_hours)}h`
                      : `${Math.round(row.speed_hours / 24)}d`}
                  </div>
                  <div className="col-span-2 sm:text-right">
                    <button
                      onClick={() => handleAffiliateClick(row.slug, row.affiliate_url)}
                      className="inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background transition hover:opacity-90"
                    >
                      Go to {row.name.split(" ")[0]}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">
              MangoGlobal is independent. Some links are affiliate links — we may earn a commission
              at no extra cost to you. Rates and fees are estimates; verify on the provider's site
              before sending.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
