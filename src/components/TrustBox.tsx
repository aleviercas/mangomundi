import { useEffect, useRef } from "react";
import { Star } from "lucide-react";

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
 * right above it (a 40px/h-10 button). Dropped to 36px to match — WRONG
 * FIX, reverted the same day once the next round reported the /about
 * instance now looking "cortado abajo" (cut off at the bottom): unlike a
 * regular DOM box, this attribute sets the height of Trustpilot's OWN
 * iframe, which their script uses to lay out its actual logo+stars+text
 * content — squeezing that below what it needs (Trustpilot's own docs and
 * examples for this widget size use 52px) clips their content at the
 * iframe boundary itself, not something fixable from our CSS. Restored to
 * 52px; the rail card that looked "too tall" next to a button now just
 * gives the widget the room it actually needs instead of fighting it (see
 * TrustpilotCard's own updated comment in ComparatorSection.tsx).
 *
 * 2026-09-02 feedback — "el botón de trustpilot del rail está mal": every
 * fix so far assumed the widget was actually converting to Trustpilot's
 * real logo+stars iframe and only its BOX needed adjusting. But the one
 * state this sandbox can always render and verify is the fallback —
 * before the bootstrap script runs (this sandbox has no network path to
 * trustpilot.com at all, so it never runs here) — and that fallback was a
 * completely unstyled `<a>Trustpilot</a>`: default blue underlined link
 * text in a padded box. That reads as broken regardless of alignment. A
 * real production pageview can hit this same state too (slow network, an
 * ad/tracker blocker, the one-time DOM-scan timing issue described
 * above) — this fallback was never given real button styling for that
 * case. Styled as a small badge (star icon + label, bordered pill,
 * Trustpilot's own brand green) so it reads as an intentional link even
 * when their script never takes over.
 *
 * 2026-09-03 feedback — Trustpilot alignment complaints keep recurring next
 * to 52px buttons (AboutManifestoSection's "About us" CTA is h-[52px]
 * specifically to match data-style-height below). Verified in a throwaway
 * test route with a stand-in 52px element (this sandbox has no path to
 * trustpilot.com to load the real script) that the intended mechanism DOES
 * line the two up once conversion happens — so at the time, the fallback
 * link (the one state actually renderable/verifiable here) looked like the
 * likely culprit instead: `py-1.5` plus a 13px text line sizes it to
 * roughly 32px, well short of the 52px neighboring buttons are sized to
 * match. Fixed to `h-[52px]` so the fallback's own box is always that
 * height regardless of whether Trustpilot's script takes over.
 *
 * 2026-09-03 feedback (second round), now with a real screenshot of the
 * REAL converted widget for the first time — "ahora quedo muy arriba,
 * antes estaba muy abajo": the fallback fix above was real but not the
 * whole story. `data-style-height="52px"` sets Trustpilot's own DIV to
 * 52px, but their script renders the actual logo+stars content inside
 * that div top-anchored, not vertically centered within it — so once the
 * div itself is exactly 52px (matching the button, `items-center` on the
 * row has nothing left to center), the shorter VISIBLE content inside
 * still sits flush at the top of that box, reading as "too high" next to
 * a button whose own text truly does fill its full height. Wrapping the
 * raw widget div in our own `flex h-[52px] items-center` container fixes
 * this regardless of what Trustpilot does internally: if their div ends
 * up shorter than 52px for any reason, this wrapper centers it instead of
 * leaving it pinned to the top of a taller implicit box; if it fills the
 * full 52px, the wrapper is a no-op. Either way, centering now happens at
 * a layer this codebase actually controls instead of relying on Trustpilot's
 * own iframe content to center itself, which it apparently doesn't. */
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
    <div className="flex h-[52px] items-center">
      <div
        ref={ref}
        className="trustpilot-widget"
        data-locale="en-US"
        data-template-id="56278e9abfbbba0bdcd568bc"
        data-businessunit-id="6a7a14b6f29ac72f7bd2792e"
        data-style-height="52px"
        data-style-width="auto"
        data-token="ef14895d-6018-44c4-9b24-4bb39ed6b2e5"
      >
        <a
          href="https://www.trustpilot.com/review/mangomundi.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-[52px] items-center gap-1.5 rounded-md border border-[#00b67a]/30 bg-[#00b67a]/[.08] px-2.5 text-[13px] font-bold text-[#00b67a] no-underline transition hover:bg-[#00b67a]/[.14]"
        >
          <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
          Trustpilot
        </a>
      </div>
    </div>
  );
}
