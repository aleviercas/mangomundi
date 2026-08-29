import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowRight,
  ArrowLeftRight,
  Banknote,
  Briefcase,
  Building2,
  ChevronDown,
  Clock,
  Coins,
  CreditCard,
  Gauge,
  Handshake,
  Loader2,
  Percent,
  Send,
  Shield,
  Star,
  Sparkle,
  Zap,
  Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { CountryCombobox } from "@/components/ui/CountryCombobox";
import { CurrencyCombobox } from "@/components/ui/CurrencyCombobox";
import { useAnalytics } from "@/hooks/use-analytics";
import { useProviderCounts } from "@/hooks/use-provider-counts";
import { B2B_UPSELL_MIN_AMOUNT } from "@/config/providers";
import { SITE_URL } from "@/config/site";
import { captureBusinessLead, captureEnterpriseLead } from "@/lib/agent.functions";
import { TrustBox } from "@/components/TrustBox";
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
  pickFeaturedAmongTies,
  computeCompositeScores,
  displayScore,
  type ScoreProfileKey,
} from "@/lib/scoring.functions";

type Segment = "retail" | "business";
type AmountMode = "send" | "receive";

/** Field styling for inputs/triggers inside the (light) comparator card —
 *  a recessed pill distinct from the card's own surface. */
const WHITE_FIELD =
  "h-11 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted hover:border-border focus:outline-none focus:ring-2 focus:ring-brand-cta/40";
/** Per-metric micro-label above each row value — design/AJUSTES-1.md §C1's
 *  literal spec (10.5px/700/.06em/uppercase/#6B5F55), not the site's
 *  cooler-toned --muted-foreground token: this is a mockup-exact value,
 *  not a general UI gray. */
const METRIC_LABEL = "text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B5F55]";
type Urgency = "urgent" | "standard" | "flexible";
type SortKey = ScoreProfileKey;
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
 *  Primary row (bigger chips, Kayak/Google Flights "Best/Cheapest/Fastest"
 *  pattern) — exactly the 3 criteria that already have a direct, obvious
 *  visual counterpart on every row (Score pill, the big received amount,
 *  the speed cell), so picking one of these visually "points at" something
 *  the person is already looking at. "overall" is labeled "Score" (see
 *  sortLabelKey) — same composite number as the pill on every row, not a
 *  separately-named editorial pick.
 *
 *  The other 3 (trust, fee, exchange rate) live behind the "More criteria"
 *  dropdown, not because they're less legitimate — the three money-related
 *  ones (recipient_gets_most, lowest_cost, best_exchange_rate) are
 *  DELIBERATELY kept as separate sort options rather than blended into one
 *  "value" metric: a provider can advertise "$0 fee" while hiding a bad
 *  exchange rate margin (or vice versa), and splitting them is the whole
 *  point of a neutral comparator — but six equal-weight chips read as "pick
 *  one of six", which stalls the decision rather than guiding it.
 *
 *  most_transparent was removed entirely (used to be here) — not a UI
 *  decision, a data-integrity one: unlike trust_score (has a documented,
 *  cited source per provider — see
 *  docs/multi-criteria-ranking/scoring-data-findings.md), no equivalent
 *  research trail exists for transparency_score. Rather than keep a sort
 *  option — and a per-row chip, and a weighted contribution to every OTHER
 *  profile including "Score" itself — built on a number nobody can
 *  currently trace back to a source, it's fully removed: the sort chip,
 *  the STRICT_SORT_FIELD entry, the SCORE_PROFILES weight in every profile
 *  (redistributed), and the per-row display chip. If a real, sourced
 *  methodology gets established later, it can come back. */
const MORE_SORT_CHIPS: SortKey[] = ["most_trusted", "lowest_cost", "best_exchange_rate"];
/** Maps a profile to its i18n key. Reuses existing fee/speed copy where the
 *  concept lines up 1:1, so we don't duplicate translated strings. */
// "best_business" deliberately excluded: the Personal/Empresa segment
// toggle above the comparator already splits results by business fit, so a
// dedicated sort chip for it was redundant. The underlying score profile
// stays (see SCORE_PROFILES) — the AI copilot still uses it for
// business-flavored questions asked in chat — only this manual chip is gone.
/** 294000 -> "294K" — keeps the trust chip compact so it doesn't blow out
 *  the fixed-height Features cell on providers with huge review counts. */
/** Maps the raw composite score (0-1, min-max normalized within the current
 *  result set — see scoring.functions.ts) onto a 7.0-9.0 display range,
 *  instead of showing it as 0-10. This is a presentation-only remap: it
 *  never touches the underlying score used for sorting/badges/featured-row
 *  selection, only how the number is printed in the pill. Rationale: a
 *  relative, corridor-specific score (not an absolute quality rating) that
 *  happens to print as "3.2/10" reads as "this provider is bad", when it
 *  really just means "weakest of this particular result set" — compressing
 *  the printed range keeps every row looking like a legitimate, curated
 *  option while the actual ranking underneath is untouched. Clamped
 *  defensively even though computeCompositeScores is mathematically
 *  guaranteed to return [0,1] (weights sum to 1.0, every component
 *  normalized to [0,1]) — cheap insurance against a future weights change
 *  breaking that invariant and printing something outside 7-9. */
// Matches Tailwind's `lg:` breakpoint (1024px) — the width the results grid
// switches from stacked to a 268px rail + results column (design/HANDOFF.md
// §3). Defaults to false (today's floating-agent behavior) until the effect
// confirms a wide viewport, so SSR/first paint never assumes desktop.
function useIsDesktopRail(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

function compactNumber(n: number): string {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(
    n,
  );
}

/** Derived from speed_hours ONLY — deliberately not delivery_minutes. See
 *  the long-form rationale on this same logic in ProviderRow: speed_hours
 *  is the only field the scoring/sort engine reads, so the printed label
 *  has to come from it too or "Fastest" sorting and the printed time can
 *  disagree. Shared here (not duplicated) so ProviderRow and the compact
 *  widget list can't drift apart on how a given speed_hours prints. */
function formatDeliverySpeed(hours: number): string {
  if (hours < 1) return "<1h";
  if (hours <= 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
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
    case "best_large_transfers":
      return "comparator.sort.largeTransfers";
    case "best_deal":
      return "comparator.sort.bestDeal";
    default:
      return "comparator.sort.overall";
  }
}

/** Same icon the matching per-row chip/legend entry already uses, so a sort
 *  chip visually points at the exact thing to look for in each row to
 *  verify the ordering — e.g. "Most transparent" and the eye icon on the
 *  transparency chip are now the same glyph, not just the same word. Before
 *  this, there was no visual link between a sort criterion and where its
 *  value actually shows up on a row, which made a correct re-sort easy to
 *  read as "didn't do anything" — nothing to visually confirm against. */
function sortIcon(p: SortKey): LucideIcon {
  switch (p) {
    case "recipient_gets_most":
      return Banknote;
    case "lowest_cost":
      return Coins;
    case "best_exchange_rate":
      return Percent;
    case "fastest":
      return Clock;
    case "most_trusted":
      return Star;
    case "best_business":
      return Briefcase;
    case "best_cash_pickup":
      return Banknote;
    case "best_large_transfers":
      return ArrowLeftRight;
    case "best_deal":
      return Sparkle;
    default:
      return Gauge;
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
  onHasResultChange,
  onQueryChange,
}: {
  initialQuery?: ComparatorQuery;
  /** Embed mode (iframe widget): drop the floating AI agent and the section
   *  chrome (padding/max-width) so it fits inside the host container. */
  embedded?: boolean;
  /** Notifies the parent page when a comparison has (or no longer has) a
   *  result, so it can collapse the marketing hero above this section —
   *  the "search becomes a sticky bar, results take the screen" pattern.
   *  Home-only; the embed widget has no hero to collapse. */
  onHasResultChange?: (hasResult: boolean) => void;
  /** Reports the debounced corridor state (same fields as ComparatorQuery,
   *  minus lang/autoRun) so the parent route can mirror it into the URL —
   *  see handleQueryChange in routes/index.tsx and design/HANDOFF.md §2.
   *  This component's own useState stays the source of truth; this is a
   *  one-way, best-effort notification, not a controlled-value callback.
   *  Home-only, same as onHasResultChange — the embed widget's corridor
   *  lives inside an iframe with no URL of its own worth syncing. */
  onQueryChange?: (q: {
    from: string;
    to: string;
    amount: number;
    segment: Segment;
    sendingCountry: string;
    receivingCountry: string;
  }) => void;
}) {
  const { t, lang } = useI18n();
  const [amount, setAmount] = useState<number>(initialQuery?.amount ?? 1000);
  const [from, setFrom] = useState(initialQuery?.from ?? "GBP");
  const [to, setTo] = useState(initialQuery?.to ?? "USD");
  const [sendingCountry, setSendingCountry] = useState(initialQuery?.origin ?? "GB");
  // Empty until the user picks — the basic row shows "Select country…" and the
  // Compare CTA validates (same UX the old hero widget had).
  const [receivingCountry, setReceivingCountry] = useState(initialQuery?.destination ?? "");
  // Country is the source of truth for the main picker (matches every real
  // remittance comparator — Remitly, WorldRemit, Western Union all lead with
  // country, currency is a byproduct) and it MUST be, now that fx_rates
  // (see fx.functions.ts, ENABLE_CORRIDOR_FILTERING) keys corridor-specific
  // pricing by (sending_country, receiving_country): a currency like EUR
  // spans 9+ sending countries in that data (ES, FR, IT, DE, IE...) with
  // genuinely different real rates per country, so a currency-only picker
  // would silently collapse them all into whichever one country
  // primaryCountryForCurrency happens to pick. These two handlers are the
  // only place `from`/`to` get set from a country change — everything else
  // downstream (buildReasoning, tracking, the rate banner, the API call)
  // keeps reading `from`/`to` exactly as before.
  const handleSendingCountryChange = (code: string) => {
    setSendingCountry(code);
    setFrom(localCurrency(code));
    setFromCurrencyOverride(false);
  };
  const handleReceivingCountryChange = (code: string) => {
    setReceivingCountry(code);
    setTo(localCurrency(code));
    setToCurrencyOverride(false);
  };
  // Escape hatch for the real minority case where currency and country
  // genuinely diverge: a multi-currency account (Wise, Revolut, business FX)
  // held by someone sending from — or receiving into — a country whose local
  // currency isn't the one they want. Off by default so the common case
  // (country implies currency) stays a single click; once on, the server
  // (fx.functions.ts, `currencyOverridden`) drops every corridor-specific
  // MTO from the results, since e.g. Sendwave literally cannot pay a GBP
  // account into EUR — only the broad-coverage brokers apply here.
  const [fromCurrencyOverride, setFromCurrencyOverride] = useState(false);
  const [toCurrencyOverride, setToCurrencyOverride] = useState(false);
  // Same country is only a dead-end when currency is left at the local
  // default too (comparing GBP->GBP within the UK is meaningless). Once the
  // override diverges the currency (e.g. UK->UK but GBP->EUR, a multi-
  // currency account paying itself in a different currency), same-country is
  // the whole point of the feature, so it must NOT trip the "same corridor"
  // guard below.
  const currencyOverridden =
    from.toUpperCase() !== localCurrency(sendingCountry) ||
    (receivingCountry !== "" && to.toUpperCase() !== localCurrency(receivingCountry));
  const sameCorridorBlocked = sendingCountry === receivingCountry && !currencyOverridden;
  // Segment used to be a manual tab the user toggled. Now it's derived
  // automatically from the amount — same threshold already used for the
  // business-desk upsell banner (B2B_UPSELL_MIN_AMOUNT), so the whole
  // product agrees on one line between "individual" and "business" instead
  // of two separate magic numbers. This also removes an interactive control
  // from the card header, letting the box sit a bit shorter.
  const [segment, setSegment] = useState<Segment>(initialQuery?.segment ?? "retail");
  // Business-only fields (design/HANDOFF.md §4) — UI state only for now: no
  // broker table exists yet to price a Spot/Forward/Option contract or a
  // recurring schedule differently, so these don't change the query. They
  // stay local until that table (and a place to persist the choice on a
  // captured lead) exists — see docs/handoff/handoff-2026-08-29-rediseno-mangomundi-4.md.
  const [contractType, setContractType] = useState<"spot" | "forward" | "option">("spot");
  const [frequency, setFrequency] = useState<"one_off" | "monthly" | "quarterly">("one_off");
  const providerCounts = useProviderCounts();
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
  useEffect(() => {
    onHasResultChange?.(Boolean(result));
  }, [result, onHasResultChange]);
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
  // activeFilters (Sponsored-only / Large-transfers checkboxes) removed —
  // both filter clusters got dropped from the UI (see FILTERS ROW below),
  // so this whole mechanism was left with nothing that could ever populate
  // it. Delivery-method filtering (right below) is unrelated and unaffected.
  // Delivery-method chips (Bank account / Cash / Card / Broker) — separate
  // from activeFilters above: single-select, click the active one again to
  // clear it back to "all methods". Folded into the "Requiere" chip row as
  // a 4th chip group (see render below) rather than a standalone preview
  // grid — the numeric per-method preview was removed in the redesign.
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const toggleDeliveryMethod = (method: DeliveryMethod) =>
    setDeliveryMethod((prev) => (prev === method ? null : method));
  // Exclusive-rates filter — an explicit, user-initiated narrowing, not a
  // change to the default ranking. Neutrality lives in what happens when
  // this is OFF (default): every provider shown, ordered purely by the
  // chosen sort criterion, sponsored or not. Turning this ON is the
  // person choosing to look at a labeled subset — same category as
  // filtering by delivery method — not mangomundi silently favoring
  // partners. Within the filtered set, sort still applies exactly as
  // normal; this never reorders anything on its own.
  const [showOnlyExclusive, setShowOnlyExclusive] = useState(false);
  // Single legend panel (not per-row tooltips) explaining what each Features
  // icon/chip means — icon+text alone still isn't foolproof for a first-time
  // visitor on a decision involving real money, and repeating a tooltip on
  // every row adds clutter without adding clarity. One explanation, shown
  // once, toggled on demand.
  const [showLegend, setShowLegend] = useState(false);
  // Per-option match counts for the rail's Filters card (design/HANDOFF.md
  // §3 — "conteo por opción"). Computed from the current result set, not
  // hardcoded — an option with 0 matches on this corridor still shows "0",
  // never a stale number from a previous search.
  const { deliveryCounts, exclusiveCount } = useMemo(() => {
    const counts: Record<DeliveryMethod, number> = {
      bank_transfer: 0,
      cash_pickup: 0,
      card_payout: 0,
      broker: 0,
    };
    if (!result) return { deliveryCounts: counts, exclusiveCount: 0 };
    for (const { key } of DELIVERY_METHODS) {
      counts[key] = result.rows.filter(DELIVERY_METHOD_PREDICATES[key]).length;
    }
    return {
      deliveryCounts: counts,
      exclusiveCount: result.rows.filter((r) => r.has_exclusive_deal).length,
    };
  }, [result]);
  // The 3 big order-tab headline numbers (design/AJUSTES-1.md §C2) — real
  // values from the current result set, never invented. fastestFigure
  // reuses formatDeliverySpeed, the same function ProviderRow's own
  // Delivery metric prints, so the tab and the row it points at can never
  // disagree.
  const tabSummary = useMemo(() => {
    if (!result || result.rows.length === 0) return null;
    const recommendedRow = sortByScore(result.rows, "overall")[0];
    const receiveMoreRow = sortByScore(result.rows, "recipient_gets_most")[0];
    const fastestRow = sortByScore(result.rows, "fastest")[0];
    return {
      quote: result.quote,
      recommendedFigure: Math.round(recommendedRow.received).toLocaleString(),
      recommendedName: recommendedRow.name,
      receiveMoreFigure: Math.round(receiveMoreRow.received).toLocaleString(),
      fastestFigure: formatDeliverySpeed(fastestRow.speed_hours),
      fastestName: fastestRow.name,
    };
  }, [result]);
  // Rail (design/HANDOFF.md §3) only replaces the floating agent once
  // there's a result to show a rail next to, and only at ≥lg — below that,
  // and before any result, the agent keeps its existing floating behavior.
  const isDesktopRail = useIsDesktopRail();
  const showDockedAgent = isDesktopRail && Boolean(result) && !embedded;
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
  // Was a per-message unread COUNT; nothing auto-populates `chat` anymore
  // (see compareMut's onSuccess), so there's no message count left to keep.
  // A plain boolean — "a result landed while the panel was collapsed" — is
  // what's left to signal.
  const [hasNewResult, setHasNewResult] = useState(false);

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
        const parsed = JSON.parse(raw) as { chat?: ChatMsg[]; hasNewResult?: boolean };
        if (Array.isArray(parsed.chat) && parsed.chat.length > 0) setChat(parsed.chat);
        if (typeof parsed.hasNewResult === "boolean") setHasNewResult(parsed.hasNewResult);
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
      // Lazy chat, on purpose — nothing gets built or pushed into `chat`
      // here anymore. Whatever the panel should open with (the business
      // wizard's first question, the B2B upsell note, or the generic
      // welcome + quick-actions grid) is decided at render time from
      // (segment, businessStage, result), the first time the user actually
      // expands the panel — see the `chat.length === 0` branch below. A
      // fresh result still needs a clean slate, so any leftover messages
      // from a previous corridor get cleared here.
      setChat([]);
      if (segment === "business") {
        setBusinessStage("volume");
        setBusinessData({});
      }
      // Was an unread-count badge tied to how many messages got
      // auto-generated on load; now that nothing gets auto-generated,
      // there's nothing to count. Swapped for a plain boolean — "a new
      // result is waiting" — so the collapsed toggle still visibly invites
      // the user in without implying unread chat content that doesn't
      // exist yet.
      if (aiCollapsed) setHasNewResult(true);

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
    if (amount <= 0 || !receivingCountry || sameCorridorBlocked) return;
    // The URL-sync effect's 300ms timer clears result/chat unless this one-shot
    // flag is set — covers sub-300ms responses landing before the timer fires.
    skipNextSyncClearRef.current = true;
    compareMut.mutate(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (!receivingCountry) {
        handleReceivingCountryChange(sendingCountry === "US" ? "MX" : "US");
      }
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
              // Same exact condition the row UI uses to show/hide the CTA
              // button (`{row.affiliate_url ? <button> : ...}`) — not a
              // separate "is this sponsored" flag, so it can never drift
              // from what the button actually does. Providers gain/lose a
              // real link over time (see providers.affiliate_url in
              // Supabase), so this is recomputed fresh on every request
              // rather than a hardcoded list.
              clickable: Boolean(r.affiliate_url),
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
  // trigger redundant state resets or URL writes. (This used to sync the old
  // /compare URL and got cut down to just stale-result hygiene when the
  // comparator moved to the home page — see design/HANDOFF.md §2 for why the
  // URL sync is back, now on "/" via the onQueryChange callback below rather
  // than this component touching the router directly.)
  useEffect(() => {
    setValidationError(null);
    if (amount <= 0 || !receivingCountry || sameCorridorBlocked) {
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
      onQueryChange?.({ from, to, amount, segment, sendingCountry, receivingCountry });
    }, 300);
    return () => clearTimeout(handle);
  }, [
    amount,
    from,
    to,
    segment,
    sendingCountry,
    receivingCountry,
    sameCorridorBlocked,
    onQueryChange,
  ]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, chatMut.isPending]);

  // NOTE: previously auto-scrolled the page to "Your Results" whenever a
  // comparison landed. Removed — the results panel already renders inline
  // right below the form, and jumping the page felt disorienting rather
  // than helpful.

  // Persist chat + hasNewResult to survive remounts/navigation without flicker.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify({ chat, hasNewResult }));
    } catch {
      /* ignore quota */
    }
  }, [chat, hasNewResult]);

  // Toggle handler: clears the "new result" flag when the agent is opened.
  const handleAgentToggle = (nextCollapsed: boolean) => {
    setAiCollapsed(nextCollapsed);
    if (!nextCollapsed) setHasNewResult(false);
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
      // The wizard's opening question is render-only until now (see the
      // `chat.length === 0` branch) — never written into `chat` while the
      // panel sits unopened. The FIRST reply is what proves the user
      // actually engaged, so that's the moment it gets backfilled as a
      // real message, ahead of their own — otherwise their reply would be
      // the first thing in the transcript with no visible question above it.
      setChat((current) =>
        current.length === 0
          ? [
              { role: "assistant", content: t("comparator.copilot.business.intro") },
              { role: "user", content: trimmed },
            ]
          : [...current, { role: "user", content: trimmed }],
      );
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
            visible; advanced fields fold out below inside the same card.
            Once a comparison has run, the card sticks under the fixed
            header (top-16 = its 64px height) so the search stays reachable
            and editable while the results list below scrolls underneath it
            — the Kayak/Skyscanner "search collapses to a sticky bar, results
            take the screen" pattern, without a second page. */}
        <div className={`min-w-0 ${result && !embedded ? "sticky top-16 z-30" : ""}`}>
          {/* Decision card — light surface, same token language as the rest
              of the site (no more dark-navy island). */}
          <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_-25px_rgba(15,23,42,0.12)]">
            {/* Card header: brand + segment toggle. Tried moving this into
                the post-results filter row (Personal/Empresa alongside
                Size/Show only/Receive via) — reverted: unlike those
                filters, which just narrow already-fetched rows client-side,
                switching segment changes the SERVER query itself (a
                different fetch, not a subset) and, going to Empresa, hands
                the chat to the business-lead wizard. That decision needs to
                happen BEFORE the search runs, not as a post-results filter
                — so it stays here. */}
            <div
              className={`flex items-center justify-between gap-3 border-b border-border ${
                embedded ? "px-3 py-1" : "px-4 py-1.5 sm:px-5"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2 text-eyebrow font-bold uppercase text-brand-cta">
                <Sparkle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{t("home.search.compareLabel")}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <div
                  role="tablist"
                  aria-label={t("search.segment")}
                  className="flex h-8 shrink-0 items-center gap-0.5 rounded-full bg-muted p-1"
                >
                  {(["retail", "business"] as Segment[]).map((s) => (
                    <button
                      key={s}
                      role="tab"
                      aria-selected={segment === s}
                      onClick={() => setSegment(s)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize transition ${
                        segment === s
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t(`comparator.segment.${s}`)}
                    </button>
                  ))}
                </div>
                {/* Real, live count (useProviderCounts → getProviderCounts
                    server fn) — never a number hardcoded into copy, see
                    design/HANDOFF.md §2. Hidden while loading/embedded
                    rather than showing a stale or placeholder figure. */}
                {!embedded && providerCounts.data && (
                  <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                    {t(
                      segment === "business"
                        ? "comparator.segment.businessCount"
                        : "comparator.segment.retailCount",
                    ).replace(
                      "{n}",
                      String(
                        segment === "business"
                          ? providerCounts.data.business
                          : providerCounts.data.retail,
                      ),
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Form body. @container lets the rows adapt to the CARD's width, not
              the viewport: 3/4 columns when the card is full-width (no results
              yet), 2 columns once it shares the row with the metrics panel. */}
            <div
              className={`@container ${embedded ? "space-y-1.5 p-2" : "space-y-2 p-2.5 sm:p-3.5"}`}
            >
              {sameCorridorBlocked && receivingCountry && (
                <div className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
                  {t("search.sameCountry")}
                </div>
              )}
              {/* One consolidated row — FROM country → swap → TO country → CTA.
                  Country-first (not currency-first), matching how every real
                  MTO comparator does it (Remitly, WorldRemit, Western Union
                  all lead with country; currency is a derived label, never an
                  independent choice) — see the note by handleSendingCountryChange/
                  handleReceivingCountryChange above for why this matters now
                  that fx_rates keys corridor-specific pricing by country pair,
                  not currency pair. `from`/`to` (currency) are still the state
                  everything downstream reads — these handlers just derive them
                  from the country pick instead of the other way around. */}
              <div className="grid grid-cols-1 items-stretch gap-2.5 @2xl:grid-cols-[1.5fr_auto_1.2fr_auto]">
                {/* FROM box: "You send" — amount + country unified pill
                    (currency shown as the combobox's secondary/dropdown hint,
                    and in the mid-market rate banner once a comparison runs). */}
                <div className="min-w-0">
                  <FieldLight label={t("comparator.field.amount")}>
                    {/* Unified pill: amount + country read as one control,
                        split by a hairline divider instead of two boxes. */}
                    <div className="flex h-11 w-full min-w-0 items-stretch overflow-hidden rounded-md border border-border bg-background shadow-sm transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-brand-cta/40">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={1}
                        value={amount || ""}
                        placeholder="1000"
                        onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                        aria-label={t("comparator.field.amount")}
                        className="min-w-0 flex-1 bg-transparent px-3 text-sm font-medium tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                      <CountryCombobox
                        value={sendingCountry}
                        onChange={handleSendingCountryChange}
                        placeholder={t("comparator.combobox.placeholder")}
                        searchPlaceholder={t("comparator.combobox.search")}
                        emptyLabel={t("comparator.combobox.empty")}
                        ariaLabel={t("comparator.field.sourceCurrency")}
                        triggerClassName="h-11 w-auto shrink-0 rounded-none border-0 border-l border-border bg-transparent px-3 shadow-none hover:bg-muted focus:ring-0"
                      />
                    </div>
                  </FieldLight>
                </div>

                {/* Swap — click to flip FROM/TO country (currency follows).
                    Rotated 90° when the row stacks vertically. */}
                <div className="flex items-center justify-center py-0.5 @2xl:flex-col @2xl:justify-end @2xl:pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      const prevSending = sendingCountry;
                      const prevReceiving = receivingCountry;
                      if (prevReceiving) handleSendingCountryChange(prevReceiving);
                      handleReceivingCountryChange(prevSending);
                    }}
                    aria-label={t("comparator.swap")}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-brand-cta transition hover:bg-muted/70 hover:text-brand-cta-hover focus:outline-none focus:ring-2 focus:ring-brand-cta/40"
                  >
                    <ArrowLeftRight className="h-4 w-4 rotate-90 @2xl:rotate-0" />
                  </button>
                </div>

                {/* TO box: "You receive" — country only, highlighted while it
                    still matches FROM (nudges picking a different country). */}
                <div className="min-w-0">
                  <FieldLight label={t("comparator.field.youReceive")}>
                    <CountryCombobox
                      value={receivingCountry}
                      onChange={handleReceivingCountryChange}
                      placeholder={t("comparator.combobox.placeholder")}
                      searchPlaceholder={t("comparator.combobox.search")}
                      emptyLabel={t("comparator.combobox.empty")}
                      ariaLabel={t("comparator.field.targetCurrency")}
                      triggerClassName={
                        sameCorridorBlocked
                          ? `${WHITE_FIELD} ring-2 ring-brand-cta/60`
                          : WHITE_FIELD
                      }
                    />
                  </FieldLight>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!receivingCountry || sameCorridorBlocked || amount <= 0) {
                        setValidationError(t("fx.validation"));
                        return;
                      }
                      setValidationError(null);
                      compareMut.mutate(undefined);
                    }}
                    disabled={
                      compareMut.isPending ||
                      !receivingCountry ||
                      sameCorridorBlocked ||
                      amount <= 0
                    }
                    className="btn-cta inline-flex h-11 w-full items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring @2xl:w-[168px]"
                  >
                    {compareMut.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="truncate">…</span>
                      </>
                    ) : (
                      <>
                        <span className="truncate">
                          {t(
                            segment === "business"
                              ? "comparator.cta.request"
                              : "comparator.cta.compareRates",
                          )}
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Business-only: contract type + frequency (design/HANDOFF.md
                  §4). UI state only for now — see the note by their
                  useState above for why. */}
              {segment === "business" && (
                <div className="grid grid-cols-2 gap-2.5 @xl:w-1/2">
                  <FieldLight label={t("comparator.field.contractType")}>
                    <select
                      value={contractType}
                      onChange={(e) => setContractType(e.target.value as typeof contractType)}
                      aria-label={t("comparator.field.contractType")}
                      className={`${WHITE_FIELD} w-full`}
                    >
                      <option value="spot">{t("comparator.contractType.spot")}</option>
                      <option value="forward">{t("comparator.contractType.forward")}</option>
                      <option value="option">{t("comparator.contractType.option")}</option>
                    </select>
                  </FieldLight>
                  <FieldLight label={t("comparator.field.frequency")}>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as typeof frequency)}
                      aria-label={t("comparator.field.frequency")}
                      className={`${WHITE_FIELD} w-full`}
                    >
                      <option value="one_off">{t("comparator.frequency.oneOff")}</option>
                      <option value="monthly">{t("comparator.frequency.monthly")}</option>
                      <option value="quarterly">{t("comparator.frequency.quarterly")}</option>
                    </select>
                  </FieldLight>
                </div>
              )}

              {/* Currency override — collapsed by default (the country pick
                  already implies the right currency for the vast majority of
                  transfers). Opens up two small currency pickers for the real
                  minority case: a multi-currency account (Wise, Revolut,
                  business FX) held by someone sending from — or receiving
                  into — a country whose local currency isn't the one they
                  actually want (e.g. sending from the UK but in EUR). Once
                  open, the server drops every corridor-specific MTO from the
                  results (see `currencyOverridden` in fx.functions.ts) —
                  those genuinely can't serve a non-local currency, only the
                  broad-coverage brokers can. */}
              {!fromCurrencyOverride && !toCurrencyOverride ? (
                <button
                  type="button"
                  onClick={() => setFromCurrencyOverride(true)}
                  className="text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
                >
                  {t("comparator.field.overrideCurrencyLink")}
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">
                    {t("comparator.field.overrideCurrencyOpen")}
                  </span>
                  <CurrencyCombobox
                    value={from}
                    onChange={(v) => {
                      setFrom(v);
                      setFromCurrencyOverride(true);
                    }}
                    ariaLabel={t("comparator.field.sourceCurrency")}
                    triggerClassName="h-8 w-auto text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const prevFrom = from;
                      setFrom(to);
                      setTo(prevFrom);
                    }}
                    aria-label={t("comparator.swap")}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-brand-cta-hover focus:outline-none focus:ring-2 focus:ring-brand-cta/40"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                  </button>
                  <CurrencyCombobox
                    value={to}
                    onChange={(v) => {
                      setTo(v);
                      setToCurrencyOverride(true);
                    }}
                    ariaLabel={t("comparator.field.targetCurrency")}
                    triggerClassName="h-8 w-auto text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFromCurrencyOverride(false);
                      setToCurrencyOverride(false);
                      setFrom(localCurrency(sendingCountry));
                      if (receivingCountry) setTo(localCurrency(receivingCountry));
                    }}
                    className="ml-auto text-[11px] text-muted-foreground underline hover:text-foreground"
                  >
                    {t("comparator.field.useLocalCurrency")}
                  </button>
                </div>
              )}

              {/* Mid-market exchange rate — shown as soon as a comparison has
                  run, right inside this same box (like Wise's compare page).
                  Skipped in embed mode: CompactResultsList already prints
                  the winner's own rate inline, and the widget has no
                  vertical budget to spare for a second rate line — this is
                  one of the concrete cuts that gets it to fit without an
                  internal scroll. */}
              {result && !embedded && (
                <div
                  ref={resultsRef}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 scroll-mt-24"
                >
                  <span className="font-heading text-base font-bold text-foreground sm:text-lg">
                    1 {from} ={" "}
                    {result.market_rate.toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
                    {to}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("comparator.midMarketRate")}
                  </span>
                </div>
              )}

              {validationError && (
                <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                  {validationError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating AI Agent — fixed bottom-right, minimized by default.
            Chat state (history, result context) is preserved across collapse/expand
            because we only toggle visibility, not unmount. Hidden in embed mode:
            a floating chat inside a third-party iframe would be out of place.
            Rendered exactly once: floating here, OR docked in the rail below
            (design/HANDOFF.md §3) — never both, see showDockedAgent. */}
        {!embedded && !showDockedAgent && (
          <FloatingAgent
            collapsed={aiCollapsed}
            onToggle={handleAgentToggle}
            hasNewResult={hasNewResult}
            amount={amount}
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

        {/* First-search loading state — only while there's no prior result to
            keep showing (a re-search with existing results just updates them
            in place once the new data lands). Without this, clicking Compare
            left a dead gap below the button until the request resolved; sized
            to roughly match 3 real ProviderRow rows for the same
            CLS-avoidance reason as BlogSection's skeleton. */}
        {compareMut.isPending && !result && (
          <div className="mt-5 min-w-0" aria-hidden>
            <div className="mb-3 h-3.5 w-28 animate-pulse rounded bg-muted" />
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center gap-3.5 border-b border-border px-5 py-4 last:border-b-0"
                >
                  <div className="h-9 w-9 shrink-0 rounded-sm bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-muted" />
                    <div className="h-3 w-40 rounded bg-muted" />
                  </div>
                  <div className="h-7 w-24 shrink-0 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Your Results — a first-class home section. The page auto-scrolls
            to the mid-market rate banner above (inside the comparator card)
            rather than straight to this table, so the rate is seen first.
            Embed mode skips all of this (tabs, filters, legend, the full
            table) for CompactResultsList — a widget in a 360-440px iframe
            has no room for a sort/filter row, and doesn't need one: it's a
            "what's the best option" summary, not the full comparator. */}
        {result &&
          (embedded ? (
            <div className="mt-2.5 min-w-0">
              <CompactResultsList
                result={result}
                handleAffiliateClick={openPreferredRate}
                tRecipient={t("fx.recipient")}
                tCta={t("retail.cta")}
              />
            </div>
          ) : (
            <div className="mt-5 grid min-w-0 scroll-mt-24 gap-5 lg:grid-cols-[268px_minmax(0,1fr)] lg:items-start">
              {/* Left rail — design/HANDOFF.md §3: Filters → AI Agent →
                  Rate alert → Trustpilot. ≥lg only; below that the page
                  keeps the existing inline filter row + floating agent
                  (rendered elsewhere), unchanged. */}
              <aside className="hidden lg:flex lg:flex-col lg:gap-4">
                <FiltersCard
                  t={t}
                  deliveryMethod={deliveryMethod}
                  toggleDeliveryMethod={toggleDeliveryMethod}
                  deliveryCounts={deliveryCounts}
                  showOnlyExclusive={showOnlyExclusive}
                  setShowOnlyExclusive={setShowOnlyExclusive}
                  exclusiveCount={exclusiveCount}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                />
                {showDockedAgent && (
                  <FloatingAgent
                    docked
                    collapsed={aiCollapsed}
                    onToggle={handleAgentToggle}
                    hasNewResult={hasNewResult}
                    amount={amount}
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
                <RateAlertCard
                  t={t}
                  from={from}
                  to={to}
                  amount={amount}
                  sendingCountry={sendingCountry}
                  receivingCountry={receivingCountry}
                />
                <TrustpilotCard t={t} />
              </aside>

              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-eyebrow font-bold uppercase text-brand-cta">
                    {t("comparator.results")}
                  </h3>
                </div>
                <div className="mb-2.5 flex flex-col gap-3">
                  {/* Sort chips row stays visible at every width (the 3 main
                    tabs aren't rail content). The secondary filters
                    cluster right below (delivery method / exclusive /
                    "more sort" dropdown) is redundant with the rail's
                    Filters card once that exists, so it's lg:hidden —
                    mobile/tablet keep using it exactly as before. */}
                  {/* Sort chips + delivery-method cluster + legend button, all
                  in ONE flex-wrap row now (on request) — they used to be
                  two separate rows. Still two visually distinct sections
                  within it: the sort chips are plain pill buttons, the
                  delivery methods sit inside their own bordered/tinted
                  cluster (bg-muted/40 + border), so the grouping stays
                  legible even after everything wraps onto multiple lines at
                  narrow widths. No literal divider line between the two
                  sections — a vertical bar can end up alone at the end of
                  a wrapped line on narrow widths (widget/mobile), which
                  reads as a stray/broken element; the cluster's own
                  border+background already separates it without needing
                  one. No "Receive via" label either (removed on request —
                  the bank/cash/card/broker icons plus this being the last
                  cluster after the sort chips already read as "how do you
                  want to receive it" without spelling it out). flex-wrap
                  (not overflow-x-auto) — a horizontal-scroll strip was
                  tried first, but at the 440px reference width of the
                  embeddable widget (see EmbedComparator/EmbedWidgetSection)
                  there wasn't enough visible width to hint that more
                  content existed off-screen, so it just looked cut off
                  instead of scrollable; wrapping costs vertical space
                  instead, but never hides anything. */}
                  {/* Primary tabs (design/AJUSTES-1.md §C2) — 3 big buttons,
                  not 4 small pills. The headline figure is the point: a
                  sort tab that shows how much you gain by using it gets
                  tapped; a pill that just says "Smart" doesn't. "More
                  criteria" no longer lives here — its 3 groups live in the
                  left rail (FiltersCard, ≥lg) and, below lg where the rail
                  is hidden, in the secondary filters row underneath. */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(
                      [
                        {
                          key: "overall" as SortKey,
                          label: t("comparator.tab.recommended"),
                          hint: t("comparator.tab.recommendedHint"),
                          figure: tabSummary?.recommendedFigure ?? "—",
                          sub: tabSummary
                            ? `${tabSummary.quote} · ${tabSummary.recommendedName}`
                            : "",
                        },
                        {
                          key: "recipient_gets_most" as SortKey,
                          label: t("comparator.tab.receiveMore"),
                          hint: t("comparator.tab.receiveMoreHint"),
                          figure: tabSummary?.receiveMoreFigure ?? "—",
                          sub: tabSummary
                            ? `${tabSummary.quote} · ${t("comparator.tab.receiveMoreSub")}`
                            : "",
                        },
                        {
                          key: "fastest" as SortKey,
                          label: t("comparator.tab.fastest"),
                          hint: t("comparator.tab.fastestHint"),
                          figure: tabSummary?.fastestFigure ?? "—",
                          sub: tabSummary?.fastestName ?? "",
                        },
                      ] as const
                    ).map((tab) => {
                      const isActive = sortBy === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setSortBy(tab.key)}
                          aria-pressed={isActive}
                          className="flex min-h-[78px] flex-col justify-between rounded-xl px-3.5 py-2.5 text-left transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/40"
                          style={{
                            border: isActive ? "1.5px solid #EE5B3E" : "1px solid #EBE3D9",
                            boxShadow: isActive ? "0 4px 14px -6px rgba(238,91,62,.35)" : "none",
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-foreground">{tab.label}</span>
                            <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
                              {tab.hint}
                            </span>
                          </div>
                          <div>
                            <div className="font-heading text-[20px] font-extrabold leading-tight tabular-nums text-foreground">
                              {tab.figure}
                            </div>
                            <div className="truncate text-[11px] font-medium text-muted-foreground">
                              {tab.sub}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Secondary filters — delivery method, exclusive-only, legend.
                  Visually separate row (smaller chips) so it never competes
                  with the primary tabs above for attention. */}
                  <div className="flex flex-wrap items-center gap-2 lg:hidden">
                    {/* "More criteria" (trust, fee, exchange rate) — moved out
                    of the primary tab row (§C2: only 3 tabs there now). At
                    ≥lg these 3 live in the rail's FiltersCard instead, so
                    this dropdown only needs to exist below that breakpoint,
                    same as the rest of this row. */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-pressed={MORE_SORT_CHIPS.includes(sortBy)}
                          className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 ${
                            MORE_SORT_CHIPS.includes(sortBy)
                              ? "border-foreground bg-foreground text-background"
                              : "border-input bg-card text-foreground hover:border-foreground/30"
                          }`}
                        >
                          {(() => {
                            const Icon = MORE_SORT_CHIPS.includes(sortBy)
                              ? sortIcon(sortBy)
                              : Gauge;
                            return <Icon className="h-3.5 w-3.5" />;
                          })()}
                          {MORE_SORT_CHIPS.includes(sortBy)
                            ? t(sortLabelKey(sortBy))
                            : t("comparator.sort.more")}
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuRadioGroup
                          value={sortBy}
                          onValueChange={(v) => setSortBy(v as SortKey)}
                        >
                          {MORE_SORT_CHIPS.map((key) => (
                            <DropdownMenuRadioItem key={key} value={key}>
                              {t(sortLabelKey(key))}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Delivery method — single-select, mutually exclusive,
                    click the active one again to clear back to "all
                    methods". Its own bordered cluster (not plain pill
                    buttons like the sort chips above) is what visually
                    marks this as a different KIND of control — a filter
                    that narrows the result set, not a reorder — without
                    needing a text label to say so. */}
                    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-1">
                      {DELIVERY_METHODS.map(({ key, icon: Icon, labelKey }) => {
                        const isActive = deliveryMethod === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleDeliveryMethod(key)}
                            aria-pressed={isActive}
                            className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 ${
                              isActive
                                ? "border-foreground bg-foreground text-background"
                                : "border-input bg-card text-foreground hover:border-foreground/30"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {t(labelKey)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Exclusive-rates filter — an explicit opt-in the person
                    turns on themselves, not a default. Accent-colored like
                    the "Check for exclusive rate" nudge pill on each row —
                    same visual language for the same underlying disclosed
                    thing, so the two read as connected. Neutral by design:
                    OFF (default) shows everyone, ordered purely by the
                    chosen sort; ON only narrows to a labeled subset,
                    still ordered by that same sort — never a re-ranking. */}
                    <button
                      type="button"
                      onClick={() => setShowOnlyExclusive((prev) => !prev)}
                      aria-pressed={showOnlyExclusive}
                      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 ${
                        showOnlyExclusive
                          ? "border-transparent bg-accent text-accent-foreground"
                          : "border-accent/40 bg-accent/10 text-accent hover:border-accent/70"
                      }`}
                    >
                      <Sparkle className="h-3.5 w-3.5" />
                      {t("comparator.filter.exclusiveOnly")}
                    </button>

                    {/* Legend opens in a modal — never pushes the results table
                    down, unlike an inline expand. Same content available on
                    both desktop (click) and mobile (tap), no hover needed. */}
                    <button
                      type="button"
                      onClick={() => setShowLegend(true)}
                      aria-label={t("comparator.legend.toggle")}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-input bg-card text-muted-foreground hover:border-foreground/30"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
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
                    {/* Moved here from the filter row, on request — same
                    ReactMarkdown treatment (bold spans translate correctly
                    across all 20 locales without hardcoding word
                    position), just relocated so it doesn't compete for
                    space with the sort/filter chips. */}
                    <div className="border-b border-border pb-3 text-sm leading-relaxed text-muted-foreground [&_p]:m-0 [&_strong]:font-semibold [&_strong]:text-foreground">
                      <ReactMarkdown>{t("comparator.rankingExplainer")}</ReactMarkdown>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground">
                      {(
                        [
                          [Gauge, "comparator.legend.score"],
                          [Coins, "comparator.legend.fee"],
                          [Percent, "comparator.legend.bestExchangeRate"],
                          [Clock, "comparator.legend.speed"],
                          [Star, "comparator.legend.trust"],
                          // The 4 delivery methods, each with its OWN real
                          // icon (matching DELIVERY_METHODS above) instead of
                          // just explaining "Cash pickup" alone — that used to
                          // leave Bank/Card/Broker unexplained, an inconsistency
                          // once all 4 became equal chips in the same cluster.
                          [Building2, "comparator.legend.bankTransfer"],
                          [Banknote, "comparator.legend.cashPickup"],
                          [CreditCard, "comparator.legend.cardPayout"],
                          [Handshake, "comparator.legend.broker"],
                          // No separate "Exclusive rates" row here — same
                          // Sparkle icon as Sponsored right below would read as
                          // a duplicate entry; the Sponsored text already
                          // covers the filter in its last sentence instead.
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
                  deliveryMethod={deliveryMethod}
                  showOnlyExclusive={showOnlyExclusive}
                  hasCorridorContext={Boolean(sendingCountry && receivingCountry)}
                  handleAffiliateClick={openPreferredRate}
                  tDisclaimer={t("fx.disclaimer")}
                  tTrademarks={t("fx.trademarks")}
                  tRatesSource={t("fx.ratesSource")}
                  tAt={t("fx.at")}
                  tRecipient={t("fx.recipient")}
                  tCta={t("retail.cta")}
                  tNeutrality={t("comparator.disclaimer.neutrality")}
                />

                {/* Stable business upsell (design/HANDOFF.md §3 + decision
                  29-ago-2026): always rendered once there's a result, never
                  popping in/out as the typed amount crosses the threshold —
                  only its emphasis changes. B2B_UPSELL_MIN_AMOUNT (not the
                  25,000 in the mockup, which was just that screen's example
                  amount) governs both the emphasis AND the copy shown once
                  crossed — the amount named there is the user's own typed
                  amount, never a fixed figure. Retail only: a business-
                  segment user is already talking to brokers. The always-on
                  band in BusinessSection (home) is unrelated and unchanged. */}
                {segment === "retail" && (
                  <div
                    className={`mt-4 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                      amount >= B2B_UPSELL_MIN_AMOUNT
                        ? "border-border bg-muted text-foreground"
                        : "border-border/60 bg-transparent text-muted-foreground"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      {amount >= B2B_UPSELL_MIN_AMOUNT
                        ? t("comparator.b2bBanner.above")
                            .replace("{amount}", amount.toLocaleString())
                            .replace("{cur}", from)
                            .replace("{threshold}", B2B_UPSELL_MIN_AMOUNT.toLocaleString())
                        : t("comparator.b2bBanner.below").replace(
                            "{threshold}",
                            B2B_UPSELL_MIN_AMOUNT.toLocaleString(),
                          )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSegment("business")}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                        amount >= B2B_UPSELL_MIN_AMOUNT
                          ? "bg-foreground text-background hover:bg-foreground/90"
                          : "text-brand-cta hover:text-brand-cta-hover"
                      }`}
                    >
                      {t("comparator.b2bBanner.cta")}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      <PreferredRateModal open={modalOpen} onOpenChange={setModalOpen} context={modalCtx} />
    </SectionTag>
  );
}

// ===== Left rail (desktop, ≥lg only) — design/HANDOFF.md §3 =====
// Filters → AI Agent (docked) → Rate alert → Trustpilot, stacked in a 268px
// column. Below lg the page keeps today's existing layout (inline filter
// chips further up + the floating agent) unchanged — this rail doesn't
// replace that, it's additive at the breakpoint where there's room for it.

/** Vertical Filters card: the same delivery-method/exclusive/rank-by state
 *  the inline filter row above already drives, re-skinned into the rail's
 *  list layout with a per-option count (design/HANDOFF.md §3). */
function FiltersCard({
  t,
  deliveryMethod,
  toggleDeliveryMethod,
  deliveryCounts,
  showOnlyExclusive,
  setShowOnlyExclusive,
  exclusiveCount,
  sortBy,
  setSortBy,
}: {
  t: (k: string) => string;
  deliveryMethod: DeliveryMethod | null;
  toggleDeliveryMethod: (m: DeliveryMethod) => void;
  deliveryCounts: Record<DeliveryMethod, number>;
  showOnlyExclusive: boolean;
  setShowOnlyExclusive: (v: boolean | ((prev: boolean) => boolean)) => void;
  exclusiveCount: number;
  sortBy: SortKey;
  setSortBy: (k: SortKey) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground">{t("comparator.filters.title")}</h4>
      </div>

      <div className="mt-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("comparator.filters.payoutMethod")}
        </div>
        <div className="mt-2 flex flex-col gap-1.5">
          {DELIVERY_METHODS.map(({ key, icon: Icon, labelKey }) => {
            const isActive = deliveryMethod === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleDeliveryMethod(key)}
                aria-pressed={isActive}
                className={`flex h-9 items-center gap-2 rounded-md border px-2.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 ${
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-input bg-background text-foreground hover:border-foreground/30"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{t(labelKey)}</span>
                <span
                  className={`ml-auto shrink-0 tabular-nums ${isActive ? "text-background/70" : "text-muted-foreground"}`}
                >
                  {deliveryCounts[key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("comparator.filters.exclusiveOffers")}
        </div>
        <button
          type="button"
          onClick={() => setShowOnlyExclusive((prev) => !prev)}
          aria-pressed={showOnlyExclusive}
          className={`mt-2 flex h-9 w-full items-center gap-2 rounded-md border px-2.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 ${
            showOnlyExclusive
              ? "border-transparent bg-accent text-accent-foreground"
              : "border-accent/40 bg-accent/10 text-accent hover:border-accent/70"
          }`}
        >
          <Sparkle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{t("comparator.filter.exclusiveOnly")}</span>
          <span
            className={`ml-auto shrink-0 tabular-nums ${showOnlyExclusive ? "text-accent-foreground/70" : "text-accent/70"}`}
          >
            {exclusiveCount}
          </span>
        </button>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("comparator.filters.rankBy")}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {MORE_SORT_CHIPS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              aria-pressed={sortBy === key}
              className={`inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 ${
                sortBy === key
                  ? "border-foreground bg-foreground text-background"
                  : "border-input bg-background text-foreground hover:border-foreground/30"
              }`}
            >
              {t(sortLabelKey(key))}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
          {t("comparator.filters.rankByHint")}
        </p>
      </div>
    </div>
  );
}

/** Email capture for "notify me if this rate improves" — design/HANDOFF.md
 *  §3. Honest about what it actually is right now: this saves the lead
 *  (email + corridor/amount context) to `enterprise_leads` via
 *  captureEnterpriseLead (feature_source: "rate_alert"), same table
 *  captureBusinessLead already writes route context into. There is NO
 *  automated job yet that watches rates and fires the email — someone has
 *  to build that monitor before this promise is fulfilled automatically.
 *  Decided explicitly (29-ago-2026, see docs/handoff/
 *  handoff-2026-08-29-rediseno-mangomundi-4.md §4 point 6): capture real
 *  interest now with honest internal docs, rather than a fake "coming soon"
 *  button or skipping the card entirely. */
function RateAlertCard({
  t,
  from,
  to,
  amount,
  sendingCountry,
  receivingCountry,
}: {
  t: (k: string) => string;
  from: string;
  to: string;
  amount: number;
  sendingCountry: string;
  receivingCountry: string;
}) {
  const submit = useServerFn(captureEnterpriseLead);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || pending) return;
    setPending(true);
    setError(false);
    try {
      await submit({
        data: {
          email,
          featureSource: "rate_alert",
          consent: true,
          fromCurrency: from,
          toCurrency: to,
          sendingCountry: sendingCountry || undefined,
          receivingCountry: receivingCountry || undefined,
          amount,
        },
      });
      setDone(true);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div
        className="h-[104px] bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/howitworks-person.jpg')",
          backgroundPosition: "center 28%",
        }}
        aria-hidden
      />
      <div className="p-4">
        <h4 className="text-sm font-bold text-foreground">
          {t("comparator.rateAlert.title").replace("{from}", from).replace("{to}", to)}
        </h4>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {t("comparator.rateAlert.body")}
        </p>
        {done ? (
          <p className="mt-3 text-xs font-semibold text-success">
            {t("comparator.rateAlert.success")}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-3 space-y-2">
            <label htmlFor="rate-alert-email" className="sr-only">
              {t("common.email")}
            </label>
            <input
              id="rate-alert-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("retail.emailPlaceholder")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-cta focus:outline-none"
            />
            {error && (
              <p className="text-[11px] text-destructive">{t("comparator.rateAlert.error")}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-foreground text-xs font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("comparator.rateAlert.cta")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/** Trustpilot rating + the same "affiliate links never move a row up"
 *  disclaimer already shown elsewhere (design/HANDOFF.md §3). */
function TrustpilotCard({ t }: { t: (k: string) => string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-center gap-1.5">
        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
        <span className="text-xs font-bold text-foreground">
          {t("comparator.trustpilot.rated")}
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        {t("comparator.disclaimer.neutrality")}
      </p>
      <div className="mt-2">
        <TrustBox />
      </div>
    </div>
  );
}

function FieldLight({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
  /** Rail mode (design/HANDOFF.md §3, ≥lg with a result): always the
   *  expanded panel, in-flow instead of fixed to the viewport edge, no
   *  minimize button. `collapsed` is ignored while this is true. */
  docked?: boolean;
  hasNewResult: boolean;
  amount: number;
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
    docked = false,
    onToggle,
    hasNewResult,
    amount,
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

  // Escape closes; auto-focus composer on open. Docked mode has no
  // collapsed state to escape out of (there's no toggle button to return
  // focus to), so this whole effect is a no-op there.
  useEffect(() => {
    if (docked || collapsed) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggle(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [docked, collapsed, onToggle]);

  return (
    // Docked to the side edge, vertically centered — Kayak's pattern for a
    // persistent secondary panel — instead of a bottom-right corner bubble
    // that sits on top of content (on mobile it used to overlap the last
    // result row's CTA). Collapsed, it's a slim edge tab rather than a
    // floating circle, so it reads as part of the page's furniture, not an
    // overlay competing with whatever's underneath it. `docked` (the rail,
    // ≥lg with a result — design/HANDOFF.md §3) drops all of that: in-flow,
    // full width of its rail column, always the expanded panel.
    <div className={docked ? "w-full" : "fixed right-0 top-1/2 z-[60] -translate-y-1/2 sm:right-0"}>
      {!docked && collapsed ? (
        <button
          ref={toggleBtnRef}
          type="button"
          onClick={() => onToggle(false)}
          aria-label={t("comparator.copilot.agent")}
          aria-expanded={false}
          aria-haspopup="dialog"
          aria-controls="ai-agent-panel"
          className="btn-cta group relative flex flex-col items-center gap-1.5 rounded-l-xl rounded-r-none py-4 pl-3 pr-2.5 shadow-2xl ring-1 ring-foreground/10 transition hover:pr-3.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Sparkle className="h-5 w-5 shrink-0" aria-hidden />
          <span
            className="text-[11px] font-semibold leading-none [writing-mode:vertical-rl]"
            aria-hidden
          >
            {t("comparator.copilot.agent")}
          </span>
          {hasNewResult && (
            <span
              aria-label={t("agent.newResult")}
              className="absolute -left-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-success ring-2 ring-background"
            />
          )}
        </button>
      ) : (
        <div
          id="ai-agent-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={panelLabelId}
          className={
            docked
              ? "surface-card flex h-[480px] w-full flex-col overflow-hidden rounded-xl ring-1 ring-foreground/10"
              : "surface-card flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-r-none shadow-2xl ring-1 ring-foreground/10"
          }
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
                className="text-[10px] font-medium uppercase tracking-wider text-success"
                aria-label={`Language ${lang.toUpperCase()}`}
              >
                ● {lang.toUpperCase()}
              </span>
              {!docked && (
                <button
                  type="button"
                  onClick={() => onToggle(true)}
                  aria-label={t("agent.minimize")}
                  className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M3 7h8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {aiLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {t("fx.analyzing")}
              </div>
            )}

            {/* Lazy entry point — nothing here was pre-built in onSuccess
                anymore (see that handler's own comment). What shows first
                is decided right here, from state that's already available,
                the first time the user actually opens the panel:
                - Business, wizard not finished yet → the wizard's first
                  question, same copy as before, just rendered directly
                  instead of pushed into `chat` ahead of time.
                - Retail, large amount → the B2B-desk nudge, same idea.
                - Otherwise → the generic welcome + quick-actions grid
                  (already existed, this branch is unchanged). */}
            {chat.length === 0 && !aiLoading && (
              <>
                {segment === "business" && businessStage !== "done" && result ? (
                  <div className="rounded-md border border-border bg-card p-3 text-sm leading-relaxed text-foreground">
                    <ReactMarkdown>{t("comparator.copilot.business.intro")}</ReactMarkdown>
                  </div>
                ) : (
                  <>
                    {segment === "retail" && result && amount >= B2B_UPSELL_MIN_AMOUNT && (
                      <div className="rounded-md border border-border bg-card p-3 text-sm leading-relaxed text-foreground">
                        <ReactMarkdown>{t("comparator.copilot.b2bUpsell")}</ReactMarkdown>
                      </div>
                    )}
                    <div className="rounded-md border border-border bg-card p-3 text-sm leading-relaxed text-foreground">
                      <ReactMarkdown>{t("chat.welcome")}</ReactMarkdown>
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("wizard.quickActions")}
                    </div>
                    <AiCopilot onAction={onWizardAction} disabled={chatMutPending || aiLoading} />
                  </>
                )}
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
  deliveryMethod,
  showOnlyExclusive,
  hasCorridorContext,
  handleAffiliateClick,
  tDisclaimer,
  tTrademarks,
  tRatesSource,
  tAt,
  tRecipient,
  tCta,
  tNeutrality,
}: {
  result: ComparisonResult;
  amount: number;
  sortBy: SortKey;
  deliveryMethod: DeliveryMethod | null;
  showOnlyExclusive: boolean;
  /** True when the current query has both a sending and receiving country
   *  selected, i.e. a real corridor lookup was attempted server-side — see
   *  fx.functions.ts. Gates the "not verified for this route" badge: without
   *  this, every row would show has_corridor_data:false whenever no
   *  corridor lookup ran at all (currency-only comparisons), which would
   *  misleadingly badge rows that were never checked against a route in the
   *  first place. */
  hasCorridorContext: boolean;
  handleAffiliateClick: (slug: string, url: string, name?: string) => void;
  tDisclaimer: string;
  tTrademarks: string;
  tRatesSource: string;
  tAt: string;
  tRecipient: string;
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
          (deliveryMethod == null || DELIVERY_METHOD_PREDICATES[deliveryMethod](r)) &&
          (!showOnlyExclusive || r.has_exclusive_deal === true),
      ),
    [result.rows, deliveryMethod, showOnlyExclusive],
  );
  const organic = useMemo(() => {
    const sorted = sortByScore(filteredRows, sortBy);
    // "Recomendado" only: sponsored providers surface as a group first,
    // each group still internally ordered by score — an explicit product
    // decision (not sortByScore's own behavior, which never does this —
    // see its neutrality comment at the top of scoring.functions.ts). The
    // sponsored corner tag on every promoted row is what keeps this
    // disclosed rather than a silent reorder. Other sort tabs (Receive
    // more / Fastest / the "More criteria" ones) stay purely neutral —
    // this only applies to the default "overall" ranking.
    if (sortBy !== "overall") return sorted;
    const sponsored = sorted.filter((r) => r.has_exclusive_deal);
    const rest = sorted.filter((r) => !r.has_exclusive_deal);
    return [...sponsored, ...rest];
  }, [filteredRows, sortBy]);
  // Reference point for every row's "vs. the best" delta — the highest
  // received amount in the currently visible set, independent of the
  // active sort (so switching to "Fastest" still shows how much less you'd
  // get vs. the best payout available, not a delta that resets per tab).
  const bestReceived = useMemo(
    () => (organic.length ? Math.max(...organic.map((r) => r.received)) : 0),
    [organic],
  );
  // Composite score (0-1, remapped to 7-9 for display — see displayScore)
  // is INTENTIONALLY always computed with the "overall" profile, never
  // `sortBy`. Score is meant to read as one stable, objective number per
  // provider — if it recalculated per sort criterion (it used to), picking
  // "Fastest" would silently change what "8.4" means without anyone
  // choosing that, which is confusing at best and looks like the number is
  // arbitrary at worst. `sortBy` still fully controls actual row ORDER
  // (see `organic` below) — only the printed Score number is now decoupled
  // from it.
  const scoresBySlug = useMemo(
    () => computeCompositeScores(filteredRows, "overall"),
    [filteredRows],
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

  return (
    <div className="min-w-0">
      {/* No shared header row (design/AJUSTES-1.md §C1 — removed on
          purpose): each row now carries its own per-metric micro-label
          above its value (see ProviderRow), so a card reads on its own
          without the eye having to travel back up to a header — which is
          also what lets the same row layout work on mobile without a
          separate table. */}
      <div className={displayRows.length > 0 ? "flex flex-col gap-3" : ""}>
        {displayRows.map((row, i) => (
          <ProviderRow
            key={row.slug}
            row={row}
            quote={result.quote}
            base={result.base}
            score={scoresBySlug.get(row.slug) ?? null}
            delta={row.received - bestReceived}
            featured={i === 0}
            hasCorridorContext={hasCorridorContext}
            onClick={() => handleAffiliateClick(row.slug, row.affiliate_url, row.name)}
            tCta={tCta}
            tRecipient={tRecipient}
          />
        ))}
        {organic.length === 0 && (
          <div className="rounded-2xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            {deliveryMethod != null ? t("comparator.emptyFiltered") : t("comparator.empty")}
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
  score,
  delta,
  featured,
  hasCorridorContext,
  onClick,
  tCta,
  tRecipient,
}: {
  row: ComparisonResult["rows"][number];
  quote: string;
  base: string;
  /** Composite score (0-1), ALWAYS the "overall" profile regardless of the
   *  active sortBy — see the useMemo in ResultsBlock for why it's
   *  intentionally decoupled from the sort criterion. Shown as the
   *  "Puntaje N" pill above the logo, relative to the current corridor's
   *  result set, not an absolute rating (see the legend modal). null if
   *  this row wasn't part of the scored set (shouldn't normally happen). */
  score: number | null;
  /** row.received - bestReceived in the current (filtered, sorted) set.
   *  0 for the row that IS the best; negative for everyone else. */
  delta: number;
  /** True for the first row after featured-promotion (see displayRows in
   *  ResultsBlock) — gets the coral border + solid CTA, Kayak's "Best
   *  value" treatment, so there's a single clear lead instead of every
   *  row looking equally weighted. */
  featured: boolean;
  /** See the same-named prop on ResultsBlock — gates the "not verified"
   *  badge below. */
  hasCorridorContext: boolean;
  onClick: () => void;
  tCta: string;
  tRecipient: string;
}) {
  const { t } = useI18n();
  const deliveryLabel = formatDeliverySpeed(row.speed_hours);

  const ratePct = row.rate_vs_market_pct;
  const ratePctLabel = `${ratePct >= 0 ? "+" : ""}${ratePct.toFixed(2)}%`;
  const ratePctClass =
    ratePct >= -0.25 ? "text-success" : ratePct >= -1 ? "text-warning" : "text-destructive";

  // Trust/confidence badges — surfaces whether this row's numbers are real
  // per-route data or a generic estimate, and when they were last checked.
  // See fx.functions.ts (has_corridor_data, corridor_verified_status,
  // provider_rates_last_updated) for how these are computed server-side.
  const notVerifiedForRoute = hasCorridorContext && !row.has_corridor_data;
  const unconfirmed = row.corridor_verified_status === "sin_confirmar";
  const lastUpdatedRaw = row.corridor_data_collected_at ?? row.provider_rates_last_updated;
  // Day + month + time (no year) — design/AJUSTES-1.md §C3's "28 Aug,
  // 09:41" stamp, not the plain date the pre-adjustment label used.
  const lastUpdatedLabel = lastUpdatedRaw
    ? new Date(lastUpdatedRaw).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const isVerified = !notVerifiedForRoute && !unconfirmed;

  // Feature highlight chips: only the delivery-method pills remain now (on
  // request) — the merit badges (lowest fee / best exchange rate / most
  // trusted / wide coverage / exclusive deal) that used to live here were
  // removed entirely: each one duplicated something already visible
  // elsewhere on the row (fee/rate in the mini-strip, trust in the star
  // chip above) or a sort chip already named the same thing, same category
  // of redundancy already fixed once for "most transparent"/"fastest" —
  // just applied consistently to the rest now instead of case-by-case.
  const highlightChips = (() => {
    type Chip = { key: string; icon: typeof Shield | null; text: string };
    const chips: Chip[] = [];
    // Delivery-method pills — derived from the SAME predicate map that
    // drives the filter chips (DELIVERY_METHOD_PREDICATES), so "this row
    // qualifies" can never disagree between the filter and the row pill.
    // Every method the row supports gets a pill, always, independent of
    // whether that method is the one currently selected in the filter row.
    for (const { key, icon, labelKey } of DELIVERY_METHODS) {
      if (!DELIVERY_METHOD_PREDICATES[key](row)) continue;
      chips.push({ key: `delivery_${key}`, icon, text: t(labelKey) });
    }
    return chips;
  })();
  // PAYOUT metric cell text (design/AJUSTES-1.md §C1) — same delivery
  // methods as the chips below the name, joined since a row can support
  // more than one. The chips themselves stay for now (removing them is
  // §C4, a separate step); this is additive, not a replacement yet.
  const payoutText = highlightChips.map((c) => c.text).join(" · ") || "—";

  // Delta vs. the best received amount in view — 0 (or a hair off it, due
  // to float rounding) means this row IS the best, so it gets no "−N"
  // line at all rather than a confusing "-0".
  const isBest = delta >= -0.005;
  const deltaLabel = isBest
    ? null
    : `${delta.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${quote}`;

  const rating = row.review_count > 0 && row.trust_score != null && (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold text-muted-foreground">
      <Star className="h-2.5 w-2.5" /> {row.trust_score.toFixed(1)} (
      {compactNumber(row.review_count)} {t("comparator.table.reviews")})
      {row.regulator && <> · {row.regulator}</>}
    </span>
  );

  const deliveryChips = highlightChips.length > 0 && (
    <div className="flex flex-wrap items-center gap-1.5">
      {highlightChips.map((c) => (
        <span
          key={c.key}
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground"
        >
          {c.icon && <c.icon className="h-2.5 w-2.5" />}
          {c.text}
        </span>
      ))}
    </div>
  );

  // Price stamp (design/AJUSTES-1.md §C3) — one line, no pill/background,
  // replacing the old orange "not verified"/"unconfirmed" badges plus the
  // separate "Updated: {date}" text. "Not verified" and "unconfirmed" both
  // collapse into the same "Estimated" state here — both still mean
  // exactly what the comment above isVerified used to say: treat this
  // row's fee/rate as an estimate, double-check on the provider's site.
  // See fx.functions.ts (has_corridor_data, corridor_verified_status,
  // provider_rates_last_updated) for how these are computed server-side.
  const priceStamp = lastUpdatedLabel && (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap text-[11.5px] font-semibold"
      style={{ color: isVerified ? "#1F7A5A" : "#6B5F55" }}
    >
      <Clock className="h-3 w-3 shrink-0" />
      {isVerified ? t("comparator.row.stampLive") : t("comparator.row.stampEstimated")} ·{" "}
      {lastUpdatedLabel}
    </span>
  );
  const trustLine = (priceStamp || row.promo_text) && (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] leading-snug">
      {priceStamp}
      {row.promo_text && (
        <span className="inline-flex items-center gap-1 font-medium text-accent">
          <Sparkle className="h-2.5 w-2.5 shrink-0" /> {t("comparator.badge.promoPrefix")}{" "}
          {row.promo_text}
        </span>
      )}
    </div>
  );

  // Labeled CTA (was an icon-only 44×44 square with no text — the audit's
  // H5: no way to tell what it does, and five identical buttons in a list
  // have no hierarchy). The featured row gets the full-color fill; every
  // other row gets an outlined version — Kayak's "Best value / Cheapest"
  // pattern, one clear lead instead of five equal buttons.
  const cta = row.affiliate_url ? (
    <button
      onClick={onClick}
      aria-label={`${tCta} — ${row.name}`}
      className={`inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-semibold transition-transform duration-200 ease-out group-hover:-translate-y-0.5 sm:w-auto ${
        featured
          ? "btn-cta group-hover:shadow-[0_8px_24px_-10px_color-mix(in_oklab,var(--color-brand-cta)_55%,transparent)]"
          : "border border-border bg-card text-foreground hover:border-foreground/30"
      }`}
    >
      <span className="truncate">{row.name}</span>
      <ArrowRight className="h-4 w-4 shrink-0" />
    </button>
  ) : (
    // Always reserve the same height, whether or not there's a real link
    // (a provider with no affiliate_url yet — see fx.functions.ts — would
    // otherwise collapse this slot and misalign the column below it).
    <div className="h-11 w-full shrink-0 sm:w-auto" aria-hidden />
  );

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-card p-4 transition-shadow duration-200 ease-out hover:shadow-md sm:p-5 ${
        featured ? "border-2 border-brand-cta" : "border border-border"
      } ${row.has_exclusive_deal ? "pt-[38px] sm:pt-[34px]" : ""}`}
    >
      {/* Sponsored disclosure — a corner tab, not an inline badge next to
          the name, so it never crowds the Score pill. Reuses the same
          comparator.badge.sponsored copy/key as the "Sponsored offer"
          filter chip (not a separate string) so the wording is identical
          wherever it appears, in every language. Always says exactly what
          it is: a disclosed commercial placement — this stays true (and
          more important to keep, not less) now that "Recomendado" also
          surfaces these providers first; the badge is what keeps that
          disclosed instead of silent. */}
      {row.has_exclusive_deal && (
        <span className="absolute left-0 top-0 rounded-br-sm border border-l-0 border-t-0 border-border bg-muted px-3 py-1 text-[10px] font-extrabold text-muted-foreground">
          <Sparkle className="mr-1 inline h-2.5 w-2.5" />
          {t("comparator.badge.sponsored")}
        </span>
      )}

      {/* Desktop — single grid, columns match the ResultsBlock header
          exactly, so values line up under their titles instead of each
          row repeating its own "Comisión"/"Tasa"/"Entrega" micro-labels. */}
      <div className="hidden sm:grid sm:grid-cols-[224px_1fr_204px] sm:items-center sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <BrandLogo
              name={row.name}
              url={row.website_url ?? row.affiliate_url}
              slug={row.slug}
              size={36}
              rounded={false}
              className="shrink-0 rounded-sm border border-border bg-white transition-transform duration-200 ease-out group-hover:scale-110"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{row.name}</div>
              {score != null && (
                <div className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                  {t("comparator.score.label")} {displayScore(score)}
                </div>
              )}
            </div>
          </div>
          <div className="mt-1.5 space-y-1">
            {rating}
            {deliveryChips}
          </div>
        </div>
        {/* Four equal metric columns, each with its own micro-label above
            the value (design/AJUSTES-1.md §C1) — replaces the shared
            header row that used to title these from above the whole list. */}
        <div className="grid grid-cols-4 gap-3">
          <div className="min-w-0 tabular-nums">
            <div className={METRIC_LABEL}>{t("comparator.row.labelFee")}</div>
            <div className="mt-0.5 text-sm font-medium text-foreground">
              {row.fee_total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {base}
            </div>
            {/* Fee/rate split is the whole point of a neutral comparator (a
                "$0 fee" headline can still hide a bad spread) — kept as a
                small subline rather than dropped. */}
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
          <div className="min-w-0 tabular-nums">
            <div className={METRIC_LABEL}>{t("comparator.row.labelRate")}</div>
            <div className="mt-0.5 text-sm font-medium text-foreground">
              {row.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {quote}
            </div>
            <div className={`text-[10px] ${ratePctClass}`}>{ratePctLabel}</div>
          </div>
          <div className="min-w-0 tabular-nums">
            <div className={METRIC_LABEL}>{t("comparator.row.labelDelivery")}</div>
            <div className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-foreground">
              <Clock className="h-3.5 w-3.5" /> {deliveryLabel}
            </div>
          </div>
          <div className="min-w-0">
            <div className={METRIC_LABEL}>{t("comparator.row.labelPayout")}</div>
            <div className="mt-0.5 truncate text-sm font-medium text-foreground">{payoutText}</div>
          </div>
        </div>
        <div className="min-w-0 text-right">
          {/* Exclusive-rate nudge — deliberately uncertain ("might be worth
              a look"), separate from the sponsored corner tag which is the
              one guaranteed-true disclosure ("this is a paid placement").
              Conflating them would make the honest disclosure read like a
              sales pitch. */}
          {row.has_exclusive_deal && (
            <div className="mb-0.5 inline-flex w-full items-center justify-end gap-1 whitespace-nowrap text-[10px] font-semibold text-accent">
              <Sparkle className="h-2.5 w-2.5" /> {t("comparator.exclusiveRateNudge")}
            </div>
          )}
          <div className={METRIC_LABEL}>{t("comparator.row.labelReceive")}</div>
          <div className="mt-0.5 whitespace-nowrap font-heading text-[28px] font-extrabold leading-[1.1] tabular-nums text-foreground">
            {row.received.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            <span className="text-xs font-semibold text-muted-foreground">{quote}</span>
          </div>
          <div
            className={`mt-0.5 text-[11px] font-semibold tabular-nums ${
              isBest ? "text-success" : "text-muted-foreground"
            }`}
          >
            {isBest ? tRecipient : deltaLabel}
          </div>
          <div className="mt-2.5 flex justify-end">{cta}</div>
        </div>
      </div>
      {trustLine && (
        <div className="mt-2 hidden border-t border-border pt-2 sm:block">{trustLine}</div>
      )}

      {/* Mobile — a card of its own, not a squeezed-down grid: identity +
          amount together up top (the decision-making number, not buried
          after three metric rows), a compact metrics line, then the CTA
          at full width. */}
      <div className="sm:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandLogo
              name={row.name}
              url={row.website_url ?? row.affiliate_url}
              slug={row.slug}
              size={32}
              rounded={false}
              className="shrink-0 rounded-sm border border-border bg-white"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{row.name}</div>
              {rating}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="whitespace-nowrap font-heading text-xl font-extrabold leading-[1.1] tabular-nums text-foreground">
              {row.received.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
              <span className="text-[11px] font-semibold text-muted-foreground">{quote}</span>
            </div>
            <div
              className={`mt-0.5 text-[11px] font-semibold tabular-nums ${
                isBest ? "text-success" : "text-muted-foreground"
              }`}
            >
              {isBest ? tRecipient : deltaLabel}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 tabular-nums text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {deliveryLabel}
          </span>
          <span>
            {row.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {quote}
          </span>
          <span>
            {row.fee_total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {base}
          </span>
        </div>
        {deliveryChips && <div className="mt-2">{deliveryChips}</div>}
        {trustLine && <div className="mt-2">{trustLine}</div>}
        {row.has_exclusive_deal && (
          <div className="mt-2 inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-accent">
            <Sparkle className="h-2.5 w-2.5" /> {t("comparator.exclusiveRateNudge")}
          </div>
        )}
        <div className="mt-3">{cta}</div>
      </div>
    </div>
  );
}

// ===== Compact results — embeddable widget only =====
// A dedicated renderer, not ProviderRow reused at a small size: the widget
// lives in a fixed 360px-wide container regardless of the page's actual
// viewport (see EmbedComparator), so viewport-based sm:/lg: breakpoints
// can't tell it apart from a real mobile screen — reusing ProviderRow's
// responsive grid here would either render the desktop 5-column layout
// squeezed into 360px, or need container queries wired through both the
// home and embed call sites. A second, deliberately simple component for
// a deliberately simple job (one winner, a few compact lines, one link
// out) is the smaller/safer change. Winner expanded with logo+rate+speed+
// amount+CTA; the rest are single lines (logo, amount, delta) — no
// per-row CTA, no metrics grid — so the whole thing fits in view without
// its own internal scroll (the old version mounted the full comparator in
// a scrolling box with a bouncing "more below" chevron; this fits by
// being short, not by scrolling).
function CompactResultsList({
  result,
  handleAffiliateClick,
  tRecipient,
  tCta,
}: {
  result: ComparisonResult;
  handleAffiliateClick: (slug: string, url: string, name?: string) => void;
  tRecipient: string;
  tCta: string;
}) {
  const { t } = useI18n();
  // Same "Recomendado" ranking as the full table (sponsored-first, then
  // score) — the widget has no sort tabs of its own, so this is the one
  // ordering it ever shows.
  const ranked = useMemo(() => {
    const sorted = sortByScore(result.rows, "overall");
    const sponsored = sorted.filter((r) => r.has_exclusive_deal);
    const rest = sorted.filter((r) => !r.has_exclusive_deal);
    return [...sponsored, ...rest];
  }, [result.rows]);
  const winner = ranked[0];
  // Capped at 2 extra lines — the point is "fits without scrolling", not
  // "shows everyone"; the invitation block below is the escape hatch for
  // the rest. (3 was tried first and still needed an internal scroll at
  // the widget's OLD 600px default height; the default shrank to 540px
  // on 29-ago-2026 (design/HANDOFF.md §5's 360×540) specifically to match
  // the mockup, which makes 2 the safer cap, not a looser one — the
  // send/receive form above already stacks to ~4 fields at 360px wide and
  // eats most of the vertical budget on its own.)
  const rest = ranked.slice(1, 3);

  if (!winner) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground">{t("comparator.empty")}</div>
    );
  }

  return (
    <div className="min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {t("comparator.results")}
      </span>

      {/* Winner — the only row with a CTA and full details. */}
      <div className="mt-1.5 rounded-xl border-2 border-brand-cta bg-card p-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo
              name={winner.name}
              url={winner.website_url ?? winner.affiliate_url}
              slug={winner.slug}
              size={28}
              rounded={false}
              className="shrink-0 rounded-sm border border-border bg-white"
            />
            <div className="min-w-0 truncate text-[11px] tabular-nums text-muted-foreground">
              {winner.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} ·{" "}
              {formatDeliverySpeed(winner.speed_hours)}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-heading text-lg font-extrabold leading-none tabular-nums text-foreground">
              {winner.received.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] font-semibold text-muted-foreground">{result.quote}</div>
          </div>
        </div>
        {winner.affiliate_url && (
          <button
            onClick={() => handleAffiliateClick(winner.slug, winner.affiliate_url, winner.name)}
            aria-label={`${tCta} — ${winner.name}`}
            className="btn-cta mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-md text-xs font-semibold"
          >
            {winner.name} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Rest — one compact line each: logo, name, amount, delta. */}
      {rest.length > 0 && (
        <div className="mt-1 flex flex-col">
          {rest.map((row) => {
            const delta = row.received - winner.received;
            return (
              <div
                key={row.slug}
                className="flex items-center justify-between gap-2 border-b border-border py-1.5 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <BrandLogo
                    name={row.name}
                    url={row.website_url ?? row.affiliate_url}
                    slug={row.slug}
                    size={20}
                    rounded={false}
                    className="shrink-0 rounded-sm border border-border bg-white"
                  />
                  <span className="truncate text-xs font-medium text-foreground">{row.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2 tabular-nums">
                  <span className="text-xs font-semibold text-foreground">
                    {row.received.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="w-12 text-right text-[10px] font-semibold text-muted-foreground">
                    {delta.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invitation block — the non-negotiable part of this widget's
          redesign (design/HANDOFF.md §5): never just a bare link, always a
          full pitch for why to leave the compact list for the real site.
          {n} is this corridor's real remaining count (rows.length minus the
          winner and the compact rows already shown above), never the whole
          provider catalog. */}
      <div className="mt-2.5 rounded-lg bg-muted p-2.5">
        <div className="text-xs font-bold text-foreground">
          {t("comparator.widget.moreProviders").replace(
            "{n}",
            String(Math.max(result.rows.length - 1 - rest.length, 0)),
          )}
        </div>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          {t("comparator.widget.moreProvidersBody")}
        </p>
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex h-9 w-full items-center justify-center gap-1 rounded-md bg-foreground text-xs font-semibold text-background transition-colors hover:bg-foreground/90"
        >
          {t("comparator.widget.viewAll").replace("{n}", String(result.rows.length))}
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="mt-1 text-center text-[9px] text-muted-foreground">{tRecipient}</div>
    </div>
  );
}
