import { Combobox } from "@/components/ui/Combobox";
import { CURRENCIES, currencySymbol } from "@/lib/currencies";

// 2026-08-31 feedback — no flag here: the currency picker sits right next to
// a country picker that already shows one, and a flag on a *currency* is
// misleading anyway (one currency, many countries, e.g. EUR/USD). Flags stay
// on CountryCombobox only. `leading` below is the currency's own symbol
// (£, $, €…) instead — added 2026-09-01 for the widget's icon-only trigger
// (see `triggerIconOnly`), not a flag.
const OPTIONS = CURRENCIES.map((c) => ({
  value: c.code,
  // 2026-08-31 feedback — "por qué aparecen los símbolos dos veces": label
  // used to be `"${code} — ${name}"` *and* secondary was the code again, so
  // the open dropdown list showed e.g. "USD — US Dollar ... USD" twice in
  // the same row. Name-only label + secondary=code reads as "US Dollar ...
  // USD" instead — code appears once. secondary alone still drives the
  // compact single-code trigger (compactLabel below), unchanged.
  label: c.name,
  secondary: c.code,
  leading: currencySymbol(c.code),
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
  triggerIconOnly,
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
  /** See Combobox's own doc comment — closed trigger shows only the
   *  currency symbol (£, $, €…), full name still shows once opened. */
  triggerIconOnly?: boolean;
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
      triggerIconOnly={triggerIconOnly}
    />
  );
}
