import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, ArrowRight, Clock, Loader2, ExternalLink, Send, MessageCircle, Shield, Star, Megaphone, Building2 } from "lucide-react";
import {
  compareProviders,
  trackAffiliateClick,
  aiRecommend,
  chatAboutRecommendation,
  type ComparisonResult,
} from "@/lib/fx.functions";
import { CURRENCIES } from "@/lib/currencies";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Money Transfers — MangoGlobal" },
      {
        name: "description",
        content:
          "Compare live FX rates across 30+ providers in one click. Neutral AI recommendation, real mid-market rates, and the best route for any corridor.",
      },
      { property: "og:title", content: "Compare Money Transfers — MangoGlobal" },
      {
        property: "og:description",
        content:
          "Compare 30+ money-transfer providers with live rates, a neutral AI recommendation, and an interactive chat.",
      },
    ],
  }),
  component: FxToolPage,
});

type Segment = "retail" | "business";
type Urgency = "urgent" | "standard" | "flexible";
type ChatMsg = { role: "user" | "assistant"; content: string };

function FxToolPage() {
  const { t, lang } = useI18n();
  const [amount, setAmount] = useState<number>(1000);
  const [from, setFrom] = useState("GBP");
  const [to, setTo] = useState("ARS");
  const [segment, setSegment] = useState<Segment>("retail");
  const [urgency, setUrgency] = useState<Urgency>("standard");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [aiText, setAiText] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const compareFn = useServerFn(compareProviders);
  const trackFn = useServerFn(trackAffiliateClick);
  const aiFn = useServerFn(aiRecommend);
  const chatFn = useServerFn(chatAboutRecommendation);

  const compareMut = useMutation({
    mutationFn: () => compareFn({ data: { amount, from, to, segment } }),
    onSuccess: async (data) => {
      setResult(data);
      setAiText("");
      setChat([]);
      setAiLoading(true);
      try {
        const ai = await aiFn({
          data: {
            amount,
            from,
            to,
            segment,
            urgency,
            lang,
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

  const chatMut = useMutation({
    mutationFn: async (userMsg: string) => {
      if (!result || !aiText) throw new Error("No recommendation yet");
      const newHistory: ChatMsg[] = [...chat, { role: "user", content: userMsg }];
      setChat(newHistory);
      const res = await chatFn({
        data: {
          amount,
          from,
          to,
          segment,
          urgency,
          lang,
          recommendation: aiText,
          top: result.rows.slice(0, 8).map((r) => ({
            name: r.name,
            received: r.received,
            fee_total: r.fee_total,
            speed_hours: r.speed_hours,
          })),
          history: newHistory,
        },
      });
      setChat((c) => [...c, { role: "assistant", content: res.text }]);
    },
  });

  useEffect(() => {
    compareMut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, chatMut.isPending]);

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

  const sendChat = (msg: string) => {
    const trimmed = msg.trim();
    if (!trimmed || chatMut.isPending) return;
    setChatInput("");
    chatMut.mutate(trimmed);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Live rates · Neutral AI · 30+ providers
          </div>
          <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t("fx.title")} <span className="text-primary">{t("fx.titleAccent")}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
            {t("fx.subtitle")}
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label={t("fx.field.send")}>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 0))}
                className="input"
              />
            </Field>
            <Field label={t("fx.field.from")}>
              <CurrencySelect value={from} onChange={setFrom} />
            </Field>
            <Field label={t("fx.field.to")}>
              <CurrencySelect value={to} onChange={setTo} />
            </Field>
            <Field label={t("fx.field.segment")}>
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
            <Field label={t("fx.field.urgency")}>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Urgency)}
                className="input"
              >
                <option value="urgent">{t("fx.urgency.urgent")}</option>
                <option value="standard">{t("fx.urgency.standard")}</option>
                <option value="flexible">{t("fx.urgency.flexible")}</option>
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
                <Loader2 className="h-4 w-4 animate-spin" /> …
              </>
            ) : (
              <>
                {t("cta.compare")} <ArrowRight className="h-4 w-4" />
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
                {t("fx.recommends")}
              </span>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> {t("fx.analyzing")}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground sm:text-base">{aiText}</p>
            )}

            {/* Interactive chat */}
            {aiText && !aiLoading && (
              <div className="mt-5 rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <MessageCircle className="h-3.5 w-3.5 text-primary" />
                  {t("fx.chat.title")}
                </div>

                {chat.length === 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {[t("fx.chat.cta1"), t("fx.chat.cta2"), t("fx.chat.cta3")].map((q) => (
                      <button
                        key={q}
                        onClick={() => sendChat(q)}
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition hover:border-primary hover:text-primary"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {chat.length > 0 && (
                  <div className="mb-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {chat.map((m, i) => (
                      <div
                        key={i}
                        className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "ml-8 bg-primary/15 text-foreground"
                            : "mr-8 bg-card text-foreground"
                        }`}
                      >
                        {m.content}
                      </div>
                    ))}
                    {chatMut.isPending && (
                      <div className="mr-8 flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("fx.chat.thinking")}
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendChat(chatInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={t("fx.chat.placeholder")}
                    className="input flex-1"
                    disabled={chatMut.isPending}
                  />
                  <button
                    type="submit"
                    disabled={chatMut.isPending || !chatInput.trim()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" /> {t("fx.chat.send")}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {compareMut.isError && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {(compareMut.error as Error)?.message ?? "Couldn't load rates."}
          </div>
        )}

        {result && (
          <div className="mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {t("fx.midmarket")} · 1 {result.base} = {result.market_rate.toFixed(6)} {result.quote}
              </span>
              <span>
                {t("fx.updated")} {new Date(result.rates_updated_at).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="hidden grid-cols-12 gap-2 border-b border-border bg-surface-elevated px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:grid">
                <div className="col-span-3">Provider</div>
                <div className="col-span-3 text-right">{t("fx.recipient")}</div>
                <div className="col-span-2 text-right">{t("fx.totalFee")}</div>
                <div className="col-span-2 text-right">{t("fx.speed")}</div>
                <div className="col-span-2 text-right">{t("fx.action")}</div>
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
                      <div className="flex items-center gap-2 flex-wrap">
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
                    {row.spread_applied > 0 && (
                      <div className="text-[10px]">+ {row.spread_applied.toFixed(2)}% spread</div>
                    )}
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
                      {t("fx.goto")} {row.name.split(" ")[0]}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">{t("fx.disclaimer")}</p>
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

function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.flag} {c.code} — {c.name}
        </option>
      ))}
    </select>
  );
}
