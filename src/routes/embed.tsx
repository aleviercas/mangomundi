import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { z } from "zod";
import { EmbedComparator } from "@/components/EmbedComparator";

// Embeddable widget target — loaded inside a third-party iframe by widget.js
// (or a hand-written <iframe>). Renders bare (no Header/Footer; see
// __root.tsx) so it drops cleanly into any host page.
// Per-field `.catch(undefined)` keeps the shape a clean {currency?, amount?,
// lang?} (an object-level .catch({}) would union in {} and drop the fields'
// types) while still swallowing garbage params.
const embedSearchSchema = z.object({
  currency: z.string().optional().catch(undefined),
  amount: z.coerce.number().positive().optional().catch(undefined),
  lang: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/embed")({
  validateSearch: (search) => embedSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Currency comparison widget — mangomundi" },
      // An embed target is not a standalone page; keep it out of the index.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EmbedPage,
});

function EmbedPage() {
  const { currency, amount } = Route.useSearch();
  // Same geo the home page uses (computed once in __root.tsx's loader from
  // the visitor's real IP) — an iframe embed is still a direct request from
  // the visitor's browser to mangomundi.com, so this is accurate even on a
  // third-party host page. Previously this route ignored it entirely and
  // EmbedComparator defaulted to a hardcoded US/USD.
  const rootData = useLoaderData({ from: "__root__" }) as {
    geoCountry?: string;
    geoCurrency?: string;
  };
  return (
    <div className="h-screen w-full">
      <EmbedComparator
        initialCurrency={currency}
        initialAmount={amount}
        geoCountry={rootData?.geoCountry}
        geoCurrency={rootData?.geoCurrency}
      />
    </div>
  );
}
