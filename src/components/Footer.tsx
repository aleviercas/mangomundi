import type { MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/Wordmark";
import { LangSwitcher } from "@/components/LangSwitcher";
import { FOOTER_COMPANY, FOOTER_PRODUCT, type NavEntry } from "@/config/nav";
import { useI18n } from "@/lib/i18n";

const socials = [
  {
    label: "X",
    href: "https://x.com/mangomundi",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/mangomundi",
    path: "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/people/Mangomundi/61591687365990/",
    path: "M22.675 0H1.325C.593 0 0 .593 0 1.326v21.348C0 23.408.593 24 1.325 24H12.82V14.706h-3.13v-3.62h3.13V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24h-1.918c-1.504 0-1.795.715-1.795 1.763v2.31h3.587l-.467 3.62h-3.12V24h6.116C23.408 24 24 23.408 24 22.674V1.326C24 .593 23.408 0 22.675 0z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/mangomundi/",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.327 3.608 1.302.975.975 1.24 2.242 1.302 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.327 2.633-1.302 3.608-.975.975-2.242 1.24-3.608 1.302-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.327-3.608-1.302-.975-.975-1.24-2.242-1.302-3.608C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.062-1.366.327-2.633 1.302-3.608.975-.975 2.242-1.24 3.608-1.302C8.416 2.175 8.796 2.163 12 2.163zm0 1.838c-3.148 0-3.512.012-4.747.068-1.005.046-1.55.215-1.913.357-.48.187-.823.41-1.184.77-.36.36-.583.703-.77 1.184-.142.362-.311.908-.357 1.913C3 8.488 2.988 8.852 2.988 12s.012 3.512.068 4.747c.046 1.005.215 1.55.357 1.913.187.48.41.823.77 1.184.36.36.703.583 1.184.77.362.142.908.311 1.913.357 1.235.056 1.599.068 4.747.068s3.512-.012 4.747-.068c1.005-.046 1.55-.215 1.913-.357.48-.187.823-.41 1.184-.77.36-.36.583-.703.77-1.184.142-.362.311-.908.357-1.913.056-1.235.068-1.599.068-4.747s-.012-3.512-.068-4.747c-.046-1.005-.215-1.55-.357-1.913a3.18 3.18 0 0 0-.77-1.184 3.18 3.18 0 0 0-1.184-.77c-.362-.142-.908-.311-1.913-.357C15.512 4.013 15.148 4 12 4zm0 3.135A4.865 4.865 0 1 1 12 16.865 4.865 4.865 0 0 1 12 7.135zm0 8.027A3.162 3.162 0 1 0 12 8.838a3.162 3.162 0 0 0 0 6.324zm6.406-8.244a1.137 1.137 0 1 1-2.274 0 1.137 1.137 0 0 1 2.274 0z",
  },
];

/** design/Mangomundi 4 - Final.dc.html (line 232-240) — Footer's own dark
 *  column, given either a home-page anchor or a real route (NavEntry,
 *  config/nav.ts). Literal to the mockup: 12.5px items in #A79C92, bold
 *  white 12.5px header, 8px gap — hardcoded hex, not the light-theme
 *  text-muted-foreground/text-foreground tokens, since this is a
 *  dark-specific palette independent of the rest of the (light) site. */
function FooterColumn({ titleKey, items }: { titleKey: string; items: ReadonlyArray<NavEntry> }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-2 text-[12.5px] text-[#A79C92]">
      {/* docs/kayak-redesign-spec.md §6.4 — títulos de columna en
          text-badge uppercase con tracking, estilo Kayak. El color SÍ se
          aparta del spec: éste pide text-muted-foreground, que asume el
          footer claro de kayak.com; sobre este footer oscuro ese token
          (#6b5f55) dejaría los títulos MENOS legibles que los links que
          encabezan — o sea invertiría la jerarquía y bajaría el contraste,
          contra la regla 5. Se queda en blanco. */}
      <span className="text-badge font-bold uppercase tracking-wide text-white">{t(titleKey)}</span>
      {items.map((item) => (
        <Link
          key={item.labelKey}
          to={item.to ?? "/"}
          hash={item.hash}
          className="transition-colors hover:text-white"
        >
          {t(item.labelKey)}
        </Link>
      ))}
    </div>
  );
}

/** design/Mangomundi 4 - Final.dc.html (line 232-240) — 2026-08-30
 *  feedback: the footer is a dark band (#1B1510), not the light bg-muted
 *  surface this had before, and noticeably more compact (28px/30px
 *  padding, 26px column gap — not py-16/gap-12). Copyright folds into the
 *  end of the Legal column here, literal to the mockup, rather than a
 *  separate bottom bar.
 *  2026-09-04 feedback (ronda 4) — "el boton de selector de idioma pasa al
 *  footer como hace kayak": the language switcher is back, next to the
 *  copyright line under the social icons — kayak.com's own footer shows
 *  "English"/"£ GBP" in exactly that spot (verified live), and Header no
 *  longer carries one (see Header.tsx) so this isn't a second/redundant
 *  copy, it's the only one now. `variant="footer"` keeps it on the dark
 *  footer palette (`text-[#A79C92]`/`border-white/14`, same as the social
 *  icons right above it) instead of the light-theme tokens the other
 *  variants use; `direction="up"` so the dropdown opens upward, since this
 *  sits at the very bottom of the page.
 *  "Local exchange" (Product) and "How we make money" (Company) stay
 *  deliberately absent — see FOOTER_PRODUCT/FOOTER_COMPANY's own comments
 *  in config/nav.ts for why. The mockup's own wordmark here carries the
 *  icon (line 234), but the standing 2026-08-30 instruction to drop the
 *  icon from Header *and* Footer ("el logo se usa en otros lugares") is
 *  the more specific, deliberate call — text-only here too, same as
 *  Header. */
export function Footer() {
  const { t } = useI18n();

  // 2026-09-04 feedback (ronda 5) — "cuando hago click en el logo mangomundi
  // en el encabezado [y] footer deberia llevar al home y resetear la
  // pagina": same fix as Header's own logo link (see its own comment) —
  // already-home is a same-route no-op for the router, so it's the one case
  // that needs a hard reload instead of a client-side Link navigation.
  const handleLogoClick = (e: MouseEvent) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      window.location.assign("/");
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const legal = [
    { to: "/legal", hash: "terms", label: t("footer.legal.terms") },
    { to: "/legal", hash: "privacy", label: t("footer.legal.privacy") },
    { to: "/legal", hash: "risk", label: t("footer.legal.risk") },
  ] as const;

  return (
    <footer className="bg-[#1B1510] py-7">
      <div className="mx-auto max-w-7xl px-5 sm:px-[30px]">
        <div className="grid gap-[26px] md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center" onClick={handleLogoClick}>
              <Wordmark className="text-[21px]" tone="light" icon={false} />
            </Link>
            <p className="mt-2.5 max-w-[280px] whitespace-pre-line text-[12.5px] leading-[1.6] text-[#8A7C6E]">
              {t("footer.tagline")}
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="group inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/14 text-[#A79C92] transition-colors hover:border-white/30 hover:text-white"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
            {/* 2026-08-31 feedback — copyright moved here, under the social
                icons, off the end of the Legal column. */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-[12.5px] text-[#A79C92]">
                © {new Date().getFullYear()} Mangomundi
              </span>
              <LangSwitcher variant="footer" direction="up" />
            </div>
          </div>

          <FooterColumn titleKey="footer.product.title" items={FOOTER_PRODUCT} />
          <FooterColumn titleKey="footer.nav.title" items={FOOTER_COMPANY} />

          <div className="flex flex-col gap-2 text-[12.5px] text-[#A79C92]">
            {/* Mismo tratamiento §6.4 que las otras columnas — esta no usa
                FooterColumn (su lista de links se arma aparte), así que
                había que aplicarlo también acá o quedaba la única columna
                con otro estilo de título. */}
            <span className="text-badge font-bold uppercase tracking-wide text-white">
              {t("footer.legal.title")}
            </span>
            {legal.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                hash={l.hash}
                className="transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
