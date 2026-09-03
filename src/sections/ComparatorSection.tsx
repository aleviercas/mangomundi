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
        className={`grid min-w-0 grid-cols-1 rounded-compact bg-card shadow-compare transition focus-within:ring-2 focus-within:ring-brand-cta/40 @2xl:flex @2xl:h-15 @2xl:items-stretch @2xl:overflow-hidden ${
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

        {/* Segmento swap. Sigue siendo solo el glifo, SIN chip propio — en
                      kayak.com el ícono de intercambio vive suelto en el
                      gap entre los dos campos de lugar, no dentro de una
                      caja ni de un hairline propio. El círculo de
                      hover/focus se mantiene como affordance. */}
        <div className="flex items-center justify-center py-0.5 @2xl:w-9 @2xl:py-0">
          <button
            type="button"
            onClick={handleSwap}
            aria-label={t("comparator.swap")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors hover:border-input hover:bg-muted hover:text-brand-cta focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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

        {/* CTA — a sangre en el extremo derecho de la barra en desktop
                      (`@2xl:rounded-none @2xl:rounded-r-compact`, sin
                      hairline propio: el contraste de color ya lo separa,
                      igual que el botón "Search" naranja de kayak.com), y
                      como última fila a ancho completo en mobile
                      (`rounded-b-compact`), igual que el CTA del widget
                      (`EmbedComparator`/`embedded` branch de este mismo
                      archivo, que ya usa este patrón). */}
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
          className="btn-cta-gradient flex h-11 w-full items-center justify-center gap-2 rounded-b-compact px-4 text-meta font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring @2xl:h-full @2xl:w-[130px] @2xl:rounded-none @2xl:rounded-r-compact"
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

                  {/* Compare — full-width row at the bottom of the same
                      card, like Kayak's Search button. */}
                  {/* docs/kayak-redesign-spec.md §5.4 — el CTA es la última
                      FILA de la tarjeta, a sangre y con las esquinas
                      inferiores redondeadas, no un botón flotando dentro de
                      un padding. */}
                  <div className="border-t border-border">
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
                      className="btn-cta-gradient flex h-11 w-full items-center justify-center rounded-b-compact text-meta font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
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
                    <div className="flex/DropdownMenu>
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
                          purely by the chosen sort — never a re-ranking. Mismo tratamiento de chip
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
                    BusinessContactCard went back to the rail instead de
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
              </div>
            </div>
          ))}
      </div>
    </SectionTag>
  );
}