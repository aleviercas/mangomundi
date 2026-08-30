import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
            {!(compactLabel && selected?.secondary && !hideSecondary) && (
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
                currency field. */}
            {selected?.secondary && !hideSecondary && (
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                {selected.secondary}
              </span>
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn("w-[var(--radix-popover-trigger-width)] min-w-[14rem] p-0", className)}
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
                  className="gap-2"
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
