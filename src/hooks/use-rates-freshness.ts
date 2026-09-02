import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

/** design/Mangomundi 4 - Final.dc.html (line 727-729) — "rates 2 min ago".
 *  Computed from the ONE comparison that actually ran (ComparisonResult
 *  .fetched_at), not a page-wide claim across several corridors — that's
 *  the case design/AJUSTES-1.md §E deliberately dropped as unhonest (see
 *  todaysRoutes.title's comment in i18n.tsx). A single query has a single
 *  real fetch time, so this one is real. Returns null until a result
 *  exists — nothing to be fresh about before that.
 *
 *  Shared by EmbedComparator's own header (pre-2026-09-04) and the widget's
 *  compact results list (CompactResultsList in ComparatorSection.tsx) —
 *  moved here so both read the exact same computation instead of drifting. */
export function useRatesFreshness(fetchedAt: string | null): string | null {
  const { t } = useI18n();
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!fetchedAt) return;
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [fetchedAt]);
  if (!fetchedAt) return null;
  const minutes = Math.max(0, Math.round((Date.now() - new Date(fetchedAt).getTime()) / 60_000));
  return minutes < 1
    ? t("widget.header.ratesJustNow")
    : t("widget.header.ratesMinAgo").replace("{n}", String(minutes));
}
