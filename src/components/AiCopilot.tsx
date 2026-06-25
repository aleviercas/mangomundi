import { Info, MapPin, Calculator, Megaphone, type LucideIcon } from "lucide-react";
import type { MasterRateMap, MissingCorridorEntry } from "@/services/providers/MasterRateStore";

/**
 * WizardAgent quick-actions — the agent prioritizes guided, low-token
 * interactions over open-ended chat. The user can still type, but the
 * suggestion grid is the primary surface.
 *
 * STRICT NEUTRALITY: action labels are factual ("Check transfer limits",
 * "Report a missing route") — no marketing, no "best rate" claims.
 */
export interface WizardAction {
  id: "how" | "limits" | "report" | "fees" | "speed";
  label: string;
  prompt: string;
  icon: LucideIcon;
}

export const DEFAULT_WIZARD_ACTIONS: WizardAction[] = [
  {
    id: "how",
    label: "How to compare",
    prompt:
      "Explain in 3 short sentences how to read the comparator table (rate, fees, delivery time) so I can pick a route myself.",
    icon: Info,
  },
  {
    id: "limits",
    label: "Check transfer limits",
    prompt:
      "Using only the data in the table, list any transfer-amount limits or tier thresholds that apply to the providers shown.",
    icon: Calculator,
  },
  {
    id: "fees",
    label: "Break down the fees",
    prompt:
      "Summarize the fee structure (fixed + percentage + spread) for the top providers using the figures in the table. No opinions.",
    icon: Calculator,
  },
  {
    id: "report",
    label: "Report a missing route",
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
  return (
    <div className={`grid grid-cols-1 gap-1.5 sm:grid-cols-2 ${className}`} role="group" aria-label="AI Wizard quick actions">
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
            <span className="truncate">{a.label}</span>
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
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-50 p-4 text-sm">
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-amber-900">
          We don't currently price {from} → {to}.
        </div>
        <p className="mt-0.5 text-xs text-amber-900/80">
          This corridor isn't covered by any connected provider yet. You can request it and
          we'll prioritize coverage when it has enough demand.
        </p>
        <button
          type="button"
          onClick={onRequest}
          disabled={acknowledged}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:cursor-default disabled:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {acknowledged ? "✓ Route requested" : "Request to add this route"}
        </button>
      </div>
    </div>
  );
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
