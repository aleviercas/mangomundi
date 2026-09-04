import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Wordmark, BrandMark } from "@/components/Wordmark";
import { LangSwitcher } from "@/components/LangSwitcher";
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

  // 2026-09-04 feedback (ronda 8) — "la barra de seleccion... se mueve al
  // header?": ComparatorSection ahora portalea la barra de búsqueda entera
  // a `#header-searchbar-slot` de más abajo (fila 2) una vez que hay
  // resultado y el viewport es lo bastante ancho — igual que kayak.com,
  // cuyo `<header>` real mide ~66px en el home y ~80px en una página de
  // resultados (medido en vivo, JFK-LAX) porque la fila de búsqueda pasa a
  // vivir ADENTRO de él. Este `<header>` ya no puede tener un alto fijo
  // (`h-[66px]`, como antes) si su fila 2 puede aparecer o no — el alto
  // ahora lo decide el contenido (`flex-col`, sin `h-*` en el elemento
  // raíz; la fila 1 abajo sí mantiene su propio `h-[66px]` para no
  // cambiar de tamaño ella misma).
  //
  // Cuatro lugares más (drawer de este archivo, `<main>` de __root.tsx, el
  // panel del AI y la tarjeta sticky de fallback en ComparatorSection.tsx)
  // necesitan saber el alto REAL del header para no quedar tapados o con
  // un hueco cuando cambia — en vez de hardcodear 66px en los cuatro (lo
  // que ya se había hecho antes y quedó mal el día que el header creció),
  // este componente mide su propio alto con un ResizeObserver y lo publica
  // como la custom property `--header-h` en `<html>`, que esos otros
  // archivos leen vía `var(--header-h)` (ver el default `66px` en
  // styles.css `:root`, el valor de siempre antes de que JS corra en el
  // primer paint/SSR).
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const publish = () => {
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 flex flex-col border-b border-border bg-card"
    >
      {/* 2026-09-04 feedback (ronda 6, cont.) — "kayak aprovecha mejor todo
          el ancho de la pagina": medido en vivo (getBoundingClientRect
          sobre `kml-layout.edges` a 1440px y 1920px, mismo valor en los
          dos) el tope real de kayak.com/kayak.co.uk es 1340px, no 1280
          (`max-w-7xl`) — sube acá y en Footer + todas las secciones de
          marketing del home. El comparador (`max-w-[1180px]` en
          ComparatorSection/HeroSection) queda intacto a propósito: medido
          también en vivo contra la página de resultados real de kayak
          (rail 220px + resultados 760px = 980px, ampliado a 1280 total
          sólo por una columna de anuncios de 300px que este sitio no
          tiene), la proporción rail+resultados de acá (240+728=968px) ya
          es prácticamente idéntica a la de kayak sin ads — tocarla no
          acerca nada a kayak, sólo arriesga romper esa matemática. */}
      {/* 2026-09-04 feedback (ronda 7) — "la hamburguesa no quedo bien a la
          izquierda de la pagina": el header real de kayak.com NO está
          centrado ni topeado a un ancho máximo (medido en vivo,
          getBoundingClientRect a 1440px y 1920px: el ☰ queda siempre en
          x=12, sea cual sea el ancho de la ventana) — es borde a borde,
          con un padding lateral fijo chico. El `mx-auto max-w-[1340px]`
          de la ronda anterior estaba tomado de una medición real, pero de
          las SECCIONES DE CONTENIDO del body (Footer, marketing), no del
          header — éste es un elemento aparte, sin tope de ancho, con un
          padding fijo en vez de un contenedor centrado. Footer y las
          secciones de marketing quedan con su 1340px intacto (ver sus
          propios comentarios), sólo el header pasa a borde a borde. */}
      <div className="flex h-[66px] shrink-0 items-center gap-3 px-3 sm:px-4">
        {/* Menu trigger — left of the logo, at every breakpoint, like
            kayak's ☰. Opens the same dropdown panel HEADER_NAV always used
            on mobile (below), just no longer gated to `md:hidden`.
            2026-09-04 feedback (ronda 6, cont.) — "el menu hamburgesa esta
            desalineado del logo": measured live (getBoundingClientRect at
            4x zoom) — this button's box and the Wordmark link's box ARE
            centered on the exact same Y in the 66px header (both flex
            children of the same `items-center` row), so it isn't a
            box-model bug. What's actually off is optical: "mangomundi" is
            set in lowercase with a real descender on the "g", which pulls
            the WORD's bounding box down without pulling its visual
            weight/x-height down with it — so the glyph's optical center
            sits a couple px higher than its own box center, while the
            hamburger icon (a symmetric glyph, no descender) has no such
            gap. Two boxes centered on the same line ≠ two GLYPHS optically
            centered on the same line when one of them carries a
            descender. `-translate-y-px` nudges the icon up to close that
            gap without touching either box's actual layout. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={t("header.menuAriaLabel")}
          className="inline-flex h-9 w-9 shrink-0 -translate-y-px items-center justify-center rounded-md text-foreground hover:bg-muted"
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

        {/* 2026-09-04 feedback (ronda 6, cont.) — "el mangomundi ai tiene
            que estar arriba a la izquierda como el de kayak" + "tiene que
            havber una barrita separadora como hace kayak": inspeccionado
            en vivo el DOM real de kayak.com — su "Ask AI" vive DENTRO del
            header, pegado al logo por el lado izquierdo, separado por una
            sola línea vertical (`.NgeD-divider`), nunca del lado derecho.
            FloatingAgent (ComparatorSection) sigue siendo el dueño del
            botón/panel — no hay forma limpia de tirar todo ese estado acá
            arriba — pero ahora hace un `createPortal` de su trigger
            colapsado (divider incluido) a ESTE slot cuando existe, así
            queda dentro del flujo flex normal del header (mismo
            comportamiento en cualquier ancho, mobile incluido) en vez de
            un pill con posición fija adivinando dónde termina el
            wordmark. Vacío en cualquier página sin comparador (no hay
            nada que portalear ahí), así que no deja una barrita colgando
            de la nada.
            2026-09-04 feedback (ronda 6, cont.) — medido en vivo el
            `.NgeD-divider` real de kayak.com: 1px × 24px, `margin: 0 12px 0
            32px` (32px de aire respecto al logo, 12px hacia el botón). Este
            slot ya recibe 12px del propio `gap-3` de la fila del header (el
            mismo gap que separa el ☰ del logo) — `ml-5` suma otros 20px
            para llegar a esos 32px totales antes del divisor; `gap-3` acá
            adentro reproduce los 12px que separan el divisor del botón.
            2026-09-04 feedback (ronda 7) — "el mangomundi ai se comporta
            diferente que el de kayak" + "tiene que replicar el
            comportamiento de kayak... en mobile": kayak.com NO usa el mismo
            trigger en mobile que en desktop — su propio DOM real (medido en
            una ronda anterior) marca el botón de escritorio con
            `drdg-hide-below-s` (texto+icono, pegado al logo) y uno
            DISTINTO para mobile con `drdg-hide-above-s` (sólo icono, en la
            esquina opuesta). Este slot pasa a `hidden sm:flex` — ya no
            recibe nada por debajo de `sm` — y FloatingAgent ahora porta un
            segundo trigger, sólo-ícono, al slot de la derecha (ver más
            abajo) para ese rango. */}
        <div id="header-ai-slot" className="ml-5 hidden items-center gap-3 sm:flex" />

        {/* Slot para el trigger mobile del agente — sólo ícono, en la
            esquina opuesta al ☰/logo, como el propio "Ask AI" de kayak en
            mobile (ver comentario de arriba). `ml-auto` lo empuja al borde
            derecho de esta misma fila; vacío (y por lo tanto invisible)
            en cualquier página sin comparador, igual que el slot de
            escritorio. */}
        <div id="header-ai-slot-mobile" className="ml-auto flex items-center sm:hidden" />
      </div>

      {/* Fila 2 — 2026-09-04 feedback (ronda 8) — "la barra de seleccion...
          se mueve al header?": ComparatorSection porta la barra de
          búsqueda entera acá (`createPortal`, ver `mergeSearchIntoHeader`
          en ese archivo) una vez que hay resultado y el viewport es lo
          bastante ancho — la misma pieza blanca del header, no una banda
          aparte, igual que kayak.com (medido en vivo: su header pasa de
          ~66px a ~80px en una página de resultados porque esta fila vive
          adentro). Vacío en cualquier página sin comparador, o en mobile,
          o por debajo de 1280px — no ocupa alto ni pinta nada (sin
          padding/borde propios acá; el contenido portaleado trae los
          suyos) hasta que algo se portalea adentro, así nunca deja una
          franja colgando de la nada, mismo criterio que `header-ai-slot`. */}
      <div id="header-searchbar-slot" />

      {/* Side drawer — now the only nav, opened by the ☰ trigger at every
          width (used to be mobile-only; desktop had its own always-open
          inline row next to the logo, dropped per the doc comment above).
          Docked to the LEFT edge under the header (kayak's own pattern —
          see the file's doc comment), as an overlay: `fixed` positioning
          means it never pushes the page's own content (the comparator's
          sticky search bar included) down or sideways.
          2026-09-04 feedback (ronda 8) — `top-[66px]` fijo pasa a
          `top-[var(--header-h)]`: si la fila 2 de arriba está mostrando la
          barra portaleada, el header real mide más de 66px, y este drawer
          debe abrir debajo del header COMPLETO (las dos filas), no tapar
          la barra de búsqueda que acaba de mudarse ahí. */}
      {open && (
        <>
          <div
            className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-40 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav
            className="fixed bottom-0 left-0 top-[var(--header-h)] z-50 flex w-[280px] max-w-[80vw] flex-col overflow-y-auto border-r border-border bg-card px-3 py-4 shadow-2xl"
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

            {/* 2026-09-04 feedback (ronda 7) — "poner la banderita del
                selector de idioma tambien en el menu de la izquierda como
                hace kayak": kayak.com repite su selector de idioma/región
                (banderita + código) DENTRO del panel que se desliza del ☰,
                no sólo en el footer — mismo control, un segundo lugar
                donde encontrarlo. El de acá se queda (ronda 4, ver su
                propio comment) — éste es un acceso adicional, no un
                reemplazo. `variant="pill"` (banderita + código en una
                píldora con borde) es el mismo tratamiento que ya usa este
                archivo en otros lugares, sólo que ahora vive al pie de la
                lista de navegación, separado por un hairline propio;
                `direction="up"` porque el drawer llega hasta el borde
                inferior del viewport — un dropdown "down" ahí se saldría
                de pantalla. */}
            <div className="mt-auto border-t border-border pt-3">
              <LangSwitcher variant="pill" direction="up" />
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
