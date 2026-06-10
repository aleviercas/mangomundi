import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Clock,
  Loader2,
  Send,
  Shield,
  Star,
  Building2,
  TrendingUp,
  ArrowDownUp,
  Sparkle,
  BellPlus,
  Share2,
  Check,
  MessageCircle,
} from "lucide-react";
import {
  compareProviders,
  trackAffiliateClick,
  chatAboutRecommendation,
  type ComparisonResult,
} from "@/lib/fx.functions";
import { useI18n } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";
import { PreferredRateModal } from "@/components/PreferredRateModal";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { CurrencyCombobox } from "@/components/ui/CurrencyCombobox";
import { useAnalytics } from "@/hooks/use-analytics";

type Segment = "retail" | "business";
type Urgency = "urgent" | "standard" | "flexible";
type ChatMsg = { role: "user" | "assistant"; content: string };

export function ComparatorSection() {
  const { t, lang } = useI18n();
  const [amount, setAmount] = useState<number>(0);
  const [from, setFrom] = useState("GBP");
  const [to, setTo] = useState("ARS");
  const [sendingCountry, setSendingCountry] = useState("");
  const [receivingCountry, setReceivingCountry] = useState("");
  const [segment, setSegment] = useState<Segment>("retail");
  const [urgency, setUrgency] = useState<Urgency>("standard");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [aiText, setAiText] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  

  const compareFn = useServerFn(compareProviders);
  const trackFn = useServerFn(trackAffiliateClick);
  const chatFn = useServerFn(chatAboutRecommendation);
  const { track } = useAnalytics();
  const [shareToast, setShareToast] = useState(false);

  const buildReasoning = (): string => {
    const urgencyLabel =
      urgency === "urgent"
        ? "urgent (minutes)"
        : urgency === "flexible"
        ? "flexible (days)"
        : "standard (same-day)";
    return `[LANG:${lang.toUpperCase()}] mangoglobal routing justification: for a transfer of ${amount.toLocaleString()} ${from} to ${to} with ${urgencyLabel} urgency, the engine analysed liquidity paths across indexed providers. The optimal route was selected from flat-fee optimisation and real-time interbank rates; spread, fixed fees, settlement window and regulatory coverage of each counterparty were normalised before ranking.`;
  };

  const compareMut = useMutation({
    mutationFn: () =>
      compareFn({
        data: { amount, from, to, segment, sendingCountry, receivingCountry },
      }),
    onSuccess: (data) => {
      setResult(data);
      setChat([]);
      setAiText(buildReasoning());
      setAiLoading(false);
      track("comparator_query", {
        amount,
        from_currency: from,
        to_currency: to,
        segment,
        urgency,
        source: "home_comparator",
      });
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
    track("provider_click", {
      provider_slug: slug,
      amount,
      from_currency: from,
      to_currency: to,
      segment,
      urgency,
      source: "home_results",
    });
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

  const handleSaveAlert = () => {
    track("rfq_interaction", {
      amount,
      from_currency: from,
      to_currency: to,
      segment,
      urgency,
      source: "save_alert",
    });
    window.alert(`Alert saved for ${from} → ${to}. We'll notify you when the rate improves.`);
  };

  const handleShare = async () => {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/compare?from=${from}&to=${to}&amount=${amount}`
        : "";
    track("rfq_interaction", {
      amount,
      from_currency: from,
      to_currency: to,
      segment,
      urgency,
      source: "share",
    });
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "mangoglobal comparison", url: shareUrl });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2400);
      }
    } catch {
      /* user cancelled */
    }
  };

  const sendChat = (msg: string) => {
    const trimmed = msg.trim();
    if (!trimmed || chatMut.isPending) return;
    setChatInput("");
    chatMut.mutate(trimmed);
  };

  return (
    <section
      id="comparator"
      key={lang}
      className="bg-background py-12 sm:py-16"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 text-center sm:mb-8">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("comparator.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            {t("comparator.subtitle")}
          </p>
        </div>

        {/* Decision card */}
        <div className="surface-card overflow-hidden">
          {/* Card header: brand + segment toggle */}
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="truncate">
                <span className="font-black lowercase text-foreground">mango</span>
                <span className="font-extralight lowercase text-foreground">global</span>
                <span className="px-1.5 text-muted-foreground/60">·</span>
                Decision Engine
              </span>
            </div>
            <div
              role="tablist"
              aria-label="Segment"
              className="flex h-8 shrink-0 items-center gap-0.5 rounded-md border border-border bg-muted p-0.5"
            >
              {(["retail", "business"] as Segment[]).map((s) => (
                <button
                  key={s}
                  role="tab"
                  aria-selected={segment === s}
                  onClick={() => setSegment(s)}
                  className={`rounded-sm px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                    segment === s
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(`comparator.segment.${s}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Form body */}
          <div className="space-y-4 p-4 sm:p-6">
            {/* Row 1 — Source Country | Target Country | Urgency */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FieldLight label={t("comparator.field.sourceCountry")}>
                <CountrySelect
                  value={sendingCountry}
                  onChange={setSendingCountry}
                  placeholder={t("comparator.combobox.placeholder")}
                  searchPlaceholder={t("comparator.combobox.search")}
                  emptyLabel={t("comparator.combobox.empty")}
                  ariaLabel={t("comparator.field.sourceCountry")}
                />
              </FieldLight>
              <FieldLight label={t("comparator.field.targetCountry")}>
                <CountrySelect
                  value={receivingCountry}
                  onChange={setReceivingCountry}
                  placeholder={t("comparator.combobox.placeholder")}
                  searchPlaceholder={t("comparator.combobox.search")}
                  emptyLabel={t("comparator.combobox.empty")}
                  ariaLabel={t("comparator.field.targetCountry")}
                />
              </FieldLight>
              <FieldLight label={t("comparator.field.urgency")}>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as Urgency)}
                  className="flex h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="urgent">{t("fx.urgency.urgent")}</option>
                  <option value="standard">{t("fx.urgency.standard")}</option>
                  <option value="flexible">{t("fx.urgency.flexible")}</option>
                </select>
              </FieldLight>
            </div>

            {/* Row 2 — Amount | Source Currency | Target Currency */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FieldLight label={t("comparator.field.amount")}>
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  value={amount || ""}
                  placeholder="1000"
                  onChange={(e) =>
                    setAmount(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="flex h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm tabular-nums text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </FieldLight>
              <FieldLight label={t("comparator.field.sourceCurrency")}>
                <CurrencyCombobox
                  value={from}
                  onChange={setFrom}
                  placeholder={t("comparator.combobox.placeholder")}
                  searchPlaceholder={t("comparator.combobox.search")}
                  emptyLabel={t("comparator.combobox.empty")}
                  ariaLabel={t("comparator.field.sourceCurrency")}
                />
              </FieldLight>
              <FieldLight label={t("comparator.field.targetCurrency")}>
                <CurrencyCombobox
                  value={to}
                  onChange={setTo}
                  placeholder={t("comparator.combobox.placeholder")}
                  searchPlaceholder={t("comparator.combobox.search")}
                  emptyLabel={t("comparator.combobox.empty")}
                  ariaLabel={t("comparator.field.targetCurrency")}
                />
              </FieldLight>
            </div>

            {/* CTA — full width */}
            <div className="pt-1">
              <button
                onClick={() => {
                  if (!sendingCountry || !receivingCountry || amount <= 0) {
                    setValidationError(t("fx.validation"));
                    return;
                  }
                  setValidationError(null);
                  compareMut.mutate();
                }}
                disabled={compareMut.isPending}
                className="btn-cta inline-flex h-11 w-full items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold"
              >
                {compareMut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="truncate">…</span>
                  </>
                ) : (
                  <>
                    <span className="truncate">{t("comparator.cta.compare")}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </>
                )}
              </button>
              {validationError && (
                <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {validationError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI reasoning + embedded chat */}
        {(aiLoading || aiText) && (
          <div className="surface-card mt-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkle className="h-3.5 w-3.5 text-foreground" />
                <span className="truncate">{t("comparator.reasoning.title")}</span>
              </div>
              {aiText && !aiLoading && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={handleSaveAlert}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-foreground/30"
                  >
                    <BellPlus className="h-3 w-3" /> Alert
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-foreground/30"
                  >
                    <Share2 className="h-3 w-3" /> Share
                  </button>
                  {shareToast && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                      <Check className="h-3 w-3" /> Copied
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {aiLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("fx.analyzing")}
                </div>
              ) : (
                <>
                  <ul className="grid gap-1.5 text-sm leading-relaxed text-foreground sm:grid-cols-3">
                    <li className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Corridor
                      </div>
                      <div className="truncate font-semibold">
                        {from} → {to}
                      </div>
                    </li>
                    <li className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Notional
                      </div>
                      <div className="truncate font-semibold tabular-nums">
                        {amount.toLocaleString()} {from}
                      </div>
                    </li>
                    <li className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Segment · Urgency
                      </div>
                      <div className="truncate font-semibold capitalize">
                        {segment} · {urgency}
                      </div>
                    </li>
                  </ul>

                  <div className="border-t border-border pt-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t("comparator.reasoning.context")}
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                      {aiText}
                    </p>
                  </div>

                  {/* Embedded FX Copilot */}
                  <div className="mt-2 rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <MessageCircle className="h-3.5 w-3.5 text-foreground" />
                      <span className="truncate">{t("comparator.copilot.title")}</span>
                    </div>

                    {chat.length === 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {[t("fx.chat.cta1"), t("fx.chat.cta2"), t("fx.chat.cta3")].map((q) => (
                          <button
                            key={q}
                            onClick={() => sendChat(q)}
                            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition hover:border-foreground/30"
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
                            className={`rounded-md px-3 py-2 text-sm leading-relaxed ${
                              m.role === "user"
                                ? "ml-8 bg-foreground text-background"
                                : "mr-8 border border-border bg-card text-foreground"
                            }`}
                          >
                            {m.content}
                          </div>
                        ))}
                        {chatMut.isPending && (
                          <div className="mr-8 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
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
                      className="flex items-center gap-2"
                    >
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={t("comparator.copilot.placeholder")}
                        className="flex h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                        disabled={chatMut.isPending}
                      />
                      <button
                        type="submit"
                        disabled={chatMut.isPending || !chatInput.trim()}
                        className="btn-cta inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-semibold"
                        aria-label={t("comparator.copilot.send")}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Errors / empty / results */}
        {compareMut.isError && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {(compareMut.error as Error)?.message ?? "Couldn't load rates."}
          </div>
        )}


        {!result && !compareMut.isPending && !compareMut.isError && !aiText && (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">{t("fx.emptyState")}</p>
          </div>
        )}

        {result && (
          <ResultsBlock
            result={result}
            amount={amount}
            handleAffiliateClick={openPreferredRate}
            tDisclaimer={t("fx.disclaimer")}
            tTrademarks={t("fx.trademarks")}
            tRatesSource={t("fx.ratesSource")}
            tAt={t("fx.at")}
            tRecipient={t("fx.recipient")}
            tTotalFee={t("fx.totalFee")}
            tSpeed={t("fx.speed")}
            tCta={t("retail.cta")}
            tMidmarket={t("fx.midmarket")}
            tUpdated={t("fx.updated")}
            tProvider={t("cmp.provider")}
          />
        )}
      </div>

      <PreferredRateModal open={modalOpen} onOpenChange={setModalOpen} context={modalCtx} />
    </section>
  );
}

function FieldLight({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </label>
  );
}

// ===== Results table (light) =====
function ResultsBlock({
  result,
  amount,
  handleAffiliateClick,
  tDisclaimer,
  tTrademarks,
  tRatesSource,
  tAt,
  tRecipient,
  tTotalFee,
  tSpeed,
  tCta,
  tMidmarket,
  tUpdated,
  tProvider,
}: {
  result: ComparisonResult;
  amount: number;
  handleAffiliateClick: (slug: string, url: string) => void;
  tDisclaimer: string;
  tTrademarks: string;
  tRatesSource: string;
  tAt: string;
  tRecipient: string;
  tTotalFee: string;
  tSpeed: string;
  tCta: string;
  tMidmarket: string;
  tUpdated: string;
  tProvider: string;
}) {
  const showLargeBanner = amount >= 50000;
  const [sortBy, setSortBy] = useState<"received" | "fee" | "speed">("received");

  const organic = useMemo(() => {
    const base = [...result.rows];
    if (sortBy === "received") base.sort((a, b) => b.received - a.received);
    if (sortBy === "fee") base.sort((a, b) => a.fee_total - b.fee_total);
    if (sortBy === "speed")
      base.sort(
        (a, b) =>
          (a.delivery_minutes ?? a.speed_hours * 60) -
          (b.delivery_minutes ?? b.speed_hours * 60),
      );
    return base;
  }, [result.rows, sortBy]);

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
          <div className="min-w-0 text-sm">
            <div className="truncate font-semibold text-foreground">
              Sending over {amount.toLocaleString()} {result.base}? Talk to our business desk.
            </div>
            <div className="mt-0.5 text-muted-foreground">
              For high-volume transfers, dedicated providers offer custom rates, treasury tooling
              and an account manager. →
            </div>
          </div>
        </Link>
      )}

      {savings && (
        <div className="mb-4 grid gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 sm:grid-cols-3 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                You save
              </div>
              <div className="font-heading text-2xl font-bold tabular-nums text-foreground">
                {savings.diff.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                <span className="text-sm font-normal text-muted-foreground">{result.quote}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                vs the market average for this corridor.
              </div>
            </div>
          </div>
          <div className="min-w-0 sm:border-l sm:border-emerald-500/20 sm:pl-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {tMidmarket}
            </div>
            <div className="truncate text-sm tabular-nums text-foreground">
              1 {result.base} = {result.market_rate.toFixed(6)} {result.quote}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {tUpdated}{" "}
              {new Date(result.rates_updated_at).toLocaleString(undefined, {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </div>
          </div>
          <div className="min-w-0 sm:border-l sm:border-emerald-500/20 sm:pl-5">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <ArrowDownUp className="mr-1 inline h-3 w-3" /> Sort by
            </div>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["received", "Best rate"],
                  ["fee", "Cheapest fees"],
                  ["speed", "Fastest"],
                ] as const
              ).map(([k, label]) => (
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

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden grid-cols-12 gap-2 border-b border-border bg-muted/60 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:grid">
          <div className="col-span-3 min-w-0">{tProvider}</div>
          <div className="col-span-3 min-w-0 text-right">{tRecipient}</div>
          <div className="col-span-2 min-w-0 text-right">{tTotalFee}</div>
          <div className="col-span-2 min-w-0 text-right">{tSpeed} · Trust</div>
          <div className="col-span-2" />
        </div>
        {organic.map((row, i) => (
          <ProviderRow
            key={row.slug}
            row={row}
            quote={result.quote}
            base={result.base}
            isBest={i === 0 && sortBy === "received"}
            onClick={() => handleAffiliateClick(row.slug, row.affiliate_url)}
            tCta={tCta}
          />
        ))}
        {organic.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No providers available for this corridor yet.
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card/50 px-4 py-3 text-[11px] text-muted-foreground">
        {tRatesSource}{" "}
        <span className="font-semibold text-foreground">
          {new Date(result.rates_updated_at).toLocaleDateString()} {tAt}{" "}
          {new Date(result.rates_updated_at).toLocaleTimeString()}
        </span>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">{tDisclaimer}</p>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/80">{tTrademarks}</p>
    </div>
  );
}

function ProviderRow({
  row,
  quote,
  base,
  isBest,
  onClick,
  tCta,
}: {
  row: ComparisonResult["rows"][number];
  quote: string;
  base: string;
  isBest: boolean;
  onClick: () => void;
  tCta: string;
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
    ratePct >= -0.25
      ? "text-emerald-600"
      : ratePct >= -1
      ? "text-amber-600"
      : "text-destructive";

  return (
    <div
      className={`grid grid-cols-1 gap-2 border-b border-border px-4 py-4 last:border-b-0 sm:grid-cols-12 sm:items-center ${
        isBest ? "bg-primary/5" : ""
      }`}
    >
      <div className="col-span-3 flex min-w-0 items-center gap-3">
        <BrandLogo name={row.name} url={row.website_url ?? row.affiliate_url} size={36} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-semibold text-foreground">{row.name}</span>
            {isBest && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                Best
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
            {row.regulator && (
              <span className="inline-flex items-center gap-0.5">
                <Shield className="h-2.5 w-2.5" /> {row.regulator}
              </span>
            )}
            {row.review_count > 0 && row.trust_score != null && (
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-current" />{" "}
                {row.trust_score.toFixed(1)} ({row.review_count.toLocaleString()})
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="col-span-3 min-w-0 sm:text-right">
        <div className="truncate text-lg font-bold tabular-nums text-foreground">
          {row.received.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
          <span className="text-xs font-normal text-muted-foreground">{quote}</span>
        </div>
        <div className={`text-[11px] tabular-nums ${ratePctClass}`}>{ratePctLabel}</div>
      </div>
      <div className="col-span-2 min-w-0 text-sm tabular-nums text-muted-foreground sm:text-right">
        {row.fee_total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {base}
        <div className="text-[10px]">
          {row.fee_percent_applied > 0 && `${row.fee_percent_applied.toFixed(2)}%`}
          {row.fee_fixed_applied > 0 && ` + ${row.fee_fixed_applied} ${base}`}
          {row.spread_applied > 0 && ` · ${row.spread_applied.toFixed(2)}% spread`}
        </div>
      </div>
      <div className="col-span-2 min-w-0 text-sm text-muted-foreground sm:text-right">
        <div className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {deliveryLabel}
        </div>
        {row.trust_score != null && (
          <div className="text-[10px]">
            Trust {row.trust_score.toFixed(1)}/10
            {row.transparency_score != null &&
              ` · Transp. ${row.transparency_score.toFixed(1)}`}
          </div>
        )}
      </div>
      <div className="col-span-2 sm:text-right">
        <button
          onClick={onClick}
          className="btn-cta inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[11px] font-semibold leading-tight"
        >
          <Sparkle className="h-3 w-3 shrink-0" />
          <span className="truncate text-left">{tCta}</span>
        </button>
      </div>
    </div>
  );
}
