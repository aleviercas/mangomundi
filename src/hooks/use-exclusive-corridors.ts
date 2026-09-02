import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getExclusiveCorridors,
  getWidgetExclusiveCorridors,
  getWidgetBusinessTodaysRoutes,
  type ExclusiveCorridor,
} from "@/lib/fx.functions";

/**
 * "Today's routes, already priced" (design/AJUSTES-1.md §E) — real
 * exclusive-rate corridors, computed server-side from the same comparison
 * logic every search runs on (see getExclusiveCorridors). Long staleTime:
 * these are marketing-band cards, not a live quote — a few minutes of
 * staleness is fine and saves re-running 8 comparisons on every render.
 *
 * `initialData` lets a route that already fetched this via its own loader
 * (whose return value the router natively serializes to the client, unlike
 * this query's own cache — there's no queryClient dehydration wired up in
 * this app) hand the exact same array straight to the first render on both
 * server and client. Without it, an SSR-populated render here had nothing
 * matching on the client's first paint (an empty cache, since nothing
 * transfers it across the wire) — a real content mismatch, not just the
 * `Math.random()` case this hook used to also trigger — so React discarded
 * and rebuilt the whole section on hydration. See TodaysRoutesSection.tsx.
 */
export function useExclusiveCorridors(initialData?: ExclusiveCorridor[]) {
  const fn = useServerFn(getExclusiveCorridors);
  return useQuery({
    queryKey: ["exclusive-corridors"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
    initialData,
  });
}

/** Same real data/logic as useExclusiveCorridors above, just a higher cap
 *  (see getWidgetExclusiveCorridors) for the embeddable widget's own
 *  pre-search examples list, which has more room to fill than the home
 *  page's 4-card grid. A separate query key — this legitimately returns a
 *  different (longer) list than useExclusiveCorridors for the same
 *  underlying data, so they can't share a cache entry. */
export function useWidgetExclusiveCorridors() {
  const fn = useServerFn(getWidgetExclusiveCorridors);
  return useQuery({
    queryKey: ["widget-exclusive-corridors"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
  });
}

/** Business-segment sibling of useWidgetExclusiveCorridors above, for the
 *  embeddable widget's own Individual/Business toggle (see
 *  EmbedComparator and getWidgetBusinessTodaysRoutes). */
export function useWidgetBusinessTodaysRoutes() {
  const fn = useServerFn(getWidgetBusinessTodaysRoutes);
  return useQuery({
    queryKey: ["widget-business-todays-routes"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
  });
}
