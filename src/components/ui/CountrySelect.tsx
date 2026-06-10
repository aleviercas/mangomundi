import { Combobox } from "@/components/ui/Combobox";

const COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: "ES", name: "España / Spain", flag: "🇪🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Deutschland", flag: "🇩🇪" },
  { code: "IT", name: "Italia", flag: "🇮🇹" },
  { code: "NL", name: "Nederland", flag: "🇳🇱" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "CH", name: "Schweiz", flag: "🇨🇭" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
];

const OPTIONS = COUNTRIES.map((c) => ({
  value: c.code,
  label: `${c.code} — ${c.name}`,
  leading: c.flag,
  keywords: [c.code, c.name],
}));

export function CountrySelect({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  ariaLabel?: string;
}) {
  return (
    <Combobox
      value={value}
      onChange={onChange}
      options={OPTIONS}
      placeholder={placeholder ?? "—"}
      searchPlaceholder={searchPlaceholder}
      emptyLabel={emptyLabel}
      ariaLabel={ariaLabel}
    />
  );
}
