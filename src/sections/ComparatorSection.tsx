import { useServerFn } from "@tanstack/react-start";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowRight,
  ArrowLeftRight,
  ArrowDownWideNarrow,
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
import { TrustBox } from "@/components/TrustBox";
import { PreferredRateModal } from "@/components/PreferredRateModal";
import { CountryCombobox } from "@/components/ui/CountryCombobox";
import { CurrencyCombobox } from "@/components/ui/CurrencyCombobox";
import { useAnalytics } from "@/hooks/use-analytics";
import { useIsMobile } from "@/hooks/use-mobile";
import { B2B_UPSELL_MIN_AMOUNT } from "@/config/providers";
import { SITE_URL } from "@/config/site";
import { captureBusinessLead, captureEnterpriseLead } from "@/lib/agent.functions";
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
  DEFAULT_WIZARD_ACTIONS,
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
  onResult,
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
  /** Same trigger as onHasResultChange but hands back the result itself (or
   *  null) — the embed widget's own header uses this to show a real
   *  "rates updated Nm ago" stamp instead of fabricating one, since that
   *  data only exists once a comparison has actually run (see
   *  EmbedComparator). */
  onResult?: (result: ComparisonResult | null) => void;
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
  // 2026-09-01 feedback — "reorganizar mobile para que se vea bien antes y
  // después de buscar": at narrow widths the origin group (amount+currency+
  // country in one bordered box, design/AJUSTES-3.md §T5) truncated the
  // country name to "U.." — real screenshot at 390px confirmed it, not a
  // guess. Same fix as the widget's own icon-only trigger (Combobox's
  // `triggerIconOnly`, see CountryCombobox/CurrencyCombobox below): below
  // md (768px, matching every other mobile breakpoint already in this
  // file) the country segment shows only its flag — the currency segment
  // right next to it already names the currency — full country name comes
  // back once the dropdown opens or the viewport is wide enough to show it
  // inline without truncating.
  const isMobile = useIsMobile();
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
  };
  const handleReceivingCountryChange = (code: string) => {
    setReceivingCountry(code);
    setTo(localCurrency(code));
  };
  // 2026-08-30 feedback (fifth round) — replaces CurrencyPillRow's tooltip-
  // gated escape hatch with a plain, always-visible currency dropdown next
  // to each country (Monito-style: country and currency are independent,
  // always-shown fields, not one derived silently from the other with a
  // hidden override). No separate override flag needs to travel with it:
  // fx.functions.ts computes `currencyOverridden` purely by comparing
  // from/to against localCurrency(sendingCountry/receivingCountry), so
  // picking a currency here is itself the signal — and re-picking a country
  // via handleSendingCountryChange/handleReceivingCountryChange above is
  // itself the reset, since it always re-derives from `localCurrency(code)`.
  const handlePickFromCurrency = (code: string) => {
    setFrom(code);
    // §A rule 5 — a currency change re-runs the comparison without an extra
    // click, but only once a result already exists to update (both
    // countries are already set by then); before that, changing FROM/TO
    // never auto-fires either (same explicit-CTA rule every other field
    // follows here).
    if (compact && result) {
      compareMut.mutate({ from: code, to, sendingCountry, receivingCountry });
    }
  };
  const handlePickToCurrency = (code: string) => {
    setTo(code);
    if (compact && result) {
      compareMut.mutate({ from, to: code, sendingCountry, receivingCountry });
    }
  };
  // Swaps country AND currency together — unlike handleSendingCountryChange/
  // handleReceivingCountryChange (which always re-derive currency from the
  // new country), a swap must preserve a currency override on either side,
  // so it sets all four pieces of state directly instead of routing through
  // those handlers.
  const handleSwap = () => {
    const prevSendingCountry = sendingCountry;
    const prevReceivingCountry = receivingCountry;
    const prevFrom = from;
    const prevTo = to;
    setSendingCountry(prevReceivingCountry);
    setReceivingCountry(prevSendingCountry);
    setFrom(prevTo);
    setTo(prevFrom);
  };
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
  // There are two ways to change segment: the Individual/Business tablist
  // (manual) and the amount-triggered B2B upsell banner below
  // (B2B_UPSELL_MIN_AMOUNT — a nudge, not a hard switch). Both go through
  // handleSegmentChange (below `to`/`sendingCountry` etc. so it can read
  // them), not this raw setter directly.
  const [segment, setSegment] = useState<Segment>(initialQuery?.segment ?? "retail");
  const segmentNavigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // 2026-08-30 feedback — switching segment used to only flip local state:
  // from /business, tapping "Individual" changed the results to retail
  // pricing but left the page shell as /business (hideMarketingSections,
  // BusinessExtrasSection still below); from "/", tapping "Business" never
  // actually took you to /business either. Segment now implies a real
  // route (retail → "/", business → "/business"); changing it navigates
  // there, carrying the current amount/currencies/countries over as query
  // params so the comparison isn't lost. A no-op when the target already
  // matches the current route (e.g. the B2B banner's CTA while already on
  // /business), which just flips local state — nothing to navigate to.
  const handleSegmentChange = (next: Segment) => {
    if (next === segment) return;
    const onBusinessRoute = pathname.startsWith("/business");
    const wantsBusinessRoute = next === "business";
    if (onBusinessRoute === wantsBusinessRoute) {
      setSegment(next);
      return;
    }
    if (wantsBusinessRoute) {
      segmentNavigate({
        to: "/business",
        search: (prev) => ({
          ...prev,
          from,
          to,
          amount,
          origin: sendingCountry || undefined,
          destination: receivingCountry || undefined,
        }),
      });
    } else {
      segmentNavigate({
        to: "/",
        search: (prev) => ({
          ...prev,
          from,
          to,
          amount,
          segment: undefined,
          origin: sendingCountry || undefined,
          destination: receivingCountry || undefined,
        }),
      });
    }
  };
  // Business-only fields (design/HANDOFF.md §4) — UI state only for now: no
  // broker table exists yet to price a Spot/Forward/Option contract or a
  // recurring schedule differently, so these don't change the query. They
  // stay local until that table (and a place to persist the choice on a
  // captured lead) exists — see docs/handoff/handoff-2026-08-29-rediseno-mangomundi-4.md.
  const [contractType, setContractType] = useState<"spot" | "forward" | "option">("spot");
  const [frequency, setFrequency] = useState<"one_off" | "monthly" | "quarterly">("one_off");
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
    onResult?.(result);
  }, [result, onHasResultChange, onResult]);
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
  // "Add to request" selections on the business results list (ProviderRow's
  // businessExtra block) — feeds BusinessRequestPanel's running list and, on
  // submit, the selected_provider_slugs column alongside contract_type/frequency.
  const [requestedSlugs, setRequestedSlugs] = useState<Set<string>>(new Set());
  const toggleRequestedSlug = (slug: string) => {
    setRequestedSlugs((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };
  const [requestPanelStatus, setRequestPanelStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

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

  // Business broker table's "Est. saved" figure (BusinessBrokerRow) is
  // disclosed as "vs. the retail best on the same route" (design/Mangomundi
  // 4 - Final.dc.html line 529) — a real number needs a real retail
  // comparison, so this runs one extra compareProviders call, retail-forced,
  // whenever the business segment has a result. Stale responses (query
  // changed again before this resolves) are dropped via retailBaselineRef.
  const [retailBestReceived, setRetailBestReceived] = useState<number | null>(null);
  const retailBaselineRef = useRef(0);
  useEffect(() => {
    if (segment !== "business" || !result) {
      setRetailBestReceived(null);
      return;
    }
    const requestId = ++retailBaselineRef.current;
    compareFn({
      data: {
        amount,
        from,
        to,
        segment: "retail",
        amountMode,
        sendingCountry: sendingCountry || undefined,
        receivingCountry: receivingCountry || undefined,
      },
    })
      .then((data) => {
        if (requestId !== retailBaselineRef.current) return;
        setRetailBestReceived(
          data.rows.length ? Math.max(...data.rows.map((r) => r.received)) : null,
        );
      })
      .catch(() => {
        if (requestId === retailBaselineRef.current) setRetailBestReceived(null);
      });
  }, [segment, result, amount, from, to, amountMode, sendingCountry, receivingCountry, compareFn]);

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

  // BusinessRequestPanel's own submit — independent of confirmBusinessLead
  // above (that one belongs to the chat wizard and needs businessData.sector,
  // which this panel never collects). Sends the brokers actually added via
  // "Add to request" (requestedSlugs), not the wizard's topProviders guess.
  const sendBusinessRequest = async (email: string) => {
    if (
      !sendingCountry ||
      sendingCountry.length !== 2 ||
      !receivingCountry ||
      receivingCountry.length !== 2 ||
      requestPanelStatus === "sending"
    )
      return;
    setRequestPanelStatus("sending");
    try {
      await captureBusinessFn({
        data: {
          email,
          monthlyVolume: amount,
          fromCurrency: from,
          toCurrency: to,
          sendingCountry,
          receivingCountry,
          locale: lang,
          consent: true,
          contractType: t(`comparator.contractType.${contractType}`),
          frequency: t(`comparator.frequency.${frequency === "one_off" ? "oneOff" : frequency}`),
          selectedProviderSlugs: Array.from(requestedSlugs),
          featureSource: "business_request_panel",
        },
      });
      setRequestPanelStatus("sent");
      track("conversion_completed", {
        amount,
        from_currency: from,
        to_currency: to,
        segment,
        source: "business_request_panel",
      });
    } catch {
      setRequestPanelStatus("error");
    }
  };

  // Embed mode drops the section chrome (padding/centered max-width) so the
  // comparator fills the iframe container; otherwise it's a home section.
  const SectionTag = embedded ? "div" : "section";
  // design/AJUSTES-2.md §1 — the search row shrinks (58px→52px fields,
  // "Compare"→"Update") once there's a result to make room for. Same gate
  // as the sticky-positioning check a few lines below (`result && !embedded`).
  const compact = Boolean(result) && !embedded;
  // 2026-08-30 feedback (second, then third round) — the widget's own
  // sizing WAS "unrelated to this home-page pattern" (see git history),
  // meaning it had none: `compact` being false for every embedded render
  // left the basic row at full 58px/25px home-page size inside a fixed
  // 360px container — exactly the "letra muy grande, mucho espacio
  // desperdiciado" complaint, screenshotted against the mockup's compact
  // row. `embedded` now gets its OWN third, more aggressive size tier
  // (42px/16px, closer to the mockup's literal 42px row) at each spot
  // below, distinct from `compact`'s 52px/21px home-page tier — but ONLY
  // for sizing; `compact` itself still separately governs the CTA label
  // ("Update" only once a real result exists), which shouldn't flip just
  // because this is a widget with no result yet.

  return (
    <SectionTag
      id={embedded ? undefined : "comparator"}
      key={lang}
      // 2026-09-01 feedback — "el primer fondo del comparador es igual que
      // el de todays routes": before a result exists, this section (search
      // card + agent trigger) sits directly above TodaysRoutesSection,
      // which has no background of its own and shows the page's cream
      // `--background` through — the same shade this section inherited
      // too, so the two blended into one band. The mockup's hero+
      // comparator area is explicit white (see HeroSection's own comment)
      // — matched here, but ONLY pre-result: once a result exists,
      // TodaysRoutesSection is hidden (no adjacency to worry about) and
      // the mockup's own "with results" screen keeps the cream page
      // background behind the rail/results, with individual white CARDS
      // floating on it rather than a white section wrapper.
      className={embedded ? "min-w-0" : `scroll-mt-24 pb-8 sm:pb-12 ${!result ? "bg-card" : ""}`}
    >
      <div className={embedded ? "min-w-0" : "mx-auto max-w-7xl px-5 sm:px-8"}>
        {/* THE comparator box — the single entry point. Basic row always
            visible; advanced fields fold out below inside the same card.
            Once a comparison has run, the card sticks under the fixed
            header (top-[66px] = its design/AJUSTES-2.md §7 height) so the
            search stays reachable and editable while the results list below
            scrolls underneath it — the Kayak/Skyscanner "search collapses
            to a sticky bar, results take the screen" pattern, without a
            second page. */}
        <div className={`min-w-0 ${result && !embedded ? "sticky top-[66px] z-30" : ""}`}>
          {/* Decision card — light surface, same token language as the rest
              of the site (no more dark-navy island).
              2026-09-01 feedback — "los cuadros también en el comparador
              tienen otros colores" vs. design/Mangomundi 4 - Final.dc.html
              line 82: that card is `#FDFBF9` (a soft cream, one step off
              pure white) with a warm-toned shadow
              (`rgba(60,40,30,.4)`, matching the site's brown/mango
              palette) — this was pure white (`bg-card`) with a cool
              slate-toned shadow (`rgba(15,23,42,...)`) that belongs to a
              blue palette, not this one. */}
          <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-[#FDFBF9] shadow-[0_14px_36px_-22px_rgba(60,40,30,0.4)]">
            {/* Card header: brand + segment toggle. Tried moving this into
                the post-results filter row (Personal/Empresa alongside
                Size/Show only/Receive via) — reverted: unlike those
                filters, which just narrow already-fetched rows client-side,
                switching segment changes the SERVER query itself (a
                different fetch, not a subset) and, going to Empresa, hands
                the chat to the business-lead wizard. That decision needs to
                happen BEFORE the search runs, not as a post-results filter
                — so it stays here. */}
            {/* 2026-08-31 feedback — "el widget debería ser solo para
                retail": the segment tablist below decides which SERVER
                query runs (see its own comment) and hands off to the
                business-lead wizard on "Business" — neither makes sense
                inside a third-party embed, which only ever queries retail
                (EmbedComparator hardcodes `segment: "retail"`). Hiding the
                whole row also buys back its ~34px in the fixed 360×540
                frame instead of showing a tablist with nothing to switch. */}
            {!embedded && (
              <div
                className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border ${
                  compact ? "px-4 py-3.5 sm:px-[30px]" : "px-4 py-1.5 sm:px-5"
                }`}
              >
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
                        onClick={() => handleSegmentChange(s)}
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
                  {/* design/AJUSTES-1.md §B originally rendered this inert
                      (no href, since /exchange doesn't exist — redesign
                      decision #5, "no está diseñada"). design/AJUSTES-3.md §B
                      revises that: an inert-but-visible link still reads as
                      broken, and the rule for an unbuilt destination is to
                      hide it, not fake it ("un enlace muerto cuesta más
                      credibilidad que una función que todavía no anunciás").
                      So it's gone from here entirely now — not moved into
                      CurrencyPillRow's with-results row either, even though
                      §A's own mockup literally places it there, because §B
                      addresses this exact link by name and its rule is the
                      more recent, more specific one. Re-add once /exchange
                      is real; home.hero.localExchangeLink is kept in i18n.tsx
                      for that. */}
                </div>
                {/* Mid-market exchange rate — moved into this header row when
                    compact (design/AJUSTES-2.md §2), replacing the standalone
                    bordered box that used to sit below the fields. No "+X%"
                    figure next to it: the mockup shows one, but that would be
                    a rate-of-change number this app doesn't track anywhere
                    (market_rate has no stored history to diff against) — not
                    invented for this row. resultsRef/scroll-mt-24 (previously
                    on the removed box) move here — see the ref's own comment
                    a few hundred lines up for why it exists. */}
                {compact && result && (
                  <div
                    ref={resultsRef}
                    className="ml-auto flex shrink-0 scroll-mt-24 items-baseline gap-2.5"
                  >
                    {/* 2026-09-01 feedback — "reorganizar mobile": at 18px
                        fixed, this line + the segment toggle to its left
                        (both `shrink-0`) overflowed the row's own
                        `overflow-hidden` card wrapper at 390px — no
                        scrollbar, the trailing digits/currency just got
                        silently clipped off-screen (confirmed via
                        screenshot, not a guess). Smaller on mobile, back to
                        the original size at sm+; `flex-wrap` on the row
                        itself (see its own className) is the safety net
                        for anything narrower still. */}
                    <span className="font-heading text-[14px] font-extrabold tracking-tight tabular-nums text-foreground sm:text-[18px]">
                      1 {from} ={" "}
                      {result.market_rate.toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
                      {to}
                    </span>
                    <span className="hidden text-xs sm:inline" style={{ color: "#8A7C6E" }}>
                      {t("comparator.midMarketRate")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Form body. @container lets the rows adapt to the CARD's width, not
              the viewport: 3/4 columns when the card is full-width (no results
              yet), 2 columns once it shares the row with the metrics panel. */}
            <div
              className={`@container ${embedded ? "space-y-2 p-2.5" : "space-y-2 p-2.5 sm:p-3.5"}`}
            >
              {sameCorridorBlocked && receivingCountry && (
                <div className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
                  {t("search.sameCountry")}
                </div>
              )}
              {/* Search form — two shapes depending on `embedded`. Both are
                  country-first (not currency-first), matching how every real
                  MTO comparator does it (Remitly, WorldRemit, Western Union
                  all lead with country; currency is a byproduct, not an
                  independent choice by default) — see the note by
                  handleSendingCountryChange/handleReceivingCountryChange
                  above for why this matters now that fx_rates keys
                  corridor-specific pricing by country pair, not currency
                  pair. `from`/`to` (currency) are still the state everything
                  downstream reads — country selection just derives them by
                  default, and the currency dropdowns below (2026-08-30
                  feedback, fifth round) let a person override them directly
                  without opening the country picker again.
                  design/AJUSTES-2.md §1 — field heights/copy shrink once a
                  result exists (58px→52px, "Compare"→"Update"); the compact
                  fields also swap to #FDFBF9 instead of white. */}
              {embedded ? (
                // 2026-09-01 feedback — "el menú de selección debe
                // comprimirse: la banderita de país en la misma línea que
                // el monto y la moneda, y abajo en la otra línea la
                // flechita con el país de destino, la moneda y el botón de
                // comparar, así abajo queda lugar para los resultados":
                // the previous version (5 stacked rows: amount+currency,
                // country, swap, country+currency, CTA) still ate most of
                // the fixed 540px frame before any result could show.
                // Compressed to exactly 2 lines — origin flag+amount+
                // currency sharing one bordered box, then swap+destination
                // country+currency+Compare sharing a second one — frees
                // roughly 150px of the frame for real results or (see
                // EmbedComparator's own example-corridor block) a preview
                // when there's no result yet.
                //
                // 2026-09-01 feedback (second round) — "en el país se está
                // mostrando el código de moneda, está de más, el país debe
                // mostrar solo la banderita cuando está seleccionado, pero
                // el nombre del país al abrir el selector; la moneda debe
                // mostrar solo el símbolo cuando está seleccionada, el
                // nombre completo al abrir": the country picker used to
                // keep `compactLabel` (flag + currency code) instead of the
                // full name, reasoning that the redundancy with the
                // adjacent currency picker (which shows that same code)
                // was an acceptable tradeoff for fitting on one line at
                // 360px — wrong call, it read as a mistake, not a
                // tradeoff. `triggerIconOnly` (Combobox's own new mode)
                // fixes both pickers at once: closed trigger shows only
                // `leading` (flag for country, currency symbol for
                // currency — see CurrencyCombobox's own `leading`), full
                // name/code still shows in the open dropdown list exactly
                // as before (unaffected — only the closed trigger changes).
                <div className="space-y-[7px]">
                  <div className="flex h-[38px] w-full min-w-0 items-stretch overflow-hidden rounded-[9px] border-[1.5px] border-input bg-white transition-colors focus-within:ring-2 focus-within:ring-brand-cta/40">
                    <CountryCombobox
                      value={sendingCountry}
                      onChange={handleSendingCountryChange}
                      placeholder={t("comparator.combobox.placeholder")}
                      searchPlaceholder={t("comparator.combobox.search")}
                      emptyLabel={t("comparator.combobox.empty")}
                      ariaLabel={t("comparator.field.sourceCountry")}
                      triggerIconOnly
                      triggerClassName="h-full w-auto shrink-0 rounded-none border-0 bg-transparent px-2 text-[12px] font-bold shadow-none hover:bg-muted focus:ring-0"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      min={1}
                      value={amount || ""}
                      placeholder="1000"
                      onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                      aria-label={t("comparator.field.amount")}
                      className="min-w-0 flex-1 border-l border-border bg-transparent px-2.5 text-[14px] font-bold tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <CurrencyCombobox
                      value={from}
                      onChange={handlePickFromCurrency}
                      placeholder={t("comparator.field.sourceCurrency")}
                      searchPlaceholder={t("comparator.combobox.search")}
                      emptyLabel={t("comparator.combobox.empty")}
                      ariaLabel={t("comparator.field.sourceCurrency")}
                      triggerIconOnly
                      triggerClassName="h-full w-auto shrink-0 rounded-none border-0 border-l border-border bg-transparent px-2 text-[12px] font-bold shadow-none hover:bg-transparent focus:ring-0"
                    />
                  </div>

                  <div className="flex items-stretch gap-[6px]">
                    <button
                      type="button"
                      onClick={handleSwap}
                      aria-label={t("comparator.swap")}
                      className="flex h-[38px] w-[32px] shrink-0 items-center justify-center rounded-[9px] transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand-cta/40"
                      style={{ backgroundColor: "#F5EFE8", color: "#EE5B3E" }}
                    >
                      <ArrowLeftRight strokeWidth={2.2} className="h-[13px] w-[13px]" />
                    </button>

                    <div
                      className={`flex h-[38px] min-w-0 flex-1 items-stretch overflow-hidden rounded-[9px] border-[1.5px] bg-white transition-colors focus-within:ring-2 focus-within:ring-brand-cta/40 ${
                        sameCorridorBlocked
                          ? "border-brand-cta ring-2 ring-brand-cta/60"
                          : "border-input"
                      }`}
                    >
                      <CountryCombobox
                        value={receivingCountry}
                        onChange={handleReceivingCountryChange}
                        placeholder={t("comparator.combobox.placeholder")}
                        searchPlaceholder={t("comparator.combobox.search")}
                        emptyLabel={t("comparator.combobox.empty")}
                        ariaLabel={t("comparator.field.targetCountry")}
                        triggerIconOnly
                        triggerClassName="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-2 text-[12px] font-bold shadow-none hover:bg-muted focus:ring-0"
                      />
                      <CurrencyCombobox
                        value={to}
                        onChange={handlePickToCurrency}
                        placeholder={t("comparator.field.targetCurrency")}
                        searchPlaceholder={t("comparator.combobox.search")}
                        emptyLabel={t("comparator.combobox.empty")}
                        ariaLabel={t("comparator.field.targetCurrency")}
                        triggerIconOnly
                        triggerClassName="h-full w-auto shrink-0 rounded-none border-0 border-l border-border bg-transparent px-2 text-[12px] font-bold shadow-none hover:bg-transparent focus:ring-0"
                      />
                    </div>

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
                      className="btn-cta flex h-[38px] w-[74px] shrink-0 items-center justify-center rounded-[9px] px-1.5 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {compareMut.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="truncate">
                          {t(compact ? "comparator.cta.update" : "comparator.cta.compareRates")}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                // 2026-08-30 feedback (fifth round) — "sacar las pildoras del
                // comparador... poder seleccionar pais de origen y destino y
                // moneda de origen y destino y monto". 2026-08-30 feedback
                // (sixth round) — "ponerlo todo en la misma linea": what was
                // a country row + an amount/currency row is now one row.
                // 2026-09-01 feedback — "se pueden agrupar las píldoras de
                // selección de país monto y moneda de origen y por otra
                // parte agrupar la de moneda y país de destino": amount +
                // FROM currency + FROM country used to be 2 separate
                // bordered boxes; TO country + TO currency likewise. Merged
                // into ONE bordered box per side (same `border-l` divider
                // pattern the amount+currency box already used internally
                // for its own two segments — just extended to a third/
                // second segment) so "everything about where it's coming
                // from" and "everything about where it's going" each read
                // as one visual unit, not four independent pills in a row.
                // Below the wide breakpoint it still stacks to one column,
                // same fallback every other tier here already uses.
                <div className="grid grid-cols-1 items-stretch gap-2.5 @4xl:grid-cols-[minmax(340px,1.7fr)_46px_minmax(260px,1.3fr)_176px]">
                  <div className="min-w-0">
                    <FieldLight label={t("comparator.field.amount")}>
                      <div
                        className={`flex w-full min-w-0 items-stretch overflow-hidden rounded-md border-[1.5px] border-input transition-colors focus-within:ring-2 focus-within:ring-brand-cta/40 ${
                          compact ? "h-[52px] bg-[#FDFBF9]" : "h-[58px] bg-card"
                        }`}
                      >
                        <input
                          type="number"
                          inputMode="decimal"
                          min={1}
                          value={amount || ""}
                          placeholder="1000"
                          onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                          aria-label={t("comparator.field.amount")}
                          // 2026-09-01 feedback — "hay cambios que no se
                          // hicieron": the mobile fix for the truncated
                          // country name (triggerIconOnly) only covered
                          // <768px — measured live at 1280px desktop, the
                          // country segment (flex-1) was still only
                          // 186.64px wide against the amount input's
                          // flex-[1.4], not enough to fit "United Kingdom"
                          // (confirmed via getBoundingClientRect + a real
                          // screenshot, not assumed). This box only ever
                          // holds a handful of digits at 25px, nowhere
                          // near as space-hungry as a country name at
                          // 14.5px — flex-1 (was 1.4) gives the country
                          // segment its fair half instead of the smaller
                          // share, without needing another isMobile branch.
                          className={`min-w-0 flex-1 bg-transparent px-2.5 font-bold tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none ${
                            compact ? "text-[21px]" : "text-[25px]"
                          }`}
                        />
                        <CurrencyCombobox
                          value={from}
                          onChange={handlePickFromCurrency}
                          placeholder={t("comparator.field.sourceCurrency")}
                          searchPlaceholder={t("comparator.combobox.search")}
                          emptyLabel={t("comparator.combobox.empty")}
                          ariaLabel={t("comparator.field.sourceCurrency")}
                          compactLabel
                          triggerClassName={`h-full w-auto shrink-0 rounded-none border-0 border-l border-border bg-transparent font-bold shadow-none hover:bg-transparent focus:ring-0 ${
                            compact ? "px-3.5 text-[14px]" : "px-3.5 text-[14.5px]"
                          }`}
                        />
                        <CountryCombobox
                          value={sendingCountry}
                          onChange={handleSendingCountryChange}
                          placeholder={t("comparator.combobox.placeholder")}
                          searchPlaceholder={t("comparator.combobox.search")}
                          emptyLabel={t("comparator.combobox.empty")}
                          ariaLabel={t("comparator.field.sourceCountry")}
                          // 2026-08-30 feedback (sixth round) — the currency
                          // segment to the left already covers it, so this
                          // plain country picker drops the redundant
                          // currency-code readout.
                          hideSecondary
                          triggerIconOnly={isMobile}
                          triggerClassName={`h-full flex-1 rounded-none border-0 border-l border-border bg-transparent px-3.5 font-bold text-foreground shadow-none hover:bg-muted focus:ring-0 ${
                            compact ? "text-[14px]" : "text-[14.5px]"
                          } ${isMobile ? "shrink-0 justify-center" : "shrink-0"}`}
                        />
                      </div>
                    </FieldLight>
                  </div>

                  {/* Swap — click to flip FROM/TO, country and currency
                      together. Rotated 90° when the row stacks vertically.
                      2026-09-01 feedback — "la flechita del comparador
                      quedó desalineada": measured with Playwright at
                      exactly 4px too high — this cell has no label above
                      it (unlike the origin/destination groups, which do,
                      via FieldLight), so `items-stretch` on the parent
                      grid stretches it to match their taller label+box
                      height, and `pb-1` (4px) then pushed the button up
                      from the bottom of that stretched cell instead of
                      flush with it. `py-0.5` (needed for breathing room
                      when stacked below @4xl) has the same effect on its
                      own at 2px — cleared at @4xl too so nothing is left
                      pushing the button off the boxes' shared bottom edge. */}
                  <div className="flex items-center justify-center py-0.5 @4xl:flex-col @4xl:justify-end @4xl:py-0">
                    <button
                      type="button"
                      onClick={handleSwap}
                      aria-label={t("comparator.swap")}
                      className={`flex shrink-0 items-center justify-center transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand-cta/40 ${
                        compact ? "h-[52px] w-[44px] rounded-md" : "h-[58px] w-[46px] rounded-md"
                      }`}
                      style={{ backgroundColor: "#F5EFE8", color: "#EE5B3E" }}
                    >
                      <ArrowLeftRight
                        strokeWidth={2.2}
                        className={`rotate-90 @4xl:rotate-0 ${compact ? "h-[17px] w-[17px]" : "h-[18px] w-[18px]"}`}
                      />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <FieldLight label={t("comparator.field.youReceive")}>
                      <div
                        className={`flex w-full min-w-0 items-stretch overflow-hidden rounded-md border-[1.5px] transition-colors focus-within:ring-2 focus-within:ring-brand-cta/40 ${
                          compact ? "h-[52px] bg-[#FDFBF9]" : "h-[58px] bg-card"
                        } ${sameCorridorBlocked ? "border-brand-cta ring-2 ring-brand-cta/60" : "border-input"}`}
                      >
                        <CountryCombobox
                          value={receivingCountry}
                          onChange={handleReceivingCountryChange}
                          placeholder={t("comparator.combobox.placeholder")}
                          searchPlaceholder={t("comparator.combobox.search")}
                          emptyLabel={t("comparator.combobox.empty")}
                          ariaLabel={t("comparator.field.targetCountry")}
                          hideSecondary
                          triggerIconOnly={isMobile}
                          triggerClassName={`h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-3.5 font-bold text-foreground shadow-none hover:bg-muted focus:ring-0 ${
                            compact ? "text-[14px]" : "text-[14.5px]"
                          } ${isMobile ? "justify-center" : ""}`}
                        />
                        <CurrencyCombobox
                          value={to}
                          onChange={handlePickToCurrency}
                          placeholder={t("comparator.field.targetCurrency")}
                          searchPlaceholder={t("comparator.combobox.search")}
                          emptyLabel={t("comparator.combobox.empty")}
                          ariaLabel={t("comparator.field.targetCurrency")}
                          compactLabel
                          triggerClassName={`h-full w-auto shrink-0 rounded-none border-0 border-l border-border bg-transparent font-bold shadow-none hover:bg-transparent focus:ring-0 ${
                            compact ? "px-3.5 text-[14px]" : "px-3.5 text-[14.5px]"
                          }`}
                        />
                      </div>
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
                      className={`btn-cta inline-flex w-full items-center justify-center text-[15px] font-bold focus:outline-none focus:ring-2 focus:ring-ring @4xl:w-[176px] ${
                        compact
                          ? "h-[52px] rounded-md px-6"
                          : "h-[58px] rounded-md px-6 shadow-[0_10px_24px_-12px_rgba(238,91,62,.8)]"
                      }`}
                    >
                      {compareMut.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="truncate">
                          {/* 2026-08-30 feedback (fourth round) — "el boton de
                              accion tiene que ser Compare igual que
                              individual": business used to say
                              comparator.cta.request here; the search action
                              is the same as individual's (compare
                              providers), "Add to request"/"Send request" is
                              its own separate action below the results, not
                              this button's job. */}
                          {t(compact ? "comparator.cta.update" : "comparator.cta.compareRates")}
                        </span>
                      )}
                    </button>
                  </div>
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

        {/* AI Agent — the floating tab/panel (collapsed edge tab, or once
            expanded), always, everywhere on the site (2026-08-31 feedback,
            twice now: first it swapped for a small trigger portaled into
            TodaysRoutesSection's header row pre-search, then for a docked
            copy of itself in the results rail — both removed. It never
            disappears automatically anymore; only collapses when the user
            clicks minimize. The rail's own dark filter panel, FiltersCard,
            is a separate, unrelated component — not this agent, see its
            own comment). Hidden only in embed mode: out of place inside a
            third-party iframe. */}
        {!embedded && (
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
                tCta={t("retail.cta")}
              />
            </div>
          ) : (
            <div className="mt-5 grid min-w-0 scroll-mt-24 gap-5 lg:grid-cols-[268px_minmax(0,1fr)] lg:items-start lg:gap-[22px]">
              {/* Left rail — design/AJUSTES-2.md §6 (mockup line 290-365):
                  Filters → AI Agent → Rate alert → Trustpilot, 268px wide,
                  13px gap between cards. ≥lg only; below that the page
                  keeps the existing inline filter row + floating agent
                  (rendered elsewhere), unchanged. */}
              <aside className="hidden lg:flex lg:flex-col lg:gap-[13px]">
                {/* 2026-08-31 feedback — this is the rail's "smart filter"
                    (Kayak-style: dark, but a filter panel, not the chat
                    agent — that one never docks here anymore, see the
                    FloatingAgent render site's own comment). */}
                <FiltersCard
                  t={t}
                  deliveryMethod={deliveryMethod}
                  toggleDeliveryMethod={toggleDeliveryMethod}
                  setDeliveryMethod={setDeliveryMethod}
                  deliveryCounts={deliveryCounts}
                  showOnlyExclusive={showOnlyExclusive}
                  setShowOnlyExclusive={setShowOnlyExclusive}
                  exclusiveCount={exclusiveCount}
                  businessFilters={
                    segment === "business"
                      ? { contractType, setContractType, frequency, setFrequency }
                      : undefined
                  }
                />
                {/* 2026-08-31 feedback — "el cuadro de rather talk to
                    someone debe estar en el menú vertical... debajo de los
                    filtros": back in the rail (was below the results for
                    one round) — business only, same as RateAlertCard is
                    retail-only right below (never both at once). */}
                {segment === "business" ? (
                  <BusinessContactCard />
                ) : (
                  <RateAlertCard
                    t={t}
                    from={from}
                    to={to}
                    amount={amount}
                    sendingCountry={sendingCountry}
                    receivingCountry={receivingCountry}
                  />
                )}
                <TrustpilotCard />
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
                  embeddable widget (see EmbedComparator, routes/widget.tsx)
                  there wasn't enough visible width to hint that more
                  content existed off-screen, so it just looked cut off
                  instead of scrollable; wrapping costs vertical space
                  instead, but never hides anything. */}
                  {/* Primary tabs (design/AJUSTES-1.md §C2) — 3 big buttons,
                  not 4 small pills. The headline figure is the point: a
                  sort tab that shows how much you gain by using it gets
                  tapped; a pill that just says "Smart" doesn't.
                  2026-09-01 feedback — "el rank by trust fees rate... sacalo
                  del cuadro vertical de filters y ponelo a la derecha
                  arriba al lado de los 3 filtros grandes... al lado de
                  fastest": those 3 extra criteria used to live in TWO
                  places (this row's own "More criteria" dropdown, `lg:hidden`
                  so it only showed below the rail's breakpoint, AND
                  duplicated again inside the rail's FiltersCard for ≥lg —
                  see FiltersCard's own comment on why that duplication is
                  now gone). One control now: this dropdown, moved out of
                  the `lg:hidden` cluster below and placed directly next to
                  the 3 tabs, visible at every width.
                  2026-09-01 feedback — "en realidad es sort, no filter":
                  renamed the trigger and dropped `sm:items-stretch` (which
                  forced this control to match the tabs' full 78px height,
                  reading as a would-be 4th tab) for `sm:items-center`, so
                  the compact pill sits at a normal control size next to
                  them instead of pretending to be one. */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
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
                              // 2026-09-01 feedback — "se resaltan con
                              // sombras cuando se seleccionan": vs.
                              // design/Mangomundi 4 - Final.dc.html line
                              // 827-828 (the tab's own `t.shadow`), this was
                              // a much weaker shadow — the mockup's actual
                              // value, restored.
                              boxShadow: isActive
                                ? "0 14px 34px -22px rgba(238,91,62,.55)"
                                : "none",
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

                    {/* Sort — trust/fee/exchange-rate, an alternate to the
                    3 big tabs' own sort criteria, not a filter (nothing
                    here narrows the row set). 2026-09-01 feedback (first
                    round) — "en realidad es sort, no filter, poner un
                    ícono de sort clásico y más chiquito": renamed from
                    "More filters" to "Sort", shrunk from a 124px/2-line
                    tile to a compact pill. 2026-09-01 feedback (second
                    round) — "el sort no es coherente con el alto de los
                    botones grandes, sacale el recuadro de píldora... o el
                    ícono clásico de sort (3 líneas con flechita)": a 36px
                    pill vertically centered next to 78px-tall tabs
                    (`sm:items-center` on the shared row) just floated in
                    the middle of a much taller row — no box height reads
                    as "coherent" next to tiles that size without becoming
                    a 4th tile itself, which would misrepresent it as a
                    4th sort *criterion* alongside Recommended/Receive
                    more/Fastest instead of the escape hatch it actually
                    is. Simplest fix that matches what was asked: drop the
                    border/background entirely (plain text+icon control,
                    no pill) and switch to `ArrowDownWideNarrow` — lucide's
                    "3 bars + arrow" glyph, the actual classic sort icon
                    (vs. the two-way ArrowUpDown used before). Active state
                    now reads via color/weight instead of a filled pill.
                    Selecting one of these still visually replaces the 3
                    tabs' selection for free: `isActive` on every tab is
                    `sortBy === tab.key`, and a sort criterion from this
                    menu (e.g. "most_trusted") never equals any of the 3
                    tabs' keys, so all three lose their highlighted
                    border/shadow the moment one of these is picked. */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-pressed={MORE_SORT_CHIPS.includes(sortBy)}
                          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 ${
                            MORE_SORT_CHIPS.includes(sortBy)
                              ? "text-brand-cta"
                              : "text-foreground hover:text-brand-cta"
                          }`}
                        >
                          {(() => {
                            const Icon = MORE_SORT_CHIPS.includes(sortBy)
                              ? sortIcon(sortBy)
                              : ArrowDownWideNarrow;
                            return <Icon className="h-3.5 w-3.5" />;
                          })()}
                          {MORE_SORT_CHIPS.includes(sortBy)
                            ? t(sortLabelKey(sortBy))
                            : t("comparator.sort.more")}
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                  </div>

                  {/* Secondary filters — delivery method, exclusive-only, legend.
                  Visually separate row (smaller chips) so it never competes
                  with the primary tabs above for attention. Sort criteria no
                  longer live in this row at all (moved above, see its own
                  comment) — this cluster is delivery-method/exclusive/legend
                  only now, still lg:hidden since those 3 stay in the rail's
                  FiltersCard at that breakpoint. */}
                  <div className="flex flex-wrap items-center gap-2 lg:hidden">
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
                {/* 2026-08-31 feedback — "el cuadro de request en business
                    debe estar arriba de los resultados, no abajo, y debe
                    tener todo el ancho": moved above ResultsBlock (was
                    below), full width of this column now that
                    BusinessContactCard went back to the rail instead of
                    sharing this row with it. */}
                {segment === "business" && result && (
                  <div className="mb-4">
                    <BusinessRequestPanel
                      amount={amount}
                      from={from}
                      to={to}
                      totalBrokers={result?.rows.length ?? 0}
                      requestedSlugs={requestedSlugs}
                      contractTypeLabel={t(`comparator.contractType.${contractType}`)}
                      frequencyLabel={t(
                        `comparator.frequency.${frequency === "one_off" ? "oneOff" : frequency}`,
                      )}
                      status={requestPanelStatus}
                      onSend={sendBusinessRequest}
                    />
                  </div>
                )}

                <ResultsBlock
                  result={result}
                  amount={amount}
                  sortBy={sortBy}
                  deliveryMethod={deliveryMethod}
                  showOnlyExclusive={showOnlyExclusive}
                  hasCorridorContext={Boolean(sendingCountry && receivingCountry)}
                  handleAffiliateClick={openPreferredRate}
                  tRatesSource={t("fx.ratesSource")}
                  tAt={t("fx.at")}
                  tCta={t("retail.cta")}
                  tNeutrality={t("comparator.disclaimer.neutrality")}
                  segment={segment}
                  retailBestReceived={retailBestReceived}
                  requestedSlugs={requestedSlugs}
                  onToggleRequested={toggleRequestedSlug}
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
                      onClick={() => handleSegmentChange("business")}
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
// FiltersCard ("smart filter", 2026-08-31) → Rate alert (retail) or
// BusinessContactCard (business, "talk to someone") → Trustpilot, stacked
// in a 268px column. The AI agent never docks here anymore — it's always
// the floating tab (see its own render site's comment). BusinessRequestPanel
// lives in the results column instead, above ResultsBlock, full width — it's
// a running summary of what's being built for the request, not rail
// furniture. Below lg the page keeps today's existing layout (inline
// filter chips further up + the floating agent) unchanged — this rail
// doesn't replace that, it's additive at the breakpoint where there's room
// for it.

/** Vertical Filters card: the same delivery-method/exclusive/rank-by state
 *  the inline filter row above already drives, re-skinned into the rail's
 *  list layout with a per-option count (design/AJUSTES-2.md §6, mockup
 *  line 293-319). The mockup marks each option with a literal ☑/☐
 *  character rather than an icon — this card follows that literally
 *  (the inline filter row above keeps its own lucide icons, unchanged;
 *  this is a separate, rail-only presentation of the same state), and its
 *  active/inactive colors come straight from the mockup's own payoutChips
 *  script (line 853-866): active is a dark border/cream fill, not the
 *  dark-filled pill the inline row above uses. */
function FiltersCard({
  t,
  deliveryMethod,
  toggleDeliveryMethod,
  setDeliveryMethod,
  deliveryCounts,
  showOnlyExclusive,
  setShowOnlyExclusive,
  exclusiveCount,
  businessFilters,
}: {
  t: (k: string) => string;
  deliveryMethod: DeliveryMethod | null;
  toggleDeliveryMethod: (m: DeliveryMethod) => void;
  setDeliveryMethod: (m: DeliveryMethod | null) => void;
  deliveryCounts: Record<DeliveryMethod, number>;
  showOnlyExclusive: boolean;
  setShowOnlyExclusive: (v: boolean | ((prev: boolean) => boolean)) => void;
  exclusiveCount: number;
  /** 2026-08-30 feedback (fourth round) — Contract type/Frequency used to
   *  live in the main search row, which made them look like they affected
   *  the compare results (they never did — see the useState declarations'
   *  own comment). Moved here, into the left rail's filters, since that's
   *  what they actually are: context for the "Add to request" action, not
   *  the search. undefined outside the business segment. */
  businessFilters?: {
    contractType: "spot" | "forward" | "option";
    setContractType: (v: "spot" | "forward" | "option") => void;
    frequency: "one_off" | "monthly" | "quarterly";
    setFrequency: (v: "one_off" | "monthly" | "quarterly") => void;
  };
}) {
  const criteriaCount = (deliveryMethod ? 1 : 0) + (showOnlyExclusive ? 1 : 0);
  // 2026-08-31 feedback — "un agente de Smart filter... con el color
  // oscuro, como kayak.com": this card (payout method, exclusive offers —
  // nothing chat-related) went dark to read as the rail's own AI-flavored
  // panel, matching FloatingAgent's own #241C16/mango palette instead of
  // the rest of the (light) site.
  // 2026-09-01 feedback — "el rank by trust fees rate... sacalo del cuadro
  // vertical de filters": rank-by (trust/fees/rate) used to be a third
  // section here, duplicating the same 3 criteria as a "More filters"
  // dropdown that only showed up below the `lg` breakpoint where this rail
  // is hidden. Removed from here entirely — that dropdown is now the ONE
  // place those criteria live, always visible next to the 3 main sort tabs
  // (see its own comment, right above the tab row).
  const optionRowClass = (active: boolean) =>
    `flex h-[38px] items-center gap-[9px] rounded-[10px] border px-[11px] text-[13px] transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 ${
      active
        ? "border-[1.5px] border-[#FF8A6B] bg-white/[.14] font-bold text-white"
        : "border-white/15 bg-white/[.05] font-semibold text-white/80 hover:border-white/30"
    }`;

  return (
    <div
      style={{ backgroundColor: "#241C16", color: "#F1EBE4" }}
      className="rounded-[18px] px-[17px] py-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-[15px] font-extrabold text-white">{t("comparator.filters.title")}</h4>
        <button
          type="button"
          onClick={() => {
            setDeliveryMethod(null);
            setShowOnlyExclusive(false);
          }}
          className="text-[12px] font-bold text-[#FF8A6B] hover:underline"
        >
          {t("comparator.filters.clear").replace("{n}", String(criteriaCount))}
        </button>
      </div>

      {businessFilters && (
        <div className="mt-[15px]">
          <div className="text-[10.5px] font-bold uppercase tracking-[.1em] text-white/50">
            {t("comparator.field.contractType")}
          </div>
          <div className="mt-[9px] flex gap-[6px]">
            {(["spot", "forward", "option"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => businessFilters.setContractType(v)}
                aria-pressed={businessFilters.contractType === v}
                className={optionRowClass(businessFilters.contractType === v)}
              >
                {t(`comparator.contractType.${v}`)}
              </button>
            ))}
          </div>
          <div className="mt-[13px] text-[10.5px] font-bold uppercase tracking-[.1em] text-white/50">
            {t("comparator.field.frequency")}
          </div>
          <div className="mt-[9px] flex flex-col gap-[6px]">
            {(["one_off", "monthly", "quarterly"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => businessFilters.setFrequency(v)}
                aria-pressed={businessFilters.frequency === v}
                className={optionRowClass(businessFilters.frequency === v)}
              >
                {t(`comparator.frequency.${v === "one_off" ? "oneOff" : v}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={businessFilters ? "mt-[15px] border-t border-white/10 pt-[13px]" : "mt-[15px]"}
      >
        <div className="text-[10.5px] font-bold uppercase tracking-[.1em] text-white/50">
          {t("comparator.filters.payoutMethod")}
        </div>
        <div className="mt-[9px] flex flex-col gap-[6px]">
          {DELIVERY_METHODS.map(({ key, labelKey }) => {
            const isActive = deliveryMethod === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleDeliveryMethod(key)}
                aria-pressed={isActive}
                className={optionRowClass(isActive)}
              >
                <span aria-hidden>{isActive ? "☑" : "☐"}</span>
                <span className="truncate">{t(labelKey)}</span>
                <span className="ml-auto shrink-0 text-[11.5px] font-semibold text-white/50 tabular-nums">
                  {deliveryCounts[key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-[15px] border-t border-white/10 pt-[13px]">
        <div className="text-[10.5px] font-bold uppercase tracking-[.1em] text-white/50">
          {t("comparator.filters.exclusiveOffers")}
        </div>
        <button
          type="button"
          onClick={() => setShowOnlyExclusive((prev) => !prev)}
          aria-pressed={showOnlyExclusive}
          className={`mt-[9px] flex h-[38px] w-full items-center gap-[9px] rounded-[10px] border px-[11px] text-[13px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 ${
            showOnlyExclusive
              ? "border-[1.5px] border-[#EE5B3E] bg-[#EE5B3E]/20 text-[#FF8A6B]"
              : "border-white/15 bg-white/[.05] font-semibold text-white/80 hover:border-[#EE5B3E]/50"
          }`}
        >
          <span aria-hidden>{showOnlyExclusive ? "☑" : "☐"}</span>
          <span className="truncate">{t("comparator.filter.exclusiveOnlyLong")}</span>
          <span className="ml-auto shrink-0 text-[11.5px] font-bold tabular-nums">
            {exclusiveCount}
          </span>
        </button>
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
    <div className="overflow-hidden rounded-[18px] border border-border bg-card">
      <div
        className="h-[104px] bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/howitworks-person.jpg')",
          backgroundPosition: "center 28%",
        }}
        aria-hidden
      />
      <div className="px-[15px] pb-[15px] pt-[13px]">
        <h4 className="text-[14.5px] font-extrabold text-foreground">
          {t("comparator.rateAlert.title").replace("{from}", from).replace("{to}", to)}
        </h4>
        <p className="mt-1.5 text-xs leading-[1.55] text-muted-foreground">
          {t("comparator.rateAlert.body")}
        </p>
        {done ? (
          <p className="mt-3 text-xs font-semibold text-success">
            {t("comparator.rateAlert.success")}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-[10px] space-y-2">
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
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[11px] border-[1.5px] border-foreground text-[13px] font-bold text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
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

/** Trustpilot presence in the vertical rail (design/HANDOFF.md §3).
 *
 *  2026-08-30 feedback: the "4.6" figure was a hardcoded string, not a
 *  real number from Trustpilot (no API integration exists anywhere in the
 *  app). A custom "Check our rating" link replaced it for a few rounds,
 *  but 2026-08-30 feedback (sixth round) asked for the real thing back:
 *  "dejar el original... que es embebido el codigo desde trustpilot no
 *  uno hecho a medida" — the actual Trustpilot embed (TrustBox.tsx, same
 *  widget ContactSection uses), not a look-alike link built here. */
function TrustpilotCard() {
  // 2026-08-31 feedback (still reported after the first round of "flex +
  // justify-center" — that fix helped the About section, next to a button
  // in a `w-fit` row, but this card is a fixed 268px rail item: once
  // Trustpilot's bootstrap script upgrades .trustpilot-widget, it sets its
  // OWN inline width/display on that div (not on any wrapper of ours), and
  // a block-level child sitting inside a wider flex parent doesn't
  // necessarily honor the parent's `justify-center` the way a true flex
  // item would if the script also touches its display/position. `mx-auto`
  // targeted straight at `.trustpilot-widget` centers that specific div by
  // its own margins regardless of what width/display the script gives it —
  // doesn't depend on this wrapper's flex context at all, so it can't be
  // undone by whatever the script decides to set. Still unverified against
  // the live widget (no network path to trustpilot.com in this sandbox to
  // confirm the rendered result) — if this still looks off in production,
  // screenshot it; there's nothing left to reason about blind.
  //
  // 2026-09-01 feedback, now with a real screenshot — the box was roughly
  // double the height of "Set a rate alert" right above it (RateAlertCard's
  // own submit button is h-10/40px). Tried forcing a fixed `h-10` +
  // `overflow-hidden` here and shrinking the widget itself to 36px to
  // match — WRONG FIX, reverted the same day: `overflow-hidden` on a box
  // shorter than what Trustpilot's iframe actually renders just clips the
  // widget's own logo/stars content (see TrustBox.tsx's own comment).
  // Trustpilot needs its real 52px; this card now gives it comfortable
  // padding instead of a hard height, so it's taller than the button
  // above it, but nothing gets cropped.
  return (
    <div className="flex items-center justify-center rounded-[18px] border border-border bg-secondary px-3 py-2.5 [&_.trustpilot-widget]:mx-auto">
      <TrustBox />
    </div>
  );
}

// design/AJUSTES-2.md §1 — "You send"/"They receive" style labels: 11.5px/
// 700/#6B5F55, sentence case (was 11px uppercase/tracked, closer to the
// row's own METRIC_LABEL style than to what this form actually uses).
// 2026-08-30 feedback (fourth round) — the widget's own compact row (mockup
// line 734-744) has no label above the amount/destination boxes at all;
// hideLabel drops it (still an aria-label on the control itself) rather
// than fighting the mockup's own "hay que comprimirlo mucho más" for a
// label the widget was never meant to carry.
function FieldLight({
  label,
  children,
  hideLabel = false,
}: {
  label: string;
  children: React.ReactNode;
  hideLabel?: boolean;
}) {
  if (hideLabel) return <div className="min-w-0">{children}</div>;
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block truncate text-[11.5px] font-bold" style={{ color: "#6B5F55" }}>
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelLabelId = "ai-agent-title";

  // Escape closes; auto-focus the composer on open.
  useEffect(() => {
    if (collapsed) return;
    // 2026-08-31 feedback — "eliminar los movimientos automáticos... por
    // ejemplo en el agente": this focus alone was enough to make the
    // browser auto-scroll the page toward the composer whenever the panel
    // opened near the edge of the viewport. The focus itself is still
    // useful (composer ready to type into); preventScroll just drops the
    // side effect.
    inputRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggle(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed, onToggle]);

  return (
    // Docked to the side edge, vertically centered — Kayak's pattern for a
    // persistent secondary panel — instead of a bottom-right corner bubble
    // that sits on top of content (on mobile it used to overlap the last
    // result row's CTA). Collapsed, it's a slim edge tab rather than a
    // floating circle, so it reads as part of the page's furniture, not an
    // overlay competing with whatever's underneath it. 2026-08-31 feedback
    // — "siempre a la derecha... solo se minimiza cuando yo lo minimizo":
    // always this, everywhere, in both states — no more separate "docked"
    // in-rail variant (that used to also drop the dark chat chrome for a
    // light rail-matching one; removed rather than left dead, see
    // FiltersCard for what actually lives in the rail's "smart filter"
    // slot now).
    <div className="fixed right-0 top-1/2 z-[60] -translate-y-1/2 sm:right-0">
      {collapsed ? (
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
          style={{ backgroundColor: "#241C16", color: "#F1EBE4" }}
          className="flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-r-none shadow-2xl"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <span
              id={panelLabelId}
              className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60"
            >
              <Sparkle className="h-3.5 w-3.5 shrink-0 text-[#FF8A6B]" aria-hidden />
              <span className="truncate">{t("comparator.copilot.agent")}</span>
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className="text-[10px] font-medium uppercase tracking-wider text-success"
                aria-label={`Language ${lang.toUpperCase()}`}
              >
                ● {lang.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => onToggle(true)}
                aria-label={t("agent.minimize")}
                className="rounded-md p-1 text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 thin-scrollbar" aria-live="polite">
            {aiLoading && (
              <div className="flex items-center gap-2 text-sm text-[#A79C92]">
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
                  <div className="rounded-xl border border-white/10 bg-white/[.06] p-3 text-sm leading-relaxed text-[#F1EBE4]">
                    <ReactMarkdown>{t("comparator.copilot.business.intro")}</ReactMarkdown>
                  </div>
                ) : (
                  <>
                    {segment === "retail" && result && amount >= B2B_UPSELL_MIN_AMOUNT && (
                      <div className="rounded-xl border border-white/10 bg-white/[.06] p-3 text-sm leading-relaxed text-[#F1EBE4]">
                        <ReactMarkdown>{t("comparator.copilot.b2bUpsell")}</ReactMarkdown>
                      </div>
                    )}
                    <div className="rounded-xl border border-white/10 bg-white/[.06] p-3 text-sm leading-relaxed text-[#F1EBE4]">
                      <ReactMarkdown>{t("chat.welcome")}</ReactMarkdown>
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
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
                        ? "ml-6 bg-white/[.15] text-[#F1EBE4]"
                        : "mr-6 border border-white/10 bg-white/[.06] text-[#F1EBE4]"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none prose-p:my-1">
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
                  <div className="mr-6 flex items-center gap-2 rounded-md border border-white/10 bg-white/[.06] px-3 py-2 text-sm text-[#A79C92]">
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
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  {t("wizard.moreQuestions")}
                </div>
                <AiCopilot onAction={onWizardAction} disabled={chatMutPending || aiLoading} />
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-white/10 p-3">
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
                  className="border-white/20 bg-transparent text-[#F1EBE4] hover:bg-white/10 hover:text-[#F1EBE4]"
                >
                  {t("comparator.copilot.business.review")}
                </Button>
              </div>
            )}
            {/* Composer (design/AJUSTES-1.md §D) — a white pill on the dark
                panel, matching the mockup exactly, rather than the site's
                usual bordered input field. 2026-08-31 feedback — "que el
                espacio para escribir sea mas grande": a 2-row textarea (was
                a single-line 42px input) that grows the panel instead of
                cramming everything into one line; Enter still sends
                (Shift+Enter for a literal newline), same as before. */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendChat(chatInput);
              }}
              className="flex items-end gap-2 rounded-[11px] bg-white py-1.5 pl-3 pr-1.5"
            >
              <label htmlFor="ai-agent-composer" className="sr-only">
                {t("comparator.copilot.placeholder")}
              </label>
              <textarea
                id="ai-agent-composer"
                ref={inputRef}
                rows={2}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChat(chatInput);
                  }
                }}
                placeholder={t("comparator.copilot.placeholder")}
                aria-label={t("comparator.copilot.placeholder")}
                className="min-h-[52px] min-w-0 flex-1 resize-none border-0 bg-transparent py-1 text-[12.5px] font-medium text-[#241C16] outline-none placeholder:text-[#9C9089] thin-scrollbar"
                disabled={chatMutPending}
              />
              <button
                type="submit"
                disabled={chatMutPending || !chatInput.trim()}
                className="inline-flex h-[31px] w-[34px] shrink-0 items-center justify-center self-end rounded-lg bg-[#EE5B3E] text-white transition disabled:opacity-50"
                aria-label={t("comparator.copilot.send")}
              >
                <Send className="h-3.5 w-3.5" aria-hidden />
              </button>
            </form>
            <p className="mt-2 text-[11px] leading-relaxed text-[#A79C92]">
              {t("comparator.copilot.trustLine")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Business "Your request" panel =====
// design/Mangomundi 4 - Final.dc.html (line 532-541) — lives in the results
// column now, below the results list (2026-08-31 feedback; used to dock in
// the rail next to the agent): a running summary of the request being built
// from the broker table's "Add to request" toggles, not a chat wizard. Email
// and consent are
// collected inline once "Send request" is pressed, rather than up front —
// nothing here blocks browsing/selecting brokers on providing an email
// first, unlike the old chat flow.
function BusinessRequestPanel({
  amount,
  from,
  to,
  totalBrokers,
  requestedSlugs,
  contractTypeLabel,
  frequencyLabel,
  status,
  onSend,
}: {
  amount: number;
  from: string;
  to: string;
  totalBrokers: number;
  requestedSlugs: Set<string>;
  /** Read-only here — the actual controls are the existing "Contract type"/
   *  "Frequency" selects in the search row above (contractType/frequency
   *  state, design/HANDOFF.md §4), already real and already wired; this
   *  panel just reflects the current choice, same as Volume/Route below it. */
  contractTypeLabel: string;
  frequencyLabel: string;
  status: "idle" | "sending" | "sent" | "error";
  onSend: (email: string) => void;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const selectedCount = requestedSlugs.size;

  if (status === "sent") {
    return (
      <div className="rounded-[18px] border-[1.5px] border-foreground bg-card p-4">
        <h4 className="font-heading text-[15px] font-extrabold text-foreground">
          {t("comparator.business.request.title")}
        </h4>
        <p className="mt-3 text-sm leading-relaxed text-foreground">
          {t("comparator.business.request.sent")}
        </p>
      </div>
    );
  }

  // 2026-09-01 feedback — "comprimir y rediseñar el cuadro de your request
  // para que no quede tan largo, poner el botón a la derecha": this used to
  // be 3 stacked rows (title+explainer, a 4-col stat GRID spanning the
  // full width, then the CTA on its own full-width line below that) —
  // three separate border-t bands of vertical space for what's really one
  // decision. The stats are now a compact inline cluster (gap-x, not a
  // grid forcing 1/4 width each) sharing ONE row with the button on the
  // right, so the button no longer needs its own line at all — only the
  // email form (needs room for a text input) drops to its own row, and
  // only once "Send request" is actually clicked.
  return (
    <div className="rounded-[18px] border-[1.5px] border-foreground bg-card p-3.5">
      <h4 className="font-heading text-[15px] font-extrabold text-foreground">
        {t("comparator.business.request.title")}
      </h4>
      <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
        {t("comparator.business.request.explainer")}
      </p>

      {/* 2026-09-01 feedback — "queda espacio en blanco desaprovechado":
          `justify-between` used to pin the CTA to the row's far-right edge,
          which on any screen wider than the 4 stats + button's combined
          width left a dead gap between them (visible in the live
          screenshot — stats end well before the button starts). Just
          flowing the button right after the stats with the same gap-x-5
          the stats already use removes that gap; any leftover space now
          falls after the button, which reads as normal card padding
          instead of a void in the middle of the row. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-3">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
              {t("comparator.business.request.volume")}
            </div>
            <div className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
              {amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {from}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
              {t("comparator.business.request.route")}
            </div>
            <div className="mt-0.5 text-sm font-bold text-foreground">
              {from} → {to}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
              {t("comparator.business.request.contract")}
            </div>
            <div className="mt-0.5 text-sm font-bold text-foreground">
              {contractTypeLabel} · {frequencyLabel}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
              {t("comparator.business.request.brokersSelected")}
            </div>
            <div className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
              {selectedCount} {t("comparator.business.request.of")} {totalBrokers}
            </div>
          </div>
        </div>

        {expanded ? (
          <form
            className="flex w-full flex-col gap-2 sm:flex-row sm:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              onSend(email);
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("comparator.business.request.emailPlaceholder")}
              className="h-11 flex-1 rounded-lg border border-input bg-card px-3 text-sm text-foreground"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="btn-cta flex h-11 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-bold disabled:opacity-60"
            >
              {status === "sending"
                ? t("comparator.business.request.sending")
                : t("comparator.business.request.cta").replace("{n}", String(selectedCount))}
            </button>
            {status === "error" && (
              <p className="text-xs text-destructive sm:basis-full">
                {t("comparator.business.request.error")}
              </p>
            )}
          </form>
        ) : (
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => setExpanded(true)}
            className="btn-cta flex h-10 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("comparator.business.request.cta").replace("{n}", String(selectedCount))}
          </button>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        {t("comparator.business.request.disclaimer")}
      </p>
    </div>
  );
}

// design/Mangomundi 4 - Final.dc.html (line 552-557) — the mockup's third
// rail card is "Rather talk to someone?" + "Book a 15-min call". 2026-08-30
// feedback (second round) is explicit: no booking flow — contact stays
// email, same business desk address the home teaser and BusinessExtrasSection
// already use. Literal to the mockup otherwise: same photo, top-anchored,
// bordered card.
function BusinessContactCard() {
  const { t } = useI18n();
  return (
    <div className="overflow-hidden rounded-[18px] border border-border bg-card">
      <img
        src="/images/business-person.jpg"
        alt=""
        width={300}
        height={120}
        className="h-[120px] w-full object-cover object-[center_30%]"
        loading="lazy"
      />
      <div className="p-4">
        <h4 className="text-[14.5px] font-extrabold text-foreground">
          {t("comparator.business.contactCard.title")}
        </h4>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {t("comparator.business.contactCard.body")}
        </p>
        {/* 2026-08-31 feedback — "el botón de acción de enviar un email
            respete la paleta": was a plain ink-bordered button, now the
            brand's own btn-cta (mango), same as BusinessExtrasSection's
            matching email CTA below. */}
        <a
          href="mailto:hello@mangomundi.com?subject=Business%20FX%20inquiry"
          className="btn-cta mt-2.5 flex h-10 items-center justify-center rounded-xl text-[13px] font-bold"
        >
          {t("business.extras.cta")}
        </a>
      </div>
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
  tRatesSource,
  tAt,
  tCta,
  tNeutrality,
  segment,
  retailBestReceived,
  requestedSlugs,
  onToggleRequested,
}: {
  result: ComparisonResult;
  amount: number;
  sortBy: SortKey;
  deliveryMethod: DeliveryMethod | null;
  showOnlyExclusive: boolean;
  /** design/Mangomundi 4 - Final.dc.html line 494-529 — business segment
   *  passes an extra businessExtra prop to every ProviderRow (see
   *  BusinessRowExtra), never a different row layout — see this prop's own
   *  2026-08-30 (second round) correction below. */
  segment: Segment;
  /** Best received amount from a same-corridor RETAIL comparison, fetched
   *  separately (see ComparatorSection's retail-baseline effect) so the
   *  broker table's "Est. saved" figure can honestly say "vs the retail
   *  best on this route" (the mockup's own disclosed methodology, line
   *  529) instead of a number with no stated baseline. Null while that
   *  fetch hasn't resolved yet, or outside the business segment — the
   *  saved figure is hidden rather than guessed in that case. */
  retailBestReceived: number | null;
  requestedSlugs: Set<string>;
  onToggleRequested: (slug: string) => void;
  /** True when the current query has both a sending and receiving country
   *  selected, i.e. a real corridor lookup was attempted server-side — see
   *  fx.functions.ts. Gates the "not verified for this route" badge: without
   *  this, every row would show has_corridor_data:false whenever no
   *  corridor lookup ran at all (currency-only comparisons), which would
   *  misleadingly badge rows that were never checked against a route in the
   *  first place. */
  hasCorridorContext: boolean;
  handleAffiliateClick: (slug: string, url: string, name?: string) => void;
  tRatesSource: string;
  tAt: string;
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

  // design/Mangomundi 4 - Final.dc.html (line 435) — "Show N more providers"
  // instead of always rendering the full list; resets to collapsed whenever
  // the underlying result changes (a new search shouldn't stay expanded from
  // the previous one). Client-side only — result.rows is already fully
  // loaded, so this is just how many of it render, not a new fetch.
  const INITIAL_VISIBLE_ROWS = 6;
  const [showAllRows, setShowAllRows] = useState(false);
  useEffect(() => setShowAllRows(false), [result]);
  const visibleRows = showAllRows ? displayRows : displayRows.slice(0, INITIAL_VISIBLE_ROWS);
  const hiddenRowCount = displayRows.length - visibleRows.length;

  return (
    <div className="min-w-0">
      {/* No shared header row (design/AJUSTES-1.md §C1 — removed on
          purpose): each row now carries its own per-metric micro-label
          above its value (see ProviderRow), so a card reads on its own
          without the eye having to travel back up to a header — which is
          also what lets the same row layout work on mobile without a
          separate table. */}
      <div className={displayRows.length > 0 ? "flex flex-col gap-[11px]" : ""}>
        {/* 2026-08-30 feedback (second round) — business used to swap this
            for a completely different card (BusinessBrokerRow). Corrected:
            the business segment gets the SAME row — same metrics, same
            affiliate CTA, everything individual already has — with the
            broker fields (spread/minimum/settlement/contracts) and "Add to
            special request" appended as an ADDITIONAL block via
            businessExtra, never a replacement. */}
        {visibleRows.map((row, i) => (
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
            sortBy={sortBy}
            businessExtra={
              segment === "business"
                ? {
                    amount,
                    savedVsRetail:
                      retailBestReceived != null ? row.received - retailBestReceived : null,
                    requested: requestedSlugs.has(row.slug),
                    onToggleRequested: () => onToggleRequested(row.slug),
                  }
                : undefined
            }
          />
        ))}
        {organic.length === 0 && (
          <div className="rounded-2xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            {deliveryMethod != null ? t("comparator.emptyFiltered") : t("comparator.empty")}
          </div>
        )}
      </div>

      {hiddenRowCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAllRows(true)}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-xl border-[1.5px] border-input bg-card text-sm font-bold text-foreground transition-colors hover:border-foreground/40 sm:w-auto sm:px-5"
        >
          {t("comparator.showMoreProviders").replace("{n}", String(hiddenRowCount))}
        </button>
      )}

      {/* 2026-08-31 feedback — the neutrality disclaimer used to sit right
          above the list, right under the 3 big tabs; moved down here to
          join the other small print instead of doubling up on fine-print
          real estate in the busiest part of the page. */}
      <div className="mt-4 rounded-xl border border-border bg-card/50 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <p>
          {tRatesSource}{" "}
          <span className="font-semibold text-foreground">
            {new Date(result.rates_updated_at).toLocaleDateString()} {tAt}{" "}
            <span className="tabular-nums">{updatedTime}</span>
          </span>
        </p>
        <p className="mt-1">
          <span className="font-semibold text-foreground">⚖︎ </span>
          {tNeutrality}
        </p>
      </div>
      {/* design/Mangomundi 4 - Final.dc.html line 529 — the broker table's
          own disclosed methodology, not the retail footer copy above. */}
      {segment === "business" && (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {t("comparator.business.methodology")}
        </p>
      )}
    </div>
  );
}

// design/AJUSTES-2.md §3 — the small orange tag next to the featured row's
// name ("Best overall"/"Fastest"/…), naming which active sort criterion it
// won. Distinct from sortLabelKey's short tab/chip words (e.g. "Smart",
// "Rate") — this is a full phrase explaining the win, matching the
// mockup's dynamic tag literally ("Best overall", "Receives most",
// "Fastest").
function winnerTagKey(sortBy: SortKey): string {
  switch (sortBy) {
    case "recipient_gets_most":
      return "comparator.row.tagReceivesMost";
    case "fastest":
      return "comparator.row.tagFastest";
    case "most_trusted":
      return "comparator.row.tagMostTrusted";
    case "lowest_cost":
      return "comparator.row.tagLowestFee";
    case "best_exchange_rate":
      return "comparator.row.tagBestRate";
    default:
      return "comparator.row.tagBestOverall";
  }
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
  sortBy,
  businessExtra,
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
  /** Drives the featured row's winner tag (design/AJUSTES-2.md §3) — which
   *  criterion it won under the currently active sort. */
  sortBy: SortKey;
  /** design/Mangomundi 4 - Final.dc.html line 494-529 — business-only,
   *  additive block (Spread/Minimum/Settlement/Contracts + "Add to special
   *  request") appended below the row's existing footer. 2026-08-30
   *  feedback (second round): this used to be a whole separate row
   *  component replacing the individual layout — corrected to be exactly
   *  this, an addition, since the business search should show everything
   *  individual already does (affiliate CTA included) plus this. undefined
   *  outside the business segment. */
  businessExtra?: {
    amount: number;
    savedVsRetail: number | null;
    requested: boolean;
    onToggleRequested: () => void;
  };
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
  // methods that used to render as chips below the name. §C4 removes those
  // chips outright: payout is one of the four metrics now, text only, not
  // repeated as a pill below the name too.
  const payoutText = highlightChips.map((c) => c.text).join(" · ") || "—";

  // Delta vs. the best received amount in view (§C4) — 0 (or a hair off it,
  // due to float rounding) means this row IS the best, so it gets the
  // winner label instead of a "−N vs best" line.
  const isBest = delta >= -0.005;
  const deltaLabel = isBest
    ? null
    : t("comparator.row.deltaVsBest").replace(
        "{amount}",
        `${delta.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${quote}`,
      );

  // Name + rating (§C4) — "★ 4.3 on Trustpilot · {regulator}", no review
  // count. row.regulator holds the real per-provider regulator name when
  // one exists (e.g. "FCA") — kept as real data rather than the mockup's
  // literal placeholder word "Regulated".
  // design/AJUSTES-2.md §0/§3 — the rating star is filled #F59E0B (amber),
  // one of the two exceptions to "no filled icons" the doc calls out
  // (the other is the Trustpilot star elsewhere, filled #1F7A5A/green).
  const rating = row.trust_score != null && (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11.5px] text-muted-foreground">
      <Star className="h-2.5 w-2.5 shrink-0 fill-[#F59E0B] text-[#F59E0B]" />{" "}
      {row.trust_score.toFixed(1)} {t("comparator.row.onTrustpilot")}
      {row.regulator && <> · {row.regulator}</>}
    </span>
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
  // Sponsored disclosure (§C4) — demoted from a colored corner tab to plain
  // footer text, same size/weight as the price stamp next to it. Same
  // has_exclusive_deal trigger as before (presentation change only, not a
  // rewiring of which flag counts as "sponsored"). The neutrality statement
  // itself now lives once above the whole list (see ResultsBlock), not
  // repeated here.
  const affiliateNote = row.has_exclusive_deal && (
    <span className="whitespace-nowrap font-medium text-muted-foreground">
      {t("comparator.row.affiliateLink")}
    </span>
  );
  // design/AJUSTES-2.md §3 — literal "·" dividers between footer elements,
  // and "Fee breakdown" pinned right (ml-auto). Built as an array so the
  // dot only ever renders BETWEEN two real elements, never dangling if one
  // is absent (has_exclusive_deal false, no promo_text, etc.).
  const footerDot = (
    <span className="whitespace-nowrap" style={{ color: "#B3A698" }}>
      ·
    </span>
  );
  const footerParts = [
    priceStamp,
    row.promo_text && (
      <span key="promo" className="inline-flex items-center gap-1 font-medium text-accent">
        <Sparkle className="h-2.5 w-2.5 shrink-0" /> {t("comparator.badge.promoPrefix")}{" "}
        {row.promo_text}
      </span>
    ),
    affiliateNote,
  ].filter(Boolean);
  // 2026-08-30 feedback (fifth round) — "Fee breakdown" removed: it opened
  // the AI agent's canned fee-explainer rather than showing an inline
  // breakdown, which read as a dead/confusing link ("no tiene sentido").
  // That explainer is still reachable through the agent itself (its own
  // quick-actions grid), just not duplicated as a per-row footer link.
  const trustLine = footerParts.length > 0 && (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] leading-snug">
      {footerParts.map((part, i) => (
        <span key={i} className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {i > 0 && footerDot}
          {part}
        </span>
      ))}
    </div>
  );

  // Labeled CTA (§C4 — "Go to {name} ↗"; was an icon-only 44×44 square with
  // no text before that, then just the bare name — the audit's H5: no way
  // to tell what it does, and five identical buttons in a list have no
  // hierarchy). The featured row gets the full-color fill; every other row
  // gets an outlined version — Kayak's "Best value / Cheapest" pattern, one
  // clear lead instead of five equal buttons.
  const cta = row.affiliate_url ? (
    <button
      onClick={onClick}
      aria-label={`${tCta} — ${row.name}`}
      className={`inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-md border-[1.5px] px-4 text-[14px] font-bold transition-transform duration-200 ease-out group-hover:-translate-y-0.5 sm:w-auto ${
        featured
          ? "btn-cta border-transparent group-hover:shadow-[0_8px_24px_-10px_color-mix(in_oklab,var(--color-brand-cta)_55%,transparent)]"
          : "border-input bg-card text-foreground hover:border-foreground/30"
      }`}
    >
      <span className="truncate">
        {t("fx.goto")} {row.name} ↗
      </span>
    </button>
  ) : (
    // Always reserve the same height, whether or not there's a real link
    // (a provider with no affiliate_url yet — see fx.functions.ts — would
    // otherwise collapse this slot and misalign the column below it).
    <div className="h-11 w-full shrink-0 sm:w-auto" aria-hidden />
  );

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-card p-4 transition-shadow duration-200 ease-out hover:shadow-md sm:px-[19px] sm:py-4"
      style={{
        border: featured ? "1.5px solid #EE5B3E" : "1px solid #EBE3D9",
        // 2026-09-01 feedback — "se resaltan con sombras cuando se
        // seleccionan": this was using the 3-tab row's OWN shadow value
        // (design/Mangomundi 4 - Final.dc.html line 828, `t.shadow`)
        // instead of the result rows' own, slightly different one
        // (line 846, `r.shadow`) — the two got cross-wired at some point.
        boxShadow: featured ? "0 12px 28px -18px rgba(238,91,62,.6)" : "none",
      }}
    >
      {/* Desktop — single grid, columns match the ResultsBlock header
          exactly, so values line up under their titles instead of each
          row repeating its own "Comisión"/"Tasa"/"Entrega" micro-labels. */}
      <div className="hidden sm:grid sm:grid-cols-[224px_1fr_204px] sm:items-center sm:gap-[18px]">
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
              {/* 2026-09-01 feedback — "hay cambios que no se hicieron":
                  found via audit, not reported directly — the featured
                  row's name+badge shared one line in a fixed 224px
                  column; even "Provider 1" (10 chars) truncated to
                  "Provid..." fighting the "BEST OVERALL" badge for room
                  (confirmed on screenshot, not assumed). `flex-wrap`
                  drops the badge to its own line instead of truncating
                  the name — the name is the identifying info, the badge
                  is a bonus tag, so wrapping preserves the one that
                  matters. Non-featured rows (no badge) are unaffected. */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-[15px] font-bold text-foreground">{row.name}</span>
                {/* design/AJUSTES-2.md §3 — the featured row's "why this
                    won" tag, matching the active sort criterion literally
                    (mockup: "Best overall"/"Fastest"/"Receives most"). */}
                {featured && (
                  <span
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style={{ backgroundColor: "#FDE9E4", color: "#C2410C" }}
                  >
                    {t(winnerTagKey(sortBy))}
                  </span>
                )}
              </div>
              {score != null && (
                <div className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                  {t("comparator.score.label")} {displayScore(score)}
                </div>
              )}
            </div>
          </div>
          <div className="mt-1.5">{rating}</div>
        </div>
        {/* Four equal metric columns, each with its own micro-label above
            the value (design/AJUSTES-1.md §C1) — replaces the shared
            header row that used to title these from above the whole list. */}
        <div className="grid grid-cols-4 gap-[10px]">
          <div className="min-w-0 tabular-nums">
            <div className={METRIC_LABEL}>{t("comparator.row.labelFee")}</div>
            <div className="mt-0.5 text-[14.5px] font-semibold text-foreground">
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
            <div className="mt-0.5 text-[14.5px] font-semibold text-foreground">
              {row.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {quote}
            </div>
            <div className={`text-[10px] ${ratePctClass}`}>{ratePctLabel}</div>
          </div>
          <div className="min-w-0 tabular-nums">
            <div className={METRIC_LABEL}>{t("comparator.row.labelDelivery")}</div>
            <div className="mt-0.5 inline-flex items-center gap-1 text-[14.5px] font-semibold text-foreground">
              <Clock className="h-3.5 w-3.5" /> {deliveryLabel}
            </div>
          </div>
          <div className="min-w-0">
            <div className={METRIC_LABEL}>{t("comparator.row.labelPayout")}</div>
            {/* 2026-09-01 feedback — "hay cambios que no se hicieron":
                found via audit — a provider supporting 2+ delivery
                methods (e.g. "Bank transfer · Card") truncated to
                "Bank · Ca..." in this equal-width 1/4 metric column,
                confirmed on screenshot. Joined method names wrap onto a
                2nd line just fine (no single word is long enough to
                break awkwardly) instead of hiding real information. */}
            <div className="mt-0.5 text-[14.5px] font-semibold leading-snug text-foreground">
              {payoutText}
            </div>
          </div>
        </div>
        <div className="min-w-0 text-right">
          <div className={METRIC_LABEL}>{t("comparator.row.labelReceive")}</div>
          <div className="mt-0.5 whitespace-nowrap font-heading text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em] tabular-nums text-foreground">
            {row.received.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            <span className="text-xs font-semibold text-muted-foreground">{quote}</span>
          </div>
          <div
            className={`mt-0.5 text-[12px] font-bold tabular-nums ${
              isBest ? "text-success" : "text-muted-foreground"
            }`}
          >
            {isBest ? t("comparator.row.deltaWinner") : deltaLabel}
          </div>
          <div className="mt-2.5 flex justify-end">{cta}</div>
        </div>
      </div>
      {trustLine && (
        <div
          className="mt-[10px] hidden pt-[9px] sm:block"
          style={{ borderTop: "1px solid #F5EFE8" }}
        >
          {trustLine}
        </div>
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
              <div className="truncate text-[15px] font-bold text-foreground">{row.name}</div>
              {rating}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="whitespace-nowrap font-heading text-xl font-extrabold leading-[1.1] tabular-nums text-foreground">
              {row.received.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
              <span className="text-[11px] font-semibold text-muted-foreground">{quote}</span>
            </div>
            <div
              className={`mt-0.5 text-[12px] font-bold tabular-nums ${
                isBest ? "text-success" : "text-muted-foreground"
              }`}
            >
              {isBest ? t("comparator.row.deltaWinner") : deltaLabel}
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
        {trustLine && <div className="mt-2">{trustLine}</div>}
        <div className="mt-3">{cta}</div>
      </div>

      {businessExtra && (
        <BusinessRowExtra
          row={row}
          quote={quote}
          amount={businessExtra.amount}
          savedVsRetail={businessExtra.savedVsRetail}
          requested={businessExtra.requested}
          onToggleRequested={businessExtra.onToggleRequested}
        />
      )}
    </div>
  );
}

// ===== Business row extra =====
// design/Mangomundi 4 - Final.dc.html (line 494-529) — appended below
// ProviderRow's own footer when businessExtra is set (segment === "business"
// only). 2026-08-30 feedback (second round): this used to be a whole
// separate card replacing ProviderRow for business; corrected to be exactly
// what its name says — an addition to the same row individual gets
// (metrics, trust line, affiliate CTA all still render above this), not a
// substitute for any of it.
function BusinessRowExtra({
  row,
  quote,
  amount,
  savedVsRetail,
  requested,
  onToggleRequested,
}: {
  row: ComparisonResult["rows"][number];
  quote: string;
  amount: number;
  /** null when the retail baseline hasn't loaded yet — the saved figure is
   *  hidden rather than guessed (see ResultsBlock's own prop comment). */
  savedVsRetail: number | null;
  requested: boolean;
  onToggleRequested: () => void;
}) {
  const { t } = useI18n();
  const metrics: Array<{ labelKey: string; value: string }> = [
    {
      labelKey: "comparator.business.metric.spread",
      value: `${row.spread_applied.toFixed(2)}%`,
    },
    {
      labelKey: "comparator.business.metric.minimum",
      value:
        row.min_amount != null
          ? `${row.min_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${quote}`
          : "—",
    },
    { labelKey: "comparator.business.metric.settlement", value: row.settlement_terms ?? "—" },
    { labelKey: "comparator.business.metric.contracts", value: row.contract_type ?? "—" },
  ];

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-dashed border-input bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.labelKey} className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {t(m.labelKey)}
            </div>
            <div className="mt-0.5 truncate text-[13px] font-semibold tabular-nums text-foreground">
              {m.value}
            </div>
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {savedVsRetail != null && savedVsRetail > 0 && (
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {t("comparator.business.estOn").replace(
                "{amount}",
                amount.toLocaleString(undefined, { maximumFractionDigits: 0 }),
              )}
            </div>
            <div className="font-heading text-lg font-extrabold leading-none tabular-nums text-foreground">
              {savedVsRetail.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
              <span className="text-[11px] font-bold text-muted-foreground">
                {quote} {t("comparator.business.saved")}
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleRequested}
          aria-pressed={requested}
          className={`flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-3.5 text-xs font-bold transition-colors ${
            requested
              ? "border-[1.5px] border-foreground bg-card text-foreground"
              : "border-[1.5px] border-input bg-card text-foreground hover:border-foreground/40"
          }`}
        >
          {requested ? t("comparator.business.added") : t("comparator.business.addToRequest")}
        </button>
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
  tCta,
}: {
  result: ComparisonResult;
  handleAffiliateClick: (slug: string, url: string, name?: string) => void;
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
      {/* design/Mangomundi 4 - Final.dc.html (line 743-744) — "Delivers the
          most / of N compared", not the generic comparator.results header
          the full table uses; a dedicated pair of keys so this doesn't
          drag that shared string's wording along with it. */}
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {t("comparator.widget.deliversMost")}
        </span>
        <span className="text-[10px] font-bold" style={{ color: "#1F7A5A" }}>
          {t("comparator.widget.ofNCompared").replace("{n}", String(result.rows.length))}
        </span>
      </div>

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
              className="shrink-0 rounded-sm"
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
                    className="shrink-0 rounded-sm"
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
      {/* 2026-09-01 feedback — "como no tiene scroll hay algo abajo que no
          se ve": a `{tRecipient}` caption used to render right here, one
          more line below the invitation block. It was fx.recipient
          ("Recipient gets") — a label meant to sit next to a figure
          elsewhere, rendered alone with nothing to attach to, and not part
          of design/Mangomundi 4 - Final.dc.html's widget mockup (line
          726-786) at all. In the fixed 360×540 frame (overflow-hidden, no
          scrollbar — EmbedComparator.tsx's own comment on why), that extra
          line was exactly what pushed the bottom of this list (and
          sometimes the "powered by" footer under it) past the visible
          height with no way to see it had happened. Removed instead of
          re-fit — it didn't belong here to begin with. */}
    </div>
  );
}
