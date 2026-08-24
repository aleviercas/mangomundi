import { Combobox } from "@/components/ui/Combobox";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { COUNTRIES } from "@/lib/countries";

const OPTIONS = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
  secondary: c.currency,
  leading: <FlagIcon country={c.code} />,
  keywords: [c.code, c.currency],
}));

export function CountryCombobox({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  ariaLabel,
  triggerClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  ariaLabel?: string;
  triggerClassName?: string;
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
    />
  );
}
