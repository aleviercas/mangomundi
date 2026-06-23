import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
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
  Zap,
  Info,
  ArrowLeft,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { B2B_UPSELL_MIN_AMOUNT, MARKET_BASELINE_SPREAD } from "@/config/providers";
import { captureBusinessLead } from "@/lib/agent.functions";
import { Button } from "@/components/ui/button";

type Segment = "retail" | "business";
type AmountMode = "send" | "receive";
type Urgency = "urgent" | "standard" | "flexible";
type SortKey = "received" | "fee" | "speed";
type ChatAction =
  | { kind: "proceed"; slug: string; url: string; label: string }
  | { kind: "notify"; label: string };
type ChatMsg = { role: "user" | "assistant"; content: string; actions?: ChatAction[] };
type BusinessStage = "volume" | "email" | "consent" | "done";

interface ComparatorQuery {
  origin: string;
  destination: string;
  segment: Segment;
  from: string;
  to: string;
  amount: number;
  lang?: string;
}

export function ComparatorSection({ initialQuery }: { initialQuery?: ComparatorQuery }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate({ from: "/compare" });
  const [amount, setAmount] = useState<number>(initialQuery?.amount ?? 1000);
  const [from, setFrom] = useState(initialQuery?.from ?? "GBP");
  const [to, setTo] = useState(initialQuery?.to ?? "USD");
  const [sendingCountry, setSendingCountry] = useState(initialQuery?.origin ?? "GB");
  const [receivingCountry, setReceivingCountry] = useState(initialQuery?.destination ?? "US");
  const [segment, setSegment] = useState<Segment>(initialQuery?.segment ?? "retail");
  const [amountMode, setAmountMode] = useState<AmountMode>("send");
  const [urgency, setUrgency] = useState<Urgency>("standard");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [aiText, setAiText] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<SortKey>("received");
  const requestRef = useRef(0);
  const [businessStage, setBusinessStage] = useState<BusinessStage>("volume");
  const [businessData, setBusinessData] = useState<{
    monthlyVolume?: number;
    sector?: string;
    email?: string;
  }>({});
  const [savingBusinessLead, setSavingBusinessLead] = useState(false);

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
  const captureBusinessFn = useServerFn(captureBusinessLead);
  const { track } = useAnalytics();
  
  const [aiCollapsed, setAiCollapsed] = useState(true);

  const buildReasoning = (): string => {
    const urgencyLabel =
      urgency === "urgent"
        ? "urgent (minutes)"
        : urgency === "flexible"
          ? "flexible (days)"
          : "standard (same-day)";
    return `[LANG:${lang.toUpperCase()}] mangomundi routing justification: for a transfer of ${amount.toLocaleString()} ${from} to ${to} with ${urgencyLabel} urgency, the engine analysed liquidity paths across indexed providers. The optimal route was selected from flat-fee optimisation and real-time interbank rates; spread, fixed fees, settlement window and regulatory coverage of each counterparty were normalised before ranking.`;
  };

  const proactiveMessage = (res: ComparisonResult, key: SortKey): ChatMsg | null => {
    const rows = [...res.rows];
    if (rows.length === 0) return null;
    if (key === "received") rows.sort((a, b) => b.received - a.received);
    else if (key === "fee") rows.sort((a, b) => a.fee_total - b.fee_total);
    else
      rows.sort(
        (a, b) =>
          (a.delivery_minutes ?? a.speed_hours * 60) - (b.delivery_minutes ?? b.speed_hours * 60),
      );
    const top = rows[0];
    const tplKey =
      key === "received"
        ? "comparator.copilot.proactive.rate"
        : key === "fee"
          ? "comparator.copilot.proactive.fee"
          : "comparator.copilot.proactive.speed";
    const content = t(tplKey).replace("{provider}", top.name);
    return {
      role: "assistant",
      content,
      actions: [
        {
          kind: "proceed",
          slug: top.slug,
          url: top.affiliate_url,
          label: t("comparator.copilot.proceed").replace("{provider}", top.name),
        },
        { kind: "notify", label: t("comparator.copilot.notify") },
      ],
    };
  };

  const compareMut = useMutation({
    mutationFn: async () => {
      const requestId = ++requestRef.current;
      const data = await compareFn({
        data: { amount, from, to, segment, amountMode, sendingCountry, receivingCountry },
      });
      return { data, requestId };
    },
    onMutate: () => {
      setAiLoading(true);
      setResult(null);
      setAiText("");
      setChat([]);
    },
    onSuccess: ({ data, requestId }) => {
      if (requestId !== requestRef.current) return;
      setResult(data);
      setSortBy("received");
      setAiText(buildReasoning());
      setAiLoading(false);
      const intro = proactiveMessage(data, "received");
      const initial: ChatMsg[] = [];
      // Results summary as first assistant bubble (per spec: results inside chat)
      const best = [...data.rows].sort((a, b) => b.received - a.received)[0];
      if (best) {
        const summary =
          `Sending **${amount.toLocaleString()} ${from}** to **${to}** — ` +
          `best route delivers **${best.received.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${data.quote}** ` +
          `via **${best.name}**.`;
        initial.push({ role: "assistant", content: summary });
      }
      if (segment === "business") {
        setBusinessStage("volume");
        setBusinessData({});
        initial.push({ role: "assistant", content: t("comparator.copilot.business.intro") });
      } else if (intro) initial.push(intro);
      // B2B upsell: retail user moving large notional → nudge to corporate desk.
      if (segment === "retail" && amount >= B2B_UPSELL_MIN_AMOUNT) {
        initial.push({
          role: "assistant",
          content: t("comparator.copilot.b2bUpsell"),
        });
      }
      setChat(initial);
      setAiCollapsed(false);
      track("comparator_query", {
        amount,
        from_currency: from,
        to_currency: to,
        segment,
        urgency,
        source: "home_comparator",
      });
    },
    onError: () => setAiLoading(false),
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
          sortBy,
          recommendation: aiText,
          top: result.rows.slice(0, 8).map((r) => ({
            name: r.name,
            received: r.received,
            fee_total: r.fee_total,
            speed_hours: r.speed_hours,
          })),
          history: newHistory.map((m) => ({ role: m.role, content: m.content })),
        },
      });
      setChat((c) => [...c, { role: "assistant", content: res.text }]);
    },
  });

  // React to filter changes in the table: append a short assistant note.
  const lastSortRef = useRef<SortKey>("received");
  useEffect(() => {
    if (!result) return;
    if (lastSortRef.current === sortBy) return;
    lastSortRef.current = sortBy;
    const msg = proactiveMessage(result, sortBy);
    if (!msg) return;
    const label =
      sortBy === "received"
        ? t("comparator.copilot.filter.received")
        : sortBy === "fee"
          ? t("comparator.copilot.filter.fee")
          : t("comparator.copilot.filter.speed");
    const intro = t("comparator.copilot.filterReact").replace("{filter}", label);
    setChat((c) => [...c, { ...msg, content: `${intro}\n\n${msg.content}` }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, result]);

  // Keep form state shareable, but only compare after the explicit CTA.
  useEffect(() => {
    setValidationError(null);
    if (amount <= 0 || !sendingCountry || !receivingCountry || from === to) return;
    setResult(null);
    setAiText("");
    setChat([]);
    void navigate({
      search: {
        origin: sendingCountry,
        destination: receivingCountry,
        segment,
        from,
        to,
        amount,
        lang,
      },
      replace: true,
      resetScroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, from, to, segment, sendingCountry, receivingCountry]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, chatMut.isPending]);

  const openPreferredRate = (slug: string, url: string, name?: string) => {
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
    void name;
    if (typeof window !== "undefined" && url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
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


  const sendChat = async (msg: string) => {
    const trimmed = msg.trim();
    if (!trimmed || chatMut.isPending) return;
    setChatInput("");
    if (segment === "business" && businessStage !== "done") {
      setChat((current) => [...current, { role: "user", content: trimmed }]);
      if (businessStage === "volume") {
        const volumeMatch = trimmed.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
        const monthlyVolume = volumeMatch ? Number(volumeMatch[0]) : 0;
        const sector = trimmed
          .replace(volumeMatch?.[0] ?? "", "")
          .replace(/^[\s,:;-]+|[\s,:;-]+$/g, "");
        if (!monthlyVolume || sector.length < 2) {
          setChat((current) => [
            ...current,
            { role: "assistant", content: t("comparator.copilot.business.volumeError") },
          ]);
          return;
        }
        setBusinessData({ monthlyVolume, sector });
        setBusinessStage("email");
        setChat((current) => [
          ...current,
          {
            role: "assistant",
            content: t("comparator.copilot.business.email").replace(
              "{providers}",
              result?.rows
                .slice(0, 2)
                .map((row) => row.name)
                .join(" y ") ?? "—",
            ),
          },
        ]);
        return;
      }
      if (businessStage === "email") {
        const email = trimmed.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
        if (!email) {
          setChat((current) => [
            ...current,
            { role: "assistant", content: t("comparator.copilot.business.emailError") },
          ]);
          return;
        }
        setBusinessData((current) => ({ ...current, email }));
        setBusinessStage("consent");
        setChat((current) => [
          ...current,
          { role: "assistant", content: t("comparator.copilot.business.consent") },
        ]);
        return;
      }
      return;
    }
    chatMut.mutate(trimmed);
  };

  const confirmBusinessLead = async () => {
    if (
      !businessData.email ||
      !businessData.monthlyVolume ||
      !businessData.sector ||
      savingBusinessLead
    )
      return;
    setSavingBusinessLead(true);
    try {
      await captureBusinessFn({
        data: {
          email: businessData.email,
          monthlyVolume: businessData.monthlyVolume,
          sector: businessData.sector,
          fromCurrency: from,
          toCurrency: to,
          sendingCountry,
          receivingCountry,
          locale: lang,
          consent: true,
          topProviders: result?.rows.slice(0, 2).map((row) => row.name) ?? [],
        },
      });
      setBusinessStage("done");
      setChat((current) => [
        ...current,
        { role: "user", content: t("comparator.copilot.business.yes") },
        { role: "assistant", content: t("comparator.copilot.business.success") },
      ]);
      track("conversion_completed", {
        amount: businessData.monthlyVolume,
        from_currency: from,
        to_currency: to,
        segment,
        source: "business_chat",
      });
    } catch {
      setChat((current) => [
        ...current,
        { role: "assistant", content: t("comparator.copilot.business.saveError") },
      ]);
    } finally {
      setSavingBusinessLead(false);
    }
  };

  return (
    <section id="comparator" key={lang} className="min-h-screen bg-background py-8 pb-32 sm:py-12 sm:pb-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t("search.new")}
        </Link>
        {/* Transfer details step */}
        <div className="mb-6 text-center sm:mb-8">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("comparator.transferDetails")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            {t("comparator.transferDetails.subtitle")}
          </p>
        </div>

        {/* Decision engine — full width. AI Agent is a floating widget (see below). */}
        <div className="min-w-0">
          {/* Decision card */}
          <div className="surface-card overflow-hidden min-w-0">

          {/* Card header: brand + segment toggle */}
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkle className="h-3.5 w-3.5 shrink-0 text-foreground" />
              <span className="truncate">{t("brand.decisionEngine")}</span>
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
            {sendingCountry === receivingCountry && (
              <div className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
                {t("search.sameCountry")}
              </div>
            )}
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

            {/* Row 2 — Amount mode | Amount | Source Currency | Target Currency */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <FieldLight label={t("comparator.field.amountMode")}>
                <div className="flex h-11 rounded-md border border-input bg-muted p-1">
                  {(["send", "receive"] as AmountMode[]).map((mode) => (
                    <Button
                      key={mode}
                      type="button"
                      size="sm"
                      variant={amountMode === mode ? "default" : "ghost"}
                      onClick={() => setAmountMode(mode)}
                      className="h-8 flex-1"
                    >
                      {t(`comparator.amountMode.${mode}`)}
                    </Button>
                  ))}
                </div>
              </FieldLight>
              <FieldLight
                label={
                  amountMode === "send"
                    ? t("comparator.field.amountSent")
                    : t("comparator.field.amountReceived")
                }
              >
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  value={amount || ""}
                  placeholder="1000"
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
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
              <Button
                onClick={() => {
                  if (!sendingCountry || !receivingCountry || amount <= 0) {
                    setValidationError(t("fx.validation"));
                    return;
                  }
                  setValidationError(null);
                  compareMut.mutate();
                }}
                disabled={compareMut.isPending}
                className="btn-cta h-11 w-full rounded-md px-6 text-sm font-semibold"
              >
                {compareMut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="truncate">…</span>
                  </>
                ) : (
                  <>
                    <span className="truncate">{t("comparator.cta.compareRates")}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </>
                )}
              </Button>
              {validationError && (
                <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {validationError}
                </div>
              )}
            </div>
          </div>
          </div>

        </div>

        {/* Floating AI Agent — fixed bottom-right, minimized by default.
            Chat state (history, result context) is preserved across collapse/expand
            because we only toggle visibility, not unmount. */}
        <FloatingAgent
          collapsed={aiCollapsed}
          onToggle={(next) => setAiCollapsed(next)}
          unreadCount={chat.length}
          lang={lang}
          t={t}
          aiLoading={aiLoading}
          chat={chat}
          result={result}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendChat={sendChat}
          chatMutPending={chatMut.isPending}
          chatBottomRef={chatBottomRef}
          openPreferredRate={openPreferredRate}
          handleSaveAlert={handleSaveAlert}
          segment={segment}
          businessStage={businessStage}
          savingBusinessLead={savingBusinessLead}
          confirmBusinessLead={confirmBusinessLead}
          setBusinessStage={setBusinessStage}
          setChat={setChat}
        />



        {/* Errors */}
        {compareMut.isError && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {(compareMut.error as Error)?.message ?? "Couldn't load rates."}
          </div>
        )}

        {/* Results table — full width below the decision/AI grid */}
        {result && (
          <div className="mt-6 min-w-0">
            <ResultsBlock
              result={result}
              amount={amount}
              sortBy={sortBy}
              onSortChange={setSortBy}
              handleAffiliateClick={openPreferredRate}
              tDisclaimer={t("fx.disclaimer")}
              tTrademarks={t("fx.trademarks")}
              tRatesSource={t("fx.ratesSource")}
              tAt={t("fx.at")}
              tRecipient={t("fx.recipient")}
              tAmountSent={t("comparator.table.amountSent")}
              tTotalFee={t("fx.totalFee")}
              tSpeed={t("fx.speed")}
              tCta={t("retail.cta")}
              tMidmarket={t("fx.midmarket")}
              tUpdated={t("fx.updated")}
              tProvider={t("cmp.provider")}
              tLastUpdate={t("comparator.lastUpdate")}
              tSavingsLabel={t("comparator.savings.label")}
              tSavingsBaseline={t("comparator.savings.baseline")}
              tNeutrality={t("comparator.disclaimer.neutrality")}
            />
          </div>
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
  sortBy,
  onSortChange,
  handleAffiliateClick,
  tDisclaimer,
  tTrademarks,
  tRatesSource,
  tAt,
  tRecipient,
  tAmountSent,
  tTotalFee,
  tSpeed,
  tCta,
  tMidmarket,
  tUpdated,
  tProvider,
  tLastUpdate,
  tSavingsLabel,
  tSavingsBaseline,
  tNeutrality,
}: {
  result: ComparisonResult;
  amount: number;
  sortBy: SortKey;
  onSortChange: (k: SortKey) => void;
  handleAffiliateClick: (slug: string, url: string, name?: string) => void;
  tDisclaimer: string;
  tTrademarks: string;
  tRatesSource: string;
  tAt: string;
  tRecipient: string;
  tAmountSent: string;
  tTotalFee: string;
  tSpeed: string;
  tCta: string;
  tMidmarket: string;
  tUpdated: string;
  tProvider: string;
  tLastUpdate: string;
  tSavingsLabel: string;
  tSavingsBaseline: string;
  tNeutrality: string;
}) {
  const showLargeBanner = amount >= 50000;

  const organic = useMemo(() => {
    const base = [...result.rows];
    if (sortBy === "received") base.sort((a, b) => b.received - a.received);
    if (sortBy === "fee") base.sort((a, b) => a.fee_total - b.fee_total);
    if (sortBy === "speed")
      base.sort(
        (a, b) =>
          (a.delivery_minutes ?? a.speed_hours * 60) - (b.delivery_minutes ?? b.speed_hours * 60),
      );
    return base;
  }, [result.rows, sortBy]);

  // Savings = amount * (baseline_spread - best_provider_spread).
  // baseline_spread is the 3.5% retail/remittance market reference.
  const savings = useMemo(() => {
    if (!result.rows.length || amount <= 0) return null;
    const bestSpreadPct = Math.min(...result.rows.map((r) => Number(r.spread_applied) || 0));
    const bestSpread = bestSpreadPct / 100;
    const delta = MARKET_BASELINE_SPREAD - bestSpread;
    if (delta <= 0) return null;
    return { amountSaved: amount * delta };
  }, [result.rows, amount]);

  // Crisp HH:mm:ss for the trust line.
  const updatedTime = new Date(result.rates_updated_at).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="mt-6">
      {showLargeBanner && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
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
        </div>
      )}

      {/* Live trust strip: last-update timestamp (HH:mm:ss) always visible */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[11px] text-foreground">
        <div className="inline-flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="font-semibold uppercase tracking-wider text-emerald-700">
            {tLastUpdate}:
          </span>
          <span className="tabular-nums">{updatedTime}</span>
        </div>
        <span className="truncate text-muted-foreground">
          1 {result.base} = {result.market_rate.toFixed(6)} {result.quote} · {tMidmarket}
        </span>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 sm:grid-cols-3 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              {tSavingsLabel}
            </div>
            <div className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {savings
                ? savings.amountSaved.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : "—"}{" "}
              <span className="text-sm font-normal text-muted-foreground">{result.base}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">{tSavingsBaseline}</div>
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
                onClick={() => onSortChange(k)}
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

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden grid-cols-[minmax(180px,2.2fr)_minmax(105px,1.15fr)_minmax(120px,1.25fr)_minmax(125px,1.35fr)_minmax(90px,1fr)_64px] gap-4 border-b border-border bg-muted/60 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:grid">
          <div className="min-w-0">{tProvider}</div>
          <div className="min-w-0 text-right">{tAmountSent}</div>
          <div className="min-w-0 text-right">{tTotalFee}</div>
          <div className="min-w-0 text-right">{tRecipient}</div>
          <div className="min-w-0 text-right">{tSpeed}</div>
          <div />
        </div>
        {organic.map((row, i) => (
          <ProviderRow
            key={row.slug}
            row={row}
            quote={result.quote}
            base={result.base}
            isBest={i === 0 && sortBy === "received"}
            onClick={() => handleAffiliateClick(row.slug, row.affiliate_url, row.name)}
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
          <span className="tabular-nums">{updatedTime}</span>
        </span>
      </div>
      <p className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">⚖︎ </span>
        {tNeutrality}
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">{tDisclaimer}</p>
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
  const { t } = useI18n();
  const tooltipPreferred = t("comparator.tooltip.proceed");
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
    ratePct >= -0.25 ? "text-emerald-600" : ratePct >= -1 ? "text-amber-600" : "text-destructive";

  return (
    <div
      className={`grid grid-cols-1 gap-2 border-b border-border px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(180px,2.2fr)_minmax(105px,1.15fr)_minmax(120px,1.25fr)_minmax(125px,1.35fr)_minmax(90px,1fr)_64px] lg:items-center lg:gap-4 ${
        isBest ? "bg-primary/5" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <BrandLogo name={row.name} url={row.website_url ?? row.affiliate_url} size={36} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-semibold text-foreground">{row.name}</span>
            {isBest && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                {t("comparator.table.bestRate")}
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
                <Star className="h-2.5 w-2.5 fill-current" /> {row.trust_score.toFixed(1)} (
                {row.review_count.toLocaleString()})
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="min-w-0 text-sm tabular-nums text-foreground lg:text-right">
        <span className="text-[10px] uppercase text-muted-foreground lg:hidden">
          {t("comparator.table.amountSent")} ·{" "}
        </span>
        {row.amount_sent.toLocaleString(undefined, { maximumFractionDigits: 2 })} {base}
      </div>
      <div className="min-w-0 text-sm tabular-nums text-muted-foreground lg:text-right">
        <span className="text-[10px] uppercase lg:hidden">{t("fx.totalFee")} · </span>
        {row.fee_total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {base}
        <div className="text-[10px]">
          {row.fee_percent_applied > 0 && `${row.fee_percent_applied.toFixed(2)}%`}
          {row.fee_fixed_applied > 0 && ` + ${row.fee_fixed_applied} ${base}`}
          {row.spread_applied > 0 && ` · ${row.spread_applied.toFixed(2)}% spread`}
        </div>
      </div>
      <div className="min-w-0 lg:text-right">
        <div className="text-lg font-bold tabular-nums text-foreground">
          {row.received.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
          <span className="text-xs font-normal text-muted-foreground">{quote}</span>
        </div>
        <div className={`text-[11px] tabular-nums ${ratePctClass}`}>{ratePctLabel}</div>
      </div>
      <div className="min-w-0 text-sm text-muted-foreground lg:text-right">
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
      <div className="lg:text-right">
        <button
          onClick={onClick}
          aria-label={`${tCta} — ${row.name}`}
          title={`${tCta} — ${row.name}`}
          className="btn-cta inline-flex h-10 w-full items-center justify-center rounded-md px-3 text-xs font-semibold leading-tight lg:h-9 lg:w-10 lg:px-0"
        >
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}
