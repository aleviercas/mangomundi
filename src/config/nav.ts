import type { TKey } from "@/lib/i18n";

/** A nav entry always has a route (`to`, defaults to "/" at the render
 *  site when omitted) and optionally a `hash` — an anchor within that
 *  route, e.g. `{ to: "/about", hash: "contact" }` for /about#contact. */
export type NavEntry = { labelKey: TKey; to?: string; hash?: string };

/** Home-section navigation shared by Footer's "Company" column. Order
 *  matches the page's scroll order so the anchors read top-to-bottom.
 *  "Home" is intentionally absent — the mangomundi wordmark (a
 *  `<Link to="/">` in both places) is the only home affordance.
 *
 *  design/AJUSTES-3.md §B — "For business" and "About" now point at their
 *  own real routes (/business, /about) rather than the home-page anchor:
 *  the doc calls out "For business" by name ("Hoy «For business» no
 *  apunta a /business — es un arreglo de una línea"), and About gets the
 *  same treatment now that /about is a real page (AJUSTES-4 §1) instead
 *  of a redirect stub — the home anchor is still there for anyone
 *  scrolling the page itself, it's just not what the nav link targets
 *  anymore. "Widget" gets the same treatment (2026-08-30 feedback) now
 *  that /widget is a real page too — the home page only has a small
 *  teaser card for it now (WidgetTeaserSection.tsx), not a full section
 *  worth anchoring to. */
export const HOME_NAV: ReadonlyArray<NavEntry> = [
  { hash: "how-it-works", labelKey: "footer.nav.how" },
  { to: "/about", labelKey: "nav.about" },
  { to: "/widget", labelKey: "home.widget.eyebrow" },
  { to: "/business", labelKey: "nav.business" },
  // 2026-08-30 feedback — Contact moved off the home page onto /about's
  // own closing section (id="contact" there too), so this now points at
  // /about#contact instead of a home anchor.
  { to: "/about", hash: "contact", labelKey: "nav.contact" },
  { hash: "blog", labelKey: "nav.blog" },
];

/** design/AJUSTES-2.md §7 (mockup line 252) — Header's own nav, literal
 *  order "How it works · For business · Widget · Blog · About", 5 items,
 *  no Contact. Deliberately separate from HOME_NAV: that one is shared
 *  with Footer and carries Contact plus a different order/label set. */
export const HEADER_NAV: ReadonlyArray<NavEntry> = [
  { hash: "how-it-works", labelKey: "footer.nav.how" },
  { to: "/business", labelKey: "nav.forBusiness" },
  { to: "/widget", labelKey: "home.widget.eyebrow" },
  { hash: "blog", labelKey: "nav.blog" },
  { to: "/about", labelKey: "nav.about" },
];

/** design/AJUSTES-3.md §B — Footer's 3 columns, literal groups/order/labels.
 *  "Local exchange" is deliberately absent from Product: "/exchange" isn't
 *  built yet (redesign decision #5, still true), and §B's own rule for
 *  exactly this case is "sale del footer... un enlace muerto cuesta más
 *  credibilidad que una función que todavía no anunciás" — re-add once
 *  that route is real. */
export const FOOTER_PRODUCT: ReadonlyArray<NavEntry> = [
  { hash: "comparator", labelKey: "footer.product.comparator" },
  { to: "/widget", labelKey: "home.widget.eyebrow" },
  // "Rate alerts" (RateAlertCard) only mounts inside the left rail once a
  // comparison has a result — no stable anchor exists to land on directly,
  // so this points at the comparator itself (where the feature lives)
  // rather than a hash that would silently no-op most of the time.
  { to: "/", labelKey: "footer.product.rateAlerts" },
];

// 2026-08-30 feedback — /how-we-make-money removed (no real copy backed
// it, and the site's only trust page is /about now), so its footer link
// goes with it.
export const FOOTER_COMPANY: ReadonlyArray<NavEntry> = [
  { to: "/about", labelKey: "nav.about" },
  { to: "/business", labelKey: "nav.forBusiness" },
  // 2026-08-30 feedback — Contact moved off the home page onto /about's
  // own closing section (id="contact" there too), so this now points at
  // /about#contact instead of a home anchor.
  { to: "/about", hash: "contact", labelKey: "nav.contact" },
];
