import type { TKey } from "@/lib/i18n";

/** A nav entry always has a route (`to`, defaults to "/" at the render
 *  site when omitted) and optionally a `hash` — an anchor within that
 *  route, e.g. `{ to: "/about", hash: "contact" }` for /about#contact. */
export type NavEntry = { labelKey: TKey; to?: string; hash?: string };

/** design/AJUSTES-2.md §7 (mockup line 252) — Header's own nav, literal
 *  order "How it works · For business · Widget · Blog · About", 5 items,
 *  no Contact.
 *
 *  Navigation architecture (2026-08-30 feedback, second round — audited
 *  for SEO: real routes get real URLs in the nav, anchors stay for content
 *  that lives on the page it's reached from):
 *  - How it works: stays a home-page anchor (`hash`) — it's a section of
 *    the home page, not a page of its own, same as the comparator itself.
 *  - For business, Widget, About: real standalone routes — each already
 *    had one before this audit (design/AJUSTES-3.md §B, §A's own follow-up
 *    for Widget), unchanged here.
 *  - Blog: was `{ hash: "blog" }` (scrolled to the home page's teaser
 *    section) even though a real, indexable /blog listing route already
 *    exists (routes/blog.tsx) — the nav should send crawlers and visitors
 *    to that real page, not bury it behind a home anchor. Fixed to
 *    `{ to: "/blog" }`; the home page keeps its own "From the blog" teaser
 *    section regardless (its own "All articles" link already points at
 *    /blog too), it's just no longer what this nav link targets. */
export const HEADER_NAV: ReadonlyArray<NavEntry> = [
  { hash: "how-it-works", labelKey: "footer.nav.how" },
  { to: "/business", labelKey: "nav.forBusiness" },
  { to: "/widget", labelKey: "home.widget.eyebrow" },
  { to: "/blog", labelKey: "nav.blog" },
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
