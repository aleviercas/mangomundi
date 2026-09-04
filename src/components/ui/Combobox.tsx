import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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
}

/**
 * Searchable combobox built on shadcn Popover + cmdk.
 *
 * Mobile-first: trigger height matches input (h-11), content width tracks the
 * trigger so the dropdown never overflows the card on small screens.
 */
export function Combobox({
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
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = React.useMemo(() => options.find((o) => o.value === value), [options, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
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
      </PopoverTrigger>
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
        <Command
          filter={(itemValue, search) => {
            // itemValue is the raw value we passed to CommandItem
            const opt = options.find((o) => o.value === itemValue);
            if (!opt) return 0;
            const haystack = [opt.label, opt.secondary ?? "", opt.value, ...(opt.keywords ?? [])]
              .join(" ")
              .toLowerCase();
            return haystack.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} className="h-10" />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={(v) => {
                    onChange(v);
                    setOpen(false);
                  }}
                  className="gap-2.5 rounded-md px-2.5 py-2.5 data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
                >
                  {opt.leading && (
                    <span className="shrink-0 text-base leading-none">{opt.leading}</span>
                  )}
                  <span className="truncate">{opt.label}</span>
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
      </PopoverContent>
    </Popover>
  );
}
