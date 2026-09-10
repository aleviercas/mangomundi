import * as React from "react";
import { Combobox, type ComboboxHandle } from "@/components/ui/Combobox";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { COUNTRIES } from "@/lib/countries";

const OPTIONS = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
  secondary: c.currency,
  leading: <FlagIcon country={c.code} />,
  keywords: [c.code, c.currency],
}));

/** 2026-09-09 feedback — "comportamiento como kayak.com": forwards the ref
 *  through to the underlying `Combobox` so a sibling field can auto-open
 *  this one (`advanceTo`) or so this one can auto-open a sibling — see
 *  Combobox's own `ComboboxHandle` doc comment for the full reasoning. */
export const CountryCombobox = React.forwardRef<
  ComboboxHandle,
  {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyLabel?: string;
    ariaLabel?: string;
    triggerClassName?: string;
    compactLabel?: boolean;
    /** See Combobox's own doc comment — drops the local-currency readout,
     *  for callers with a separate currency field right next to this one. */
    hideSecondary?: boolean;
    /** See Combobox's own doc comment — closed trigger shows only the flag,
     *  full country name still shows once the dropdown opens. */
    triggerIconOnly?: boolean;
    /** See Combobox's own doc comment — drops the dropdown chevron. */
    hideChevron?: boolean;
    /** See Combobox's own doc comment — adds a small × to clear once a
     *  country is picked, kayak's own "To"-field pattern. */
    clearable?: boolean;
    /** See Combobox's own doc comment — auto-opens the given field the
     *  instant a country is picked here, kayak's own From→To pattern. */
    advanceTo?: React.RefObject<ComboboxHandle | null>;
  }
>(function CountryCombobox(
  {
    value,
    onChange,
    placeholder,
    searchPlaceholder,
    emptyLabel,
    ariaLabel,
    triggerClassName,
    compactLabel,
    hideSecondary,
    triggerIconOnly,
    hideChevron,
    clearable,
    advanceTo,
  },
  ref,
) {
  return (
    <Combobox
      ref={ref}
      value={value}
      onChange={onChange}
      options={OPTIONS}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyLabel={emptyLabel}
      ariaLabel={ariaLabel}
      triggerClassName={triggerClassName}
      compactLabel={compactLabel}
      hideSecondary={hideSecondary}
      triggerIconOnly={triggerIconOnly}
      hideChevron={hideChevron}
      clearable={clearable}
      advanceTo={advanceTo}
    />
  );
});
