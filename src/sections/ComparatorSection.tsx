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
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronsRight,
  Clock,
  Coins,
  CreditCard,
  Gauge,
  Handshake,
  Heart,
  Loader2,
  Percent,
  Send,
  Shield,
  Share2,
  SlidersHorizontal,
  Star,
  Sparkle,
  User,
  Zap,
  Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
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
import {
  localCurrency,
  primaryCountryForCurrency,
  resolveRouteCode,
  COUNTRY_BY_CODE,
} from "@/lib/countries";
import { BrandLogo } from "@/components/BrandLogo";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { TrustBox } from "@/components/TrustBox";
import { PreferredRateModal } from "@/components/PreferredRateModal";
import { Checkbox } from "@/components/ui/checkbox";
import { CountryCombobox } from "@/components/ui/CountryCombobox";
import { CurrencyCombobox } from "@/components/ui/CurrencyCombobox";
import { useAnalytics } from "@/hooks/use-analytics";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRatesFreshness } from "@/hooks/use-rates-freshness";
import { B2B_UPSELL_MIN_AMOUNT } from "@/config/providers";
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
/* El micro-label por métrica (METRIC_LABEL, 10.5px/700/#6B5F55 literal del
 * mockup) se eliminó con docs/kayak-redesign-spec.md §3.7: las cuatro
 * columnas de métrica con label propio pasaron a UNA línea inline con
 * separadores "·", así que ya no hay nada que etiquetar — y con eso se va
 * el tamaño más chico de todo el comparador, que era justo lo que la regla
 * 5 del spec (piso de 12px) venía a eliminar. */
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
      // 2026-09-02 feedback (round 4) — without this, the URL-sync effect's
      // own 300ms-debounced setResult(null) (below) fired right behind this
      // mutate's onMutate (which no longer clears result itself — see its
      // own comment) and nulled the result out from under the in-flight
      // re-compare anyway, so the skeleton still flashed. Same guard the
      // AI-suggested-compare and auto-run-on-mount flows already use.
      skipNextSyncClearRef.current = true;
      compareMut.mutate({ from: code, to, sendingCountry, receivingCountry });
    }
  };
  const handlePickToCurrency = (code: string) => {
    setTo(code);
    if (compact && result) {
      skipNextSyncClearRef.current = true;
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
  // 2026-09-03 feedback, second round — "el switch deberia dejar la pagina
  // con el titulo de nuevo hasta que se toque de nuevo compare o update...
  // dame la recomendacion": confirmed with the user — a segment switch is a
  // clean reset to a fresh search screen, not a same-page toggle. Two parts
  // to that, both fixed here:
  //
  // 1. autoRun must NOT carry over. Both "/" and "/business" derive their
  //    own initialQuery.autoRun as `Boolean(origin && destination)` (for a
  //    real shared/bookmarked link) — but this navigation also carries
  //    origin/destination over so the FORM stays filled in, which would
  //    silently satisfy that same condition and auto-fire a comparison on
  //    the new segment. `autoRun: false` in the search object is now an
  //    explicit override both routes' searchSchema/initialQuery respect
  //    (search.autoRun ?? the old derivation) — carries the fields, not the
  //    auto-execute.
  // 2. Scroll must go back to the top. An earlier round (first "raro"
  //    report) added `resetScroll: false` on the theory that a toggle
  //    shouldn't jump the viewport — but once the destination is an
  //    intentionally fresh, pre-result screen (hero expanded, no result),
  //    staying at a mid-page scroll offset left the reader looking at
  //    whatever content happens to sit there now, unrelated to what used to
  //    be at that scroll position — the actual "se oculta y aparece" effect
  //    being reported. Removed here; TanStack Router's own default (scroll
  //    to top on a fresh forward navigation) is what a real reset needs.
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
          autoRun: false,
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
          autoRun: false,
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
  // 2026-09-02 feedback — "el auto scroll te saca de la respuesta": stays
  // true when the reader is at (or near) the bottom of the chat pane; set
  // by FloatingAgent's own onScroll below. Read at effect time, before any
  // new content is appended, so it reflects where the reader actually was —
  // not where the pane ends up after growing.
  const chatNearBottomRef = useRef(true);
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
  /** docs/kayak-redesign-spec.md §4.2 — el contador del botón de filtros de
   *  mobile ("Aplicar (N)" / el badge sobre el ícono). Cuenta criterios
   *  ACTIVOS, no opciones disponibles: es la misma cuenta que el rail usa
   *  para decidir si muestra "Limpiar filtros". */
  const activeFilterCount = (deliveryMethod ? 1 : 0) + (showOnlyExclusive ? 1 : 0);
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
  /** docs/kayak-redesign-spec.md §4.1 — el formulario completo en mobile,
   *  detrás de la píldora de resumen. */
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  /** §4.2 — el rail de filtros de §3.4, como Drawer, debajo de `lg`. */
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
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
      // 2026-09-02 feedback (round 4) — "sigue apareciendo la rejilla al
      // seleccionar la currency y poner compare": this unconditionally
      // nulled `result`, even for a re-search that already has results on
      // screen (e.g. changing currency post-search auto-fires a re-compare
      // — see handlePickFromCurrency/handlePickToCurrency's own comment).
      // That contradicted the first-search skeleton's own doc comment
      // ("a re-search with existing results just updates them in place")
      // — every re-search actually flashed to the empty-result skeleton
      // and back, which is exactly the "weird visual delay" reported.
      // Leaving a prior result in place during a re-search (the Compare
      // button's own spinner — see its disabled/isPending rendering below
      // — already signals "working") means only a genuine first search
      // (no prior result) ever shows the skeleton.
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

  // 2026-09-02 feedback (AH3) — "sigue pasando lo del delay... aparece el
  // circulito y dice comparing rates pero ese recuadro que aparece con
  // delay queda mal": the first-search skeleton below used to render the
  // instant `compareMut.isPending` went true. In this sandbox a real
  // request is slow enough that isn't visible, but in production a fast
  // response (a couple hundred ms) meant the skeleton box popped in and
  // was immediately torn out again for the real results — a flash/flicker,
  // not a smooth loading state, which reads exactly as "queda mal". Gating
  // it behind a short delay means a fast response never shows the skeleton
  // at all (no flash), while a genuinely slow one still gets the normal
  // loading experience after this brief grace period. The Compare button's
  // own spinner (below) stays tied directly to `isPending` — that's a
  // small, layout-stable change, so instant feedback there is still good,
  // it's only this larger inserted block that benefits from the delay.
  const [showLoadingSkeleton, setShowLoadingSkeleton] = useState(false);
  useEffect(() => {
    if (!compareMut.isPending) {
      setShowLoadingSkeleton(false);
      return;
    }
    const timer = setTimeout(() => setShowLoadingSkeleton(true), 250);
    return () => clearTimeout(timer);
  }, [compareMut.isPending]);

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

  // 2026-09-02 feedback — "el auto scroll te saca de la respuesta, mejor
  // que no se mueva cuando responde, sino no se entiende que es un chat,
  // que tenga el comportamiento de acuerdo a las mejores prácticas": this
  // used to call scrollIntoView() with no `block`, which defaults to
  // "start" — for a zero-height marker sitting right after the newest
  // message, that aligns the marker's (empty) position to the TOP of the
  // pane, scrolling the entire new response up out of view instead of
  // revealing it. `block: "end"` is the actual "stick to bottom" chat
  // pattern (ChatGPT/Slack/etc.): the pane scrolls just far enough that
  // the new message's bottom edge lands at the pane's bottom edge, so
  // reading starts at its top and the chat still visibly advances. Also
  // skipped entirely when the reader has scrolled up to reread earlier
  // history — best practice is to leave their position alone rather than
  // yank them back down mid-read.
  useEffect(() => {
    if (!chatNearBottomRef.current) return;
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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
      // 2026-09-03 feedback — "te deja volver a elegir nuevos proveedores
      // pero la pantalla de sent no se va, tendria que quedar la pantalla
      // anterior de nuevo limpia una vez que se envio un request": status
      // used to stay "sent" forever — the panel never returned to its
      // normal form, even though the results list right above it stayed
      // fully interactive (Add to request still toggled requestedSlugs),
      // so a second request had nowhere to go. A brief confirmation, then
      // a real reset (status back to idle, selections cleared so "Add to
      // request" buttons return to their unselected state) so the panel is
      // ready to build a new request rather than stuck showing the last one.
      window.setTimeout(() => {
        setRequestPanelStatus("idle");
        setRequestedSlugs(new Set());
      }, 3000);
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

  // docs/kayak-redesign-spec.md §4.1 — el patrón mobile de Kayak: una vez
  // que hay resultado, la barra completa (5 segmentos apilados, ~300px de
  // alto) se reemplaza por una PÍLDORA de resumen sticky bajo el header, y
  // el formulario entero se muda a un Drawer que esa píldora abre. Sin
  // esto, en 390px la barra se come la pantalla entera y los resultados —
  // que son lo que la persona vino a ver — arrancan debajo del fold.
  //
  // Gate por `isMobile` (el hook que este archivo ya usa) y no por una
  // media query CSS: el formulario tiene que existir en UN solo lugar del
  // árbol a la vez, o los inputs se duplican y el foco/estado se parte en
  // dos copias.
  const collapsedSearch = !embedded && Boolean(result) && isMobile;
  const collapsedRoute = `${COUNTRY_BY_CODE[sendingCountry]?.name ?? sendingCountry} → ${
    receivingCountry ? (COUNTRY_BY_CODE[receivingCountry]?.name ?? receivingCountry) : "—"
  }`;
  const collapsedDetail = `${amount.toLocaleString()} ${from} · ${
    deliveryMethod
      ? t(
          DELIVERY_METHODS.find((m) => m.key === deliveryMethod)?.labelKey ??
            "comparator.delivery.all",
        )
      : t("comparator.delivery.all")
  }`;
  const collapsedSearchPill = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setSearchDrawerOpen(true)}
        aria-label={t("comparator.mobile.editSearch")}
        className="min-w-0 flex-1 rounded-compact bg-muted px-3 py-2 text-left transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <div className="truncate text-metric font-bold text-foreground">{collapsedRoute}</div>
        <div className="truncate text-meta text-muted-foreground">{collapsedDetail}</div>
      </button>
      {/* El `Ask AI` de Kayak: el agente ya existe y ya está montado — acá
          sólo cambia su punto de entrada en mobile, donde la pestaña
          lateral flotante queda tapada por la lista de resultados. */}
      <button
        type="button"
        onClick={() => handleAgentToggle(false)}
        aria-label={t("comparator.copilot.agent")}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-input bg-card text-brand-cta transition-colors hover:border-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Sparkle className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
  // docs/kayak-redesign-spec.md §3.2/§4.1 — la barra completa se
  // extrae a una constante porque tiene DOS puntos de montaje: inline
  // (desktop siempre; mobile mientras no hay resultado) y dentro del
  // Drawer de la píldora colapsada (mobile con resultado, §4.1). Es el
  // mismo árbol en los dos casos — duplicar el markup sería garantía de
  // que las dos copias se separen a la primera corrección.
  const searchBar = (
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
    // 2026-09-02 feedback (Z2) — "en mobile ordenar mejor las
    // ventanas de comparar como hicimos en el widget para que
    // quede los selectores en dos líneas": below @4xl this was
    // `grid-cols-1`, so Send/swap/Receive/Compare each became
    // their own full-width row — 4 stacked rows instead of the
    // 2-line shape the embedded widget already uses for the
    // same fields (see the `embedded ?` branch above). Same
    // idea here, without duplicating the field markup: `flex
    // flex-wrap` + `basis-full` on Send forces it alone onto
    // line 1 (the same forced-break trick BusinessRequestPanel
    // used to use for its own button, W10/Y2 history), and
    // swap/Receive/Compare — none of which carry `basis-full`
    // — flow together onto line 2, sized the same way the
    // widget's own line 2 already is (Receive content-sized,
    // Compare `flex-1` soaking up the rest). @4xl still swaps
    // this to the original one-line 4-column grid.
    // docs/kayak-redesign-spec.md §3.2/§3.3 — el formulario deja
    // de ser cajas independientes con label arriba y pasa a ser
    // lo que usa kayak.com: una fila de tiles de "vertical"
    // arriba, y debajo UN solo rectángulo blanco segmentado
    // (radio 8, sin borde, --shadow-compare) dividido por
    // hairlines verticales, con el CTA a sangre en el extremo
    // derecho. Ningún segmento lleva borde, radio ni sombra
    // propios: ese es el detalle que hace que se lea como una
    // barra y no como cuatro inputs pegados.
    <div className="flex flex-col gap-3">
      {/* §3.3 (revisado) — Personal/Empresa deja de ser dos tiles de
                    ícono lado a lado y pasa a ser UN selector desplegable,
                    igual que el "One-way ⌄" de kayak.com: una píldora
                    chica arriba y AFUERA de la barra, con el valor activo +
                    chevron, que abre un menú con las dos opciones. Mismo
                    estado `segment`/`handleSegmentChange` de siempre —
                    cambia la piel (dos tiles → un trigger), no la lógica
                    ni el motivo por el que el segmento se decide antes de
                    buscar (los resultados retail y business son conjuntos
                    distintos). El eyebrow "COMPARAR" sigue sin volver: la
                    barra ya se explica sola. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("search.segment")}
            className="flex w-fit items-center gap-1.5 rounded-full border border-input bg-card px-3 py-1.5 text-meta font-semibold text-foreground shadow-sm transition-colors hover:border-foreground/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {segment === "business" ? (
              <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" aria-hidden />
            )}
            <span>{t(`comparator.segment.${segment}`)}</span>
            <ChevronDown className="h-4 w-4 opacity-60" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={segment}
            onValueChange={(v) => handleSegmentChange(v as Segment)}
          >
            <DropdownMenuRadioItem value="retail">
              <User className="mr-2 h-4 w-4" aria-hidden />
              {t("comparator.segment.retail")}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="business">
              <Building2 className="mr-2 h-4 w-4" aria-hidden />
              {t("comparator.segment.business")}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* docs/kayak-redesign-spec.md §3.2 — LA barra. Un solo bloque:
                    `@2xl:h-15` (60px, la medida real de kayak.co.uk),
                    `rounded-compact`, `bg-card`, `shadow-compare`.
                    2026-09-03 CORRECCIÓN (verificado en vivo contra
                    kayak.com/kayak.co.uk, no contra capturas): el commit
                    "campos como recuadritos con borde/sombra" (segunda
                    ronda del 2026-09-03) se hizo sin poder navegar
                    kayak.com en esa sesión — decía textualmente "no pude
                    navegar kayak.com en vivo, sin conector de Chrome
                    instalado". Con el navegador disponible, se midió el DOM
                    real de kayak.co.uk (`getComputedStyle` sobre la barra
                    de búsqueda a 1440px): el contenedor `.J_T2-row` tiene
                    UN solo `border-radius: 8px` y UN solo `box-shadow`; sus
                    `.J_T2-field-group` hijos no tienen background, border,
                    radius ni shadow propios — son transparentes. La
                    separación entre campos es un pseudo-elemento `::before`
                    de 1px con `background: rgb(217,226,232)`, es decir un
                    hairline, no un chip. Esto confirma el spec original
                    (§3.2 tal cual está escrito arriba) y revierte el commit
                    de "recuadritos": vuelve a ser una sola pieza segmentada,
                    sin borde/sombra/fondo por campo, separada por hairlines
                    (`border-t` apilado en mobile, `border-l` en fila en
                    desktop), con el CTA a sangre en el extremo derecho. */}
      <div
        className={`grid min-w-0 grid-cols-1 rounded-compact bg-card shadow-compare transition focus-within:ring-2 focus-within:ring-brand-cta/40 @2xl:flex @2xl:h-15 @2xl:items-stretch ${
          sameCorridorBlocked ? "ring-2 ring-brand-cta" : ""
        }`}
      >
        {/* Segmento 1 — monto, solo. El monto es el primer segmento y el
                      más grande de la barra. Sin chip propio: comparte el
                      lienzo del contenedor (regla general de este bloque,
                      ver comentario de arriba). */}
        <div className="flex min-w-0 items-center px-3 py-2.5 @2xl:h-14 @2xl:flex-[1.3] @2xl:py-0">
          <FieldLight label={t("comparator.field.amount")}>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              value={amount || ""}
              placeholder="1000"
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
              aria-label={t("comparator.field.amount")}
              className="w-full min-w-0 bg-transparent text-metric font-bold tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </FieldLight>
        </div>

        {/* Segmento 2 — moneda de origen. "Las currencys deben ser como
                      espacio de la fecha de kayak" — caja angosta propia
                      (`@2xl:w-28 @2xl:flex-none`, no crece ni se achica), la
                      misma idea que el campo de fecha de kayak.com: chico,
                      de ancho fijo, solo un valor corto. Separada del
                      segmento anterior por hairline (`border-t` en mobile,
                      `border-l` en desktop), sin chip propio. */}
        <div className="flex min-w-0 items-center border-t border-border px-3 py-2.5 @2xl:h-14 @2xl:w-28 @2xl:flex-none @2xl:border-t-0 @2xl:border-l @2xl:py-0">
          {/* Label corto ("Currency", key ya existente y traducida a los
                        20 idiomas vía comparator.business.request.currency —
                        no una key nueva) en vez de "Source Currency" completo:
                        en una caja de ancho fijo tipo fecha de kayak.com, el
                        label largo truncaba a "Source Cur…". El aria-label
                        del combobox de abajo sigue siendo el descriptivo
                        completo, para lectores de pantalla. */}
          <FieldLight label={t("comparator.business.request.currency")}>
            <CurrencyCombobox
              value={from}
              onChange={handlePickFromCurrency}
              placeholder={t("comparator.field.sourceCurrency")}
              searchPlaceholder={t("comparator.combobox.search")}
              emptyLabel={t("comparator.combobox.empty")}
              ariaLabel={t("comparator.field.sourceCurrency")}
              compactLabel
              triggerClassName="h-auto w-full gap-0.5 rounded-none border-0 bg-transparent px-0 text-metric font-bold text-foreground shadow-none hover:text-brand-cta focus:ring-0"
            />
          </FieldLight>
        </div>

        {/* Segmento 3 — país de origen. "El país debería ser como el
                      aeropuerto, con el mismo comportamiento" — mismo
                      `CountryCombobox` con búsqueda y lista de banderas que
                      ya se usa acá (es el mismo control que el picker de
                      origen/destino de un buscador de vuelos), en su propio
                      segmento sin chip, separado por hairline. */}
        <div className="flex min-w-0 items-center border-t border-border px-3 py-2.5 @2xl:h-14 @2xl:flex-[1.4] @2xl:border-t-0 @2xl:border-l @2xl:py-0">
          <FieldLight label={t("comparator.field.sourceCountry")}>
            <CountryCombobox
              value={sendingCountry}
              onChange={handleSendingCountryChange}
              placeholder={t("comparator.combobox.placeholder")}
              searchPlaceholder={t("comparator.combobox.search")}
              emptyLabel={t("comparator.combobox.empty")}
              ariaLabel={t("comparator.field.sourceCountry")}
              hideSecondary
              triggerClassName="h-auto w-full rounded-none border-0 bg-transparent px-0 text-metric font-bold text-foreground shadow-none hover:text-brand-cta focus:ring-0"
            />
          </FieldLight>
        </div>

        {/* Segmento swap. 2026-09-04: en el widget (`EmbedComparator`, más
                      abajo en este archivo) el swap ya es un círculo con
                      borde/sombra SIEMPRE visibles (no solo en hover) — así
                      se ve el de kayak.co.uk en vivo. Acá tenía
                      `border-transparent` (invisible hasta el hover), que
                      es la única diferencia real con el del widget; se
                      alinea al mismo tratamiento sin tocar el layout (sigue
                      siendo su propio segmento, sin chip). */}
        <div className="flex items-center justify-center py-0.5 @2xl:w-9 @2xl:py-0">
          <button
            type="button"
            onClick={handleSwap}
            aria-label={t("comparator.swap")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-input bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-brand-cta focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ArrowLeftRight className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>

        {/* Segmento 4 — país destino, mismo comportamiento de aeropuerto
                      que el Segmento 3, mismo hairline de separación. */}
        <div className="flex min-w-0 items-center border-t border-border px-3 py-2.5 @2xl:h-14 @2xl:flex-[1.4] @2xl:border-t-0 @2xl:border-l @2xl:py-0">
          <FieldLight label={t("comparator.field.youReceive")} emphasizeLabel={!receivingCountry}>
            <CountryCombobox
              value={receivingCountry}
              onChange={handleReceivingCountryChange}
              placeholder={t("comparator.field.receiveCountryPlaceholder")}
              searchPlaceholder={t("comparator.combobox.search")}
              emptyLabel={t("comparator.combobox.empty")}
              ariaLabel={t("comparator.field.targetCountry")}
              hideSecondary
              triggerClassName={`h-auto w-full rounded-none border-0 bg-transparent px-0 text-metric font-bold shadow-none hover:text-brand-cta focus:ring-0 ${
                receivingCountry ? "text-foreground" : "text-accent-text"
              }`}
            />
          </FieldLight>
        </div>

        {/* Segmento 5 — moneda de destino, misma caja angosta tipo fecha
                      que el Segmento 2, mismo hairline de separación. */}
        <div className="flex min-w-0 items-center border-t border-border px-3 py-2.5 @2xl:h-14 @2xl:w-28 @2xl:flex-none @2xl:border-t-0 @2xl:border-l @2xl:py-0">
          <FieldLight label={t("comparator.business.request.currency")}>
            <CurrencyCombobox
              value={to}
              onChange={handlePickToCurrency}
              placeholder={t("comparator.field.targetCurrency")}
              searchPlaceholder={t("comparator.combobox.search")}
              emptyLabel={t("comparator.combobox.empty")}
              ariaLabel={t("comparator.field.targetCurrency")}
              compactLabel
              triggerClassName="h-auto w-full gap-0.5 rounded-none border-0 bg-transparent px-0 text-metric font-bold text-foreground shadow-none hover:text-brand-cta focus:ring-0"
            />
          </FieldLight>
        </div>

        {/* Método de entrega — "el payout method no queremos que esté en
                      el selector inicial, queda para ser seleccionado en el
                      comparador". Deja de ser un segmento de la barra;
                      sigue existiendo como filtro real dentro de los
                      resultados (rail sticky §3.4 más abajo, con
                      checkboxes + contador por método, y su equivalente en la
                      fila de chips de mobile/tablet) — no se perdió
                      funcionalidad, solo se movió del momento de la búsqueda
                      al momento de filtrar resultados. */}

        {/* CTA — 2026-09-04 CORRECCIÓN (verificado en vivo contra
                      kayak.com/kayak.co.uk a los anchos que este entorno
                      puede capturar sin artefactos, 375/768/~750px): el
                      botón "Search" de kayak NUNCA sangra al borde de la
                      tarjeta blanca. Siempre tiene margen visible arriba,
                      abajo y a los costados, y sus 4 esquinas están
                      redondeadas — nunca solo un lado. El comentario previo
                      ("a sangre... igual que el botón Search de kayak.com")
                      se escribió midiendo `.J_T2-row` a 1440px sin haber
                      visto realmente cómo se ve el botón ahí; a los anchos
                      donde sí pudimos ver la página en vivo, sangrar al
                      borde es exactamente lo que kayak NO hace. Mismo ancho
                      de columna (130px) y misma altura (44px/h-11) que
                      antes, pero ahora con margen (`mx-3`/`@2xl:mx-2`) y
                      radio completo (`rounded-compact`, no
                      `rounded-r-compact`/`rounded-b-compact`) en vez de
                      sangrar. Mismo fix aplicado más abajo al botón del
                      widget (`EmbedComparator`/`embedded`). */}
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
          disabled={compareMut.isPending || !receivingCountry || sameCorridorBlocked || amount <= 0}
          className="btn-cta-gradient mx-3 mb-3 mt-1 flex h-11 items-center justify-center gap-2 rounded-compact px-4 text-meta font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring @2xl:mx-2 @2xl:my-0 @2xl:h-11 @2xl:w-[130px] @2xl:flex-none @2xl:self-center"
        >
          {compareMut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <span className="truncate">
              {t(compact ? "comparator.cta.update" : "comparator.cta.compareRates")}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <SectionTag
      id={embedded ? undefined : "comparator"}
      key={lang}
      // docs/kayak-redesign-spec.md §3.1 — la sección deja de vivir sobre
      // --background y pasa a su propio lienzo (--surface-canvas, medio
      // punto de L por debajo) para que la barra blanca y cada fila de
      // resultado floten sobre él, igual que kayak.com pone #F0F3F5 detrás
      // de tarjetas #FFF.
      //
      // Reemplaza el `!result ? "bg-card"` anterior (2026-09-01, "el primer
      // fondo del comparador es igual que el de todays routes"): ese
      // problema era que la sección heredaba el mismo cream que la sección
      // de abajo y las dos se leían como una sola banda. El lienzo propio
      // lo resuelve igual de bien y además en los dos estados, con y sin
      // resultado — que es lo que hace que esto se lea como un buscador y
      // no como una sección más del home.
      className={embedded ? "min-w-0" : "scroll-mt-24 bg-surface-canvas pb-8 pt-4 sm:pb-12"}
    >
      {/* §3.1 — 1180 = 240 de rail + 728 de resultados + gutters, la
          proporción real de kayak.com (antes max-w-7xl = 1280). */}
      <div className={embedded ? "min-w-0" : "mx-auto max-w-[1180px] px-5 sm:px-8"}>
        {/* THE comparator box — the single entry point. Basic row always
            visible; advanced fields fold out below inside the same card.
            Once a comparison has run, the card sticks under the fixed
            header (top-[66px] = its design/AJUSTES-2.md §7 height) so the
            search stays reachable and editable while the results list below
            scrolls underneath it — the Kayak/Skyscanner "search collapses
            to a sticky bar, results take the screen" pattern, without a
            second page. */}
        <div
          className={`min-w-0 ${
            result && !embedded
              ? // El wrapper sticky necesita fondo propio: sin él, la lista
                // que scrollea por debajo se ve a través de los huecos
                // alrededor de la píldora/barra (verificado en screenshot a
                // 390px). Es el mismo lienzo de la sección, así que no
                // agrega una banda visible — sólo tapa.
                "sticky top-[66px] z-30 bg-surface-canvas py-2"
              : ""
          }`}
        >
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
          <div
            className={
              // docs/kayak-redesign-spec.md §3.2 — en desktop la tarjeta ya
              // NO es este wrapper: la barra de búsqueda de abajo es la
              // tarjeta (un único rectángulo blanco, radio 8, sin borde,
              // --shadow-compare), así que este contenedor se vuelve
              // transparente y deja de sumar un segundo marco alrededor.
              // En modo embebido sigue habiendo una tarjeta real, con la
              // geometría compacta del spec en vez del radio 2xl anterior.
              embedded ? "compare-card min-w-0 overflow-hidden" : "min-w-0"
            }
          >
            {/* 2026-09-02 feedback — "el box de compare se puede hacer menos
                alto si se mueve la píldora de individual/business arriba de
                compare y en la misma línea de send y receive... se puede
                eliminar toda la pestaña de arriba": this used to be its own
                bordered header row (~34-50px of chrome — role="tablist" +
                the segment pill, nothing else) sitting above the form body.
                Dropped entirely, saving the card that whole row's height.
                design/AJUSTES-1.md §B's dead /exchange link (that used to
                live in this removed row) was already gone per AJUSTES-3.md
                §B — nothing left here worth keeping.
                2026-09-02 feedback (second round) — "el individual business
                tiene que estar arriba del botón de comparar no arriba del
                send": the pill's first home (the Send field's own label
                line) turned out to be the wrong one — it now sits above
                the Compare button instead, in that button's own column of
                this grid (a few hundred lines into the form body below). */}

            {/* Form body. @container lets the rows adapt to the CARD's width, not
              the viewport: 3/4 columns when the card is full-width (no results
              yet), 2 columns once it shares the row with the metrics panel.
              2026-09-03 feedback — "sobra espacio en el cuadro": sm:p-3.5
              (14px) trimmed to sm:p-3 (12px) and the space-y-2 (8px) gap
              before the search row — reserved even while the same-country
              warning above it is collapsed to 0 height — trimmed to
              space-y-1.5 (6px). Small on their own, but this card has been
              through several rounds of exactly this ask (S4/S9/X1/Z1/Z2) —
              real, not cosmetic padding is what's left to give back. */}
            <div className={`@container ${embedded ? "space-y-1.5 p-2.5" : "space-y-2"}`}>
              {/* 2026-09-02 feedback — "el comparador se mueve y parece
                  raro" al elegir país/moneda: reproducido y medido (no a
                  ojo) — elegir el mismo país en origen y destino inserta
                  este aviso, la card crece ~42px al instante y todo lo de
                  abajo (Institutional & Partnership Inquiries, footer)
                  salta de golpe. La animación grid-rows (técnica estándar
                  para animar hacia/desde height:auto sin JS ni medir el
                  alto a mano) convierte ese salto instantáneo en una
                  transición suave — sigue "moviendo" la página como
                  cualquier mensaje de validación real, pero de forma
                  predecible en vez de abrupta. El aviso queda siempre
                  montado (nunca unmount) para que la transición tenga algo
                  que animar en ambos sentidos. */}
              <div
                className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
                  sameCorridorBlocked && receivingCountry ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0">
                  <div className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent-text">
                    {t("search.sameCountry")}
                  </div>
                </div>
              </div>
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
                // docs/kayak-redesign-spec.md §5.4 — el formulario del
                // widget es el formulario mobile de Kayak: UNA tarjeta
                // blanca con la geometría compacta (radio 8, sombra corta),
                // filas divididas por hairlines y el CTA a ancho completo
                // como última fila. Se va el rounded-[12px] + borde de
                // 1.5px, que lo hacían leer como un input gigante en vez de
                // como un buscador.
                <div
                  className={`compare-card flex flex-col overflow-hidden transition-colors ${
                    sameCorridorBlocked ? "ring-2 ring-brand-cta" : ""
                  }`}
                >
                  {/* 2026-09-04 feedback (Kayak-style redesign, approved
                      canvas mockup "mangomundi Search Redesign") — Send and
                      Receive now read as ONE continuous bordered card
                      (hairline divider between rows, not two separate boxes
                      with a gap), a square swap button pinned to the right
                      edge overlapping the seam between them, and Compare as
                      a full-width row at the bottom of the same card. Field
                      widths (w-20 flag/country, w-[58px] currency) are
                      unchanged from the previous layout — AD5/AG3/AH2's
                      "never resizes on selection, never clips a locale's
                      placeholder" fixes still apply here. */}
                  <div className="relative">
                    <div className="flex flex-col gap-[3px] border-b border-border px-2.5 py-[7px]">
                      <span className="text-badge font-semibold text-muted-foreground">
                        {t("comparator.field.amount")}
                      </span>
                      <div className="flex h-[30px] items-stretch overflow-hidden rounded-control bg-muted">
                        <CountryCombobox
                          value={sendingCountry}
                          onChange={handleSendingCountryChange}
                          placeholder=""
                          searchPlaceholder={t("comparator.combobox.search")}
                          emptyLabel={t("comparator.combobox.empty")}
                          ariaLabel={t("comparator.field.sourceCountry")}
                          triggerIconOnly
                          triggerClassName="h-full w-20 shrink-0 justify-center gap-1 rounded-none border-0 bg-transparent px-1.5 text-[12px] font-bold shadow-none hover:bg-black/5 focus:ring-0"
                        />
                        <input
                          type="number"
                          inputMode="decimal"
                          min={1}
                          value={amount || ""}
                          placeholder="1000"
                          onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                          aria-label={t("comparator.field.amount")}
                          className="min-w-0 flex-1 border-l border-black/10 bg-transparent px-2.5 text-[14px] font-bold tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                        <CurrencyCombobox
                          value={from}
                          onChange={handlePickFromCurrency}
                          placeholder={t("comparator.field.sourceCurrency")}
                          searchPlaceholder={t("comparator.combobox.search")}
                          emptyLabel={t("comparator.combobox.empty")}
                          ariaLabel={t("comparator.field.sourceCurrency")}
                          compactLabel
                          triggerClassName="h-full w-[58px] shrink-0 rounded-none border-0 border-l border-black/10 bg-transparent px-2 text-[12px] font-bold shadow-none hover:bg-black/5 focus:ring-0"
                        />
                      </div>
                    </div>

                    {/* 2026-09-04 feedback — Receive gets a real bordered
                        box in the accent color while it still needs a
                        country (Kayak's focused "To?" field cue), the same
                        treatment as the full comparator's own Receive
                        segment — distinct from sameCorridorBlocked (a
                        stronger, more urgent state on the whole card,
                        unchanged above). */}
                    <div className="flex flex-col gap-[3px] px-2.5 py-[7px]">
                      <span
                        className={`text-badge font-semibold ${
                          !receivingCountry ? "text-accent-text" : "text-muted-foreground"
                        }`}
                      >
                        {t("comparator.field.youReceive")}
                      </span>
                      <div
                        className={`flex h-[30px] items-stretch overflow-hidden rounded-control transition-colors ${
                          !receivingCountry ? "border border-brand-cta bg-accent/10" : "bg-muted"
                        }`}
                      >
                        <CountryCombobox
                          value={receivingCountry}
                          onChange={handleReceivingCountryChange}
                          placeholder={t("comparator.field.receiveCountryPlaceholder")}
                          searchPlaceholder={t("comparator.combobox.search")}
                          emptyLabel={t("comparator.combobox.empty")}
                          ariaLabel={t("comparator.field.targetCountry")}
                          triggerIconOnly
                          triggerClassName="h-full w-20 shrink-0 justify-center gap-1 rounded-none border-0 bg-transparent px-1.5 text-[12px] font-bold shadow-none hover:bg-black/5 focus:ring-0"
                        />
                        <CurrencyCombobox
                          value={to}
                          onChange={handlePickToCurrency}
                          placeholder={t("comparator.field.targetCurrency")}
                          searchPlaceholder={t("comparator.combobox.search")}
                          emptyLabel={t("comparator.combobox.empty")}
                          ariaLabel={t("comparator.field.targetCurrency")}
                          compactLabel
                          triggerClassName="h-full w-[58px] shrink-0 rounded-none border-0 border-l border-black/10 bg-transparent px-2 text-[12px] font-bold shadow-none hover:bg-black/5 focus:ring-0"
                        />
                      </div>
                    </div>

                    {/* Swap — square, pinned to the right edge, overlapping
                        the seam between the two rows (top-1/2 of this
                        relative wrapper lands on that seam since both rows
                        share the same padding/line-height). */}
                    <button
                      type="button"
                      onClick={handleSwap}
                      aria-label={t("comparator.swap")}
                      // §5.4 / regla 1 — los dos hex sueltos (#F5EFE8 fondo,
                      // #EE5B3E ícono) pasan a tokens; el ring blanco que lo
                      // recortaba contra el borde pasa a ring-card, que es
                      // ese mismo blanco pero por token.
                      className="absolute right-2 top-1/2 flex h-[30px] w-[30px] -translate-y-1/2 items-center justify-center rounded-control bg-muted text-brand-cta shadow-md ring-[3px] ring-card transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta/40"
                    >
                      <ArrowLeftRight strokeWidth={2.2} className="h-[13px] w-[13px]" />
                    </button>
                  </div>

                  {/* Compare — 2026-09-04 CORRECCIÓN: igual que en la barra
                      principal (`searchBar` más arriba en este archivo), el
                      botón "Search" de kayak.com nunca sangra al borde de
                      la tarjeta — siempre tiene margen visible y esquinas
                      redondeadas completas. El comentario anterior
                      ("a sangre... como el botón Search de kayak.com") era
                      la lectura equivocada; se corrige acá igual que en el
                      buscador de escritorio. */}
                  <div className="border-t border-border px-3 py-3">
                    <button
                      type="button"
                      data-search-submit
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
                      className="btn-cta-gradient flex h-11 w-full items-center justify-center rounded-compact text-meta font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
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
              ) : collapsedSearch ? (
                collapsedSearchPill
              ) : (
                searchBar
              )}

              {validationError && (
                <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                  {validationError}
                </div>
              )}
            </div>
          </div>

          {/* docs/kayak-redesign-spec.md §4.1 — barra de progreso de 3px al
              pie de la barra sticky mientras corre la búsqueda. Es el
              feedback más barato que hay: en mobile, con la barra colapsada
              a una píldora, el spinner del CTA ya no está en pantalla, así
              que sin esto un re-compare no tiene ningún acuse de recibo.
              `animate-pulse` y no una animación de progreso falsa: no
              sabemos cuánto va a tardar, y fingir un porcentaje mentiría. */}
          {compareMut.isPending && result && !embedded && (
            <div
              className="h-[3px] w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={t("comparator.status.fetching")}
            >
              <div
                className="h-full w-full animate-pulse"
                style={{ backgroundImage: "var(--gradient-cta)" }}
              />
            </div>
          )}
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
        {/* docs/kayak-redesign-spec.md §4.1 — en mobile con resultado, el
            punto de entrada del agente pasa a ser el botón ✦ de la píldora,
            así que la pestaña lateral flotante se oculta: medida en
            screenshot, se superponía sobre las tarjetas de resultado a
            390px. Cuando el panel está ABIERTO sigue visible, obviamente —
            es el panel mismo. */}
        <div className={collapsedSearch && aiCollapsed ? "hidden" : ""}>
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
              chatNearBottomRef={chatNearBottomRef}
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
        </div>

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
            {(compareMut.error as Error)?.message ?? t("comparator.row.genericError")}
          </div>
        )}

        {/* First-search loading state — only while there's no prior result to
            keep showing (a re-search with existing results just updates them
            in place once the new data lands). Without this, clicking Compare
            left a dead gap below the button until the request resolved; sized
            to roughly match 3 real ProviderRow rows for the same
            CLS-avoidance reason as BlogSection's skeleton.
            2026-09-02 feedback (AH3) — gated behind `showLoadingSkeleton`
            (see its own comment above) instead of `compareMut.isPending`
            directly, so a fast response never flashes this in and back out. */}
        {showLoadingSkeleton && !result && (
          <div className="mt-5 min-w-0">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden />
              {t("comparator.loading.title")}
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card" aria-hidden>
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
        {/* 2026-09-02 feedback (round 4) — now that onMutate (above) leaves a
            prior result in place during a re-search instead of nulling it,
            this dims it slightly while the new one is in flight — a subtle
            "updating" cue (on top of the Compare button's own spinner)
            instead of the jarring blank-then-repopulate flash. */}
        {result &&
          (embedded ? (
            <div
              className={`mt-2.5 min-w-0 transition-opacity duration-200 ${compareMut.isPending ? "opacity-60" : ""}`}
            >
              <CompactResultsList
                result={result}
                handleAffiliateClick={openPreferredRate}
                tCta={t("retail.cta")}
              />
            </div>
          ) : (
            <div
              className={`mt-5 grid min-w-0 scroll-mt-24 gap-5 transition-opacity duration-200 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-5 ${compareMut.isPending ? "opacity-60" : ""}`}
            >
              {/* Left rail — design/AJUSTES-2.md §6 (mockup line 290-365):
                  Filters → AI Agent → Rate alert → Trustpilot, 268px wide,
                  13px gap between cards. ≥lg only; below that the page
                  keeps the existing inline filter row + floating agent
                  (rendered elsewhere), unchanged. */}
              {/* docs/kayak-redesign-spec.md §3.4 — 240px (era 268) y
                  sticky bajo el header + la barra de búsqueda, que ya es
                  sticky ella misma: el rail de kayak.com acompaña el scroll
                  de la lista en vez de irse hacia arriba con ella. */}
              <aside className="hidden lg:sticky lg:top-[136px] lg:flex lg:flex-col lg:gap-3">
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
                  {/* 2026-09-02 feedback (X8 audit) — was h3, but every
                      marketing section that carries an h2 (Today's routes,
                      How it works, About manifesto, Blog…) is hidden the
                      moment a result exists (see HomePageBody's own
                      `!hasResult` gates) — so on the actual results page
                      the heading order was h1 straight to h3, skipping a
                      level. h2 (same classes, so no visual change) closes
                      that gap; the h4s below it in this same view (Filters,
                      rate alert, Your request, "Rather talk to someone?")
                      move to h3 for the same reason, so nothing skips from
                      here either. */}
                  <h2 className="text-eyebrow font-bold uppercase text-accent-text">
                    {t("comparator.results")}
                  </h2>
                  {/* 2026-09-02 feedback — "el resultado de mid market rate
                      ponelo en el mismo renglón que your results, abajo del
                      comparador y afuera del box, a la derecha": was inside
                      the comparator card's own header row (design/AJUSTES-2.md
                      §2's original placement) — moved here instead, same row
                      as "Your results", outside the card. resultsRef/
                      scroll-mt-24 (the auto-scroll target after a compare —
                      see its own comment near the ref's declaration) moves
                      with it; `justify-between` on this row already existed
                      for exactly this second element. */}
                  <div
                    ref={resultsRef}
                    className="flex shrink-0 scroll-mt-24 items-baseline gap-2.5"
                  >
                    <span className="font-heading text-[14px] font-extrabold tracking-tight tabular-nums text-foreground sm:text-[18px]">
                      1 {from} ={" "}
                      {result.market_rate.toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
                      {to}
                    </span>
                    <span className="hidden text-xs sm:inline" style={{ color: "#8A7C6E" }}>
                      {t("comparator.midMarketRate")}
                    </span>
                  </div>
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
                    {/* §3.5 — un solo bloque de 3 columnas SIN gaps: la
                        matriz de precio de Kayak es una pieza, no 3
                        tarjetas sueltas. `overflow-hidden` recorta la barra
                        inferior de la tab activa contra el radio del
                        bloque. */}
                    <div className="grid flex-1 grid-cols-3 overflow-hidden rounded-compact bg-card shadow-compare">
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
                            // docs/kayak-redesign-spec.md §3.5 — las 3 tabs
                            // dejan de ser tarjetas sueltas con borde coral y
                            // sombra propia y pasan a ser la matriz de precio
                            // de Kayak: UN bloque de 3 columnas, sin gaps,
                            // con la activa marcada por una barra inferior de
                            // 2px (border-b-2 border-brand-cta) sobre fondo
                            // de tarjeta, y las inactivas hundidas en
                            // bg-muted/40. El contenido — label, figura y
                            // subtítulo — ya era el correcto (una tab que
                            // muestra cuánto se gana se toca; una que sólo
                            // dice "Smart" no), sólo cambia la piel.
                            className={`flex flex-col gap-0.5 px-3.5 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 ${
                              isActive
                                ? "border-b-2 border-brand-cta bg-card"
                                : "border-b-2 border-transparent bg-muted/40 hover:bg-muted"
                            }`}
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-meta font-semibold text-muted-foreground">
                                {tab.label}
                              </span>
                              <span className="hidden whitespace-nowrap text-badge text-muted-foreground sm:inline">
                                {tab.hint}
                              </span>
                            </div>
                            <div className="text-metric font-bold tabular-nums text-foreground">
                              {tab.figure}
                            </div>
                            <div className="truncate text-badge text-muted-foreground">
                              {tab.sub}
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
                              ? "text-accent-text"
                              : "text-foreground hover:text-accent-text"
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
                  {/* docs/kayak-redesign-spec.md §4.2 — la fila de filtros de
                      mobile deja de envolver y pasa a scrollear en
                      horizontal, precedida por un botón cuadrado que abre el
                      Drawer de filtros (el mismo rail de §3.4, apilado).
                      El comentario largo que justificaba `flex-wrap` sigue
                      siendo cierto PARA EL WIDGET de 440px, donde no hay
                      ancho para insinuar que hay más contenido fuera de
                      pantalla — así que el wrap se conserva exactamente ahí
                      (`embedded`), y sólo mobile real pasa a scroll. */}
                  <div
                    className={`flex items-center gap-2 lg:hidden ${embedded ? "flex-wrap" : ""}`}
                  >
                    {/* Abre el rail completo como Drawer. Sólo fuera del
                        widget: dentro de un iframe de 440px un drawer a
                        pantalla casi completa se lee como un secuestro de la
                        página del tercero. */}
                    {!embedded && (
                      <button
                        type="button"
                        onClick={() => setFiltersDrawerOpen(true)}
                        aria-label={t("comparator.filters.title")}
                        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-input bg-card text-foreground transition-colors hover:border-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <SlidersHorizontal className="h-4 w-4" aria-hidden />
                        {activeFilterCount > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-cta px-1 text-badge font-bold leading-none text-brand-cta-foreground">
                            {activeFilterCount}
                          </span>
                        )}
                      </button>
                    )}

                    <div
                      className={`flex min-w-0 items-center gap-2 ${
                        embedded ? "flex-wrap" : "overflow-x-auto no-scrollbar"
                      }`}
                    >
                      {DELIVERY_METHODS.map(({ key, icon: Icon, labelKey }) => {
                        const isActive = deliveryMethod === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleDeliveryMethod(key)}
                            aria-pressed={isActive}
                            // §4.2 — el chip activo va en oscuro sólido, no
                            // en color de marca: el coral se reserva para la
                            // acción (el CTA), no para el estado de un filtro.
                            className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-meta font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                              isActive
                                ? "border-transparent bg-foreground text-background"
                                : "border-input bg-card text-foreground hover:border-foreground/40"
                            }`}
                          >
                            <Icon className="h-4 w-4" aria-hidden />
                            {t(labelKey)}
                          </button>
                        );
                      })}

                      {/* Exclusive-rates filter — an explicit opt-in the
                          person turns on themselves, not a default. Neutral
                          by design: OFF (default) shows everyone, ordered
                          purely by the chosen sort; ON only narrows to a
                          labeled subset, still ordered by that same sort —
                          never a re-ranking. Mismo tratamiento de chip
                          activo que el resto (§4.2): dejó de ser el único
                          chip coral de la fila. */}
                      <button
                        type="button"
                        onClick={() => setShowOnlyExclusive((prev) => !prev)}
                        aria-pressed={showOnlyExclusive}
                        className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-meta font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                          showOnlyExclusive
                            ? "border-transparent bg-foreground text-background"
                            : "border-input bg-card text-foreground hover:border-foreground/40"
                        }`}
                      >
                        <Sparkle className="h-4 w-4" aria-hidden />
                        {t("comparator.filter.exclusiveOnly")}
                      </button>

                      {/* Legend opens in a modal — never pushes the results
                          table down, unlike an inline expand. Same content
                          available on both desktop (click) and mobile (tap),
                          no hover needed. */}
                      <button
                        type="button"
                        onClick={() => setShowLegend(true)}
                        aria-label={t("comparator.legend.toggle")}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-input bg-card text-muted-foreground transition-colors hover:border-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <Info className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
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
                      sendingCountry={sendingCountry}
                      receivingCountry={receivingCountry}
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
                  pending={compareMut.isPending}
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
                          : "text-accent-text hover:text-brand-cta-hover"
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

      {/* docs/kayak-redesign-spec.md §4.1 — el formulario completo detrás de
          la píldora colapsada. Sólo se monta cuando la píldora está en
          pantalla (`collapsedSearch`), así el árbol nunca tiene dos copias
          de los mismos inputs a la vez. El CTA del formulario cierra el
          drawer al disparar la búsqueda: la lista de abajo ya se reordena
          sola, no hace falta que la persona lo cierre a mano. */}
      {collapsedSearch && (
        <Drawer open={searchDrawerOpen} onOpenChange={setSearchDrawerOpen}>
          <DrawerContent className="max-h-[92vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-metric font-bold">
                {t("comparator.mobile.editSearch")}
              </DrawerTitle>
            </DrawerHeader>
            <div
              className="overflow-y-auto px-4 pb-6"
              onClickCapture={(e) => {
                // El CTA es el único control del drawer que termina la
                // tarea; cualquier otro click (abrir un combobox, tocar
                // swap) tiene que dejarlo abierto.
                if ((e.target as HTMLElement).closest("[data-search-submit]")) {
                  setSearchDrawerOpen(false);
                }
              }}
            >
              {searchBar}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* docs/kayak-redesign-spec.md §4.2 — el mismo rail de filtros de
          §3.4, apilado en un Drawer, para los anchos donde el rail no
          existe. Reusa FiltersCard entero en vez de una segunda
          implementación de los mismos controles: dos copias de un filtro es
          cómo se llega a que una filtre y la otra no. */}
      {!embedded && (
        <Drawer open={filtersDrawerOpen} onOpenChange={setFiltersDrawerOpen}>
          <DrawerContent className="max-h-[85vh] lg:hidden">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-metric font-bold">
                {t("comparator.filters.title")}
              </DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4">
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
                hideHeader
              />
            </div>
            {/* "Aplicar (N)" fijo abajo. Los filtros ya se aplican en vivo
                (cada checkbox reordena la lista al instante), así que este
                botón sólo cierra — pero sin él el drawer no tiene salida
                obvia con el pulgar, que es todo el punto en mobile. */}
            <div className="border-t border-border p-4">
              <button
                type="button"
                onClick={() => setFiltersDrawerOpen(false)}
                className="btn-cta-gradient flex h-11 w-full items-center justify-center rounded-control text-meta font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("comparator.filters.apply")}
                {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </button>
            </div>
          </DrawerContent>
        </Drawer>
      )}

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
  hideHeader = false,
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
  /** docs/kayak-redesign-spec.md §4.2 — dentro del Drawer de mobile el
   *  título ya lo pone el DrawerHeader; repetirlo acá deja "Filtros" dos
   *  veces, una arriba de la otra. */
  hideHeader?: boolean;
}) {
  const criteriaCount = (deliveryMethod ? 1 : 0) + (showOnlyExclusive ? 1 : 0);
  // docs/kayak-redesign-spec.md §3.4 — el rail deja de ser el panel oscuro
  // "smart filter" (#241C16 + mango, pensado para leerse como un panel de
  // agente) y pasa a ser el rail de filtros de kayak.com: una `compare-card`
  // clara, secciones apiladas separadas por hairlines, cada una con su
  // encabezado en text-badge y sus filas de checkbox con el contador de
  // proveedores a la derecha. Es el mismo contenido y el mismo estado — sólo
  // cambia la piel y la geometría.
  //
  // El rank-by (trust/fees/rate) sigue sin vivir acá (2026-09-01: "sacalo
  // del cuadro vertical de filters"); su única casa es el dropdown "Sort"
  // al lado de las 3 tabs.
  const sectionClass = "px-4 py-3.5";
  const headingClass = "text-badge font-semibold uppercase tracking-wide text-muted-foreground";
  const rowClass =
    "flex cursor-pointer items-center gap-2.5 py-1.5 text-meta text-foreground transition-colors hover:text-brand-cta";

  return (
    <div className="compare-card divide-y divide-border">
      <div
        className={`${hideHeader ? "hidden" : "flex"} items-center justify-between ${sectionClass}`}
      >
        {/* Was h4 — see the "Your results" h2's own comment (X8 audit). */}
        <h3 className="text-metric font-bold text-foreground">{t("comparator.filters.title")}</h3>
        {/* §3.4, pie del rail — "Limpiar filtros" sólo cuando hay alguno
            activo, en vez de un "Clear · 0" permanente que no hace nada. */}
        {criteriaCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setDeliveryMethod(null);
              setShowOnlyExclusive(false);
            }}
            className="text-meta font-semibold text-accent-text hover:underline"
          >
            {t("comparator.filters.clear").replace("{n}", String(criteriaCount))}
          </button>
        )}
      </div>

      {businessFilters && (
        <div className={sectionClass}>
          <div className={headingClass}>{t("comparator.field.contractType")}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(["spot", "forward", "option"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => businessFilters.setContractType(v)}
                aria-pressed={businessFilters.contractType === v}
                className={`inline-flex h-8 items-center rounded-control border px-2.5 text-meta font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                  businessFilters.contractType === v
                    ? "border-transparent bg-foreground text-background"
                    : "border-input bg-card text-foreground hover:border-foreground/40"
                }`}
              >
                {t(`comparator.contractType.${v}`)}
              </button>
            ))}
          </div>
          <div className={`mt-3 ${headingClass}`}>{t("comparator.field.frequency")}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(["one_off", "monthly", "quarterly"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => businessFilters.setFrequency(v)}
                aria-pressed={businessFilters.frequency === v}
                className={`inline-flex h-8 items-center rounded-control border px-2.5 text-meta font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                  businessFilters.frequency === v
                    ? "border-transparent bg-foreground text-background"
                    : "border-input bg-card text-foreground hover:border-foreground/40"
                }`}
              >
                {t(`comparator.frequency.${v === "one_off" ? "oneOff" : v}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={sectionClass}>
        <div className={headingClass}>{t("comparator.filters.payoutMethod")}</div>
        <div className="mt-1.5">
          {DELIVERY_METHODS.map(({ key, labelKey }) => {
            const isActive = deliveryMethod === key;
            return (
              <label key={key} className={rowClass}>
                {/* Sigue siendo single-select sobre el mismo estado
                    `deliveryMethod` — el spec lo quiere multi-select, pero
                    eso cambia qué filas se muestran (lógica), no la piel.
                    Ver la nota de desvío del commit. */}
                <Checkbox
                  checked={isActive}
                  onCheckedChange={() => toggleDeliveryMethod(key)}
                  aria-label={t(labelKey)}
                  // rounded-sm deriva de --radius (14px) y da 10px: sobre
                  // una caja de 16px eso se lee como un círculo, o sea como
                  // un radio button — exactamente lo contrario de lo que
                  // este control es. rounded-control (4px) es el radio de
                  // control de esta superficie.
                  className="rounded-control! border-input"
                />
                <span className="min-w-0 flex-1 truncate font-semibold">{t(labelKey)}</span>
                <span className="shrink-0 text-meta tabular-nums text-muted-foreground">
                  {deliveryCounts[key]}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className={sectionClass}>
        <div className={headingClass}>{t("comparator.filters.exclusiveOffers")}</div>
        <label className={`mt-1.5 ${rowClass}`}>
          {/* §3.4 — deja de ser un chip coral y pasa a ser un checkbox más:
              el color de marca se reserva para la acción, no para un
              filtro opcional. */}
          <Checkbox
            checked={showOnlyExclusive}
            onCheckedChange={() => setShowOnlyExclusive((prev) => !prev)}
            aria-label={t("comparator.filter.exclusiveOnlyLong")}
            className="rounded-control! border-input"
          />
          <span className="min-w-0 flex-1 truncate font-semibold">
            {t("comparator.filter.exclusiveOnlyLong")}
          </span>
          <span className="shrink-0 text-meta tabular-nums text-muted-foreground">
            {exclusiveCount}
          </span>
        </label>
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
    <div className="compare-card overflow-hidden">
      <div
        className="h-[104px] bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/howitworks-person.jpg')",
          backgroundPosition: "center 28%",
        }}
        aria-hidden
      />
      <div className="px-[15px] pb-[15px] pt-[13px]">
        {/* Was h4 — see the "Your results" h2's own comment (X8 audit). */}
        <h3 className="text-[14.5px] font-extrabold text-foreground">
          {t("comparator.rateAlert.title").replace("{from}", from).replace("{to}", to)}
        </h3>
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
              // Un cambio de color de borde sólo (focus:border-brand-cta) no es un
              // indicador de foco suficiente con teclado — medido tabulando la
              // página, era el único control de esta superficie que no pintaba
              // nada visible. Se le agrega el mismo anillo que usa el resto.
              className="w-full rounded-control border border-border bg-background px-3 py-2 text-meta text-foreground placeholder:text-muted-foreground focus:border-brand-cta focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            {error && (
              <p className="text-badge text-destructive">{t("comparator.rateAlert.error")}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-control border border-foreground text-meta font-bold text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
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
  //
  // 2026-09-03 feedback — "sacarle el recuadro redondeado y dejarlo sobre
  // el fondo sin el recuadro": every round so far treated this as a CARD
  // (bordered, bg-secondary, matching RateAlertCard/BusinessContactCard
  // above it in the same rail) and kept tuning that card's own height —
  // wrong frame each time, since the actual ask was to drop the card
  // entirely. The rail's own `gap-[13px]` (see its own className) already
  // spaces this from its neighbor above, so this just centers the widget
  // directly on the rail's own page background, no box of its own.
  return (
    <div className="flex items-center justify-center [&_.trustpilot-widget]:mx-auto">
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
  emphasizeLabel = false,
}: {
  label: string;
  children: React.ReactNode;
  hideLabel?: boolean;
  /** Pinta el label en coral mientras el campo sigue vacío — el
   *  equivalente del "To?" resaltado de Kayak. Solo color: nunca un borde
   *  ni un fondo propios, que romperían la pieza única de la barra. */
  emphasizeLabel?: boolean;
}) {
  if (hideLabel) return <div className="min-w-0">{children}</div>;
  return (
    // docs/kayak-redesign-spec.md §3.2 — el label deja de ser una línea
    // aparte encima de una caja y pasa a vivir DENTRO del segmento, en 12px
    // (text-badge, el piso del sistema), directamente sobre el valor.
    // Kayak solo lo muestra cuando el campo está vacío; acá queda siempre,
    // porque "Envías"/"Recibís" es información que un comparador de FX no
    // puede dar por sobrentendida.
    //
    // `justify-center` (antes `justify-end`, con toda la historia Z1 de
    // bottom-alinear cajas dentro de una celda de grid que estiraba): ya no
    // aplica, porque el contenedor pasó a ser un segmento de altura fija de
    // 60px — el par label+valor se centra en el alto del segmento y no hay
    // columna hermana más alta con la que desalinearse.
    <label className="flex min-w-0 flex-col justify-center gap-0.5">
      <span
        className={`block truncate text-badge font-semibold ${
          emphasizeLabel ? "text-accent-text" : "text-muted-foreground"
        }`}
      >
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
  chatNearBottomRef: React.RefObject<boolean>;
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
    chatNearBottomRef,
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
            className="text-badge font-semibold leading-none [writing-mode:vertical-rl]"
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
                className="text-badge font-medium uppercase tracking-wider text-success"
                aria-label={t("comparator.agent.languageAriaLabel").replace(
                  "{lang}",
                  lang.toUpperCase(),
                )}
              >
                ● {lang.toUpperCase()}
              </span>
              {/* 2026-09-03 feedback — "el boton para minimizar el agente ai
                  puede ser mas intuitivo? porque el menos chiquitito apenas
                  se ve": this was a bare 14px minus-line stroke at 60%
                  white opacity — small, low-contrast, and "−" doesn't read
                  as "collapse this panel" the way an arrow pointing at the
                  edge it docks to does. `ChevronsRight` (the panel is
                  docked to the right edge, see this component's own
                  comment) reads as "push this back to the edge," a
                  standard sidebar-collapse affordance; wrapped in a visible
                  pill (bg-white/10, a real background instead of bare
                  text) so it reads as a button at a glance instead of
                  blending into the header row. */}
              <button
                type="button"
                onClick={() => onToggle(true)}
                aria-label={t("agent.minimize")}
                title={t("agent.minimize")}
                className="flex items-center justify-center rounded-full bg-white/10 p-1.5 text-white/90 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <ChevronsRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div
            className="flex-1 space-y-3 overflow-y-auto p-4 thin-scrollbar"
            aria-live="polite"
            onScroll={(e) => {
              const el = e.currentTarget;
              // 2026-09-02 feedback — best-practice chat auto-scroll: only
              // treat the reader as "following along" (and therefore worth
              // auto-scrolling on the next message) while they're within a
              // small threshold of the bottom. Scrolled up to reread
              // earlier history → leave their position alone.
              chatNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 64;
            }}
          >
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
                    <div className="text-badge font-semibold uppercase tracking-wider text-white/50">
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
                              className="btn-cta inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-badge font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
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
                              className="btn-cta inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-badge font-semibold focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
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
                <div className="mb-1.5 text-badge font-semibold uppercase tracking-wider text-white/50">
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
            <p className="mt-2 text-badge leading-relaxed text-[#A79C92]">
              {t("comparator.copilot.trustLine")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// A compact label/value pair, sized to its own content (no fixed column) —
// used by BusinessRequestPanel's stats row so several of these can sit in
// one wrapping flex row and a long value (e.g. a country pair) just wraps
// to its own line as a whole unit instead of overflowing a fixed-width cell.
function StatItem({
  label,
  labelExtra,
  children,
  dark,
}: {
  label: string;
  /** Rendered right after the label (e.g. BusinessRowExtra's "estimated"
   *  badge) — kept out of `children` so it stays on the label's own line
   *  even when the value below wraps to several lines. */
  labelExtra?: React.ReactNode;
  children: React.ReactNode;
  /** BusinessRequestPanel's dark theme (2026-09-04 feedback, round 2) —
   *  same white/50 + white text pairing FiltersCard uses for its own
   *  labels/values, instead of the light-card muted-foreground/foreground
   *  pair every other StatItem caller (the broker row metrics) keeps. */
  dark?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div
        className={`flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide ${dark ? "text-white/50" : "text-muted-foreground"}`}
      >
        {label}
        {labelExtra}
      </div>
      <div
        className={`mt-0.5 text-sm font-bold leading-snug tabular-nums ${dark ? "text-white" : "text-foreground"}`}
      >
        {children}
      </div>
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
  sendingCountry,
  receivingCountry,
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
  sendingCountry: string;
  receivingCountry: string;
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
  const [email, setEmail] = useState("");
  // 2026-09-03 feedback — once the parent resets `status` back to "idle"
  // a few seconds after a successful send (see sendBusinessRequest's own
  // comment), this panel's own email field needs to clear too, or it would
  // show the just-submitted address again instead of the clean pre-request
  // form the feedback asked for.
  useEffect(() => {
    if (status === "idle") setEmail("");
  }, [status]);
  const selectedCount = requestedSlugs.size;
  const sendingCountryName = COUNTRY_BY_CODE[sendingCountry]?.name ?? sendingCountry;
  const receivingCountryName = receivingCountry
    ? (COUNTRY_BY_CODE[receivingCountry]?.name ?? receivingCountry)
    : "—";

  // 2026-09-04 feedback — "cuando se manda el mail que no se cambie el
  // tamaño de la ventana de your request": the "sent" state used to be a
  // much shorter card (title + one line) than the normal form below it
  // (title+disclaimer, a wrapping stats row, the email field and button) —
  // real content, but a lot less of it, so the panel visibly shrank the
  // moment a request went out. Mirrors the normal state's own layout
  // instead (same header row, same stats row confirming what was actually
  // requested) and only swaps the email form for a same-sized confirmation
  // message in that one slot, so the panel's height doesn't move.
  if (status === "sent") {
    return (
      <div style={{ backgroundColor: "#241C16", color: "#F1EBE4" }} className="rounded-[18px] p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-[15px] font-extrabold text-white">
              {t("comparator.business.request.title")}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#A79C92]">
              {t("comparator.business.request.disclaimer")}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-white/50">
              {t("comparator.business.request.brokersSelected")}
            </div>
            <div className="mt-0.5 text-sm font-bold tabular-nums text-white">
              {selectedCount} {t("comparator.business.request.of")} {totalBrokers}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-white/15 pt-3">
          {/* 2026-09-04 feedback (round 2) — "poner currency en el renglón
              de abajo y antes de contract": grid-cols-2 instead of a free
              wrapping flex row so Volume/Route always land on row 1 and
              Currency/Contract on row 2, regardless of viewport width,
              rather than wherever the flex-wrap happened to break. */}
          <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2">
            <StatItem dark label={t("comparator.business.request.volume")}>
              {amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {from}
            </StatItem>
            <StatItem dark label={t("comparator.business.request.route")}>
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <FlagIcon country={sendingCountry} /> {sendingCountryName}
                <span>→</span>
                {receivingCountry && <FlagIcon country={receivingCountry} />} {receivingCountryName}
              </span>
            </StatItem>
            <StatItem dark label={t("comparator.business.request.currency")}>
              {from} → {to}
            </StatItem>
            <StatItem dark label={t("comparator.business.request.contract")}>
              {contractTypeLabel} · {frequencyLabel}
            </StatItem>
          </div>

          {/* 2026-09-04 feedback — "eso hace que se mueva el tamaño del
              cuadro de your request por algo mínimo": matching the form's
              *content* (same header/stats row) wasn't enough — the form
              below is two stacked h-10 controls (input + button) with a
              gap-2 between them, 88px tall (2.5rem+0.5rem+2.5rem), while
              this confirmation was a single ~40px row. On most widths the
              stats block next to it was tall enough (wrapped to 2-3 lines)
              to hide the difference, but whenever it wrapped to fewer
              lines the shared flex row's height tracked the shorter side,
              shrinking the panel by that few-px gap. `h-[88px]` pins this
              box to the exact same height as the form, independent of how
              the stats wrap. */}
          <div className="flex h-[88px] w-full items-center justify-center gap-2 rounded-lg border border-success/40 bg-success/15 px-3 text-sm font-semibold text-success sm:w-[280px]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t("comparator.business.request.sent")}
          </div>
        </div>
      </div>
    );
  }

  // 2026-09-03 feedback — third redesign of this panel: "cambiarle el
  // color y reorganizar de nuevo todos los datos... así como lo pusimos
  // en columna queda mal". Every dark treatment tried here (near-black,
  // then the softened #716B68) kept reading as its own separate, heavier
  // "mode" next to the plain bg-card results below it — and the stacked
  // single-column layout (four label/value rows one under another) read
  // as unnecessarily tall for what's four short facts. Dropping the
  // custom dark background entirely: this is now styled exactly like
  // every other card on the page (border-border, bg-card, foreground/
  // muted-foreground text) rather than a fourth attempt at a bespoke
  // dark tint — the safest way to stop it clashing is to stop giving it
  // its own look. The four facts move from a stacked column into a
  // single wrapping row of compact label/value pairs (StatItem below) —
  // no grid, no fixed-width cells, so a long country pair just wraps to
  // the next line as its own unit instead of overflowing a column
  // (the original overlap bug's actual cause).
  //
  // "Eliminar esto porque ocupa lugar... ponerlo en el subtitulo de your
  // request más conciso": the old explainer paragraph (a full sentence
  // about what selecting brokers does) AND the disclaimer paragraph below
  // the stats both took their own line; dropped the explainer and
  // promoted the disclaimer's own already-existing copy ("One email with
  // your requirements...") to be the one subtitle under the title —
  // shorter, and says the one thing that actually matters (privacy),
  // instead of two paragraphs saying it twice.
  //
  // The Send button keeps its own bottom row, right-aligned via
  // `justify-end` on a row of its own — same "anchored, never drifting"
  // fix as before (see git history), now independent of how many lines
  // the stats row above it wraps to.
  return (
    <div style={{ backgroundColor: "#241C16", color: "#F1EBE4" }} className="rounded-[18px] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Was h4 — see the "Your results" h2's own comment (X8 audit). */}
          <h3 className="font-heading text-[15px] font-extrabold text-white">
            {t("comparator.business.request.title")}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#A79C92]">
            {t("comparator.business.request.disclaimer")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-white/50">
            {t("comparator.business.request.brokersSelected")}
          </div>
          <div className="mt-0.5 text-sm font-bold tabular-nums text-white">
            {selectedCount} {t("comparator.business.request.of")} {totalBrokers}
          </div>
        </div>
      </div>

      {/* 2026-09-03 feedback (third round) — "el volume route currency
          contract y el boton de send request podrian estar un poco mas
          separados y deberian de estar en el mismo nivel, queda mucho
          espacio en blanco": these used to be two stacked rows, each with
          its own `border-t pt-3` — one gap for the stats, a second
          identical gap above the button, adding a full extra row's worth
          of height for no real content. Merged into one row (one border,
          one pt-3): stats flow on the left, the button anchors to the
          right via `justify-between` on the shared row (still never
          drifting — see the button's own comment below) — `gap-8` between
          the two sides so the button doesn't crowd the stats now that
          they share a row. `items-center` on this outer row keeps the
          button vertically centered against the stats block's height;
          the stats keep their own `items-baseline` internally. */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-white/15 pt-3">
        {/* 2026-09-04 feedback (round 2) — same grid-cols-2 reordering as
            the "sent" state above. */}
        <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2">
          <StatItem dark label={t("comparator.business.request.volume")}>
            {amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {from}
          </StatItem>
          <StatItem dark label={t("comparator.business.request.route")}>
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <FlagIcon country={sendingCountry} /> {sendingCountryName}
              <span>→</span>
              {receivingCountry && <FlagIcon country={receivingCountry} />} {receivingCountryName}
            </span>
          </StatItem>
          <StatItem dark label={t("comparator.business.request.currency")}>
            {from} → {to}
          </StatItem>
          <StatItem dark label={t("comparator.business.request.contract")}>
            {contractTypeLabel} · {frequencyLabel}
          </StatItem>
        </div>

        {/* 2026-09-03 feedback — "el campo de mail ver si conviene dejarlo
            siempre visible arriba del boton de send request": this used to
            be a plain CTA button that only revealed the email input after
            its own click (an extra step + an extra layout change every
            time). Always showing the field removes both — one less click
            to submit, and no more content jumping in as the button is
            pressed. `justify-between` on the shared row above still keeps
            this block anchored right regardless of content — the earlier
            "el botón se mueve al centro" fix (see git history) — so the
            button itself doesn't need a fixed width for that. */}
        <form
          className="flex w-full flex-col gap-2 sm:w-[280px]"
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
            className="h-10 w-full rounded-lg border border-white/20 bg-white/[.06] px-3 text-sm text-white placeholder:text-white/40 focus:border-[#FF8A6B]/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={selectedCount === 0 || status === "sending"}
            className="btn-cta flex h-10 w-full shrink-0 items-center justify-center rounded-xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "sending"
              ? t("comparator.business.request.sending")
              : t("comparator.business.request.cta").replace("{n}", String(selectedCount))}
          </button>
          {status === "error" && (
            <p className="text-right text-xs text-destructive">
              {t("comparator.business.request.error")}
            </p>
          )}
        </form>
      </div>
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
    <div className="compare-card overflow-hidden">
      <img
        src="/images/business-person.jpg"
        alt=""
        width={300}
        height={120}
        className="h-[120px] w-full object-cover object-[center_30%]"
        loading="lazy"
      />
      <div className="p-4">
        {/* Was h4 — see the "Your results" h2's own comment (X8 audit). */}
        <h3 className="text-[14.5px] font-extrabold text-foreground">
          {t("comparator.business.contactCard.title")}
        </h3>
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
  pending,
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
  /** docs/kayak-redesign-spec.md §3.6 — alimenta el spinner "buscando
   *  precios" de la barra de estado. El padre ya atenúa el bloque entero
   *  durante el fetch; esto le pone palabras a esa atenuación. */
  pending: boolean;
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

  // docs/kayak-redesign-spec.md §4.4 — barra fija al pie en mobile una vez
  // que la persona scrolleó más de 400px: a esa altura el ganador ya salió
  // de pantalla y volver arriba para tocarlo es el gesto que Kayak evita.
  // Vive acá, en ResultsBlock, y no en el padre, porque el ganador es
  // `displayRows[0]` — el resultado del orden y los filtros ACTIVOS. Sacar
  // esa cuenta al padre significaría duplicar el ranking, que es
  // exactamente lo que este rediseño no toca.
  const [showBottomBar, setShowBottomBar] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowBottomBar(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const winner = displayRows[0];

  return (
    <div className="min-w-0">
      {/* docs/kayak-redesign-spec.md §3.6 — barra de estado de 40px sobre
          los resultados, sin fondo. A la izquierda el recuento (durante el
          fetch, spinner + "buscando precios", el `Fetching prices…` de
          Kayak); a la derecha el sello de actualización, que antes vivía
          enterrado en el bloque legal al final de la lista — es EL dato de
          confianza de un comparador y en Kayak vive arriba, no abajo. */}
      <div className="flex h-10 items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-meta text-muted-foreground">
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              {t("comparator.status.fetching")}
            </>
          ) : (
            t("comparator.status.providers").replace("{n}", String(displayRows.length))
          )}
        </span>
        <span className="text-meta text-muted-foreground">
          {t("comparator.status.updated")}{" "}
          <span className="tabular-nums font-semibold text-foreground">{updatedTime}</span>
        </span>
      </div>

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

      {/* docs/kayak-redesign-spec.md §4.4 — barra fija al pie, sólo mobile
          (`sm:hidden`) y sólo con el ganador ya fuera de pantalla. A la
          izquierda el mejor monto encontrado, a la derecha el CTA de ESA
          fila — el mismo `handleAffiliateClick` que dispara la fila,
          incluido su tracking, nunca un atajo que saltee la disclosure. */}
      {winner && showBottomBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
          <div className="min-w-0">
            <div className="truncate text-meta font-semibold tabular-nums text-foreground">
              {winner.received.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
              {result.quote}
            </div>
            <div className="truncate text-badge text-muted-foreground">{winner.name}</div>
          </div>
          {winner.affiliate_url && (
            <button
              type="button"
              onClick={() => handleAffiliateClick(winner.slug, winner.affiliate_url, winner.name)}
              className="btn-cta-gradient inline-flex h-10 shrink-0 items-center justify-center rounded-control px-5 text-meta font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("fx.goto")} {winner.name} ↗
            </button>
          )}
        </div>
      )}

      {/* docs/kayak-redesign-spec.md §3.6 — el bloque legal se mantiene
          entero (es obligación, no decoración) pero colapsado en un
          <details>: el sello de actualización que lo encabezaba ya subió a
          la barra de estado, así que lo que queda acá es letra chica que no
          tiene por qué ocupar altura permanente al pie de la lista. */}
      <details className="mt-4 rounded-compact border border-border bg-card/50 px-4 py-3">
        <summary className="cursor-pointer text-meta font-semibold text-muted-foreground hover:text-foreground">
          {t("comparator.legal.summary")}
        </summary>
        <div className="mt-2 text-badge leading-relaxed text-muted-foreground">
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
          {/* design/Mangomundi 4 - Final.dc.html line 529 — the broker
              table's own disclosed methodology, not the retail footer copy
              above. */}
          {segment === "business" && <p className="mt-2">{t("comparator.business.methodology")}</p>}
        </div>
      </details>
    </div>
  );
}

// design/AJUSTES-2.md §3 — the small orange tag next to the featured row's
// name ("Best overall"/"Fastest"/…), naming which active sort criterion it
// won. Distinct from sortLabelKey's short tab/chip words (e.g. "Smart",
// "Rate") — this is a full phrase explaining the win, matching the
// mockup's dynamic tag literally ("Best overall", "Receives most",
// "Fastest").
/** docs/kayak-redesign-spec.md §3.7 — clave de localStorage del ♡ de cada
 *  fila. Guarda sólo slugs de proveedor: ni montos, ni corredores, ni nada
 *  que ate el guardado a una búsqueda concreta — es "me interesa este
 *  proveedor", no "guardá esta cotización", que caducaría en minutos. */
const SAVED_RATES_KEY = "mangomundi.savedProviders";

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
  // 2026-09-03 feedback (found during AC23's own testing, confirmed via a
  // fresh mobile screenshot) — "rating overlapping amount": this whole line
  // used to be one inline-flex span with no overflow handling, so a long
  // regulator name (real data — not every provider is just "FCA") had
  // nothing clipping it and could spill out of its column into the amount
  // block next to it. The star/score/"on Trustpilot" part never varies in
  // length and always matters, so it stays fixed (shrink-0); only the
  // regulator name — the one open-ended part — is its own min-w-0 flex item
  // with `truncate`, so it gets a real ellipsis instead of an abrupt cut or
  // an overlap when space runs out.
  const rating = row.trust_score != null && (
    <span className="flex min-w-0 items-center gap-1 text-[11.5px] text-muted-foreground">
      <Star className="h-2.5 w-2.5 shrink-0 fill-warning text-warning" />
      <span className="shrink-0 whitespace-nowrap">
        {row.trust_score.toFixed(1)} {t("comparator.row.onTrustpilot")}
      </span>
      {row.regulator && <span className="min-w-0 truncate">· {row.regulator}</span>}
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
      <span key="promo" className="inline-flex items-center gap-1 font-medium text-accent-text">
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
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-badge leading-snug">
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
  // hierarchy).
  //
  // docs/kayak-redesign-spec.md §3.7 — 36px de alto (la medida real del CTA
  // de fila de kayak.co.uk: 144x36), radio de control, text-meta. Nunca más
  // alto que 36 en la fila: era h-11 (44px), y 8 botones de 44px apilados
  // son los que hacían que la lista perdiera densidad. La destacada lleva
  // el gradiente; el resto, outline — la jerarquía la da el CTA, no un
  // borde coral alrededor de toda la tarjeta.
  const cta = row.affiliate_url ? (
    <button
      onClick={onClick}
      aria-label={`${tCta} — ${row.name}`}
      // El nombre más largo del catálogo ("Currencies Direct", "Ria Money
      // Transfer") no entra en la columna de precio de 216px, así que se
      // trunca — pero el nombre completo está a la izquierda, en el
      // titular de la propia fila, y el title lo recupera en hover. Es el
      // único recorte aceptable acá: agrandar la columna se lo come al
      // bloque de métricas, y achicar la tipografía lo prohíbe el §0.5.
      title={`${t("fx.goto")} ${row.name}`}
      className={`inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-control px-2.5 text-meta font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        featured
          ? "btn-cta-gradient"
          : "border border-input bg-card text-foreground hover:border-foreground/40"
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
    <div className="h-9 w-full shrink-0" aria-hidden />
  );

  // 2026-09-03 feedback — "agregar un boton de share this rate abajo del
  // boton de go to wise o go to torfx... en ese caso esta compartiendo el
  // link de afiliado, los que no tienen link cargado que no aparezca lo de
  // compartir": a real link only, never fabricated — same
  // `row.affiliate_url` gate the CTA above already uses, so a provider
  // with no link yet shows neither button, same as before. Native share
  // sheet first (best on mobile — the person picks WhatsApp/Messages/etc.
  // themselves), clipboard copy as the fallback everywhere else, same
  // pattern blog_.$slug.tsx's own ShareRow already uses.
  const [shareCopied, setShareCopied] = useState(false);
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: row.name, url: row.affiliate_url });
        return;
      }
    } catch {
      // User cancelled the native share sheet, or it failed — fall through
      // to a plain clipboard copy instead of leaving the click looking dead.
    }
    try {
      await navigator.clipboard.writeText(row.affiliate_url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — fail
      // silently rather than showing a broken "copied" state.
    }
  };

  // docs/kayak-redesign-spec.md §3.7 — guardar (♡) y compartir (↗) como dos
  // cuadrados de 36px arriba a la izquierda de la fila, el par de acciones
  // de la tarjeta de resultado de Kayak. Share pasa de ser un link de texto
  // debajo del CTA a este par; el gate sigue siendo `row.affiliate_url`
  // (nunca se comparte ni se guarda un link que no existe).
  //
  // El guardado persiste en localStorage, no en el servidor: es una
  // conveniencia por navegador, no una cuenta. Cada acceso va en try/catch
  // — en modo privado o con el almacenamiento bloqueado el botón
  // simplemente no persiste, en vez de romper la fila entera.
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_RATES_KEY);
      setSaved(raw ? (JSON.parse(raw) as string[]).includes(row.slug) : false);
    } catch {
      setSaved(false);
    }
  }, [row.slug]);
  const toggleSaved = () => {
    try {
      const raw = localStorage.getItem(SAVED_RATES_KEY);
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      const next = list.includes(row.slug)
        ? list.filter((s) => s !== row.slug)
        : [...list, row.slug];
      localStorage.setItem(SAVED_RATES_KEY, JSON.stringify(next));
      setSaved(next.includes(row.slug));
    } catch {
      // Storage unavailable — flip the visual state anyway so the click
      // isn't dead; it just won't survive a reload.
      setSaved((p) => !p);
    }
  };

  const rowActionClass =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-input bg-card text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

  const saveButton = row.affiliate_url ? (
    <button
      type="button"
      onClick={toggleSaved}
      aria-pressed={saved}
      aria-label={`${saved ? t("comparator.row.saved") : t("comparator.row.save")} — ${row.name}`}
      className={`${rowActionClass} ${saved ? "text-brand-cta" : ""}`}
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} aria-hidden />
    </button>
  ) : null;

  const shareButton = row.affiliate_url ? (
    <button
      type="button"
      onClick={handleShare}
      aria-label={`${t("comparator.row.share")} — ${row.name}`}
      title={shareCopied ? t("comparator.row.shareCopied") : t("comparator.row.share")}
      className={`${rowActionClass} ${shareCopied ? "text-success" : ""}`}
    >
      {shareCopied ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <Share2 className="h-4 w-4" aria-hidden />
      )}
    </button>
  ) : null;

  return (
    // docs/kayak-redesign-spec.md §3.7 — la fila deja de ser una tarjeta
    // rounded-2xl con borde coral de 2px cuando gana, y pasa a la anatomía
    // de la tarjeta de resultado de Kayak: `compare-card` (radio 8, sombra
    // de dos capas), padding 0 en el contenedor, y DOS bloques separados
    // por una línea vertical — el de identidad+métricas a la izquierda, el
    // de precio+acción a la derecha. Esa línea vertical antes del precio es
    // una de las firmas visuales de Kayak.
    //
    // La fila destacada ya NO se marca con borde coral: repetido en una
    // lista de 8 tarjetas pesa demasiado y compite con el CTA. Se marca
    // como Kayak — badge tintado + CTA con gradiente — y el resto de las
    // filas llevan CTA outline.
    <div className="compare-card group relative grid overflow-hidden p-0 hover:shadow-lg sm:grid-cols-[minmax(0,1fr)_216px]">
      {/* Bloque izquierdo — identidad y métricas. */}
      <div className="min-w-0 px-4 py-2.5">
        {/* Línea 1 — acciones a la izquierda, badges de mérito a la
            derecha. §3.7: nada de rounded-full en botones de acción. */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex shrink-0 items-center gap-1.5">
            {saveButton}
            {shareButton}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {featured && (
              <span className="rounded-control bg-merit-best px-2 py-0.5 text-badge font-semibold text-merit-best-foreground">
                {t(winnerTagKey(sortBy))}
              </span>
            )}
            {isBest && (
              <span className="rounded-control bg-merit-cheap px-2 py-0.5 text-badge font-semibold text-merit-cheap-foreground">
                {t("comparator.row.tagReceivesMost")}
              </span>
            )}
          </div>
        </div>

        {/* Línea 2 — logo + nombre, con el rating en la misma línea. */}
        <div className="mt-1.5 flex min-w-0 items-center gap-3">
          <BrandLogo
            name={row.name}
            url={row.website_url ?? row.affiliate_url}
            slug={row.slug}
            size={36}
            rounded={false}
            className="shrink-0 rounded-control border border-border bg-white"
          />
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <span className="truncate text-metric font-bold text-foreground">{row.name}</span>
            {rating}
          </div>
        </div>

        {/* Línea 3 — UNA sola línea de métricas con separadores "·", en vez
            de cuatro columnas con micro-label cada una (§3.7). Los
            micro-labels desaparecen: con los valores en línea y unidades
            explícitas ("5 GBP", "23.2115 MXN", "24h") no hacen falta, y son
            los que forzaban el text-[10.5px] que este spec elimina. */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-meta tabular-nums text-muted-foreground">
          <span>
            {t("comparator.row.labelFee")}{" "}
            <span className="font-semibold text-foreground">
              {row.fee_total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {base}
            </span>
          </span>
          <span aria-hidden>·</span>
          <span>
            {t("comparator.row.labelRate")}{" "}
            <span className="font-semibold text-foreground">
              {row.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {quote}
            </span>{" "}
            <span className={ratePctClass}>{ratePctLabel}</span>
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden /> {deliveryLabel}
          </span>
          <span aria-hidden>·</span>
          <span className="min-w-0">{payoutText}</span>
        </div>
      </div>

      {/* Bloque derecho — precio y acción, detrás de la divisoria vertical.
          §3.7: la moneda baja de línea (antes iba inline en 12px) y el
          delta va debajo, siempre en text-badge. */}
      {/* docs/kayak-redesign-spec.md §4.3 — en mobile este bloque deja de
          ser una columna angosta alineada a la derecha (que a 390px
          desperdiciaba media pantalla) y se abre en una fila: el monto
          grande a la izquierda, el delta a la derecha, y el CTA a ancho
          completo debajo. A partir de sm vuelve a ser la columna de precio
          de §3.7, detrás de la divisoria vertical. */}
      <div className="flex flex-col gap-1.5 border-t border-border px-4 py-2.5 sm:justify-center sm:gap-0.5 sm:border-l sm:border-t-0 sm:text-right">
        <div className="flex items-end justify-between gap-3 sm:block">
          <div className="flex items-baseline gap-1.5 sm:block">
            <div className="whitespace-nowrap text-price font-bold tabular-nums text-foreground">
              {row.received.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-meta font-semibold text-muted-foreground">{quote}</div>
          </div>
          <div
            className={`text-badge font-semibold tabular-nums sm:mt-0.5 ${
              isBest ? "text-success" : "text-muted-foreground"
            }`}
          >
            {isBest ? t("comparator.row.deltaWinner") : deltaLabel}
          </div>
        </div>
        {/* §4.3 — CTA a ancho completo y 44px de alto en mobile (blanco de
            toque real con el pulgar); vuelve a los 36px de Kayak en la
            columna de precio a partir de sm. */}
        <div className="[&>button]:h-11 sm:[&>button]:h-9">{cta}</div>
      </div>

      {/* Pie — la línea de confianza y la disclosure de afiliado dejan de
          estar sueltas y pasan a una banda propia al pie de la tarjeta,
          a ancho completo de las dos columnas (§3.7). */}
      {trustLine && (
        <div className="border-t border-border bg-muted/30 px-4 py-1 sm:col-span-2">
          {trustLine}
        </div>
      )}

      {businessExtra && (
        <div className="border-t border-border px-4 py-3 sm:col-span-2">
          <BusinessRowExtra
            row={row}
            quote={quote}
            amount={businessExtra.amount}
            savedVsRetail={businessExtra.savedVsRetail}
            requested={businessExtra.requested}
            onToggleRequested={businessExtra.onToggleRequested}
          />
        </div>
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
  const metrics: Array<{ labelKey: string; value: string; estimated?: boolean }> = [
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
      estimated: row.min_amount != null && row.min_amount_estimated,
    },
    {
      labelKey: "comparator.business.metric.settlement",
      value: row.settlement_terms ?? "—",
      estimated: row.settlement_terms != null && row.settlement_terms_estimated,
    },
    {
      labelKey: "comparator.business.metric.contracts",
      value: row.contract_type ?? "—",
      estimated: row.contract_type != null && row.contract_type_estimated,
    },
  ];

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-dashed border-input bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      {/* 2026-09-03 feedback (second round) — "lo mismo ocurre en los datos
          en cada proveedor... la posición en columna quedó bastante mal":
          same fix as BusinessRequestPanel's own stats — reuses the same
          StatItem component instead of a bespoke stacked column.
          2026-09-02 feedback (AG4, round 4) — "poner spread y abajo
          minimum en una misma columna, y en otra columna al lado
          settlement y abajo contracts": the single flex-wrap row above
          let the 4 chips reflow arbitrarily (2+2, 3+1, all 4 on one
          line depending on value lengths) — no longer a fixed spread/
          minimum vs. settlement/contracts pairing. Two explicit columns
          (metrics[0]/[1] stacked in the first, [2]/[3] in the second) fix
          that pairing regardless of value length.
          2026-09-02 feedback (AH1) — "ponelo mas a la izquierda al lado
          de la otra columna... aprovechamos el espacio vacío": a
          grid-cols-2 split this whole block 50/50, so column 2 always
          started at the container's midpoint regardless of how narrow
          column 1's own content (a percentage, an amount) actually was —
          wasted gap between the columns, and settlement/contracts' long
          sentences capped at that same 50% width even though there was
          more room to their right before the Add to request block.
          Flex instead: column 1 is `shrink-0` (sized to its own short
          content), column 2 is `flex-1` (starts right after column 1's
          natural width, then uses everything remaining), separated by a
          fixed, deliberately generous gap rather than a proportional one. */}
      <div className="flex min-w-0 flex-1 items-start gap-x-8 gap-y-2">
        {[metrics.slice(0, 2), metrics.slice(2, 4)].map((column, i) => (
          <div key={i} className={`flex min-w-0 flex-col gap-2 ${i === 0 ? "shrink-0" : "flex-1"}`}>
            {column.map((m) => (
              <StatItem
                key={m.labelKey}
                label={t(m.labelKey)}
                labelExtra={
                  // 2026-09-02 feedback — real value where findable,
                  // otherwise a logical estimate (never blank, never
                  // presented as verified) — see this component's own
                  // metrics comment.
                  m.estimated ? (
                    <span
                      title={t("comparator.business.metric.estimatedTooltip")}
                      className="cursor-help rounded-sm bg-accent/15 px-1 py-px text-badge font-bold normal-case tracking-normal text-accent-text"
                    >
                      {t("comparator.business.metric.estimated")}
                    </span>
                  ) : undefined
                }
              >
                {m.value}
              </StatItem>
            ))}
          </div>
        ))}
      </div>
      {/* 2026-09-03 feedback — "dejar el botón de add request del lado
          derecho a la misma altura": sits beside the stats row (the outer
          wrapper's `sm:items-center` centers it against that row's full
          height, "misma altura" no matter how many lines Settlement/
          Contracts wrap to).
          2026-09-03 feedback (second round) — "los botones de add to
          request en verde quedan fuera de la paleta, deberían estar en
          negro": Verde read as an odd, unexpected color for this action —
          switched to solid Tinta (--primary, this palette's black),
          the same color blog_.$slug.tsx's own "Go to compare" CTA already
          uses, rather than introducing another new hue. "Added" flips to
          an outlined light-fill treatment (never back to white/card) with
          a check icon, so the confirmed state still reads as its own
          thing rather than just a darker button. */}
      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
        {savedVsRetail != null && savedVsRetail > 0 && (
          <div className="sm:text-right">
            <div className="text-badge font-bold uppercase tracking-wide text-muted-foreground">
              {t("comparator.business.estOn").replace(
                "{amount}",
                amount.toLocaleString(undefined, { maximumFractionDigits: 0 }),
              )}
            </div>
            <div className="font-heading text-lg font-extrabold leading-none tabular-nums text-foreground">
              {savedVsRetail.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
              <span className="text-badge font-bold text-muted-foreground">
                {quote} {t("comparator.business.saved")}
              </span>
            </div>
          </div>
        )}
        {/* 2026-09-02 feedback — "cuando hago click en un proveedor para
            ponerlo en add to request se mueve todo el texto porque el
            botón cambia de tamaño": "Add to request" (14 chars) vs.
            "Added" (5 chars) — fixed width sized to fit the longer label
            (plus the check icon's own state) so toggling never changes
            the button's footprint. */}
        <button
          type="button"
          onClick={onToggleRequested}
          aria-pressed={requested}
          className={`flex h-9 w-[140px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-xs font-bold transition-colors ${
            requested
              ? "border-[1.5px] border-primary/40 bg-primary/5 text-primary"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {requested && <Check className="h-3.5 w-3.5" />}
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
  // 2026-09-04 feedback — "la frase rates just now ponela en your results":
  // moved from EmbedComparator's own header bar into this header row
  // instead (see that component's comment) — it's about the freshness of
  // THESE results, so it reads better attached to them.
  const freshness = useRatesFreshness(result.fetched_at);
  // 2026-09-04 feedback — "agregar los 3 botones de ordenar por recommend,
  // receive more y fastest igual que lo hace el comparador": the widget
  // used to have no sort control at all, always showing "overall". Same
  // SortKey/sortByScore the full comparator's own 3 tabs use (see their
  // own comment a few hundred lines up) — just a compact pill row sized
  // for this 360px frame instead of the full table's 78px-tall cards.
  const [sortBy, setSortBy] = useState<SortKey>("overall");
  // Sponsored-first only applies to the default "overall" ranking, same
  // rule the full comparator's own sortedFiltered uses (see its own
  // `if (sortBy !== "overall") return sorted` a few hundred lines up) —
  // "receive more"/"fastest" are honest metric sorts, not a place to also
  // sneak sponsored rows to the top.
  const ranked = useMemo(() => {
    const sorted = sortByScore(result.rows, sortBy);
    if (sortBy !== "overall") return sorted;
    const sponsored = sorted.filter((r) => r.has_exclusive_deal);
    const rest = sorted.filter((r) => !r.has_exclusive_deal);
    return [...sponsored, ...rest];
  }, [result.rows, sortBy]);
  const winner = ranked[0];
  // 2026-09-04 feedback — "mostrar mas opciones para que ocupe todo el
  // largo del widget": was capped at 2 extra rows to guarantee no internal
  // scroll; EmbedComparator's content area now scrolls its own middle
  // section when it has to (see that component's comment), so this can
  // show as many as genuinely exist instead of hiding real results.
  const rest = ranked.slice(1);
  const sortTabs = [
    { key: "overall" as SortKey, label: t("comparator.tab.recommended") },
    { key: "recipient_gets_most" as SortKey, label: t("comparator.tab.receiveMore") },
    { key: "fastest" as SortKey, label: t("comparator.tab.fastest") },
  ];
  const activeTabLabel = sortTabs.find((tab) => tab.key === sortBy)?.label ?? sortTabs[0].label;
  // 2026-09-04 feedback (round 3) — "que se pueda mostrar mas datos no solo
  // la cotizacion, el rate, el tiempo, el trust, al menos cuando se hace
  // click que se despliegue": the non-winner rows only ever showed name +
  // amount + delta — real data (rate, speed, trust_score) already exists
  // on each row (the winner card above already reads it) but had nowhere
  // to go in this compact one-line-per-row list. Click-to-expand instead
  // of showing it inline on every row unconditionally, since most of these
  // rows are just for comparison-at-a-glance, not a decision in progress.
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  // 2026-09-02 feedback — "en el widget también poner el ícono de share en
  // las tarifas que son con link de afiliado": same native-share-sheet
  // then clipboard-copy pattern ProviderRow's own handleShare already uses
  // for the full comparator, sharing the real affiliate_url (never a
  // fabricated mangomundi page) — same "los que no tienen link cargado que
  // no aparezca lo de compartir" gate too. A single `sharedSlug` (not a
  // boolean) since more than one row's share button can exist at once.
  const [sharedSlug, setSharedSlug] = useState<string | null>(null);
  const handleShare = async (row: ComparisonResult["rows"][number]) => {
    if (!row.affiliate_url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: row.name, url: row.affiliate_url });
        return;
      }
    } catch {
      // User cancelled the native share sheet, or it failed — fall through
      // to a plain clipboard copy instead of leaving the click looking dead.
    }
    try {
      await navigator.clipboard.writeText(row.affiliate_url);
      setSharedSlug(row.slug);
      setTimeout(() => setSharedSlug((s) => (s === row.slug ? null : s)), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — fail
      // silently rather than showing a broken "copied" state.
    }
  };

  if (!winner) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground">{t("comparator.empty")}</div>
    );
  }

  return (
    <div className="min-w-0">
      {/* 2026-09-04 feedback — "sacar la frase delivers the most poner your
          results... también sacar la frase de of 24 compared": that pair
          (design/Mangomundi 4 - Final.dc.html line 743-744) is replaced by
          a plain "Your results" label plus the freshness stamp moved down
          from the header bar above (see its own comment) — "of N compared"
          didn't earn its place next to a list that only ever shows 3 of
          them anyway. Padded to match the winner/invitation cards' own
          p-2.5 inset below, since this row (plain text, no card of its
          own) would otherwise sit flush against the frame edge. */}
      <div className="flex items-baseline justify-between px-2.5">
        <span className="text-badge font-semibold uppercase tracking-wide text-muted-foreground">
          {t("comparator.widget.yourResults")}
        </span>
        {freshness && <span className="text-badge text-muted-foreground">{freshness}</span>}
      </div>

      {/* Compact sort pills — same 3 keys/labels as the full comparator's
          own tabs (comparator.tab.*), one line of small buttons instead of
          78px-tall cards. */}
      <div className="mt-1.5 grid grid-cols-3 gap-1.5 px-2.5">
        {sortTabs.map((tab) => {
          const isActive = sortBy === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSortBy(tab.key)}
              aria-pressed={isActive}
              className={`h-8 rounded-control px-1.5 text-badge font-semibold transition-colors ${
                isActive
                  ? "border-b-2 border-brand-cta bg-muted text-foreground"
                  : "border-b-2 border-transparent bg-muted/40 text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Winner — the only row with a CTA and full details. Tag (2026-09-04
          feedback — "el que mostramos es el recommended") now reflects
          whichever sort pill is active instead of always saying
          "Recommended" — once "Receive more"/"Fastest" became real sorts
          (not just "overall"), a fixed "Recommended" label on the top
          "Fastest"-sorted row would misdescribe why it's there. */}
      <div className="compare-card mt-1.5 p-2.5">
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
            <div className="min-w-0">
              <span className="inline-block rounded-control bg-merit-best px-1.5 py-0.5 text-badge font-semibold text-merit-best-foreground">
                {activeTabLabel}
              </span>
              <div className="truncate text-badge tabular-nums text-muted-foreground">
                {winner.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} ·{" "}
                {formatDeliverySpeed(winner.speed_hours)}
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-price font-bold tabular-nums text-foreground">
              {winner.received.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="text-badge font-semibold text-muted-foreground">{result.quote}</div>
          </div>
        </div>
        {winner.affiliate_url && (
          <div className="mt-2 flex items-center gap-1.5">
            <button
              onClick={() => handleAffiliateClick(winner.slug, winner.affiliate_url, winner.name)}
              aria-label={`${tCta} — ${winner.name}`}
              className="btn-cta-gradient flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-control text-meta font-semibold"
            >
              {winner.name} <ArrowRight className="h-3.5 w-3.5" />
            </button>
            {/* 2026-09-02 feedback — "en el widget también poner el ícono
                de share en las tarifas que son con link de afiliado":
                shares the real affiliate_url (see handleShare's own
                comment on why), same icon-only compact treatment as the
                expanded rest-rows below. */}
            <button
              type="button"
              onClick={() => handleShare(winner)}
              aria-label={`${sharedSlug === winner.slug ? t("comparator.row.shareCopied") : t("comparator.row.share")} — ${winner.name}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-input text-muted-foreground transition hover:text-foreground"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Rest — one compact line each: logo, name, amount, delta. Padded
          for the same reason as the header row above — plain text with no
          card of its own would otherwise touch the frame edge. */}
      {rest.length > 0 && (
        <div className="mt-1 flex flex-col divide-y divide-border px-2.5">
          {rest.map((row) => {
            const delta = row.received - winner.received;
            const isExpanded = expandedSlug === row.slug;
            return (
              <div key={row.slug}>
                <button
                  type="button"
                  onClick={() => setExpandedSlug(isExpanded ? null : row.slug)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center justify-between gap-2 py-1.5 text-left"
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
                    <span className="truncate text-meta font-semibold text-foreground">
                      {row.name}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 tabular-nums">
                    <span className="text-meta font-semibold text-foreground">
                      {row.received.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="w-12 text-right text-badge font-semibold text-muted-foreground">
                      {delta.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </div>
                </button>
                {isExpanded && (
                  <div className="flex items-center justify-between gap-2 pb-2 pl-7">
                    <div className="flex min-w-0 items-center gap-2 text-badge text-muted-foreground">
                      <span className="shrink-0 tabular-nums">
                        {row.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </span>
                      <span className="shrink-0">·</span>
                      <span className="shrink-0">{formatDeliverySpeed(row.speed_hours)}</span>
                      {row.trust_score != null && (
                        <>
                          <span className="shrink-0">·</span>
                          <span className="inline-flex shrink-0 items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 shrink-0 fill-warning text-warning" />
                            {row.trust_score.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                    {/* Row's own name, not the full tCta sentence
                        ("Apply mangomundi Preferred Channel Rate") — that
                        copy is sized for the winner card's full-width
                        button above, way too long for this inline pill.
                        Same short-label convention the winner CTA already
                        uses ({winner.name} <ArrowRight/>). */}
                    {row.affiliate_url && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() =>
                            handleAffiliateClick(row.slug, row.affiliate_url, row.name)
                          }
                          aria-label={`${tCta} — ${row.name}`}
                          className="btn-cta flex h-6 min-w-0 items-center justify-center gap-1 rounded-md px-2 text-[10.5px] font-semibold"
                        >
                          <span className="truncate">{row.name}</span>
                          <ArrowRight className="h-3 w-3 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShare(row)}
                          aria-label={`${sharedSlug === row.slug ? t("comparator.row.shareCopied") : t("comparator.row.share")} — ${row.name}`}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:text-foreground"
                        >
                          <Share2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2026-09-04 feedback — "el boton de see more on mangomundi tiene
          que quedar abajo en el widget, y también ponerlo antes de
          comparar abajo": the "see more" CTA that used to live here (end
          of this list) only ever showed up post-search. Moved out to
          EmbedComparator itself instead, as one persistent bar pinned at
          the bottom of the whole frame in both the pre-search examples
          state and this post-search results state — see that component's
          own comment. */}
    </div>
  );
}
