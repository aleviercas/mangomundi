import { useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Wordmark, BrandMark } from "@/components/Wordmark";
import { HEADER_NAV } from "@/config/nav";
import { useI18n } from "@/lib/i18n";

/** Main nav — anchors into the home sections (Link with hash works from any
 *  route). Legal lives in the footer per convention.
 *
 *  design/AJUSTES-2.md §7 (mockup line 249-254): 66px tall, solid white,
 *  1px #EBE3D9 bottom border, 30px lateral padding.
 *  2026-09-04 feedback (ronda 4) — "el boton de selector de idioma pasa al
 *  footer como hace kayak": the language pill that used to close out this
 *  nav is gone from here — kayak.com doesn't show one in its header either
 *  (verified live), it's a small "English"/"£ GBP" control at the very
 *  bottom of the page. See Footer.tsx, which now renders it there.
 *  2026-09-04 feedback (ronda 5) — "el menu de arriba del encabezado se
 *  puede poner a la izquierda como hace kayak, asi despues cuando pasamos
 *  a comparar el selector queda arriba de todo": kayak's own header is
 *  ☰ + logo on the left, nothing competing on the right — the nav lives
 *  behind the hamburger at every width, not spread out inline on desktop.
 *  Same trigger button now works at every breakpoint (moved from the
 *  right, mobile-only, to the left, always) and opens the same nav items
 *  HEADER_NAV always used on mobile; there's no more separate always-open
 *  desktop `<nav>`. A lean left-only header is also what leaves the
 *  compact sticky search bar (ComparatorSection's own `compact` state) a
 *  clean strip under the header once there's a result, instead of
 *  competing for room with a right-aligned nav row.
 *  "cuando kayak usa el loguito solo de la k... podemos usar el logo de
 *  la m": kayak's mobile header shows just the K mark, full wordmark only
 *  once there's room — same idea here with `BrandMark` (the icon-only "m")
 *  below `sm`, the full `Wordmark` from `sm` up.
 *  2026-09-04 feedback (ronda 6) — "el menu de la esquina en kayak se
 *  despliega para el costado no para abajo" + "la idea es que el selector
 *  del buscador pase arriba de todo como hace kayak, por eso el menu
 *  desplegable sale del costado": kayak's ☰ opens a panel that SLIDES IN
 *  from the left as an overlay (verified live) — it never pushes the page
 *  content down, which matters here specifically because
 *  ComparatorSection's search bar sticks to `top-[66px]` once there's a
 *  result; a panel that pushed content down would shove that sticky bar
 *  (and everything below it) out of place every time the menu opened. The
 *  ronda-5 version (`{open && <nav className="border-t...">}`, a strip
 *  that dropped in BELOW the header and pushed the page down) is replaced
 *  with a fixed-position drawer anchored to the left edge, under the
 *  header, plus a click-to-close backdrop — same nav items, same open
 *  state, just docked to the side like kayak's instead of stacked
 *  downward. */
export function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  // 2026-09-04 feedback (ronda 5) — "cuando hago click en el logo... deberia
  // llevar al home y resetear la pagina": a <Link to="/"> from a route other
  // than home already remounts the home page (a real navigation happens),
  // but clicking it while ALREADY on "/" is a same-route no-op as far as the
  // router's concerned — nothing remounts, so the comparator's own state
  // (amount, countries, an existing result) just sits there. The one case
  // that actually needs a real reset is exactly that one: already home, so
  // force a hard reload instead of a client-side no-op. Elsewhere, the
  // normal client-side Link navigation is fine (it already lands on a fresh
  // mount) and reloading a whole different route would just be slower.
  const handleLogoClick = (e: MouseEvent) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      window.location.assign("/");
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[66px] border-b border-border bg-card">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-5 sm:px-[30px]">
        {/* Menu trigger — left of the logo, at every breakpoint, like
            kayak's ☰. Opens the same dropdown panel HEADER_NAV always used
            on mobile (below), just no longer gated to `md:hidden`. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={t("header.menuAriaLabel")}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link
          to="/"
          aria-label={t("header.homeAriaLabel")}
          className="flex items-center"
          onClick={handleLogoClick}
        >
          {/* Text-only lockup here and in Footer — the icon mark is reserved
              for the widget card/embed surfaces and, now, this narrow
              header. Still bicolor ("mundi" in mango): icon={false} only
              drops the icon, unlike `compact` which also flattens the
              color — see Wordmark's own doc comment (2026-08-30
              feedback). */}
          <span className="text-2xl sm:hidden">
            <BrandMark />
          </span>
          <Wordmark className="hidden text-2xl sm:inline-flex" icon={false} />
        </Link>
      </div>

      {/* Side drawer — now the only nav, opened by the ☰ trigger at every
          width (used to be mobile-only; desktop had its own always-open
          inline row next to the logo, dropped per the doc comment above).
          Docked to the LEFT edge under the header (kayak's own pattern —
          see the file's doc comment), as an overlay: `fixed` positioning
          means it never pushes the page's own content (the comparator's
          sticky search bar included) down or sideways. */}
      {open && (
        <>
          <div
            className="fixed inset-x-0 bottom-0 top-[66px] z-40 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav
            className="fixed bottom-0 left-0 top-[66px] z-50 w-[280px] max-w-[80vw] overflow-y-auto border-r border-border bg-card px-3 py-4 shadow-2xl"
            aria-label={t("header.mainAriaLabel")}
          >
            <ul className="space-y-1">
              {HEADER_NAV.map((item) => (
                <li key={item.labelKey}>
                  <Link
                    to={item.to ?? "/"}
                    hash={item.hash}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
