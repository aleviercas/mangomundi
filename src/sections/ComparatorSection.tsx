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
