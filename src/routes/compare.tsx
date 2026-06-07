import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, ArrowRight, Clock, Loader2, Send, MessageCircle, Shield, Star, Megaphone, Building2, TrendingUp, ArrowDownUp, MapPin, Sparkle } from "lucide-react";
import {
  compareProviders,
  trackAffiliateClick,
  aiRecommend,
  chatAboutRecommendation,
  type ComparisonResult,
} from "@/lib/fx.functions";
import { CURRENCIES } from "@/lib/currencies";
import { useI18n } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";
import { PreferredRateModal } from "@/components/PreferredRateModal";

const COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: "ES", name: "España / Spain", flag: "🇪🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Deutschland", flag: "🇩🇪" },
  { code: "IT", name: "Italia", flag: "🇮🇹" },
  { code: "NL", name: "Nederland", flag: "🇳🇱" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "CH", name: "Schweiz", flag: "🇨🇭" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
];

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Money Transfers — mangoglobal" },
      {
        name: "description",
        content:
          "Compare live FX rates across 30+ providers in one click. Neutral AI recommendation, real mid-market rates, and the best route for any corridor.",
      },
      { property: "og:title", content: "Compare Money Transfers — mangoglobal" },
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
  const [sendingCountry, setSendingCountry] = useState("GB");
  const [receivingCountry, setReceivingCountry] = useState("AR");
  const [segment, setSegment] = useState<Segment>("retail");
  const [urgency, setUrgency] = useState<Urgency>("standard");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [aiText, setAiText] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Preferred Rate modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCtx, setModalCtx] = useState<{
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    sendingCountry?: string;
    receivingCountry?: string;
    providerSlug?: string;
    affiliateBaseUrl?: string;
  } | null>(null);

  const isLocalFx = sendingCountry === receivingCountry && from !== to;



  const compareFn = useServerFn(compareProviders);
  const trackFn = useServerFn(trackAffiliateClick);
  const aiFn = useServerFn(aiRecommend);
  const chatFn = useServerFn(chatAboutRecommendation);

  const compareMut = useMutation({
    mutationFn: () => compareFn({ data: { amount, from, to, segment, sendingCountry, receivingCountry } }),
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

  const openPreferredRate = (slug: string, url: string) => {
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
    setModalCtx({
      amount,
      fromCurrency: from,
      toCurrency: to,
      sendingCountry,
      receivingCountry,
      providerSlug: slug,
      affiliateBaseUrl: url,
    });
    setModalOpen(true);
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
            <Field label={t("rfq.fieldOrigin")}>
              <CountrySelect value={sendingCountry} onChange={setSendingCountry} />
            </Field>
            <Field label={t("rfq.fieldDest")}>
              <CountrySelect value={receivingCountry} onChange={setReceivingCountry} />
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

        {isLocalFx && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <div className="font-semibold text-foreground">
                Local FX detected · {sendingCountry} → {receivingCountry}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Showing multi-currency domestic accounts only — international wire fees and SWIFT
                spreads are excluded from this view.
              </div>
            </div>
          </div>
        )}

        {result && (
          <ResultsBlock
            result={result}
            amount={amount}
            handleAffiliateClick={openPreferredRate}
            tDisclaimer={t("fx.disclaimer")}
            tRecipient={t("fx.recipient")}
            tTotalFee={t("fx.totalFee")}
            tSpeed={t("fx.speed")}
            tCta={t("retail.cta")}
            tMidmarket={t("fx.midmarket")}
            tUpdated={t("fx.updated")}
          />
        )}
      </div>

      <PreferredRateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        context={modalCtx}
      />
    </div>
  );
}

// ===== Monito-style results =====
function ResultsBlock({
  result,
  amount,
  handleAffiliateClick,
  tDisclaimer,
  tRecipient,
  tTotalFee,
  tSpeed,
  tGoTo,
  tMidmarket,
  tUpdated,
}: {
  result: ComparisonResult;
  amount: number;
  handleAffiliateClick: (slug: string, url: string) => void;
  tDisclaimer: string;
  tRecipient: string;
  tTotalFee: string;
  tSpeed: string;
  tGoTo: string;
  tMidmarket: string;
  tUpdated: string;
}) {
  const showLargeBanner = amount >= 50000;
  const [sortBy, setSortBy] = useState<"received" | "fee" | "speed">("received");

  const sponsored = useMemo(
    () =>
      result.rows
        .filter((r) => r.sponsored)
        .sort((a, b) => (a.sponsored_rank ?? 999) - (b.sponsored_rank ?? 999))
        .slice(0, 2),
    [result.rows],
  );
  const organic = useMemo(() => {
    const base = result.rows.filter((r) => !r.sponsored);
    const sorted = [...base];
    if (sortBy === "received") sorted.sort((a, b) => b.received - a.received);
    if (sortBy === "fee") sorted.sort((a, b) => a.fee_total - b.fee_total);
    if (sortBy === "speed")
      sorted.sort(
        (a, b) => (a.delivery_minutes ?? a.speed_hours * 60) - (b.delivery_minutes ?? b.speed_hours * 60),
      );
    return sorted;
  }, [result.rows, sortBy]);

  // Savings vs worst provider (by received)
  const savings = useMemo(() => {
    if (result.rows.length < 2) return null;
    const sorted = [...result.rows].sort((a, b) => b.received - a.received);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const diff = best.received - worst.received;
    if (diff <= 0) return null;
    return { diff, bestName: best.name, worstName: worst.name };
  }, [result.rows]);

  return (
    <div className="mt-6">
      {showLargeBanner && (
        <Link
          to="/business"
          className="mb-4 flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 transition hover:border-primary"
        >
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm">
            <div className="font-semibold text-foreground">
              Sending over {amount.toLocaleString()} {result.base}? Talk to our business desk.
            </div>
            <div className="mt-0.5 text-muted-foreground">
              For high-volume transfers, dedicated providers offer custom rates, treasury tooling and an account manager. →
            </div>
          </div>
        </Link>
      )}

      {/* Savings summary card */}
      {savings && (
        <div className="mb-4 grid gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 sm:grid-cols-3 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                You save
              </div>
              <div className="font-heading text-2xl font-bold tabular-nums text-foreground">
                {savings.diff.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                <span className="text-sm font-normal text-muted-foreground">{result.quote}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                with <span className="font-semibold text-foreground">{savings.bestName}</span> vs <span className="font-semibold text-foreground">{savings.worstName}</span>
              </div>
            </div>
          </div>
          <div className="sm:border-l sm:border-emerald-500/20 sm:pl-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {tMidmarket}
            </div>
            <div className="text-sm tabular-nums text-foreground">
              1 {result.base} = {result.market_rate.toFixed(6)} {result.quote}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {tUpdated} {new Date(result.rates_updated_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
            </div>
          </div>
          <div className="sm:border-l sm:border-emerald-500/20 sm:pl-5">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <ArrowDownUp className="mr-1 inline h-3 w-3" /> Sort by
            </div>
            <div className="flex flex-wrap gap-1">
              {([
                ["received", "Best rate"],
                ["fee", "Cheapest fees"],
                ["speed", "Fastest"],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setSortBy(k)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                    sortBy === k
                      ? "bg-foreground text-background"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sponsored block — separated from organic, badged */}
      {sponsored.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Megaphone className="h-3 w-3" /> Sponsored offers
          </div>
          {sponsored.map((row) => (
            <ProviderRow
              key={row.slug}
              row={row}
              quote={result.quote}
              base={result.base}
              isBest={false}
              isSponsored
              onClick={() => handleAffiliateClick(row.slug, row.affiliate_url)}
              tRecipient={tRecipient}
              tTotalFee={tTotalFee}
              tSpeed={tSpeed}
              tGoTo={tGoTo}
            />
          ))}
        </div>
      )}

      {/* Organic ranking */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden grid-cols-12 gap-2 border-b border-border bg-surface-elevated px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:grid">
          <div className="col-span-3">Provider</div>
          <div className="col-span-3 text-right">{tRecipient}</div>
          <div className="col-span-2 text-right">{tTotalFee}</div>
          <div className="col-span-2 text-right">{tSpeed} · Trust</div>
          <div className="col-span-2 text-right">{/* action */}</div>
        </div>
        {organic.map((row, i) => (
          <ProviderRow
            key={row.slug}
            row={row}
            quote={result.quote}
            base={result.base}
            isBest={i === 0 && sortBy === "received"}
            isSponsored={false}
            onClick={() => handleAffiliateClick(row.slug, row.affiliate_url)}
            tRecipient={tRecipient}
            tTotalFee={tTotalFee}
            tSpeed={tSpeed}
            tGoTo={tGoTo}
          />
        ))}
        {organic.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No providers available for this corridor yet.
          </div>
        )}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">{tDisclaimer}</p>
    </div>
  );
}

function ProviderRow({
  row,
  quote,
  base,
  isBest,
  isSponsored,
  onClick,
  tRecipient,
  tTotalFee,
  tSpeed,
  tGoTo,
}: {
  row: ComparisonResult["rows"][number];
  quote: string;
  base: string;
  isBest: boolean;
  isSponsored: boolean;
  onClick: () => void;
  tRecipient: string;
  tTotalFee: string;
  tSpeed: string;
  tGoTo: string;
}) {
  const deliveryLabel =
    row.delivery_minutes != null
      ? row.delivery_minutes < 60
        ? `${row.delivery_minutes}m`
        : row.delivery_minutes < 60 * 24
        ? `${Math.round(row.delivery_minutes / 60)}h`
        : `${Math.round(row.delivery_minutes / 60 / 24)}d`
      : row.speed_hours < 1
      ? "<1h"
      : row.speed_hours <= 24
      ? `${Math.round(row.speed_hours)}h`
      : `${Math.round(row.speed_hours / 24)}d`;

  const ratePct = row.rate_vs_market_pct;
  const ratePctLabel = `${ratePct >= 0 ? "+" : ""}${ratePct.toFixed(2)}% vs mid-market`;
  const ratePctClass =
    ratePct >= -0.25 ? "text-emerald-500" : ratePct >= -1 ? "text-amber-500" : "text-destructive";

  return (
    <div
      className={`grid grid-cols-1 gap-2 border-b border-border px-4 py-4 last:border-b-0 sm:grid-cols-12 sm:items-center ${
        isSponsored ? "rounded-xl border border-amber-500/30 bg-amber-500/[0.04]" : isBest ? "bg-primary/5" : ""
      }`}
    >
      <div className="col-span-3 flex items-center gap-3">
        <BrandLogo name={row.name} url={row.website_url ?? row.affiliate_url} size={36} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-semibold text-foreground">{row.name}</span>
            {isSponsored ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400">
                Sponsored
              </span>
            ) : isBest ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                Best
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
            {row.regulator && (
              <span className="inline-flex items-center gap-0.5">
                <Shield className="h-2.5 w-2.5" /> {row.regulator}
              </span>
            )}
            {row.review_count > 0 && row.trust_score != null && (
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-current" /> {row.trust_score.toFixed(1)} ({row.review_count.toLocaleString()})
              </span>
            )}
            {row.promo_text && isSponsored && (
              <span className="text-amber-600 dark:text-amber-400">{row.promo_text}</span>
            )}
          </div>
        </div>
      </div>
      <div className="col-span-3 sm:text-right">
        <div className="text-lg font-bold tabular-nums text-foreground">
          {row.received.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
          <span className="text-xs font-normal text-muted-foreground">{quote}</span>
        </div>
        <div className={`text-[11px] tabular-nums ${ratePctClass}`}>{ratePctLabel}</div>
      </div>
      <div className="col-span-2 text-sm tabular-nums text-muted-foreground sm:text-right">
        {row.fee_total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {base}
        <div className="text-[10px]">
          {row.fee_percent_applied > 0 && `${row.fee_percent_applied.toFixed(2)}%`}
          {row.fee_fixed_applied > 0 && ` + ${row.fee_fixed_applied} ${base}`}
          {row.spread_applied > 0 && ` · ${row.spread_applied.toFixed(2)}% spread`}
        </div>
      </div>
      <div className="col-span-2 text-sm text-muted-foreground sm:text-right">
        <div className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {deliveryLabel}
        </div>
        {row.trust_score != null && (
          <div className="text-[10px]">
            Trust {row.trust_score.toFixed(1)}/10
            {row.transparency_score != null && ` · Transp. ${row.transparency_score.toFixed(1)}`}
          </div>
        )}
      </div>
      <div className="col-span-2 sm:text-right">
        <button
          onClick={onClick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-[11px] font-semibold leading-tight text-white transition hover:bg-slate-800"
        >
          <Sparkle className="h-3 w-3" />
          <span className="text-left">{tCta}</span>
        </button>
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
