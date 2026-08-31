// 2026-08-31 feedback — flags "tardan en cargar / se ven mal": the previous
// version rendered a `<span class="fi fi-xx">` whose flag is a CSS
// background-image. Background-images aren't found by the browser's preload
// scanner (only real <img>/<link> tags are) — they're only requested once
// layout is computed, well after the rest of the page has started painting,
// which is exactly what makes a flag "pop in" late. Rendering a real <img>
// instead lets the browser discover and fetch it immediately while still
// parsing the HTML, same network cost per flag but requested far earlier.
// Each country's SVG is still its own on-demand file (flag-icons ships one
// per country) — see vite.config.ts's own note on why these aren't inlined
// into the CSS bundle (would balloon it to ~550kB render-blocking).
const FLAG_URLS = import.meta.glob("/node_modules/flag-icons/flags/4x3/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const FLAG_BY_CODE: Record<string, string> = {};
for (const [path, url] of Object.entries(FLAG_URLS)) {
  const code = path
    .split("/")
    .pop()
    ?.replace(/\.svg$/, "");
  if (code) FLAG_BY_CODE[code] = url;
}

/** Accepts either a 2-letter ISO-3166 code or a flag emoji (the code is
 *  derived by reversing the regional indicators — works for 🇪🇺 too,
 *  flag-icons ships eu.svg). */
export function FlagIcon({ country }: { country: string }) {
  const code = (country.length === 2 ? country : countryFromFlagEmoji(country))?.toLowerCase();
  const src = code ? FLAG_BY_CODE[code] : undefined;
  if (!src) return <span className="text-base leading-none">{country}</span>;
  return (
    <img
      src={src}
      alt=""
      width={20}
      height={15}
      loading="eager"
      decoding="async"
      className="inline-block h-[0.9em] w-[1.2em] rounded-[2px] object-cover align-middle"
      aria-hidden="true"
    />
  );
}

function countryFromFlagEmoji(flag: string): string | null {
  const cps = [...flag].map((c) => c.codePointAt(0) ?? 0);
  if (cps.length !== 2 || cps.some((cp) => cp < 0x1f1e6 || cp > 0x1f1ff)) return null;
  return cps.map((cp) => String.fromCharCode(cp - 0x1f1e6 + 65)).join("");
}
