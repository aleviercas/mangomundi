import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { z } from "zod";
import { ComparatorSection } from "@/sections/ComparatorSection";
import { SITE_URL, hreflangLinks } from "@/config/site";

const compareSearchSchema = z.object({
  origin: z.string().length(2).optional(),
  destination: z.string().length(2).default("US"),
  segment: z.enum(["retail", "business"]).default("retail"),
  from: z.string().length(3).optional(),
  to: z.string().length(3).default("USD"),
  amount: z.coerce.number().positive().default(1000),
  lang: z.string().length(2).optional(),
  // Auto-run flag set by the home widget so the user lands on results directly.
  // Optional on purpose (a .default() would make it required in every typed
  // <Link to="/compare"> across the app). Number, not coerce.boolean (which
  // would turn the string "false" into true).
  run: z.coerce.number().optional(),
});

export const Route = createFileRoute("/compare")({
  validateSearch: (search) => compareSearchSchema.parse(search),
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
    links: [{ rel: "canonical", href: `${SITE_URL}/compare` }, ...hreflangLinks("/compare")],
  }),
  component: ComparePage,
});

function ComparePage() {
  const search = Route.useSearch();
  // Read geo detected by the root route's loader (runs SSR on every request).
  const rootData = useLoaderData({ from: "__root__" }) as {
    geoCountry?: string;
    geoCurrency?: string;
  };
  const geoCountry = rootData?.geoCountry ?? "GB";
  const geoCurrency = rootData?.geoCurrency ?? "GBP";

  // URL params always win; geo is only the default for first-time visitors.
  const initialQuery = {
    origin: search.origin ?? geoCountry,
    destination: search.destination,
    segment: search.segment,
    from: search.from ?? geoCurrency,
    to: search.to,
    amount: search.amount,
    lang: search.lang,
    autoRun: search.run === 1,
  };

  return <ComparatorSection initialQuery={initialQuery} />;
}
