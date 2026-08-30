import { Combobox } from "@/components/ui/Combobox";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { CURRENCIES } from "@/lib/currencies";

const OPTIONS = CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.code} — ${c.name}`,
  // Lets compactLabel (below) show just the code — same pattern as
  // CountryCombobox's own secondary/compactLabel pair.
  secondary: c.code,
  leading: <FlagIcon country={c.flag} />,
  keywords: [c.code, c.name],
}));

export function CurrencyCombobox({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  ariaLabel,
  triggerClassName,
  compactLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  ariaLabel?: string;
  triggerClassName?: string;
  /** 2026-08-30 feedback (fifth round) — the new always-visible currency
   *  dropdowns (replacing CurrencyPillRow) need a code-only trigger inside
   *  the embedded widget's tight row, same as CountryCombobox's own
   *  compactLabel. */
  compactLabel?: boolean;
}) {
  return (
    <Combobox
      value={value}
      onChange={onChange}
      options={OPTIONS}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyLabel={emptyLabel}
      ariaLabel={ariaLabel}
      triggerClassName={triggerClassName}
      compactLabel={compactLabel}
    />
  );
}
