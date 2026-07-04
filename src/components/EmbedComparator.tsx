import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ComparatorSection, type ComparatorQuery } from "@/sections/ComparatorSection";
import { Wordmark } from "@/components/Wordmark";

/**
 * Self-contained comparator for the embeddable widget — the SAME unified box
 * as the home page (basic row + fold-out advanced options + inline results),
 * packed into a fixed-height container that scrolls internally.
 *
 * Used by both the `/embed` iframe route and the home Widget section's live
 * preview, so "what you see is what you embed".
 */
export function EmbedComparator({
  initialCurrency,
  initialAmount,
}: {
  initialCurrency?: string;
  initialAmount?: number;
}) {
  // Presets from the embed's data-*/query params; destination stays empty for
  // the user to pick (the Compare CTA validates).
  const initialQuery: ComparatorQuery = {
    origin: "US",
    destination: "",
    segment: "retail",
    from: initialCurrency ?? "USD",
    to: "USD",
    amount: initialAmount ?? 1000,
  };

  // Down-chevron scroll affordance: shown while there's more content below the
  // fold of the internal scroll region (e.g. a long results list).
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const updateHint = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollHint(el.scrollHeight - el.scrollTop - el.clientHeight > 24);
  };
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const id = requestAnimationFrame(updateHint);
    // Content grows/shrinks inside ComparatorSection (results landing, the
    // advanced fold-out) without this component re-rendering — watch the DOM.
    const mo = new MutationObserver(() => requestAnimationFrame(updateHint));
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(id);
      mo.disconnect();
    };
  }, []);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#fcfcfc]">
      <div
        ref={scrollRef}
        onScroll={updateHint}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4"
      >
        <ComparatorSection embedded initialQuery={initialQuery} />
      </div>

      {showScrollHint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center">
          <span className="animate-bounce rounded-full bg-slate-900/85 p-1.5 text-white shadow-lg">
            <ChevronDown className="h-4 w-4" />
          </span>
        </div>
      )}

      {/* Attribution — required on the free embed; links back to the site. */}
      <a
        href="https://mangomundi.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center justify-center gap-1.5 border-t border-slate-200 bg-white py-2.5 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-700"
      >
        powered by <Wordmark className="text-sm" />
      </a>
    </div>
  );
}
