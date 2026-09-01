import { Combobox } from "@/components/ui/Combobox";
import { CURRENCIES } from "@/lib/currencies";

// 2026-08-31 feedback — no flag here: the currency picker sits right next to
// a country picker that already shows one, and a flag on a *currency* is
// misleading anyway (one currency, many countries, e.g. EUR/USD). Flags stay
// on CountryCombobox only.
//
// 2026-09-01 feedback (briefly) — added a `leading` currency symbol (£, $,
// €…) for the widget's compact trigger. 2026-09-02 feedback reverted it:
// "quitar los símbolos que agregaste en las monedas, solo dejar el nombre
// de la moneda y la abreviación con letras" — no symbol anywhere, name +
// code letters only (label/secondary below), same as every other caller.
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
