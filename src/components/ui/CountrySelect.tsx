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

export function CountrySelect({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="terminal-input w-full rounded-md px-3 py-2 text-sm font-mono">
      <option value="">{placeholder ?? "—"}</option>
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.flag} {c.code} — {c.name}
        </option>
      ))}
    </select>
  );
}
