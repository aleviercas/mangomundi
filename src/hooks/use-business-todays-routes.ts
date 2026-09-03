import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBusinessTodaysRoutes, type ExclusiveCorridor } from "@/lib/fx.functions";

/**
 * Business-segment sibling of useExclusiveCorridors (see its own comment,
 * `initialData` included) — same real getBusinessTodaysRoutes call,
 * business-segment provider pricing at a real business-scale amount instead
 * of retail's 1,000-unit reference.
 */
export function useBusinessTodaysRoutes(initialData?: ExclusiveCorridor[]) {
  const fn = useServerFn(getBusinessTodaysRoutes);
  return useQuery({
    queryKey: ["business-todays-routes"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
    initialData,
  });
}
