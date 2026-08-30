import { cn } from "@/lib/utils";

/** Literal brand palette from design/HANDOFF.md §1 — kept as hex constants
 *  here rather than the site's --accent token, since the wordmark/icon spec
 *  is pixel/colour-exact and must not drift if the general UI accent does. */
const INK = "#241C16";
const MANGO = "#EE5B3E";
const MANGO_LIGHT = "#FF8A6B"; // bicolor mango on a dark background only

/**
 * The mangomundi icon: a single Rubik 700 "m" split by a diagonal thread
 * that starts at the valley between the two humps and runs down at the same
 * angle as the wordmark's italic tails. Ink on the left, mango on the right.
 * Built from two clipped copies of the same glyph (not an SVG trace) so it
 * stays pixel-identical to design/Mangomundi 4 - Final.dc.html, which is
 * the literal reference until the traced SVG exists (see HANDOFF §8).
 */
/** Icon mark alone (no wordmark text) — the badge design/Mangomundi 4 -
 *  Final.dc.html's small "Widget" card uses (line 212, a 36×36 dark
 *  square). 2026-08-30: exported so that one real spot can still use the
 *  icon while Header/Footer go text-only. Font-size controls the whole
 *  glyph's box, same as Wordmark's own sizing. */
export function BrandMark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const ink = tone === "light" ? "#FFFFFF" : INK;
  const mango = tone === "light" ? MANGO_LIGHT : MANGO;
  return (
    <span
      aria-hidden="true"
      className="relative inline-block shrink-0 font-brand font-bold leading-none"
      style={{ fontSize: "1.4em", color: "transparent" }}
    >
      m
      <span
        className="absolute left-0 top-0"
        style={{ color: ink, clipPath: "polygon(0% 0%, 60.8% 0%, 46.8% 100%, 0% 100%)" }}
      >
        m
      </span>
      <span
        className="absolute left-0 top-0"
        style={{ color: mango, clipPath: "polygon(62.8% 0%, 100% 0%, 100% 100%, 48.8% 100%)" }}
      >
        m
      </span>
    </span>
  );
}

interface WordmarkProps {
  className?: string;
  /** Override colour for dark backgrounds (default: ink on light). */
  tone?: "dark" | "light";
  /** Below the 18px bicolor threshold (HANDOFF §1): single ink colour, no
   *  icon mark. Use for tiny lockups like the widget's "powered by" line. */
  compact?: boolean;
}

/**
 * mangomundi wordmark — Rubik 700 lowercase, "ango"/"undi" in true italic
 * (font-style: italic on the loaded Italic family, not transform: skewX —
 * combining both would double-slant the tails). Both "m"s stay upright.
 * "mundi" carries the brand mango colour; below 18px (compact) everything
 * collapses to one ink colour and the icon mark is dropped.
 */
export function Wordmark({ className = "", tone = "dark", compact = false }: WordmarkProps) {
  const ink = tone === "light" ? "#FFFFFF" : INK;
  const mango = tone === "light" ? MANGO_LIGHT : MANGO;
  return (
    <span className={cn("inline-flex items-center gap-[0.4em]", className)}>
      {!compact && <BrandMark tone={tone} />}
      <span
        aria-label="mangomundi"
        className="font-brand lowercase font-bold leading-none"
        style={{ letterSpacing: "-0.025em", color: ink }}
      >
        m<span className="italic">ango</span>
        {compact ? (
          <>
            m<span className="italic">undi</span>
          </>
        ) : (
          <span style={{ color: mango }}>
            m<span className="italic">undi</span>
          </span>
        )}
      </span>
    </span>
  );
}
