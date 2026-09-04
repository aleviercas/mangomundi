import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProviderCounts } from "@/lib/fx.functions";

/**
 * Single shared source for "N providers · retail rates" / "N brokers ·
 * negotiated rates" style copy (design/HANDOFF.md §2/§4) — every caller
 * gets the same cached query (React Query dedupes by queryKey), so this is
 * one network request feeding every place that shows the number, never a
 * hardcoded figure copied into each screen. Counts change rarely (a
 * provider gets researched and activated, not every visit), hence the long
 * staleTime.
 */
export function useProviderCounts() {
  const fn = useServerFn(getProviderCounts);
  return useQuery({
    queryKey: ["provider-counts"],
    queryFn: () => fn(),
    staleTime: 10 * 60_000,
  });
}
