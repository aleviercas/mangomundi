import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Trustpilot?: { loadFromElement: (el: Element, force?: boolean) => void };
  }
}

/**
 * Trustpilot "Review Collector" TrustBox — invites a visitor to leave a
 * review for mangomundi.com directly on the site, no email step involved
 * (unlike AFS, which needs an outbound customer email to BCC — something
 * this site doesn't send yet). The bootstrap script that actually renders
 * this (see TrustpilotBootstrap in routes/__root.tsx) is loaded once,
 * site-wide; this component just renders the target div wherever it's used.
 *
 * The `data-token`, `data-businessunit-id`, and `data-template-id` values
 * are specific to mangomundi's Trustpilot business account — copied as-is
 * from the snippet in the Trustpilot dashboard, not something to invent or
 * guess if this ever needs to move.
 *
 * Fixed height (data-style-height) reserves the space up front, so this
 * doesn't reintroduce the kind of layout shift fixed elsewhere on the site
 * (see BlogSection's skeleton loader for the same concern with different
 * async content).
 *
 * 2026-08-31 feedback — "queda descentrado del contenido de adentro" (the
 * rail's TrustpilotCard): `data-style-width="100%"` stretches the widget's
 * iframe to the full width of whatever card it's in, but the actual
 * logo+stars content Trustpilot renders inside it is a fixed, narrower
 * width, left-anchored by their own internal layout — against a wide card
 * that reads as sitting off to the side rather than centered. `"auto"`
 * (Trustpilot's own documented alternative) sizes the widget to its real
 * content instead, so a flex/justify-center wrapper around it (both call
 * sites now do this) actually centers something narrower than the card.
 * Not verified against the live widget in this sandbox — no network path
 * to trustpilot.com here to confirm the rendered result.
 *
 * 2026-08-31 feedback — "no se ve el original, solo la letra Trustpilot sin
 * formato": Trustpilot's bootstrap script only scans the DOM for
 * `.trustpilot-widget` elements once, right when it finishes loading. In an
 * SPA, this widget almost never exists in the DOM at that exact moment — it
 * mounts whenever React gets around to it (which page you land on, any
 * client-side nav, any conditional render gated on async data like
 * TodaysRoutesSection's). Once that one scan is over, an unconverted widget
 * never gets a second chance and just sits there as the raw fallback link.
 * Trustpilot's own fix for SPAs is calling `Trustpilot.loadFromElement`
 * manually — done here with a bounded retry since the bootstrap script
 * (loaded `async`, elsewhere in the document) may not have finished
 * executing yet when this effect first runs.
 *
 * 2026-09-01 feedback, with a real screenshot of the live widget for the
 * first time — "el botón de trustpilot del rail sigue quedando raro": at
 * 52px tall plus the rail card's own 14px top/bottom padding, the
 * rendered box came out roughly double the height of "Set a rate alert"
 * right above it (a 40px/h-10 button) — a real size mismatch, not an
 * alignment one. Dropped to 36px, closer to that button's height; both
 * call sites (this rail card, /about's ContactSection) already wrap this
 * in their own centering box, so a shorter widget just centers more
 * comfortably rather than needing anything else adjusted. */
export function TrustBox() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let attempts = 0;
    const tryLoad = () => {
      if (window.Trustpilot) {
        window.Trustpilot.loadFromElement(el, true);
        return true;
      }
      return false;
    };
    if (tryLoad()) return;
    const id = window.setInterval(() => {
      attempts += 1;
      if (tryLoad() || attempts >= 20) window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      ref={ref}
      className="trustpilot-widget"
      data-locale="en-US"
      data-template-id="56278e9abfbbba0bdcd568bc"
      data-businessunit-id="6a7a14b6f29ac72f7bd2792e"
      data-style-height="36px"
      data-style-width="auto"
      data-token="ef14895d-6018-44c4-9b24-4bb39ed6b2e5"
    >
      <a
        href="https://www.trustpilot.com/review/mangomundi.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        Trustpilot
      </a>
    </div>
  );
}
