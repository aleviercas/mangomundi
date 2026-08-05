import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowRight,
  ArrowLeftRight,
  Banknote,
  Briefcase,
  Building2,
  Check,
  Clock,
  Coins,
  CreditCard,
  Eye,
  Gauge,
  Handshake,
  Loader2,
  Percent,
  Send,
  Shield,
  SlidersHorizontal,
  Star,
  Sparkle,
  Zap,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  compareProviders,
  trackAffiliateClick,
  chatAboutRecommendation,
  type ComparisonResult,
} from "@/lib/fx.functions";
import { useI18n } from "@/lib/i18n";
import { localCurrency, primaryCountryForCurrency, resolveRouteCode } from "@/lib/countries";
import { BrandLogo } from "@/components/BrandLogo";
import { PreferredRateModal } from "@/components/PreferredRateModal";
import { CurrencyCombobox } from "@/components/ui/CurrencyCombobox";
import { useAnalytics } from "@/hooks/use-analytics";
import { B2B_UPSELL_MIN_AMOUNT } from "@/config/providers";
import { captureBusinessLead } from "@/lib/agent.functions";
import { getMasterRateState, reportMissingCorridor } from "@/lib/master.functions";
import {
  MasterRateStore,
  type MasterRateMap,
  type MissingCorridorEntry,
} from "@/services/providers/MasterRateStore";
import {
  AiCopilot,
  MissingCorridorCta,
  buildWizardContext,
  resolveWizardLocale,
  localHowToCompare,
  localTransferLimits,
  localFeeBreakdown,
  localAbout,
  localFree,
  localNeutral,
  localSend,
  localProviders,
  type WizardAction,
} from "@/components/AiCopilot";
import { Button } from "@/components/ui/button";
import {
  sortByScore,
  deriveBadges,
  pickFeaturedAmongTies,
  computeCompositeScores,
  type ScoreProfileKey,
  type BadgeKey,
} from "@/lib/scoring.functions";

type Segment = "retail" | "business";
type AmountMode = "send" | "receive";

/** White field styling for inputs/triggers inside the dark comparator card. */
const WHITE_FIELD =
  "h-11 rounded-md border border-transparent bg-white px-3 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff6b5b]/40";
type Urgency = "urgent" | "standard" | "flexible";
type SortKey = ScoreProfileKey;
type FeatureFilterKey = "cash_pickup_available" | "supports_large_tickets" | "has_exclusive_deal";
/** Monito-style "how does the recipient get paid" filter — single-select
 *  (unlike the opt-in requirement chips below, these are mutually exclusive
 *  delivery channels, not stackable requirements), null = no filter. */
type DeliveryMethod = "bank_transfer" | "cash_pickup" | "card_payout" | "broker";
/** Card payout and bank transfer are real per-provider research (see
 *  docs/multi-criteria-ranking/delivery-methods-findings.md) — bank
 *  transfer is defaulted true for active non-bank providers rather than
 *  researched individually, since it's near-universal. Cash pickup and
 *  broker reuse existing fields (`cash_pickup_available`, `provider_type`)
 *  from earlier research passes. */
const DELIVERY_METHOD_PREDICATES: Record<
  DeliveryMethod,
  (r: ComparisonResult["rows"][number]) => boolean
> = {
  bank_transfer: (r) => r.bank_transfer_available === true,
  cash_pickup: (r) => r.cash_pickup_available === true,
  card_payout: (r) => r.card_payout_available === true,
  broker: (r) => r.provider_type === "broker",
};
// NOTE: the exact grid-cols-[...] utility below is duplicated verbatim in
// both the header row and every ProviderRow (search
// "minmax(205px,1.8fr)" to find both) — Tailwind's JIT scanner needs the
// complete literal class string present in the source to generate its CSS,
// so this can't be factored into a shared JS constant/template interpolation
// without silently breaking the layout. Keep both in sync by hand. Provider/
// Exchange rate/Recibís got more breathing room than the original pass gave
// them — long provider names ("Currencies Direct", "Ria Money Transfer") and
// the exchange-rate cell's "1.2345 USD (+0.12%)" format were both getting
// clipped/overlapping at the old minimums.

const DELIVERY_METHODS: Array<{ key: DeliveryMethod; icon: typeof Banknote; labelKey: string }> = [
  { key: "bank_transfer", icon: Building2, labelKey: "comparator.delivery.bankTransfer" },
  { key: "cash_pickup", icon: Banknote, labelKey: "comparator.delivery.cashPickup" },
  { key: "card_payout", icon: CreditCard, labelKey: "comparator.delivery.cardPayout" },
  { key: "broker", icon: Handshake, labelKey: "comparator.delivery.broker" },
];
/** Sort chips: spectrum criteria only ("who's better on X"). Binary
 *  capabilities (cash pickup, large transfers, exclusive/sponsored offer)
 *  live exclusively in the "Filtros" panel below, not here too — showing
 *  "Cash pickup" in both places was confusing (same word, two different
 *  behaviors: one reorders, one hides).
 *
 *  Primary row (Kayak/Google Flights pattern: 4-5 prominent tabs). The
 *  three money-related ones are DELIBERATELY separate, not blended: a
 *  provider can advertise "$0 fee" while hiding a bad exchange rate margin
 *  (or vice versa) — splitting them is the whole point of a neutral
 *  comparator, matching Wise's own "we show the real cost" positioning. */
const SORT_CHIPS: SortKey[] = ["overall", "recipient_gets_most", "lowest_cost", "best_exchange_rate", "fastest"];
/** Secondary criteria — real, useful, but not everyone needs them on every
 *  visit. Tucked into a "More criteria" dropdown instead of crowding the
 *  primary row, same pattern as Skyscanner's "Sort by" overflow menu. */
const SECONDARY_SORT_CHIPS: SortKey[] = ["most_trusted", "best_business", "most_transparent"];
/** Maps a profile to its i18n key. Reuses existing fee/speed copy where the
 *  concept lines up 1:1, so we don't duplicate translated strings. */
/** 294000 -> "294K" — keeps the trust chip compact so it doesn't blow out
 *  the fixed-height Features cell on providers with huge review counts. */
function compactNumber(n: number): string {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(
    n,
  );
}

function sortLabelKey(p: SortKey): string {
  switch (p) {
    case "recipient_gets_most":
      return "comparator.sort.recipientGetsMost";
    case "lowest_cost":
      return "comparator.sort.fee";
    case "best_exchange_rate":
      return "comparator.sort.bestExchangeRate";
    case "fastest":
      return "comparator.sort.speed";
    case "most_trusted":
      return "comparator.sort.mostTrusted";
    case "best_business":
      return "comparator.sort.bestBusiness";
    case "best_cash_pickup":
      return "comparator.sort.cashPickup";
    case "most_transparent":
      return "comparator.sort.mostTransparent";
    case "best_large_transfers":
      return "comparator.sort.largeTransfers";
    case "best_deal":
      return "comparator.sort.bestDeal";
    default:
      return "comparator.sort.overall";
  }
}
type ChatAction =
  | { kind: "proceed"; slug: string; url: string; label: string }
  | {
      kind: "compare";
      from: string;
      to: string;
      /** Explicit country (ISO-3166) when the user named one, else inferred from currency. */
      fromCountry?: string;
      toCountry?: string;
      label: string;
    };
type ChatMsg = { role: "user" | "assistant"; content: string; actions?: ChatAction[] };
type BusinessStage = "volume" | "email" | "consent" | "done";

export interface ComparatorQuery {
  origin: string;
  destination: string;
  segment: Segment;
  from: string;
  to: string;
  amount: number;
  lang?: string;
  /** Run the comparison immediately on mount (set by the hero widget submit). */
  autoRun?: boolean;
}

export function ComparatorSection({
  initialQuery,
  embedded = false,
}: {
  initialQuery?: ComparatorQuery;
  /** Embed mode (iframe widget): drop the floating AI agent and the section
   *  chrome (padding/max-width) so it fits inside the host container. */
  embedded?: boolean;
}) {
  const { t, lang } = useI18n();
  const [amount, setAmount] = useState<number>(initialQuery?.amount ?? 1000);
  const [from, setFrom] = useState(initialQuery?.from ?? "GBP");
  const [to, setTo] = useState(initialQuery?.to ?? "USD");
  const [sendingCountry, setSendingCountry] = useState(initialQuery?.origin ?? "GB");
  // Empty until the user picks — the basic row shows "Select country…" and the
  // Compare CTA validates (same UX the old hero widget had).
  const [receivingCountry, setReceivingCountry] = useState(initialQuery?.destination ?? "");
  // Segment used to be a manual tab the user toggled. Now it's derived
  // automatically from the amount — same threshold already used for the
  // business-desk upsell banner (B2B_UPSELL_MIN_AMOUNT), so the whole
  // product agrees on one line between "individual" and "business" instead
  // of two separate magic numbers. This also removes an interactive control
  // from the card header, letting the box sit a bit shorter.
  const [segment, setSegment] = useState<Segment>(initialQuery?.segment ?? "retail");
  // Fixed: the Send/Receive pill was removed (it changed the meaning of the
  // FROM amount, which read as confusing). The amount is always what you
  // send; the server payload still expects a mode value.
  const amountMode: AmountMode = "send";
  // Fixed: the urgency field was removed from the form (the engine never used
  // it for ranking — speed is a results column/sort), but the server schema
  // still expects a value.
  const urgency: Urgency = "standard";
  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [aiText, setAiText] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<SortKey>("overall");
  /** Opt-in requirement filters — distinct from sortBy. Sorting never hides
   *  a provider (that's the whole point of the multi-criteria engine); these
   *  DO hide non-matching providers, but only because the person explicitly
   *  said they need that capability (e.g. "I need cash pickup") — that's the
   *  person narrowing to their real requirement, not us hiding someone for
   *  editorial/monetization reasons. */
  const [activeFilters, setActiveFilters] = useState<Set<FeatureFilterKey>>(new Set());
  const toggleFilter = (key: FeatureFilterKey) =>
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  // Delivery-method chips (Bank account / Cash / Card / Broker) — separate
  // from activeFilters above: single-select, click the active one again to
  // clear it back to "all methods". Folded into the "Requiere" chip row as
  // a 4th group (see render below) rather than a standalone preview grid —
  // a whole second row of tiles for a filter this narrow (4 options) was
  // more visual weight than the decision deserved, and the amount preview
  // it showed duplicated what the results table already shows per row.
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const toggleDeliveryMethod = (method: DeliveryMethod) =>
    setDeliveryMethod((prev) => (prev === method ? null : method));
  // Single legend panel (not per-row tooltips) explaining what each Features
  // icon/chip means — icon+text alone still isn't foolproof for a first-time
  // visitor on a decision involving real money, and repeating a tooltip on
  // every row adds clutter without adding clarity. One explanation, shown
  // once, toggled on demand.
  const [showLegend, setShowLegend] = useState(false);
  const requestRef = useRef(0);
  // Set true when a compare just populated results for a NEW corridor, so the
  // debounced URL-sync effect (which fires on from/to/country changes) syncs the
  // URL without wiping the freshly-set results/chat. One-shot.
  const skipNextSyncClearRef = useRef(false);
  // Auto-scroll target: the mid-market rate banner inside the comparator
  // card (Wise-style — the rate is the first thing the user should see
  // after comparing; the results table is reachable right below it).
  const resultsRef = useRef<HTMLDivElement>(null);
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
  const getMasterFn = useServerFn(getMasterRateState);
  const reportMissingFn = useServerFn(reportMissingCorridor);
  const { track } = useAnalytics();

  // Floating agent state: minimized by default on ALL devices. Only expands
  // on explicit user click. Chat transcript + unread badge persist across
  // navigation via localStorage so remounts don't reset or flicker.
  const AGENT_STORAGE_KEY = "mm.agent.v1";
  const [aiCollapsed, setAiCollapsed] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // MasterRateMap / MissingCorridorsLog (client mirror). Hydrated from the
  // server on mount and re-synced after each comparison so the AI Wizard
  // always has up-to-date context.
  const [masterMap, setMasterMap] = useState<MasterRateMap | null>(() =>
    MasterRateStore.getMaster(),
  );
  const [missingLog, setMissingLog] = useState<MissingCorridorEntry[]>(() =>
    MasterRateStore.getMissing(),
  );
  const [missingCorridor, setMissingCorridor] = useState<{ from: string; to: string } | null>(null);

  // Restore once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(AGENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { chat?: ChatMsg[]; unread?: number };
        if (Array.isArray(parsed.chat) && parsed.chat.length > 0) setChat(parsed.chat);
        if (typeof parsed.unread === "number") setUnreadCount(parsed.unread);
      }
    } catch {
      /* ignore */
    }
    // Subscribe to local master store changes (e.g. acknowledgements).
    const unsub = MasterRateStore.subscribe(() => {
      setMasterMap(MasterRateStore.getMaster());
      setMissingLog(MasterRateStore.getMissing());
    });
    // Hydrate worker-side master state into local cache (additive merge).
    getMasterFn()
      .then((state) => {
        MasterRateStore.hydrate(state.master);
        // Server-side missing log entries seed the local log too.
        for (const m of state.missing) {
          const existing = MasterRateStore.getMissing().find(
            (x) => x.from === m.from && x.to === m.to,
          );
          if (!existing) MasterRateStore.logMissing(m.from, m.to);
        }
      })
      .catch(() => {
        /* offline / build-time — ignore */
      });
    return () => {
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildReasoning = (): string => {
    return `[LANG:${lang.toUpperCase()}] mangomundi routing justification: for a transfer of ${amount.toLocaleString()} ${from} to ${to}, the engine analysed liquidity paths across indexed providers. The optimal route was selected from flat-fee optimisation and real-time interbank rates; spread, fixed fees, settlement window and regulatory coverage of each counterparty were normalised before ranking.`;
  };

  const proactiveMessage = (res: ComparisonResult, key: SortKey): ChatMsg | null => {
    const rows = [...res.rows];
    if (rows.length === 0) return null;
    const sorted = sortByScore(rows, key);
    const top = sorted[0];
    const dedicatedTplKey =
      key === "lowest_cost"
        ? "comparator.copilot.proactive.fee"
        : key === "fastest"
          ? "comparator.copilot.proactive.speed"
          : key === "most_trusted"
            ? "comparator.copilot.proactive.trust"
            : key === "best_business"
              ? "comparator.copilot.proactive.business"
              : key === "best_cash_pickup"
                ? "comparator.copilot.proactive.cashPickup"
                : key === "overall"
                  ? "comparator.copilot.proactive.rate"
                  : null;
    // Profiles without a dedicated, fact-accurate template (most_transparent,
    // best_large_transfers, best_deal, and any future one) fall back to the
    // generic "{provider} stands out on {criterion}" copy instead of the old
    // hardcoded "best rate" text, which would misstate why this pick won.
    const content = dedicatedTplKey
      ? t(dedicatedTplKey).replace("{provider}", top.name)
      : t("comparator.copilot.proactive.generic")
          .replace("{provider}", top.name)
          .replace("{criterion}", t(sortLabelKey(key)));
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
      ],
    };
  };

  const compareMut = useMutation({
    mutationFn: async (override?: {
      from: string;
      to: string;
      sendingCountry?: string;
      receivingCountry?: string;
    }) => {
      const useFrom = override?.from ?? from;
      const useTo = override?.to ?? to;
      const useSending = override?.sendingCountry ?? sendingCountry;
      const useReceiving = override?.receivingCountry ?? receivingCountry;
      const requestId = ++requestRef.current;
      const data = await compareFn({
        data: {
          amount,
          from: useFrom,
          to: useTo,
          segment,
          amountMode,
          sendingCountry: useSending || undefined,
          receivingCountry: useReceiving || undefined,
        },
      });
      return {
        data,
        requestId,
        usedFrom: useFrom,
        usedTo: useTo,
        usedSending: useSending,
        usedReceiving: useReceiving,
      };
    },
    onMutate: () => {
      setAiLoading(true);
      setResult(null);
      setAiText("");
      setChat([]);
      setMissingCorridor(null);
    },
    onSuccess: ({ data, requestId, usedFrom, usedTo, usedSending, usedReceiving }) => {
      if (requestId !== requestRef.current) return;
      if (usedFrom !== from) setFrom(usedFrom);
      if (usedTo !== to) setTo(usedTo);
      // Keep the country selects consistent with the (possibly new) currencies
      // — a suggested compare can change the corridor, not just the currency.
      if (usedSending !== sendingCountry) setSendingCountry(usedSending);
      if (usedReceiving !== receivingCountry) setReceivingCountry(usedReceiving);
      // If the corridor changed, the URL-sync effect will fire from those state
      // changes — tell it to keep the results/chat we're about to set.
      if (
        usedFrom !== from ||
        usedTo !== to ||
        usedSending !== sendingCountry ||
        usedReceiving !== receivingCountry
      ) {
        skipNextSyncClearRef.current = true;
      }
      setResult(data);
      setSortBy("overall");
      setAiText(buildReasoning());
      setAiLoading(false);
      setMissingCorridor(null);
      const intro = proactiveMessage(data, "overall");
      const initial: ChatMsg[] = [];
      // Results summary as first assistant bubble (per spec: results inside chat)
      const best = [...data.rows].sort((a, b) => b.received - a.received)[0];
      if (best) {
        const referenceTag = data.is_reference ? " _(reference)_" : "";
        const summary =
          `Sending **${amount.toLocaleString()} ${usedFrom}** to **${usedTo}** — ` +
          `best route delivers **${best.received.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${data.quote}** ` +
          `via **${best.name}**.${referenceTag}`;
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
      // Do NOT auto-expand. The agent stays minimized until the user clicks
      // it; we surface activity via the unread badge instead.
      if (aiCollapsed) setUnreadCount((n) => n + initial.length);

      track("comparator_query", {
        amount,
        from_currency: from,
        to_currency: to,
        segment,
        urgency,
        source: "home_comparator",
      });
    },
    onError: (err) => {
      setAiLoading(false);
      const msg = (err as Error)?.message ?? "";
      const m = /MISSING_CORRIDOR:([A-Z]{3})-([A-Z]{3})/.exec(msg);
      if (m) {
        setMissingCorridor({ from: m[1], to: m[2] });
        MasterRateStore.logMissing(m[1], m[2]);
      }
    },
  });

  // Auto-run one comparison when arriving from the home widget (?run=1) so the
  // user lands directly on results instead of having to click "Compare Rates"
  // again. Fires once per mount (ref guard also survives a StrictMode
  // double-effect). Same validation as the manual CTA, plus the corridor
  // sanity check the URL-sync effect uses.
  const didAutoRunRef = useRef(false);
  useEffect(() => {
    if (!initialQuery?.autoRun || didAutoRunRef.current) return;
    didAutoRunRef.current = true;
    if (amount <= 0 || from === to) return;
    // The URL-sync effect's 300ms timer clears result/chat unless this one-shot
    // flag is set — covers sub-300ms responses landing before the timer fires.
    skipNextSyncClearRef.current = true;
    compareMut.mutate(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Business no longer has a visible country field, but the optional "request
  // a manual quote" chat flow still sends sendingCountry/receivingCountry in
  // its lead — so keep them in sync with whatever currencies are selected,
  // silently, instead of asking the user to pick a country nobody needs for
  // the actual rate comparison.
  useEffect(() => {
    if (segment !== "business") return;
    const nextSending = primaryCountryForCurrency(from);
    if (nextSending && nextSending !== sendingCountry) setSendingCountry(nextSending);
    const nextReceiving = primaryCountryForCurrency(to);
    if (nextReceiving && nextReceiving !== receivingCountry) setReceivingCountry(nextReceiving);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment, from, to]);

  const requestMissingRoute = async (from: string, to: string) => {
    MasterRateStore.logMissing(from, to);
    try {
      await reportMissingFn({ data: { from, to } });
    } catch {
      /* logged locally regardless */
    }
    MasterRateStore.acknowledgeMissing(from, to);
    track("rfq_interaction", {
      amount,
      from_currency: from,
      to_currency: to,
      segment,
      urgency,
      source: "missing_corridor_request",
    });
  };

  // Runs an actual comparison for a route the user asked about in free-text
  // chat, instead of assuming it's unsupported. If it genuinely isn't
  // supported, compareMut.onError already detects MISSING_CORRIDOR and
  // surfaces the existing request-this-route CTA — so nothing is logged as
  // missing until a real attempt confirms it.
  const runSuggestedCompare = (
    suggestedFrom: string,
    suggestedTo: string,
    suggestedFromCountry?: string,
    suggestedToCountry?: string,
  ) => {
    track("rfq_interaction", {
      amount,
      from_currency: suggestedFrom,
      to_currency: suggestedTo,
      segment,
      urgency,
      source: "chat_suggested_compare",
    });
    // If the user named a specific country, use it directly. Otherwise keep each
    // country consistent with the suggested currency: only change a side's
    // country when its current country doesn't already use that currency (so a
    // route that keeps one currency leaves that country untouched).
    const nextOrigin =
      suggestedFromCountry ??
      (localCurrency(sendingCountry) === suggestedFrom
        ? sendingCountry
        : (primaryCountryForCurrency(suggestedFrom) ?? sendingCountry));
    const nextDest =
      suggestedToCountry ??
      (localCurrency(receivingCountry) === suggestedTo
        ? receivingCountry
        : (primaryCountryForCurrency(suggestedTo) ?? receivingCountry));
    compareMut.mutate({
      from: suggestedFrom,
      to: suggestedTo,
      sendingCountry: nextOrigin,
      receivingCountry: nextDest,
    });
  };

  const handleWizardAction = (action: WizardAction) => {
    if (action.id === "report") {
      const note = t("wizard.reportNote").replace("{from}", from).replace("{to}", to);
      MasterRateStore.logMissing(from, to);
      void reportMissingFn({ data: { from, to } }).catch(() => {});
      setChat((c) => [
        ...c,
        { role: "user", content: `${t(action.label)} ${from} → ${to}` },
        { role: "assistant", content: note },
      ]);
      return;
    }

    // "Run an example" — the no-AI path INTO the comparator: fill a sensible
    // corridor if the form is incomplete, then run the real comparison. Guides
    // a first-time user straight to results without typing anything.
    if (action.id === "example") {
      if (!receivingCountry) setReceivingCountry(sendingCountry === "US" ? "MX" : "US");
      setValidationError(null);
      setChat((c) => [
        ...c,
        { role: "user", content: t(action.label) },
        { role: "assistant", content: t("wizard.exampleNote") },
      ]);
      requestAnimationFrame(() => compareMut.mutate(undefined));
      return;
    }

    // Product / onboarding answers — static copy, no AI, and NO prior
    // comparison required, so the whole tree works for a first-time visitor.
    const infoReply: Record<string, () => string> = {
      about: () => localAbout(t),
      how: () => localHowToCompare(t),
      free: () => localFree(t),
      neutral: () => localNeutral(t),
      send: () => localSend(t),
      providers: () => localProviders(result, t),
    };
    if (infoReply[action.id]) {
      setChat((c) => [
        ...c,
        { role: "user", content: t(action.label) },
        { role: "assistant", content: infoReply[action.id]() },
      ]);
      return;
    }

    // Data-dependent answers (fees / limits) read the current table — need a
    // comparison first.
    if (!result) {
      setChat((c) => [
        ...c,
        { role: "user", content: t(action.label) },
        { role: "assistant", content: t("wizard.runFirst") },
      ]);
      return;
    }
    if (action.id === "limits" || action.id === "fees") {
      const reply =
        action.id === "limits" ? localTransferLimits(result, t) : localFeeBreakdown(result, t);
      setChat((c) => [
        ...c,
        { role: "user", content: t(action.label) },
        { role: "assistant", content: reply },
      ]);
      return;
    }
    void chatMut.mutate(action.prompt);
  };

  const chatMut = useMutation({
    mutationFn: async (userMsg: string) => {
      if (!result || !aiText) throw new Error("No recommendation yet");
      const newHistory: ChatMsg[] = [...chat, { role: "user", content: userMsg }];
      setChat(newHistory);
      // Client-side safety net: the server-side failover chain has a 24s
      // worst case (3 providers x 8s), but if the serverless function itself
      // gets killed by the platform's own execution limit before it can
      // return our graceful fallback, the request would otherwise hang
      // indefinitely and the app would crash instead of degrading nicely.
      // Racing against a slightly longer client timeout guarantees we always
      // land in onError with a friendly message.
      const CHAT_TIMEOUT_MS = 26_000;
      const res = await Promise.race([
        chatFn({
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
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("chat_timeout")), CHAT_TIMEOUT_MS),
        ),
      ]);
      // The AI invites the user to actually run a comparison for a
      // different route they asked about by appending a machine tag as the
      // last line of its reply (see the Neutrality Protocol prompt). Parse
      // it into a real "Compare X → Y" button — clicking it runs the actual
      // comparator, which only logs the route as missing if it genuinely
      // isn't supported (via compareMut.onError, unchanged).
      // Models often backslash-escape square brackets in markdown-rendered
      // output (since "[x]" is link syntax), so normalize "\[" / "\]" back
      // to plain brackets before matching the tag.
      const normalized = res.text.replace(/\\(\[|\])/g, "$1");
      // Each side may be a 2-letter ISO country code (when the user named a
      // specific country) or a 3-letter currency code (currency only). Match the
      // tag ANYWHERE — not just at the very end — since the model doesn't always
      // place it last; otherwise the raw "[[SUGGEST_COMPARE:…]]" text leaks into
      // the chat bubble instead of becoming a button.
      const tagMatch = /\[\[SUGGEST_COMPARE:([A-Z]{2,3})-([A-Z]{2,3})\]\]/.exec(normalized);
      const displayText = tagMatch
        ? normalized
            .replace(tagMatch[0], "")
            .replace(/\s{2,}/g, " ")
            .replace(/\s+([.!])/g, "$1")
            .trim()
        : res.text;
      const fromSide = tagMatch ? resolveRouteCode(tagMatch[1]) : undefined;
      const toSide = tagMatch ? resolveRouteCode(tagMatch[2]) : undefined;
      const actions: ChatAction[] | undefined =
        fromSide && toSide
          ? [
              {
                kind: "compare",
                from: fromSide.currency,
                to: toSide.currency,
                fromCountry: fromSide.country,
                toCountry: toSide.country,
                // Show the country code when the user named one, else the currency.
                label: `${t("wizard.compare")} ${
                  fromSide.country ?? fromSide.currency
                } → ${toSide.country ?? toSide.currency}`,
              },
            ]
          : undefined;
      setChat((c) => [...c, { role: "assistant", content: displayText, actions }]);
    },
    onError: () => {
      const locale = resolveWizardLocale(lang);
      const content =
        locale === "es"
          ? "Uy, tardó demasiado en responder. Probá de nuevo en un momento."
          : locale === "pt"
            ? "Ops, demorou demais para responder. Tente novamente em instantes."
            : "Sorry, that took too long to answer. Please try again in a moment.";
      setChat((c) => [...c, { role: "assistant", content }]);
    },
  });

  // React to filter changes in the table: append a short assistant note.
  const lastSortRef = useRef<SortKey>("overall");
  useEffect(() => {
    if (!result) return;
    if (lastSortRef.current === sortBy) return;
    lastSortRef.current = sortBy;
    const msg = proactiveMessage(result, sortBy);
    if (!msg) return;
    const label = t(sortLabelKey(sortBy));
    const intro = t("comparator.copilot.filterReact").replace("{filter}", label);
    setChat((c) => [...c, { ...msg, content: `${intro}\n\n${msg.content}` }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, result]);

  // Keep form state shareable, but only compare after the explicit CTA.
  // Debounced 300ms so rapid input changes (e.g. typing the amount) don't
  // trigger redundant state resets. (This used to also sync the /compare URL;
  // the comparator now lives on the home page with a clean URL, so only the
  // stale-result hygiene remains.)
  useEffect(() => {
    setValidationError(null);
    if (amount <= 0 || from === to) {
      skipNextSyncClearRef.current = false; // don't let a stale skip leak
      return;
    }
    const handle = setTimeout(() => {
      // After a suggested/corridor-changing compare we keep the just-set results;
      // otherwise a manual input edit clears stale results.
      if (skipNextSyncClearRef.current) {
        skipNextSyncClearRef.current = false;
      } else {
        setResult(null);
        setAiText("");
        setChat([]);
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, from, to, segment, sendingCountry, receivingCountry]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, chatMut.isPending]);

  // NOTE: previously auto-scrolled the page to "Your Results" whenever a
  // comparison landed. Removed — the results panel already renders inline
  // right below the form, and jumping the page felt disorienting rather
  // than helpful.

  // Persist chat + unread to survive remounts/navigation without flicker.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify({ chat, unread: unreadCount }));
    } catch {
      /* ignore quota */
    }
  }, [chat, unreadCount]);

  // Toggle handler: clears unread when the agent is opened.
  const handleAgentToggle = (nextCollapsed: boolean) => {
    setAiCollapsed(nextCollapsed);
    if (!nextCollapsed) setUnreadCount(0);
  };

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
        // The country panel above is a separate control the user can skip —
        // nothing else in this flow checked it, so it was possible to reach
        // email/consent/submit with receivingCountry still "" and fail the
        // server-side schema (agent.functions.ts requires exactly 2 chars).
        if (
          !sendingCountry ||
          sendingCountry.length !== 2 ||
          !receivingCountry ||
          receivingCountry.length !== 2
        ) {
          setChat((current) => [
            ...current,
            { role: "assistant", content: t("comparator.copilot.business.countryError") },
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
    if (!result) {
      setChat((current) => [
        ...current,
        { role: "user", content: trimmed },
        { role: "assistant", content: t("wizard.runFirst") },
      ]);
      return;
    }
    chatMut.mutate(trimmed);
  };

  const confirmBusinessLead = async () => {
    if (
      !businessData.email ||
      !businessData.monthlyVolume ||
      !businessData.sector ||
      !sendingCountry ||
      sendingCountry.length !== 2 ||
      !receivingCountry ||
      receivingCountry.length !== 2 ||
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

  // Embed mode drops the section chrome (padding/centered max-width) so the
  // comparator fills the iframe container; otherwise it's a home section.
  const SectionTag = embedded ? "div" : "section";

  return (
    <SectionTag
      id={embedded ? undefined : "comparator"}
      key={lang}
      className={embedded ? "min-w-0" : "scroll-mt-24 pb-8 sm:pb-12"}
    >
      <div className={embedded ? "min-w-0" : "mx-auto max-w-7xl px-5 sm:px-8"}>
        {/* THE comparator box — the single entry point. Basic row always
            visible; advanced fields fold out below inside the same card. */}
        <div className="min-w-0">
          {/* Decision card — dark, matching the brand widget (white inputs). */}
          <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.4)]">
            {/* Card header: brand + segment toggle */}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-1.5 sm:px-5">
              <div className="flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">
                <Sparkle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{t("home.search.compareLabel")}</span>
              </div>
              <div
                role="tablist"
                aria-label={t("search.segment")}
                className="flex h-8 shrink-0 items-center gap-0.5 rounded-full bg-white/10 p-1"
              >
                {(["retail", "business"] as Segment[]).map((s) => (
                  <button
                    key={s}
                    role="tab"
                    aria-selected={segment === s}
                    onClick={() => setSegment(s)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize transition ${
                      segment === s
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {t(`comparator.segment.${s}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Form body. @container lets the rows adapt to the CARD's width, not
              the viewport: 3/4 columns when the card is full-width (no results
              yet), 2 columns once it shares the row with the metrics panel. */}
            <div className="@container space-y-2 p-2.5 sm:p-3.5">
              {from === to && (
                <div className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
                  {t("search.sameCountry")}
                </div>
              )}
              {/* One consolidated row — FROM currency → swap → TO currency → CTA.
                  Currency-only (no country picker) for the main flow, matching
                  how consumer FX comparators (e.g. Wise) do it: the compare
                  engine already matches providers by currency pair, not
                  country (see fx.functions.ts), so country isn't needed here.
                  Business keeps a country panel below (compliance/RFQ need a
                  real jurisdiction) — see the segment === "business" block. */}
              <div className="grid grid-cols-1 items-stretch gap-2.5 @2xl:grid-cols-[1.5fr_auto_1.2fr_auto]">
                {/* FROM box: "You send" — amount + currency unified pill. */}
                <div className="min-w-0">
                  <FieldLight label={t("comparator.field.amount")}>
                    {/* Unified pill: amount + currency read as one control,
                        split by a hairline divider instead of two boxes. */}
                    <div className="flex h-11 w-full min-w-0 items-stretch overflow-hidden rounded-md border border-transparent bg-white shadow-sm transition-colors hover:bg-slate-50 focus-within:ring-2 focus-within:ring-[#ff6b5b]/40">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={1}
                        value={amount || ""}
                        placeholder="1000"
                        onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                        aria-label={t("comparator.field.amount")}
                        className="min-w-0 flex-1 bg-transparent px-3 text-sm font-medium tabular-nums text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                      <CurrencyCombobox
                        value={from}
                        onChange={setFrom}
                        placeholder={t("comparator.combobox.placeholder")}
                        searchPlaceholder={t("comparator.combobox.search")}
                        emptyLabel={t("comparator.combobox.empty")}
                        ariaLabel={t("comparator.field.sourceCurrency")}
                        triggerClassName="h-11 w-auto shrink-0 rounded-none border-0 border-l border-slate-200 bg-transparent px-3 shadow-none hover:bg-slate-50 focus:ring-0"
                      />
                    </div>
                  </FieldLight>
                </div>

                {/* Swap — click to flip FROM/TO (and the country panel below,
                    if Business). Rotated 90° when the row stacks vertically. */}
                <div className="flex items-center justify-center py-0.5 @2xl:flex-col @2xl:justify-end @2xl:pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      const prevFrom = from;
                      const prevTo = to;
                      setFrom(prevTo);
                      setTo(prevFrom);
                      if (segment === "business") {
                        const prevSending = sendingCountry;
                        const prevReceiving = receivingCountry;
                        setSendingCountry(prevReceiving);
                        setReceivingCountry(prevSending);
                      }
                    }}
                    aria-label={t("comparator.swap")}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#ff6b5b] transition hover:bg-white/10 hover:text-[#ff8577] focus:outline-none focus:ring-2 focus:ring-[#ff6b5b]/40"
                  >
                    <ArrowLeftRight className="h-4 w-4 rotate-90 @2xl:rotate-0" />
                  </button>
                </div>

                {/* TO box: "You receive" — currency only, highlighted while it
                    still matches FROM (nudges picking a different currency). */}
                <div className="min-w-0">
                  <FieldLight label={t("comparator.field.youReceive")}>
                    <CurrencyCombobox
                      value={to}
                      onChange={setTo}
                      placeholder={t("comparator.combobox.placeholder")}
                      searchPlaceholder={t("comparator.combobox.search")}
                      emptyLabel={t("comparator.combobox.empty")}
                      ariaLabel={t("comparator.field.targetCurrency")}
                      triggerClassName={
                        from === to ? `${WHITE_FIELD} ring-2 ring-[#ff6b5b]/60` : WHITE_FIELD
                      }
                    />
                  </FieldLight>
                </div>

                <div className="flex flex-col justify-end">
                  <Button
                    onClick={() => {
                      if (from === to || amount <= 0) {
                        setValidationError(t("fx.validation"));
                        return;
                      }
                      setValidationError(null);
                      compareMut.mutate(undefined);
                    }}
                    disabled={compareMut.isPending || from === to || amount <= 0}
                    className="h-11 w-full rounded-md bg-[#ff6b5b] px-6 text-sm font-semibold text-white hover:bg-[#ff5a48] @2xl:w-[168px]"
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
                </div>
              </div>

              {/* Business no longer shows a country panel here — confirmed the
                  provider query (`compareProviders`) filters only by segment +
                  currency, never by country, so requiring it before "Compare
                  Rates" was pure friction with zero effect on the results.
                  sendingCountry/receivingCountry are still auto-derived below
                  (via primaryCountryForCurrency) purely so the optional
                  "request a manual quote" chat flow still has a real country
                  to send if the user chooses that path — it's just never
                  shown or required as a blocking field in the main flow. */}

              {/* Mid-market exchange rate — shown as soon as a comparison has
                  run, right inside this same box (like Wise's compare page). */}
              {result && (
                <div
                  ref={resultsRef}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 scroll-mt-24"
                >
                  <span className="font-heading text-base font-bold text-white sm:text-lg">
                    1 {from} ={" "}
                    {result.market_rate.toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
                    {to}
                  </span>
                  <span className="text-xs text-slate-400">{t("comparator.midMarketRate")}</span>
                </div>
              )}

              {validationError && (
                <div className="rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {validationError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating AI Agent — fixed bottom-right, minimized by default.
            Chat state (history, result context) is preserved across collapse/expand
            because we only toggle visibility, not unmount. Hidden in embed mode:
            a floating chat inside a third-party iframe would be out of place. */}
        {!embedded && (
          <FloatingAgent
            collapsed={aiCollapsed}
            onToggle={handleAgentToggle}
            unreadCount={unreadCount}
            lang={lang}
            t={t}
            aiLoading={aiLoading}
            chat={chat}
            result={result}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendChat={sendChat}
            chatMutPending={chatMut.isPending}
            comparePending={compareMut.isPending}
            onSuggestedCompare={runSuggestedCompare}
            chatBottomRef={chatBottomRef}
            openPreferredRate={openPreferredRate}
            segment={segment}
            businessStage={businessStage}
            savingBusinessLead={savingBusinessLead}
            confirmBusinessLead={confirmBusinessLead}
            setBusinessStage={setBusinessStage}
            setChat={setChat}
            onWizardAction={handleWizardAction}
          />
        )}

        {/* Missing corridor — crowdsourced discovery CTA. */}
        {missingCorridor && (
          <div className="mt-6">
            <MissingCorridorCta
              from={missingCorridor.from}
              to={missingCorridor.to}
              acknowledged={Boolean(
                missingLog.find(
                  (m) =>
                    m.from === missingCorridor.from &&
                    m.to === missingCorridor.to &&
                    m.acknowledged,
                ),
              )}
              onRequest={() => void requestMissingRoute(missingCorridor.from, missingCorridor.to)}
            />
          </div>
        )}

        {/* Errors (non-missing-corridor) */}
        {compareMut.isError && !missingCorridor && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {(compareMut.error as Error)?.message ?? "Couldn't load rates."}
          </div>
        )}

        {/* Your Results — a first-class home section. The page auto-scrolls
            to the mid-market rate banner above (inside the comparator card)
            rather than straight to this table, so the rate is seen first. */}
        {result && (
          <div className="mt-5 min-w-0 scroll-mt-24">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">
                {t("comparator.results")}
              </h3>
            </div>
            <div className="mb-2.5 flex flex-col gap-2.5">
              {/* All sort criteria shown as plain chips, primary and
                  secondary alike — no dropdown to open. Wraps to a second
                  line on narrow screens instead of hiding options behind a
                  click. */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("comparator.sortBy")}
                </span>
                {[...SORT_CHIPS, ...SECONDARY_SORT_CHIPS].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSortBy(key)}
                    aria-pressed={sortBy === key}
                    className={`h-8 rounded-full border px-3 text-xs font-medium normal-case tracking-normal transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 ${
                      sortBy === key
                        ? "border-transparent bg-[#ff6b5b] text-white"
                        : "border-input bg-card text-foreground hover:border-foreground/30"
                    }`}
                  >
                    {t(sortLabelKey(key))}
                  </button>
                ))}
              </div>

              {/* Requirement toggles — deliberately NOT a rounded-full pill
                  like the sort chips above, and always shows an empty
                  checkbox outline (filled + checkmark only once active), so
                  these read as checkable requirements to opt into, not as
                  another "pick one" sort option. The delivery-method chips
                  (Bank account / Cash / Card / Broker) are folded in here as
                  a 4th, single-select group behind a divider — same "how
                  does the recipient get paid" switch a standalone tile grid
                  would give, without a whole extra row of UI for a 4-option
                  filter. Real per-provider data (see
                  docs/multi-criteria-ranking/delivery-methods-findings.md),
                  never hidden even when it matches nobody in the current
                  corridor — selecting it surfaces the real "no providers
                  match" empty state below, same as the checkboxes. */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <SlidersHorizontal className="h-3 w-3" /> {t("comparator.filterBy")}
                </span>
                {(
                  [
                    ["cash_pickup_available", "comparator.sort.cashPickup"],
                    ["supports_large_tickets", "comparator.sort.largeTransfers"],
                    ["has_exclusive_deal", "comparator.badge.sponsored"],
                  ] as const
                ).map(([key, labelKey]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleFilter(key)}
                    aria-pressed={activeFilters.has(key)}
                    className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 ${
                      activeFilters.has(key)
                        ? "border-foreground bg-foreground text-background"
                        : "border-input bg-card text-foreground hover:border-foreground/30"
                    }`}
                  >
                    <span
                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${
                        activeFilters.has(key)
                          ? "border-background bg-background"
                          : "border-muted-foreground/60"
                      }`}
                    >
                      {activeFilters.has(key) && <Check className="h-2.5 w-2.5 text-foreground" />}
                    </span>
                    {t(labelKey)}
                  </button>
                ))}
                <span aria-hidden className="mx-1 h-5 w-px bg-border" />
                {DELIVERY_METHODS.map(({ key, icon: Icon, labelKey }) => {
                  const isActive = deliveryMethod === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDeliveryMethod(key)}
                      aria-pressed={isActive}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 ${
                        isActive
                          ? "border-[#ff6b5b] bg-[#ff6b5b]/5 text-foreground"
                          : "border-input bg-card text-foreground hover:border-foreground/30"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t(labelKey)}
                    </button>
                  );
                })}
                {/* Legend opens in a modal — never pushes the results table
                    down, unlike an inline expand. Same content available on
                    both desktop (click) and mobile (tap), no hover needed. */}
                <button
                  type="button"
                  onClick={() => setShowLegend(true)}
                  aria-label={t("comparator.legend.toggle")}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-input bg-card text-muted-foreground hover:border-foreground/30"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Explains what "Score" drives and that "Sponsored" is a
                  disclosure, not a ranking boost — a caption instead of
                  another modal, since it's short enough to always be
                  visible rather than gated behind a click. ReactMarkdown
                  (already used for the AI chat welcome message) renders the
                  bold spans so translations can move the emphasis to match
                  each language's word order instead of a hardcoded split. */}
              <div className="text-[11px] leading-relaxed text-muted-foreground [&_p]:m-0 [&_strong]:font-semibold [&_strong]:text-foreground">
                <ReactMarkdown>{t("comparator.rankingExplainer")}</ReactMarkdown>
              </div>
            </div>
            <Dialog open={showLegend} onOpenChange={setShowLegend}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("comparator.legend.toggle")}</DialogTitle>
                  <DialogDescription className="sr-only">
                    {t("comparator.legend.toggle")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground">
                  {(
                    [
                      [Gauge, "comparator.legend.score"],
                      [Coins, "comparator.legend.fee"],
                      [Percent, "comparator.legend.bestExchangeRate"],
                      [Zap, "comparator.legend.speed"],
                      [Shield, "comparator.legend.trust"],
                      [Briefcase, "comparator.legend.business"],
                      [Banknote, "comparator.legend.cashPickup"],
                      [Eye, "comparator.legend.transparency"],
                      [ArrowLeftRight, "comparator.legend.largeTransfers"],
                      [Sparkle, "comparator.legend.sponsored"],
                    ] as const
                  ).map(([Icon, key]) => (
                    <div key={key} className="flex items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{t(key)}</span>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <ResultsBlock
              result={result}
              amount={amount}
              sortBy={sortBy}
              activeFilters={activeFilters}
              deliveryMethod={deliveryMethod}
              handleAffiliateClick={openPreferredRate}
              tDisclaimer={t("fx.disclaimer")}
              tTrademarks={t("fx.trademarks")}
              tRatesSource={t("fx.ratesSource")}
              tAt={t("fx.at")}
              tRecipient={t("fx.recipient")}
              tSpeed={t("fx.speed")}
              tExchangeRate={t("comparator.table.exchangeRate")}
              tCta={t("retail.cta")}
              tNeutrality={t("comparator.disclaimer.neutrality")}
            />
          </div>
        )}
      </div>

      <PreferredRateModal open={modalOpen} onOpenChange={setModalOpen} context={modalCtx} />
    </SectionTag>
  );
}

function FieldLight({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block truncate text-[11px] font-semibold uppercase tracking-wider text-slate-300">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </label>
  );
}

// ===== Floating AI Agent (a11y + keyboard) =====
interface FloatingAgentProps {
  collapsed: boolean;
  onToggle: (next: boolean) => void;
  unreadCount: number;
  lang: string;
  t: (k: string) => string;
  aiLoading: boolean;
  chat: ChatMsg[];
  result: ComparisonResult | null;
  chatInput: string;
  setChatInput: (v: string) => void;
  sendChat: (v: string) => void;
  chatMutPending: boolean;
  comparePending: boolean;
  onSuggestedCompare: (from: string, to: string, fromCountry?: string, toCountry?: string) => void;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
  openPreferredRate: (slug: string, url: string, name?: string) => void;
  segment: Segment;
  businessStage: BusinessStage;
  savingBusinessLead: boolean;
  confirmBusinessLead: () => void;
  setBusinessStage: (s: BusinessStage) => void;
  setChat: React.Dispatch<React.SetStateAction<ChatMsg[]>>;
  onWizardAction: (action: WizardAction) => void;
}

function FloatingAgent(p: FloatingAgentProps) {
  const {
    collapsed,
    onToggle,
    unreadCount,
    lang,
    t,
    aiLoading,
    chat,
    result,
    chatInput,
    setChatInput,
    sendChat,
    chatMutPending,
    comparePending,
    onSuggestedCompare,
    chatBottomRef,
    openPreferredRate,
    segment,
    businessStage,
    savingBusinessLead,
    confirmBusinessLead,
    setBusinessStage,
    setChat,
    onWizardAction,
  } = p;
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelLabelId = "ai-agent-title";

  // Escape closes; auto-focus composer on open.
  useEffect(() => {
    if (collapsed) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggle(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed, onToggle]);

  return (
    <div className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6">
      {collapsed ? (
        <button
          ref={toggleBtnRef}
          type="button"
          onClick={() => onToggle(false)}
          aria-label={t("comparator.copilot.agent")}
          aria-expanded={false}
          aria-haspopup="dialog"
          aria-controls="ai-agent-panel"
          className="btn-cta group relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl ring-1 ring-foreground/10 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Sparkle className="h-6 w-6" aria-hidden />
          {unreadCount > 0 && (
            <span
              aria-label={t("agent.unread").replace("{n}", String(unreadCount))}
              className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white"
            >
              {unreadCount}
            </span>
          )}
        </button>
      ) : (
        <div
          id="ai-agent-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={panelLabelId}
          className="surface-card flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden shadow-2xl ring-1 ring-foreground/10"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
            <span
              id={panelLabelId}
              className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <Sparkle className="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden />
              <span className="truncate">{t("comparator.copilot.agent")}</span>
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className="text-[10px] font-medium uppercase tracking-wider text-emerald-600"
                aria-label={`Language ${lang.toUpperCase()}`}
              >
                ● {lang.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => onToggle(true)}
                aria-label={t("agent.minimize")}
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {aiLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {t("fx.analyzing")}
              </div>
            )}

            {chat.length === 0 && !aiLoading && (
              <>
                <div className="rounded-md border border-border bg-card p-3 text-sm leading-relaxed text-foreground">
                  <ReactMarkdown>{t("chat.welcome")}</ReactMarkdown>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("wizard.quickActions")}
                </div>
                <AiCopilot onAction={onWizardAction} disabled={chatMutPending || aiLoading} />
              </>
            )}

            {chat.length > 0 && (
              <div className="space-y-2">
                {chat.map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-md px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "ml-6 bg-foreground text-background"
                        : "mr-6 border border-border bg-card text-foreground"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-strong:text-foreground">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.actions.map((a, j) =>
                          a.kind === "proceed" ? (
                            <button
                              key={j}
                              onClick={() => openPreferredRate(a.slug, a.url)}
                              className="btn-cta inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <Zap className="h-3 w-3" aria-hidden /> {a.label}
                            </button>
                          ) : (
                            <button
                              key={j}
                              onClick={() =>
                                onSuggestedCompare(a.from, a.to, a.fromCountry, a.toCountry)
                              }
                              disabled={comparePending}
                              className="btn-cta inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                            >
                              <Zap className="h-3 w-3" aria-hidden /> {a.label}
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {chatMutPending && (
                  <div className="mr-6 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />{" "}
                    {t("comparator.copilot.analyzing")}
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            )}

            {/* Persistent quick-action tree — stays available after answers so
                the whole product can be explored without free-typing/AI. */}
            {chat.length > 0 && !aiLoading && (
              <div className="pt-1">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("wizard.moreQuestions")}
                </div>
                <AiCopilot onAction={onWizardAction} disabled={chatMutPending || aiLoading} />
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border p-3">
            {segment === "business" && businessStage === "consent" && (
              <div className="mb-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={savingBusinessLead}
                  onClick={() => void confirmBusinessLead()}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {savingBusinessLead ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : null}
                  {t("comparator.copilot.business.yes")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBusinessStage("email");
                    setChat((current) => [
                      ...current,
                      { role: "assistant", content: t("comparator.copilot.business.no") },
                    ]);
                  }}
                >
                  {t("comparator.copilot.business.review")}
                </Button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendChat(chatInput);
              }}
              className="flex items-center gap-2"
            >
              <label htmlFor="ai-agent-composer" className="sr-only">
                {t("comparator.copilot.placeholder")}
              </label>
              <input
                id="ai-agent-composer"
                ref={inputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t("comparator.copilot.placeholder")}
                aria-label={t("comparator.copilot.placeholder")}
                className="flex h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                disabled={chatMutPending}
              />
              <button
                type="submit"
                disabled={chatMutPending || !chatInput.trim()}
                className="btn-cta inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={t("comparator.copilot.send")}
              >
                <Send className="h-3.5 w-3.5" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Results table (light) =====
function ResultsBlock({
  result,
  amount,
  sortBy,
  activeFilters,
  deliveryMethod,
  handleAffiliateClick,
  tDisclaimer,
  tTrademarks,
  tRatesSource,
  tAt,
  tRecipient,
  tSpeed,
  tExchangeRate,
  tCta,
  tNeutrality,
}: {
  result: ComparisonResult;
  amount: number;
  sortBy: SortKey;
  activeFilters: Set<FeatureFilterKey>;
  deliveryMethod: DeliveryMethod | null;
  handleAffiliateClick: (slug: string, url: string, name?: string) => void;
  tDisclaimer: string;
  tTrademarks: string;
  tRatesSource: string;
  tAt: string;
  tRecipient: string;
  tSpeed: string;
  tExchangeRate: string;
  tCta: string;
  tNeutrality: string;
}) {
  const { t } = useI18n();

  // Opt-in requirement filters narrow the pool BEFORE ranking/badges are
  // computed, so a "cheapest" badge always reflects the cheapest among what
  // the person can actually see right now, not a hidden full market.
  const filteredRows = useMemo(
    () =>
      result.rows.filter(
        (r) =>
          (!activeFilters.has("cash_pickup_available") || r.cash_pickup_available) &&
          (!activeFilters.has("supports_large_tickets") || r.supports_large_tickets) &&
          (!activeFilters.has("has_exclusive_deal") || r.has_exclusive_deal) &&
          (deliveryMethod == null || DELIVERY_METHOD_PREDICATES[deliveryMethod](r)),
      ),
    [result.rows, activeFilters, deliveryMethod],
  );
  const organic = useMemo(() => sortByScore(filteredRows, sortBy), [filteredRows, sortBy]);
  const badgesBySlug = useMemo(() => deriveBadges(filteredRows), [filteredRows]);
  // Composite score (0-10, Monito-style circle) — same weighted formula
  // already driving the sort/badges, just made visible per-row instead of
  // only crowning a single winner. Relative to the current corridor's
  // result set (min-max normalized), not an absolute universal rating —
  // see the legend modal for that caveat.
  const scoresBySlug = useMemo(
    () => computeCompositeScores(filteredRows, sortBy),
    [filteredRows, sortBy],
  );
  // Stable per-mount seed so the near-tie rotation (see pickFeaturedAmongTies
  // in scoring.functions.ts) picks one value for this page view and doesn't
  // flicker between renders, but still varies across visits/sessions — that's
  // what actually spreads the "featured" slot across genuinely-tied providers
  // instead of always favoring whichever one happens to sort first.
  const tieBreakSeed = useMemo(() => Math.random() * 1000, []);
  const featuredSlug = useMemo(
    () => pickFeaturedAmongTies(organic, sortBy, tieBreakSeed)?.slug ?? organic[0]?.slug,
    [organic, sortBy, tieBreakSeed],
  );
  // The featured provider must render FIRST — a "recommended" ribbon on a
  // row that isn't visually at the top reads as broken, not as a fair
  // rotation. This only ever reorders among rows that are already within
  // the near-tie threshold of each other (pickFeaturedAmongTies never picks
  // outside that cluster), so it never contradicts the actual ranking —
  // it just decides who leads among genuine equals, and puts them first.
  const displayRows = useMemo(() => {
    if (!featuredSlug) return organic;
    const idx = organic.findIndex((r) => r.slug === featuredSlug);
    if (idx <= 0) return organic;
    const copy = [...organic];
    const [featured] = copy.splice(idx, 1);
    copy.unshift(featured);
    return copy;
  }, [organic, featuredSlug]);

  // Crisp HH:mm:ss for the trust line.
  const updatedTime = new Date(result.rates_updated_at).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Every row's chip strip must be exactly as tall as the tallest one —
  // never clipping a chip, never letting a row with more badges than its
  // neighbors grow taller than them. Since each provider renders as its own
  // independent block (not a shared table row), CSS alone can't equalize N
  // siblings' heights without either capping content or hiding overflow, so
  // this measures each strip's natural content height in JS and applies the
  // max to all of them directly via the DOM (NOT via React state + a style
  // prop): when a re-measure lands on the same max as before, setState
  // would be a no-op and React would never re-apply the style, leaving
  // whatever the measurement step's temporary `height:auto` last wrote in
  // the DOM — that was the actual bug behind rows visibly drifting back to
  // their natural (uneven) height after any resort/filter that didn't
  // happen to change the tallest row. Writing the final height imperatively
  // every time sidesteps that entirely.
  const chipsRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useLayoutEffect(() => {
    let raf = 0;
    const measure = () => {
      const els = Array.from(chipsRefs.current.values());
      if (els.length === 0) return;
      els.forEach((el) => {
        el.style.height = "auto";
      });
      const max = Math.max(...els.map((el) => el.scrollHeight));
      els.forEach((el) => {
        el.style.height = `${max}px`;
      });
    };
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    // Web fonts (Manrope/Sora) can finish loading/swapping after this first
    // pass, changing chip text widths and thus wrap points — remeasure once
    // they're ready so a late font swap can't silently invalidate the
    // heights we just locked in.
    document.fonts?.ready?.then(measure).catch(() => {});
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [displayRows]);

  return (
    <div className="min-w-0">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* No separate header row anymore — every stat is self-labeled
            inline (see the mini-strip in ProviderRow), so there's nothing
            left for a header to say that isn't already on each row. That
            also means this table no longer needs a `lg:`-breakpoint desktop
            layout distinct from a mobile one: the row is one flex-wrap
            strip that reflows based on its own rendered width (not the
            viewport), so it degrades correctly both in the real `/embed`
            iframe and in the narrow (but not narrow-viewport) home-page
            widget preview — the two cases the old grid-vs-stacked
            `embedded` switch existed to handle. */}
        {displayRows.map((row) => (
          <ProviderRow
            key={row.slug}
            row={row}
            quote={result.quote}
            base={result.base}
            isBest={row.slug === featuredSlug}
            sortBy={sortBy}
            badges={badgesBySlug.get(row.slug) ?? []}
            score={scoresBySlug.get(row.slug) ?? null}
            onClick={() => handleAffiliateClick(row.slug, row.affiliate_url, row.name)}
            tCta={tCta}
            tSpeed={tSpeed}
            tExchangeRate={tExchangeRate}
            tRecipient={tRecipient}
            chipsRef={(el) => {
              if (el) chipsRefs.current.set(row.slug, el);
              else chipsRefs.current.delete(row.slug);
            }}
          />
        ))}
        {organic.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {activeFilters.size > 0 || deliveryMethod != null
              ? t("comparator.emptyFiltered")
              : t("comparator.empty")}
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

/** exclusive_deal maps to its own key but gets distinct disclosure styling
 *  below (amber, not the neutral gray merit pills) — it's a promotional
 *  signal, not a ranking merit, and must never blend in as if it were one. */
function badgeLabelKey(b: BadgeKey): string | null {
  switch (b) {
    case "lowest_fee":
      return "comparator.sort.fee";
    case "best_exchange_rate":
      return "comparator.sort.bestExchangeRate";
    case "fastest_delivery":
      return "comparator.sort.speed";
    case "most_trusted":
      return "comparator.sort.mostTrusted";
    case "best_business":
      return "comparator.sort.bestBusiness";
    case "cash_pickup":
      return "comparator.sort.cashPickup";
    case "most_transparent":
      return "comparator.sort.mostTransparent";
    case "large_transfers":
      return "comparator.sort.largeTransfers";
    case "exclusive_deal":
      return "comparator.sort.bestDeal";
    default:
      return null;
  }
}

/** Icon shown alongside the badge's text in the Features column — icon
 *  alone is never enough (no hover/tooltip on mobile, and several of these
 *  aren't self-explanatory), so this always pairs with badgeLabelKey's text,
 *  never replaces it. */
function badgeIcon(b: BadgeKey) {
  switch (b) {
    case "lowest_fee":
      return Coins;
    case "best_exchange_rate":
      return Percent;
    case "fastest_delivery":
      return Zap;
    case "most_trusted":
      return Shield;
    case "best_business":
      return Briefcase;
    case "cash_pickup":
      return Banknote;
    case "most_transparent":
      return Eye;
    case "large_transfers":
      return ArrowLeftRight;
    case "exclusive_deal":
      return Sparkle;
    default:
      return null;
  }
}

function ProviderRow({
  row,
  quote,
  base,
  isBest,
  sortBy,
  badges,
  score,
  onClick,
  tCta,
  tSpeed,
  tExchangeRate,
  tRecipient,
  chipsRef,
}: {
  row: ComparisonResult["rows"][number];
  quote: string;
  base: string;
  isBest: boolean;
  sortBy: SortKey;
  badges: BadgeKey[];
  /** Composite score (0-1) for the active sort profile, same formula that
   *  drives ranking/badges — shown as the "★ Score N.N" pill above the
   *  logo, relative to the current corridor's result set, not an absolute
   *  rating (see the legend modal). null if this row wasn't part of the
   *  scored set (shouldn't normally happen). */
  score: number | null;
  onClick: () => void;
  tCta: string;
  tSpeed: string;
  tExchangeRate: string;
  tRecipient: string;
  /** ResultsBlock uses this ref to measure this row's chip strip and
   *  imperatively set its (and every other row's) height to the shared max
   *  — see the comment above the measurement effect for why that's done
   *  directly via the DOM rather than through a React-state style prop. */
  chipsRef: (el: HTMLDivElement | null) => void;
}) {
  const { t } = useI18n();
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
  const ratePctLabel = `${ratePct >= 0 ? "+" : ""}${ratePct.toFixed(2)}%`;
  const ratePctClass =
    ratePct >= -0.25 ? "text-emerald-600" : ratePct >= -1 ? "text-amber-600" : "text-destructive";

  // Feature-highlight chips: trust score first (when we have data for it),
  // then only the badges that actually apply to this row. Count varies a
  // lot — a provider that wins several categories can have 4-5 chips, one
  // that wins none has zero — which is exactly why the strip below is
  // height-equalized across every row via `chipsRef` rather than left to
  // wrap freely (that's what made rows drift to different heights before).
  const highlightChips = (() => {
    type Chip = { key: string; icon: typeof Shield | null; text: string };
    const chips: Chip[] = [];
    if (row.review_count > 0 && row.trust_score != null) {
      chips.push({
        key: "trust",
        icon: Star,
        text: `${row.trust_score.toFixed(1)} (${compactNumber(row.review_count)} ${t("comparator.table.reviews")})`,
      });
    }
    for (const b of badges) {
      if (b === "exclusive_deal") continue;
      const labelKey = badgeLabelKey(b);
      if (!labelKey) continue;
      if (isBest && labelKey === sortLabelKey(sortBy)) continue;
      chips.push({ key: b, icon: badgeIcon(b), text: t(labelKey) });
    }
    return chips;
  })();

  return (
    <div
      className={`relative flex flex-wrap items-start gap-x-5 gap-y-3 border-b border-border px-5 pb-[18px] last:border-b-0 ${
        row.has_exclusive_deal ? "pt-[34px]" : "pt-[18px]"
      } ${isBest ? "bg-primary/5" : ""}`}
    >
      {/* Sponsored disclosure — a corner tab, not inline with the name, so
          it never crowds the Score pill or the name/logo. Always says
          exactly what it is: a disclosed commercial placement, never a
          merit ranking (see the caption under the sort/filter rows above). */}
      {row.has_exclusive_deal && (
        <span className="absolute left-0 top-0 inline-flex items-center gap-1 rounded-br-md rounded-tl-2xl border border-l-0 border-t-0 border-amber-300 bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-800">
          <Sparkle className="h-2.5 w-2.5" /> {t("comparator.badge.sponsored")}
        </span>
      )}

      {/* Provider identity — logo/name/score, fixed width so it lines up
          down the list like a real column would, without needing an actual
          shared CSS grid track across independent row elements. */}
      <div className="flex w-[190px] min-w-0 flex-none flex-col gap-1.5">
        {/* Score sits above the logo/name line, not beside it — a badge
            inline with the logo was eating into the column's already-tight
            width and crowding out longer provider names. */}
        <div className="flex h-5 items-center">
          {score != null && (
            <span
              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isBest ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <Star className="h-2.5 w-2.5 fill-current" /> {t("comparator.score.label")}{" "}
              {(score * 10).toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandLogo
            name={row.name}
            url={row.website_url ?? row.affiliate_url}
            slug={row.slug}
            size={40}
          />
          {/* min-w-0 + truncate: the isBest ribbon used to sit inline next
              to the name and could wrap it onto a second line, making just
              that row taller than its neighbors. Truncating instead keeps
              every row's identity block exactly the same height; the full
              name is still the actual text node (truncation is CSS-only),
              so it stays available to screen readers and copy/paste
              without a native title tooltip. */}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{row.name}</div>
            {isBest && (
              <div className="truncate text-[10px] font-bold uppercase text-primary">
                {t(sortLabelKey(sortBy))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats mini-strip (speed / rate / fee), each self-labeled since
          there's no shared header row anymore, then the highlight chips
          below it. min-w-0 + flex-[1_1_Npx] (never a fixed px min-width) is
          what lets this reflow based on the row's own rendered width
          instead of the viewport — see the note above the header row in
          ResultsBlock. */}
      <div className="flex min-w-[260px] flex-[1_1_360px] flex-col gap-2.5">
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {tSpeed}
            </div>
            <div className="mt-0.5 inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold text-foreground">
              <Clock className="h-3 w-3" /> {deliveryLabel}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {tExchangeRate}
            </div>
            <div className="mt-0.5 whitespace-nowrap text-[13px] font-semibold text-foreground">
              {row.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {quote}{" "}
              <span className={ratePctClass}>({ratePctLabel})</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("fx.totalFee")}
            </div>
            <div className="mt-0.5 whitespace-nowrap text-[13px] font-semibold text-foreground">
              {row.fee_total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {base}
            </div>
            {/* Fee/rate split is the whole point of a neutral comparator (a
                "$0 fee" headline can still hide a bad spread), kept as a
                subline rather than dropped. */}
            {(row.fee_percent_applied > 0 ||
              row.fee_fixed_applied > 0 ||
              row.spread_applied > 0) && (
              <div className="text-[10px] leading-snug text-muted-foreground">
                {row.fee_percent_applied > 0 && `${row.fee_percent_applied.toFixed(2)}%`}
                {row.fee_fixed_applied > 0 && ` + ${row.fee_fixed_applied} ${base}`}
                {row.spread_applied > 0 && ` · ${row.spread_applied.toFixed(2)}% spread`}
              </div>
            )}
          </div>
        </div>
        {/* Height-equalized across every row via chipsRef (see the
            measurement effect in ResultsBlock) — never scrolling, never
            clipping a chip, and never letting a row with more badges than
            its neighbors grow taller than them. */}
        <div ref={chipsRef} className="flex flex-wrap content-start items-start gap-1.5">
          {row.regulator && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Shield className="h-2.5 w-2.5 shrink-0" /> {row.regulator}
            </span>
          )}
          {highlightChips.map((c) => (
            <span
              key={c.key}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {c.icon && <c.icon className="h-2.5 w-2.5 shrink-0" />} {c.text}
            </span>
          ))}
        </div>
      </div>

      {/* Receive + CTA — kept at the row's end (scan pattern: the number
          that actually matters is the last thing seen before the button). */}
      <div className="flex flex-[1_1_180px] items-center justify-end gap-3">
        <div className="text-right">
          {/* whitespace-nowrap: this is the hero number — wrapping it onto
              two lines for large corridor amounts (COP, IDR...) would look
              broken regardless of row-height concerns, and would make this
              row taller than its neighbors besides. */}
          <div className="whitespace-nowrap text-lg font-bold tabular-nums text-foreground">
            {row.received.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
            <span className="text-xs font-normal text-muted-foreground">{quote}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">{tRecipient}</div>
        </div>
        {row.affiliate_url && (
          <button
            onClick={onClick}
            aria-label={`${tCta} — ${row.name}`}
            className="btn-cta inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
          >
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
