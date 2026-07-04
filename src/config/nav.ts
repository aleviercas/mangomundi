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
