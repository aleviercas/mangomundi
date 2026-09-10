import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useIsMobile } from "@/hooks/use-mobile";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Optional leading element (flag, currency symbol, icon). */
  leading?: React.ReactNode;
  /** Secondary muted text shown after the label. */
  secondary?: string;
  /** Extra search tokens (e.g. currency code, native name). */
  keywords?: string[];
}

/** 2026-09-09 feedback — "hacer que el comportamiento... sea lo mas similar
 *  posible al comportamiento del sitio kayak.com": imperative handle so a
 *  sibling field can open/focus THIS combobox from the outside (see
 *  `advanceTo` below) — mirrors kayak's own From→To flow, where picking an
 *  origin auto-opens the destination field instead of leaving the user to
 *  click it by hand. */
export interface ComboboxHandle {
  /** Opens the field, but only if this exact trigger is actually visible
   *  (`offsetParent !== null`). Guards against the recurring pattern in
   *  this codebase where the SAME logical field is mounted more than once
   *  at the same time — desktop bar + mobile stacked layout inside
   *  `searchBarFields` both render always, one is just `hidden` via a
   *  `@2xl` container query, not conditionally unmounted. Without this
   *  guard, auto-advancing from the visible instance could pop open its
   *  hidden twin's portal content off-screen instead. */
  open: () => void;
  /** Focuses the trigger button without opening it — used when there's
   *  nowhere meaningful left to advance to but focus should still move
   *  forward, not get lost. Same visibility guard as `open`. */
  focus: () => void;
}

export interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  ariaLabel?: string;
  /** 2026-08-30 feedback (second round) — the embeddable widget's own
   *  amount+country row is a fixed ~360px container, nowhere near enough
   *  for the trigger's normal "United Kingdom  GBP" (full country name +
   *  code); shows just `secondary` (the currency code) instead, matching
   *  the mockup's compact widget row. Off by default — every other caller
   *  keeps the full country name. */
  compactLabel?: boolean;
  /** 2026-08-30 feedback (sixth round) — "en el país se podría sacar la
   *  moneda porque la moneda se selecciona aparte": once a currency has its
   *  own dedicated field next to a plain country picker, showing the
   *  country's local currency code here too is redundant. Drops `secondary`
   *  everywhere (trigger and dropdown list) rather than just the trigger.
   *  Off by default — CountryCombobox callers that don't have a separate
   *  currency field still want the readout. */
  hideSecondary?: boolean;
  /** 2026-09-01 feedback — "en el widget el país debe mostrar solo la
   *  banderita cuando ya está seleccionado, pero al abrir el selector que
   *  diga el nombre del país; lo mismo con la moneda, solo el símbolo
   *  cerrado, nombre completo abierto": neither `compactLabel` nor
   *  `hideSecondary` alone (or combined) produces a true icon-only closed
   *  trigger — `compactLabel` swaps the name for `secondary`, and
   *  `compactLabel`+`hideSecondary` together paradoxically leaves nothing
   *  to hide so the name comes back. This is the actual icon-only mode:
   *  only `leading` (flag/symbol) shows in the closed trigger, full
   *  `label`/`secondary` still show in the open dropdown list below
   *  (unaffected — that part already worked, only the trigger was wrong).
   *  Falls back to the placeholder text when nothing is selected yet,
   *  since there's no icon to show in that case. */
  triggerIconOnly?: boolean;
  /** 2026-09-04 feedback (ronda 6) — "sacarle la flechita del menu
   *  desplegable ya se sabe que es para seleccionar": the corridor pickers
   *  (currency/country in the search bar and widget) drop the chevron —
   *  the field already reads as a selector from its own trigger chrome
   *  (border/box, flag/symbol), same as kayak's own search fields, which
   *  carry no dropdown arrow either. Off by default: every other caller
   *  (Sort, filters, etc.) keeps the chevron, since those aren't inside a
   *  self-evidently-a-picker search bar. */
  hideChevron?: boolean;
  /** 2026-09-09 feedback — "comportamiento como kayak.com": kayak's own
   *  From/To location fields carry a small × once something is picked, so
   *  that one field can be cleared without reopening the list and hunting
   *  for a blank option. Off by default — currency fields (always must
   *  hold a value, no real "unset" state) and other non-location callers
   *  don't want this; wired on for the destination-country pickers only
   *  (see ComparatorSection) — that's the field this app already treats
   *  as legitimately clearable (accent-border placeholder styling when
   *  empty, CTA disabled without it), same as kayak's own "To" field. */
  clearable?: boolean;
  /** 2026-09-09 feedback — "comportamiento como kayak.com": after picking
   *  a value here, imperatively opens the field passed in (via its own
   *  `ComboboxHandle`) — same as kayak auto-advancing focus from "From" to
   *  "To" the instant an airport is chosen, instead of leaving the person
   *  to click the next field by hand. Delayed one tick (`setTimeout(…,
   *  0)`) past this field's own close — Radix/vaul both return focus to
   *  THIS trigger when their own popover/drawer closes, and opening the
   *  next one synchronously in the same tick loses that race. Deliberately
   *  not wired on every field — currency pickers stay manual, standalone
   *  overrides once a country's already picked a default (see the actual
   *  call sites in ComparatorSection for the exact chain: origin country →
   *  destination country, currencies untouched). */
  advanceTo?: React.RefObject<ComboboxHandle | null>;
}

/**
 * Searchable combobox built on shadcn Popover + cmdk.
 *
 * Mobile-first: trigger height matches input (h-11), content width tracks the
 * trigger so the dropdown never overflows the card on small screens.
 *
 * 2026-09-09 feedback — "comportamiento como kayak.com... en mobile abre
 * como pantalla completa": kayak's own location pickers open a genuine
 * full-screen search overlay on mobile (search input pinned at top, results
 * fill the rest of the screen) rather than a small floating card — a
 * Popover anchored to a ~44px trigger has nowhere near enough room for that
 * on a phone. Below the same `useIsMobile` breakpoint (768px) this codebase
 * already uses everywhere else for this exact kind of decision (see
 * ComparatorSection's own `collapsedSearch`/`mergeSearchIntoHeader`), swaps
 * the whole Popover for a full-height Drawer instead — reuses the same
 * vaul-based primitive already used for the mobile "edit search" sheet
 * elsewhere in this codebase, just stretched to the full viewport height
 * (`h-[100dvh]`, no rounded top, no drag handle inset) instead of that
 * sheet's normal partial-height card. Same trigger button, same `Command`
 * list/filter/highlight underneath either way — only the container around
 * it changes.
 */
export const Combobox = React.forwardRef<ComboboxHandle, ComboboxProps>(function Combobox(
  {
    value,
    onChange,
    options,
    placeholder = "Select…",
    searchPlaceholder = "Search…",
    emptyLabel = "No results.",
    className,
    triggerClassName,
    disabled,
    ariaLabel,
    compactLabel = false,
    hideSecondary = false,
    triggerIconOnly = false,
    hideChevron = false,
    clearable = false,
    advanceTo,
  },
  ref,
) {
  const [open, setOpen] = React.useState(false);
  // 2026-09-09 feedback — controlled search string (cmdk's own internal
  // state before this): needed so the dropdown list can bold the part of
  // each label that matches what was typed, same as kayak's own airport
  // list does (see `highlightMatch` below). Reset on close so a field
  // never reopens on a stale filter.
  const [search, setSearch] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();
  const selected = React.useMemo(() => options.find((o) => o.value === value), [options, value]);

  React.useImperativeHandle(
    ref,
    () => ({
      open: () => {
        if (triggerRef.current && triggerRef.current.offsetParent !== null) {
          setOpen(true);
        }
      },
      focus: () => {
        if (triggerRef.current && triggerRef.current.offsetParent !== null) {
          triggerRef.current.focus();
        }
      },
    }),
    [],
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch("");
  };

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
    setSearch("");
    if (advanceTo) {
      // One tick past this field's own close — see `advanceTo`'s own doc
      // comment above for why the delay matters.
      setTimeout(() => advanceTo.current?.open(), 0);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange("");
  };

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-label={ariaLabel ?? placeholder}
      disabled={disabled}
      className={cn(
        "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
        triggerClassName,
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {selected?.leading && (
          <span className="shrink-0 text-base leading-none">{selected.leading}</span>
        )}
        {(!triggerIconOnly || !selected) &&
          !(compactLabel && selected?.secondary && !hideSecondary) && (
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected ? selected.label : placeholder}
            </span>
          )}
        {/* Currency code alongside the country name — was only visible
            inside the open dropdown list before, never on the closed
            trigger, so "what currency am I actually sending/receiving"
            required opening the picker to find out. shrink-0 so it
            never gets truncated away in favor of the (longer, more
            variable-length) country name. compactLabel drops the name
            entirely instead (see its own doc comment) — this is then
            the only text left in the trigger. hideSecondary drops this
            readout altogether, for callers with their own separate
            currency field. triggerIconOnly drops it too — see its own
            doc comment, that mode shows nothing but `leading`. */}
        {!triggerIconOnly && selected?.secondary && !hideSecondary && (
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
            {selected.secondary}
          </span>
        )}
      </span>
      {/* 2026-09-09 feedback — "comportamiento como kayak.com": kayak's own
          From/To fields carry a small × once something is picked, so it
          can be cleared without reopening the list. Own click handler
          (stopPropagation + preventDefault) so clicking it clears the
          field instead of toggling the popover/drawer open — same pattern
          the trigger's own `asChild` button would otherwise intercept.
          Sits right before the chevron, the same slot kayak's own clear
          glyph occupies. tabIndex={-1}: reachable by mouse/touch, not a
          separate stop in the tab order — Escape-to-clear-then-close would
          need two keystrokes for what a sighted mouse user does in one
          click, worse, not better, for keyboard users; the field itself
          stays the single tab stop, same as before this was added. */}
      {clearable && selected && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={ariaLabel ? `${ariaLabel} — clear` : "Clear"}
          onClick={handleClear}
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      )}
      {/* 2026-09-04 feedback (round 3) — "en la de país de origen
          agregarle las flecitas para saber que se puede elegir": a
          triggerIconOnly trigger is deliberately tiny (see its own doc
          comment above) — the base h-4 chevron plus its gap-2 spacing
          didn't fit next to the flag in that narrow a box, so it
          silently overflowed and got clipped by the row's own
          overflow-hidden, taking the flag's visible edge down with it
          ("aplastada"). A smaller chevron here (paired with tighter
          gap-1/px-1.5 on the caller's own triggerClassName) is sized to
          actually fit instead of relying on overflow to hide the
          mismatch.
          2026-09-04 feedback (round 4) — "las flechitas que sean como
          las de kayak": kayak's dropdown affordance is a single simple
          chevron pointing down, not the two-headed up/down glyph this
          had (`ChevronsUpDown`). Same sizing/opacity per mode, just the
          simpler icon. */}
      {!hideChevron && (
        <ChevronDown
          className={
            triggerIconOnly ? "h-3 w-3 shrink-0 opacity-60" : "h-4 w-4 shrink-0 opacity-50"
          }
        />
      )}
    </button>
  );

  // 2026-09-09 feedback — controlled `value`/`onValueChange` on CommandInput
  // (was uncontrolled, cmdk's own internal state) so `highlightMatch` below
  // can bold the matching part of each row against what's actually typed.
  // `isFullScreen` only changes CommandList's own max-height (grows to fill
  // the Drawer instead of the Popover's normal 300px cap) — same filter,
  // same rows, same highlight either way, see this function's own doc
  // comment for why the container differs on mobile.
  const commandContent = (isFullScreen: boolean) => (
    <Command
      filter={(itemValue, searchValue) => {
        // itemValue is the raw value we passed to CommandItem
        const opt = options.find((o) => o.value === itemValue);
        if (!opt) return 0;
        const haystack = [opt.label, opt.secondary ?? "", opt.value, ...(opt.keywords ?? [])]
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchValue.toLowerCase()) ? 1 : 0;
      }}
      className={isFullScreen ? "flex-1" : undefined}
    >
      <CommandInput
        placeholder={searchPlaceholder}
        className={isFullScreen ? "h-12 text-base" : "h-10"}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className={isFullScreen ? "max-h-none flex-1" : undefined}>
        <CommandEmpty>{emptyLabel}</CommandEmpty>
        <CommandGroup>
          {options.map((opt) => (
            <CommandItem
              key={opt.value}
              value={opt.value}
              onSelect={handleSelect}
              className={cn(
                "gap-2.5 rounded-md data-[selected=true]:bg-muted data-[selected=true]:text-foreground",
                isFullScreen ? "px-3 py-3 text-base" : "px-2.5 py-2.5",
              )}
            >
              {opt.leading && (
                <span className="shrink-0 text-base leading-none">{opt.leading}</span>
              )}
              <span className="truncate">{highlightMatch(opt.label, search)}</span>
              {opt.secondary && !hideSecondary && (
                <span className="ml-auto truncate text-xs text-muted-foreground">
                  {opt.secondary}
                </span>
              )}
              {value === opt.value && <Check className="ml-1 h-4 w-4 shrink-0 opacity-70" />}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  // 2026-09-09 feedback — "que se abra como pantalla completa en mobile,
  // como hace kayak.com": below the breakpoint, the Popover branch never
  // even mounts — swaps to a full-height Drawer instead (see this
  // component's own doc comment above for the reasoning). Same trigger,
  // same Command content (`commandContent(true)` just grows the list to
  // fill the sheet), only the surrounding chrome changes.
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="mt-0 flex h-[100dvh] max-h-[100dvh] flex-col rounded-none border-0 p-0">
          <DrawerHeader className="shrink-0 border-b border-border px-4 pb-3 pt-3 text-left">
            <DrawerTitle className="text-metric font-bold">
              {ariaLabel ?? placeholder}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col px-1">{commandContent(true)}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      {/* 2026-09-04 feedback (ronda 7) — "cuando se despliega el menu para
          seleccionar el pais es diferente que el de kayak buscando
          aeropuerto": medido en vivo el picker de aeropuerto real de
          kayak.com (`getComputedStyle` sobre el popover y sus filas) — es
          una tarjeta blanca FLOTANTE bastante más ancha que el campo que
          la abre (480px medidos, contra un trigger de ~110px: no copia el
          ancho del trigger), radio 8px, sombra en capas hacia arriba y
          hacia abajo (`0 10px 20px, 0 3px 6px, 0 -3px 6px`), y una lista
          plana sin ningún resaltado de color fuerte en la fila activa —
          sólo hover neutro. Este picker heredaba el ancho exacto del
          trigger (`w-[var(--radix-popover-trigger-width)]`) — angosto
          porque el trigger de la barra también lo es — y pintaba la fila
          enfocada con `bg-accent` (el coral de marca), que es la señal de
          "seleccionado" en TODO el resto del sitio pero acá, dentro de una
          lista de opciones para elegir, se lee como un semáforo prendido
          en la primera fila en vez de un simple foco de teclado. Pasa a un
          ancho propio (no atado al trigger) y una sombra en capas más
          parecida a la real; el resaltado de fila pasa de `bg-accent` a un
          gris neutro (ver `command.tsx`'s `CommandItem` — acá se
          sobrescribe puntualmente vía `className`, no se toca ese
          componente compartido, porque otros pickers del sitio que no son
          de tipo "país/aeropuerto" sí quieren seguir usando el color de
          marca para su propio estado seleccionado). */}
      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn(
          "w-[320px] max-w-[calc(100vw-2rem)] rounded-lg p-0 shadow-[0_10px_20px_rgba(25,32,36,0.1),0_3px_6px_rgba(25,32,36,0.04),0_-3px_6px_rgba(25,32,36,0.04)]",
          className,
        )}
      >
        {commandContent(false)}
      </PopoverContent>
    </Popover>
  );
});

/** 2026-09-09 feedback — "comportamiento como kayak.com": kayak bolds the
 *  substring of each suggestion that matches what was typed (e.g. typing
 *  "lon" bolds "Lon" in "London"). Case-insensitive, first match only
 *  (matches how the list itself is filtered — one relevant substring per
 *  row, not a global replace). Returns the plain label unchanged (no extra
 *  wrapper nodes) when there's nothing typed yet or nothing matches, so the
 *  common case (closed field, or a still-empty search box) stays cheap and
 *  doesn't churn the DOM. */
function highlightMatch(label: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return label;
  const idx = label.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return label;
  return (
    <>
      {label.slice(0, idx)}
      <strong className="font-semibold text-foreground">
        {label.slice(idx, idx + q.length)}
      </strong>
      {label.slice(idx + q.length)}
    </>
  );
}
