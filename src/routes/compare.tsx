import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ComparatorSection } from "@/sections/ComparatorSection";
import { SITE_URL } from "@/config/site";

const compareSearchSchema = z.object({
  origin: z.string().length(2).optional(),
  destination: z.string().length(2).default("US"),
  segment: z.enum(["retail", "business"]).default("retail"),
  from: z.string().length(3).optional(),
  to: z.string().length(3).default("USD"),
  amount: z.coerce.number().positive().default(1000),
  lang: z.string().length(2).optional(),
});

export const Route = createFileRoute("/compare")({
  validateSearch: (search) => compareSearchSchema.parse(search),
  // Server loader: detect visitor country + currency via IP geolocation.
  // Only runs server-side; result is serialized into the page as loaderData.
  // URL params always win over geo defaults (user can override).
  loader: async () => {
    try {
      const { getVisitorGeo } = await import("@/lib/geo.functions");
      const geo = await getVisitorGeo();
      return { geoCountry: geo.country, geoCurrency: geo.currency };
    } catch {
      return { geoCountry: "GB", geoCurrency: "GBP" };
    }
  },
  head: () => ({
    meta: [
      { title: "Compare FX providers — Mangomundi" },
      {
        name: "description",
        content:
          "Compare 30+ FX providers across 100+ currencies in real time. Live mid-market rates, total fees, delivery speed and AI-ranked recommendations.",
      },
      { property: "og:title", content: "Compare FX providers — Mangomundi" },
      {
        property: "og:description",
        content:
          "Live mid-market rates and total-cost rankings across 30+ FX providers, with neutral AI recommendations.",
      },
      { property: "og:url", content: `${SITE_URL}/compare` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/compare` }],
  }),
  component: ComparePage,
});

function ComparePage() {
  const search = Route.useSearch();
  const { geoCountry, geoCurrency } = Route.useLoaderData();

  // URL params win; geo is the fallback for first-time visitors.
  const initialQuery = {
    origin: search.origin ?? geoCountry,
    destination: search.destination,
    segment: search.segment,
    from: search.from ?? geoCurrency,
    to: search.to,
    amount: search.amount,
    lang: search.lang,
  };

  return <ComparatorSection initialQuery={initialQuery} />;
}
