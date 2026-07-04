/** SVG flag via the flag-icons CSS classes. Emoji flags (regional-indicator
 *  pairs) render as plain letters on Windows Chrome/Edge, so the selects use
 *  real SVGs. Accepts either a 2-letter ISO-3166 code or a flag emoji (the
 *  code is derived by reversing the regional indicators — works for 🇪🇺 too,
 *  flag-icons ships fi-eu). */
export function FlagIcon({ country }: { country: string }) {
  const code = country.length === 2 ? country : countryFromFlagEmoji(country);
  if (!code) return <span className="text-base leading-none">{country}</span>;
  return (
    <span
      className={`fi fi-${code.toLowerCase()} rounded-[2px]`}
      style={{ fontSize: "0.9em" }}
      aria-hidden="true"
    />
  );
}

function countryFromFlagEmoji(flag: string): string | null {
  const cps = [...flag].map((c) => c.codePointAt(0) ?? 0);
  if (cps.length !== 2 || cps.some((cp) => cp < 0x1f1e6 || cp > 0x1f1ff)) return null;
  return cps.map((cp) => String.fromCharCode(cp - 0x1f1e6 + 65)).join("");
}
