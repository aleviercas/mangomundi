import type { TKey } from "@/lib/i18n";

/** Single source of truth for the home-section navigation, shared by Header
 *  and Footer so both stay identical. Order matches the page's scroll order so
 *  the anchors read top-to-bottom. "Home" is intentionally absent — the
 *  mangomundi wordmark (a `<Link to="/">` in both places) is the only home
 *  affordance. Labels reuse already-translated i18n keys; no new keys. */
export const HOME_NAV: ReadonlyArray<{ hash: string; labelKey: TKey }> = [
  { hash: "how-it-works", labelKey: "footer.nav.how" },
  { hash: "about", labelKey: "nav.about" },
  { hash: "widget", labelKey: "home.widget.eyebrow" },
  { hash: "business", labelKey: "nav.business" },
  { hash: "contact", labelKey: "nav.contact" },
  { hash: "blog", labelKey: "nav.blog" },
];

/** design/AJUSTES-2.md §7 (mockup line 252) — Header's own nav, literal
 *  order "How it works · For business · Widget · Blog · About", 5 items,
 *  no Contact. Deliberately separate from HOME_NAV: that one is shared
 *  with Footer (unchanged, out of scope for this round) and carries
 *  Contact plus a different order/label set. Same anchors, so both navs
 *  still land on the same sections. */
export const HEADER_NAV: ReadonlyArray<{ hash: string; labelKey: TKey }> = [
  { hash: "how-it-works", labelKey: "footer.nav.how" },
  { hash: "business", labelKey: "nav.forBusiness" },
  { hash: "widget", labelKey: "home.widget.eyebrow" },
  { hash: "blog", labelKey: "nav.blog" },
  { hash: "about", labelKey: "nav.about" },
];
