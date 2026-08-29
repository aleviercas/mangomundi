import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getExclusiveCorridors } from "@/lib/fx.functions";

/**
 * "Today's routes, already priced" (design/AJUSTES-1.md §E) — real
 * exclusive-rate corridors, computed server-side from the same comparison
 * logic every search runs on (see getExclusiveCorridors). Long staleTime:
 * these are marketing-band cards, not a live quote — a few minutes of
 * staleness is fine and saves re-running 8 comparisons on every render.
 */
export function useExclusiveCorridors() {
  const fn = useServerFn(getExclusiveCorridors);
  return useQuery({
    queryKey: ["exclusive-corridors"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
  });
}
