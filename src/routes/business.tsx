import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";
import { HomePageBody, type ComparatorQueryChange } from "@/components/HomePageBody";
import type { ComparatorQuery } from "@/sections/ComparatorSection";
import { hreflangLinks, selfCanonical } from "@/config/site";
import { defaultCounterCurrency } from "@/lib/countries";

// Same shape/rationale as "/"'s searchSchema (design/HANDOFF.md §2, Fase B)
// minus `segment` — this route implies "business" itself. Per-field
// `.catch(undefined)` (same pattern as embed.tsx's embedSearchSchema).
const searchSchema = z
  .object({
    lang: z.string().optional(),
    from: z.string().optional().catch(undefined),
    to: z.string().optional().catch(undefined),
    amount: z.coerce.number().positive().optional().catch(undefined),
    origin: z.string().optional().catch(undefined),
    destination: z.string().optional().catch(undefined),
  })
  .catch({});

export const Route = createFileRoute("/business")({
  validateSearch: (search) => searchSchema.parse(search),
  head: ({ match }) => {
    const canonical = selfCanonical("/business", match.search.lang);
    const title = "Business FX — compare broker rates for high-volume transfers | mangomundi";
    const description =
      "Corporate FX brokers quote negotiated rates above retail volume — spot, forward and option contracts, compared side by side, neutral and free.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }, ...hreflangLinks("/business")],
    };
  },
  component: BusinessPage,
});

function BusinessPage() {
  // Same geo the home page uses (see index.tsx's identical block).
  const rootData = useLoaderData({ from: "__root__" }) as {
    geoCountry?: string;
    geoCurrency?: string;
  };
  const geoCountry = rootData?.geoCountry ?? "GB";
  const geoCurrency = rootData?.geoCurrency ?? "GBP";
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const initialQuery: ComparatorQuery = {
    origin: search.origin ?? geoCountry,
    destination: search.destination ?? "",
    segment: "business",
    from: search.from ?? geoCurrency,
    to: search.to ?? defaultCounterCurrency(search.from ?? geoCurrency),
    amount: search.amount ?? 1000,
    autoRun: Boolean(search.origin && search.destination),
  };

  // Same one-way state→URL sync as "/" (see its own comment) — this route
  // just never writes `segment` back, since being on /business already says it.
  const handleQueryChange = useCallback(
    (q: ComparatorQueryChange) => {
      navigate({
        search: (prev) => ({
          ...prev,
          from: q.from || undefined,
          to: q.to || undefined,
          amount: q.amount || undefined,
          origin: q.sendingCountry || undefined,
          destination: q.receivingCountry || undefined,
        }),
        replace: true,
      });
    },
    [navigate],
  );

  return <HomePageBody initialQuery={initialQuery} onQueryChange={handleQueryChange} />;
}
