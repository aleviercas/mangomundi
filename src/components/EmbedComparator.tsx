import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { HomeSearch } from "@/components/HomeSearch";
import { ComparatorSection, type ComparatorQuery } from "@/sections/ComparatorSection";
import { Wordmark } from "@/components/Wordmark";

/**
 * Self-contained comparator for the embeddable widget — the same flow as the
 * home page (basic COMPARE card + expandable Advanced options + inline
 * results), packed into a single fixed-height box that scrolls internally.
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
  const [query, setQuery] = useState<(ComparatorQuery & { nonce: number }) | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const nonceRef = useRef(0);

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
    // Re-evaluate after the DOM settles when content changes.
    const id = requestAnimationFrame(updateHint);
    return () => cancelAnimationFrame(id);
  }, [query, advancedOpen]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#fcfcfc]">
      <div
        ref={scrollRef}
        onScroll={updateHint}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4"
      >
        <HomeSearch
          initialCurrency={initialCurrency}
          initialAmount={initialAmount}
          onSubmit={(q) => setQuery({ ...q, nonce: ++nonceRef.current })}
          onToggleAdvanced={() => setAdvancedOpen((v) => !v)}
        />
        <div className="mt-3">
          <ComparatorSection
            embedded
            key={query?.nonce ?? 0}
            initialQuery={query ?? undefined}
            showAdvancedCard={advancedOpen}
          />
        </div>
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
