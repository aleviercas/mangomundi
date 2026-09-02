import { createFileRoute, redirect, useLoaderData } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";
import { HomePageBody, type ComparatorQueryChange } from "@/components/HomePageBody";
import type { ComparatorQuery } from "@/sections/ComparatorSection";
import { hreflangLinks, selfCanonical } from "@/config/site";
import { resolveRouteCode, primaryCountryForCurrency } from "@/lib/countries";

const searchSchema = z.object({ lang: z.string().optional() }).catch({});

interface ParsedCorridor {
  origin: string;
  destination: string;
  from: string;
  to: string;
}

/**
 * Parses a "/send/:corridor" slug like "gb-mx" (country-country, the exact
 * example in design/HANDOFF.md §2) or "gbp-mxn" (currency-currency) — reuses
 * resolveRouteCode(), the same parser the AI chat's own
 * `[[SUGGEST_COMPARE:FROM-TO]]` tag already goes through (fx.functions.ts),
 * so a hand-typed route and an agent-suggested one resolve identically.
 * Returns null for anything that isn't exactly two non-empty parts, or
 * whose currency can't be traced back to a country.
 */
function parseCorridor(corridor: string): ParsedCorridor | null {
  const parts = corridor.toLowerCase().split("-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const fromSide = resolveRouteCode(parts[0]);
  const toSide = resolveRouteCode(parts[1]);
  const origin = fromSide.country ?? primaryCountryForCurrency(fromSide.currency);
  const destination = toSide.country ?? primaryCountryForCurrency(toSide.currency);
  if (!origin || !destination) return null;
  return { origin, destination, from: fromSide.currency, to: toSide.currency };
}

export const Route = createFileRoute("/send/$corridor")({
  validateSearch: (search) => searchSchema.parse(search),
  // Bad slug ("/send/nonsense") → home, rather than a dead-end page. Runs
  // before head()/component, so both can safely assume params.corridor parses.
  beforeLoad: ({ params }) => {
    if (!parseCorridor(params.corridor)) throw redirect({ to: "/" });
  },
  head: ({ params, match }) => {
    const parsed = parseCorridor(params.corridor);
    if (!parsed) return {}; // unreachable in practice — beforeLoad already redirected
    const path = `/send/${params.corridor}`;
    const canonical = selfCanonical(path, match.search.lang);
    // Currency codes, not translated copy — safe to use as-is in every
    // language's version of this page (design/HANDOFF.md's own i18n
    // discipline: don't invent translated marketing copy outside a
    // reviewed batch — see decision 8 in docs/handoff/
    // handoff-2026-08-29-rediseno-mangomundi-4.md §4).
    const title = `Compare ${parsed.from} to ${parsed.to} exchange rates — mangomundi`;
    const description = `Real-time exchange rates and transfer fees from ${parsed.from} to ${parsed.to}, compared across every mangomundi provider. No sign-up.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }, ...hreflangLinks(path)],
    };
  },
  component: SendCorridorPage,
});

function SendCorridorPage() {
  const { corridor } = Route.useParams();
  const navigate = Route.useNavigate();
  // Same defensive fallback as head() — beforeLoad already guarantees this
  // parses by the time the component mounts.
  const parsed = parseCorridor(corridor) ?? {
    origin: "GB",
    destination: "MX",
    from: "GBP",
    to: "MXN",
  };

  const initialQuery: ComparatorQuery = {
    origin: parsed.origin,
    destination: parsed.destination,
    segment: "retail",
    from: parsed.from,
    to: parsed.to,
    amount: 1000,
    // Arriving at a named corridor (a shared link, or a search result) means
    // seeing it compared immediately, not pressing Compare again.
    autoRun: true,
  };

  // Unlike "/" and "/business" (query-string sync), this route's corridor
  // lives in the PATH — so a country change navigates to a new
  // /send/:corridor rather than patching search params. Amount/currency
  // overrides aren't tracked here, matching design/HANDOFF.md §2's own
  // routes table (only :from-:to is part of this path).
  const handleQueryChange = useCallback(
    (q: ComparatorQueryChange) => {
      const nextCorridor = `${q.sendingCountry.toLowerCase()}-${q.receivingCountry.toLowerCase()}`;
      if (nextCorridor === corridor.toLowerCase()) return;
      navigate({ to: "/send/$corridor", params: { corridor: nextCorridor }, replace: true });
    },
    [navigate, corridor],
  );

  return <HomePageBody initialQuery={initialQuery} onQueryChange={handleQueryChange} />;
}
