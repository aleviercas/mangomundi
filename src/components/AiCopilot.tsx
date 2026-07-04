import { Info, MapPin, Calculator, Megaphone, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { MasterRateMap, MissingCorridorEntry } from "@/services/providers/MasterRateStore";

/**
 * WizardAgent quick-actions — the agent prioritizes guided, low-token
 * interactions over open-ended chat. The user can still type, but the
 * suggestion grid is the primary surface.
 *
 * STRICT NEUTRALITY: action labels are factual ("Check transfer limits",
 * "Report a missing route") — no marketing, no "best rate" claims.
 *
 * `label` holds an i18n KEY (module-level constant, no hook context here);
 * render/consumption sites translate it with t().
 */
export interface WizardAction {
  id: "how" | "limits" | "report" | "fees" | "speed";
  /** i18n key for the visible label — translate with t(label). */
  label: string;
  prompt: string;
  icon: LucideIcon;
}

export const DEFAULT_WIZARD_ACTIONS: WizardAction[] = [
  {
    id: "how",
    label: "wizard.action.how",
    prompt:
      "Explain in 3 short sentences how to read the comparator table (rate, fees, delivery time) so I can pick a route myself.",
    icon: Info,
  },
  {
    id: "limits",
    label: "wizard.action.limits",
    prompt:
      "Using only the data in the table, list any transfer-amount limits or tier thresholds that apply to the providers shown.",
    icon: Calculator,
  },
  {
    id: "fees",
    label: "wizard.action.fees",
    prompt:
      "Summarize the fee structure (fixed + percentage + spread) for the top providers using the figures in the table. No opinions.",
    icon: Calculator,
  },
  {
    id: "report",
    label: "wizard.action.report",
    prompt: "__report_missing__",
    icon: Megaphone,
  },
];

interface AiCopilotProps {
  actions?: WizardAction[];
  onAction: (action: WizardAction) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * AiCopilot — Wizard-style action grid. Acts as the entry surface for the
 * floating AI Agent so users get guided suggestions (low token burn) before
 * free-form chat.
 */
export function AiCopilot({
  actions = DEFAULT_WIZARD_ACTIONS,
  onAction,
  disabled = false,
  className = "",
}: AiCopilotProps) {
  const { t } = useI18n();
  return (
    <div
      className={`grid grid-cols-1 gap-1.5 sm:grid-cols-2 ${className}`}
      role="group"
      aria-label={t("wizard.quickActionsAria")}
    >
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onAction(a)}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-left text-xs font-medium text-foreground transition hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{t(a.label)}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Inline "Request to add this route" CTA — shown when a corridor is not
 * priced by any provider. Triggers the server-side MissingCorridorsLog.
 */
export function MissingCorridorCta({
  from,
  to,
  acknowledged,
  onRequest,
}: {
  from: string;
  to: string;
  acknowledged: boolean;
  onRequest: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-50 p-4 text-sm">
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-amber-900">
          {t("corridor.missing.title").replace("{from}", from).replace("{to}", to)}
        </div>
        <p className="mt-0.5 text-xs text-amber-900/80">{t("corridor.missing.body")}</p>
        <button
          type="button"
          onClick={onRequest}
          disabled={acknowledged}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:cursor-default disabled:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {acknowledged ? t("corridor.missing.requested") : t("corridor.missing.request")}
        </button>
      </div>
    </div>
  );
}

/**
 * Local (zero-AI) Wizard replies — "how", "limits" and "fees" used to send a
 * prompt to the AI even though the answer only needs data already on the
 * client. Answering locally restores the original "80% resolved with zero
 * tokens" design and removes load from the shared free-tier AI quota.
 * Only free-form typed questions still reach the AI.
 *
 * Copy lives in the i18n dictionaries (wizard.* keys) so all 20 languages are
 * covered by the translation pipeline — the functions take `t` from useI18n.
 */
export type WizardLocale = "en" | "es" | "pt";

export function resolveWizardLocale(lang: string): WizardLocale {
  return lang === "es" || lang === "pt" ? lang : "en";
}

type T = (key: string) => string;

interface WizardRow {
  name: string;
  fee_total: number;
  fee_percent_applied?: number;
  fee_fixed_applied?: number;
  spread_applied?: number;
}

interface WizardResultLike {
  base: string;
  rows: WizardRow[];
}

export function localHowToCompare(t: T): string {
  return t("wizard.howToCompare");
}

export function localTransferLimits(_result: WizardResultLike, t: T): string {
  // Anti-hallucination: the comparator dataset has no per-provider min/max
  // transfer-limit field today, so we say so plainly instead of letting an
  // LLM improvise around a gap in the data.
  return t("wizard.limits");
}

export function localFeeBreakdown(result: WizardResultLike, t: T): string {
  const top = result.rows.slice(0, 3);
  const lines = top.map((r, i) => {
    const parts: string[] = [];
    if (r.fee_fixed_applied)
      parts.push(`${r.fee_fixed_applied.toFixed(2)} ${result.base} ${t("wizard.fees.fixed")}`);
    if (r.fee_percent_applied)
      parts.push(`${r.fee_percent_applied.toFixed(2)}% ${t("wizard.fees.fee")}`);
    if (r.spread_applied) parts.push(`${r.spread_applied.toFixed(2)}% ${t("wizard.fees.spread")}`);
    const desc = parts.length ? parts.join(" + ") : t("wizard.fees.noCharges");
    return `${i + 1}. **${r.name}** — ${desc} → ${t("wizard.fees.total")} ${r.fee_total.toFixed(2)} ${result.base}`;
  });
  return [t("wizard.fees.header"), "", ...lines].join("\n");
}

/**
 * Build the AI system-prompt context block from the MasterRateMap and
 * MissingCorridorsLog. Kept small to minimize token burn.
 */
export function buildWizardContext(
  master: MasterRateMap | null,
  missing: MissingCorridorEntry[],
): string {
  if (!master) return "";
  const knownCount = Object.keys(master.rates).length;
  const topMissing = missing
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((m) => `${m.from}→${m.to}(${m.count})`)
    .join(", ");
  return [
    `MasterRateMap base=${master.base}, knownCurrencies=${knownCount}.`,
    topMissing ? `MissingCorridorsLog top: ${topMissing}.` : "MissingCorridorsLog: empty.",
  ].join(" ");
}
