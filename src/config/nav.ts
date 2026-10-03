import type { TKey } from "@/lib/i18n";

/** 2026-09-10 — migración de ?lang= a URLs con prefijo de idioma (ver
 *  docs/handoff/handoff-2026-09-10-plan-urls-por-idioma.md). Todas las
 *  rutas indexables ahora viven bajo el segmento opcional `{-$lang}`, así
 *  que un `<Link to="/about">` plano ya no es una ruta válida — hay que
 *  usar el route-id real ("/{-$lang}/about") + pasarle `params={{ lang }}`.
 *
 *  `nav.ts` sigue guardando los `to` como paths planos (más legible acá, y
 *  es exactamente lo que ya usaban antes de esta migración) — esta función
 *  es la única responsable de traducirlos al route-id real, en un solo
 *  lugar, para no repetir el mapeo en cada componente que consume
 *  HEADER_NAV/FOOTER_PRODUCT/FOOTER_COMPANY. TypeScript no puede verificar
 *  este mapeo dinámico contra los route-ids literales generados por el
 *  router — el `as any` de abajo es un cast deliberado, seguro porque el
 *  universo de `to` posibles es el puñado fijo de arriba, no input
 *  arbitrario del usuario.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function langLinkProps(to: string | undefined, lang: string): any {
  const path = to && to !== "/" ? to : "";
  return { to: `/{-$lang}${path}`, params: { lang: lang === "en" ? undefined : lang } };
}

/** A nav entry always has a route (`to`, defaults to "/" at the render
 *  site when omitted) and optionally a `hash` — an anchor within that
 *  route, e.g. `{ to: "/about", hash: "contact" }` for /about#contact. */
export type NavEntry = { labelKey: TKey; to?: string; hash?: string };

/** 2026-08-31 feedback — Header's nav is now "Individual · Business ·
 *  Widget · Blog · About us", 5 items, no Contact, no "How it works"
 *  (was a home-page anchor; dropped in favor of the two comparator modes
 *  getting their own top-level entries). Individual/Business reuse the
 *  exact labels ("Individual"/"Business") already live on the in-page
 *  segment toggle (comparator.segment.retail/business,
 *  ComparatorSection.tsx) rather than new copy — same concept, same word,
 *  one key. Individual links to "/" (the retail-default comparator),
 *  Business to "/business" (its own route, defaults to business mode) —
 *  navigation only, this doesn't touch the in-page toggle's own local
 *  state on whichever page it's already showing.
 *  2026-09-04 feedback (ronda 7) — "se puede agregar tambien contact en el
 *  menu de la izquierda" (el drawer que abre el ☰, ver Header.tsx): Contact
 *  ya vive en la columna Company del footer (`FOOTER_COMPANY` abajo),
 *  apuntando a /about#contact (la sección de contacto real de /about, ver
 *  el comment de esa constante) — no una página nueva. Se agrega la misma
 *  entrada acá, mismo target, al final de la lista. */
export const HEADER_NAV: ReadonlyArray<NavEntry> = [
  { to: "/", labelKey: "comparator.segment.retail" },
  { to: "/business", labelKey: "comparator.segment.business" },
  { to: "/widget", labelKey: "home.widget.eyebrow" },
  { to: "/blog", labelKey: "nav.blog" },
  { to: "/about", labelKey: "nav.about" },
  { to: "/about", hash: "contact", labelKey: "nav.contact" },
];

/** 2026-08-31 feedback — Footer's 3 columns:
 *  Product: Individual, Business, Widget (mirrors the header nav's own
 *  first three, same labels/routes — "Comparator"/"Rate alerts" dropped).
 *  Company: About us, Contact, Blog.
 *  Legal: unchanged (Terms of Service, Privacy Policy, Risk Disclosure),
 *  see Footer.tsx's own `legal` array. */
export const FOOTER_PRODUCT: ReadonlyArray<NavEntry> = [
  { to: "/", labelKey: "comparator.segment.retail" },
  { to: "/business", labelKey: "comparator.segment.business" },
  { to: "/widget", labelKey: "home.widget.eyebrow" },
];

export const FOOTER_COMPANY: ReadonlyArray<NavEntry> = [
  { to: "/about", labelKey: "nav.about" },
  // 2026-08-30 feedback — Contact moved off the home page onto /about's
  // own closing section (id="contact" there too), so this now points at
  // /about#contact instead of a home anchor.
  { to: "/about", hash: "contact", labelKey: "nav.contact" },
  { to: "/blog", labelKey: "nav.blog" },
];

/** 2026-09-10 feedback — "que más se podría agregar en la barra
 *  desplegable de la izquierda... legal agrupado al pie": kayak.com's own
 *  ☰ drawer groups a secondary block of utility/legal links below the
 *  main nav, visually smaller and separated by its own hairline — not
 *  mixed into the primary Individual/Business/Widget/Blog/About list.
 *
 *  DRAWER_UTILITY — "Alertas de tasa" (footer.product.rateAlerts) y
 *  "Favoritos" (nav.favorites), cada una con su propia página real
 *  (/rate-alerts, /favorites) en vez de apuntar a "/" como placeholder.
 *  2026-09-29 feedback — "Alertas de tasa" apuntaba a "/" al principio
 *  (honesto pero vacío: la tarjeta real sólo aparece dentro de un
 *  resultado de comparación, aterrizar en home vacío no mostraba nada) —
 *  se le hizo su propia página (ver esa ruta para el porqué completo).
 *
 *  LEGAL_LINKS — Terms/Privacy/Risk, identical targets to Footer.tsx's
 *  own `legal` array (same hashes into /legal) — Header no longer needs
 *  to duplicate that array inline, both read from here now. */
export const DRAWER_UTILITY: ReadonlyArray<NavEntry> = [
  { to: "/rate-alerts", labelKey: "footer.product.rateAlerts" },
  { to: "/favorites", labelKey: "nav.favorites" },
];

export const LEGAL_LINKS: ReadonlyArray<NavEntry> = [
  { to: "/legal", hash: "terms", labelKey: "footer.legal.terms" },
  { to: "/legal", hash: "privacy", labelKey: "footer.legal.privacy" },
  { to: "/legal", hash: "risk", labelKey: "footer.legal.risk" },
];
