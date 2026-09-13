import { useState } from "react";
import { MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_WIZARD_ACTIONS, type WizardAction } from "@/lib/wizard.functions";

interface AiCopilotProps {
  actions?: WizardAction[];
  onAction: (action: WizardAction) => void;
  disabled?: boolean;
  className?: string;
}

// design/Mangomundi 4 - Final.dc.html (line 335-338) — the docked agent
// card shows 4 quick-action rows, not the full list. 2026-08-30 feedback:
// "que aparezcan solo algunas opciones al principio y diga mas opciones
// porque si aparece todo con el scroll queda mal y que quede espacio para
// escribir" — all 9 DEFAULT_WIZARD_ACTIONS rendering unconditionally ate
// the panel's scroll space and pushed the chat input further from view.
// Capped here, not by trimming DEFAULT_WIZARD_ACTIONS itself (every
// caller — welcome screen and "more questions" after a turn — still has
// all 9 available on request).
const COLLAPSED_ACTION_COUNT = 4;

/**
 * AiCopilot — Wizard-style action grid. Acts as the entry surface for the
 * floating AI Agent so users get guided suggestions (low token burn) before
 * free-form chat.
 */
/**
 * Suggested-question chips (design/AJUSTES-1.md §D) — one per line, full
 * width, arrow on the right.
 * 2026-09-07 feedback — "el panel de agente cambiaste el fondo pero ahora
 * la letra no se ve porque quedo clarita o del mismo color": este
 * componente sólo se usa DENTRO del panel del AI (FloatingAgent,
 * ComparatorSection.tsx), que era oscuro (`#241C16`) — estos botones
 * llevaban su paleta literal hardcodeada para ESE fondo (`text-[#F1EBE4]`,
 * un hueso casi blanco, sobre `bg-white/[.07]`). El panel pasó a claro en
 * la ronda anterior pero este archivo, aparte, nunca se tocó — texto casi
 * blanco sobre el `bg-card` (blanco) del panel nuevo, prácticamente
 * invisible. Pasa a los mismos tokens claros que el resto del sitio usa
 * para chips/filas interactivas (`border-border`/`bg-muted`/
 * `text-foreground`), coherente con el resto de la tarjeta.
 */
export function AiCopilot({
  actions = DEFAULT_WIZARD_ACTIONS,
  onAction,
  disabled = false,
  className = "",
}: AiCopilotProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const hasMore = actions.length > COLLAPSED_ACTION_COUNT;
  const shown = expanded ? actions : actions.slice(0, COLLAPSED_ACTION_COUNT);
  return (
    <div
      className={`flex flex-col gap-1.5 ${className}`}
      role="group"
      aria-label={t("wizard.quickActionsAria")}
    >
      {shown.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onAction(a)}
          disabled={disabled}
          className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-border bg-muted px-[11px] py-[9px] text-left text-[12px] font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <span className="truncate">{t(a.label)}</span>
          <span className="shrink-0 text-brand-cta" aria-hidden>
            →
          </span>
        </button>
      ))}
      {hasMore && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full rounded-[10px] px-[11px] py-[7px] text-center text-[11.5px] font-semibold text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {t("wizard.moreOptions")}
        </button>
      )}
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
    <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-warning">
          {t("corridor.missing.title").replace("{from}", from).replace("{to}", to)}
        </div>
        <p className="mt-0.5 text-xs text-warning/80">{t("corridor.missing.body")}</p>
        <button
          type="button"
          onClick={onRequest}
          disabled={acknowledged}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-warning px-3 py-1.5 text-xs font-semibold text-warning-foreground transition hover:brightness-95 disabled:cursor-default disabled:bg-success focus:outline-none focus:ring-2 focus:ring-warning"
        >
          {acknowledged ? t("corridor.missing.requested") : t("corridor.missing.request")}
        </button>
      </div>
    </div>
  );
}
