import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { useCallback } from "react";
import { z } from "zod";
import { HomePageBody } from "@/components/HomePageBody";
import type { ComparatorQuery } from "@/sections/ComparatorSection";
import { SITE_URL, hreflangLinks, selfCanonical } from "@/config/site";
import { defaultCounterCurrency } from "@/lib/countries";
import { listBlogPosts, toBlogLocale } from "@/lib/blog.functions";
import { getExclusiveCorridors } from "@/lib/fx.functions";

// `lang` — used to read ?lang= for the self-referencing canonical below (see
// selfCanonical). Reading it via validateSearch — rather than reaching into
// the root route's async loaderData through `matches` — avoids a known
// TanStack Start ordering issue where head() can run before a parent
// route's loader has resolved (search validation happens synchronously
// during route matching, before any loader runs).
//
// The rest (from/to/amount/segment/origin/destination) is the comparator's
// own corridor state, lifted from ComparatorSection's internal useState so a
// comparison is a shareable/bookmarkable URL (design/HANDOFF.md §2 — "el
// estado vive en la URL, no solo en React"). This is Fase A only: reading and
// writing these params on the existing "/" route, no new route files yet
// (see docs/handoff/handoff-2026-08-29-rediseno-mangomundi-4.md §4.5 for
// Fase B, the actual /send/:from-:to and /business routes). Per-field
// `.catch(undefined)` (same pattern as embed.tsx's embedSearchSchema) so one
// garbage param doesn't wipe out the others.
const searchSchema = z
  .object({
    lang: z.string().optional(),
    from: z.string().optional().catch(undefined),
    to: z.string().optional().catch(undefined),
    amount: z.coerce.number().positive().optional().catch(undefined),
    segment: z.enum(["retail", "business"]).optional().catch(undefined),
    origin: z.string().optional().catch(undefined),
    destination: z.string().optional().catch(undefined),
    // 2026-09-03 feedback — the Individual/Business segment switch (see
    // ComparatorSection's handleSegmentChange) navigates here carrying the
    // current amount/currencies/countries over so the form stays filled in
    // — but without this explicit override, autoRun below would derive to
    // true whenever origin+destination are both present, auto-firing a
    // comparison the user never asked for on the new segment. A real
    // shared/bookmarked link (with origin+destination but no explicit
    // autoRun) keeps the old auto-run-on-load behavior; the segment switch
    // sets this to `false` explicitly to suppress it.
    autoRun: z.coerce.boolean().optional().catch(undefined),
  })
  .catch({});

// Same queryKey shape BlogSection.tsx's own useQuery already uses
// (["blog", "list", locale]) — prefetching it here under the identical key
// means BlogSection's hook just reads this already-populated cache entry
// instead of firing its own client-only fetch, with zero changes needed in
// that component. Before this, the "latest posts" preview on the home page
// only ever existed in the client-rendered DOM: a crawler reading the
// server-sent HTML (or anything that doesn't wait for/execute the
// post-hydration fetch) saw no <a href="/blog/..."> links there at all —
// the home page gave no crawlable path into the blog, even though the full
// /blog listing and every individual post already had a proper loader (see
// blog.tsx and blog_.$slug.tsx) and were fine on their own.
const homeBlogListQuery = (locale: string) =>
  queryOptions({
    queryKey: ["blog", "list", locale],
    queryFn: () => listBlogPosts({ data: { locale } }),
  });

export const Route = createFileRoute("/")({
  validateSearch: (search) => searchSchema.parse(search),
  loader: async ({ context }) => {
    const { getInitialLang } = await import("@/lib/geo.functions");
    const detected = await getInitialLang().catch(() => "en" as const);
    // Run both prefetches concurrently — neither depends on the other, and
    // sequencing them would just add their latencies instead of taking the
    // slower of the two.
    //
    // 2026-09-03 feedback — "al abrir el home se comporta raro porque todays
    // routes aparece con delay y se mueve la página al cargar": corridors
    // used to go through context.queryClient.ensureQueryData, same as the
    // blog prefetch above still does. That worked for SSR itself, but this
    // app never wires up queryClient dehydration (no
    // @tanstack/react-router-ssr-query, no manual dehydrate/hydrate
    // anywhere) — so a query populated only in the server's queryClient
    // cache has nothing carrying it to the client's own (fresh, empty) one.
    // The client's first render then had no data where the server had a
    // full section, a real content mismatch, so React discarded and
    // rebuilt the whole section on hydration (visible as the exact "pop in
    // late" symptom this fix was for). Returning it from the loader instead
    // uses the router's own loaderData serialization — which this app
    // already relies on correctly elsewhere (see rootData below) — so both
    // passes render the identical array up front. See TodaysRoutesSection's
    // `initialData` prop.
    const [, corridors] = await Promise.all([
      context.queryClient.ensureQueryData(homeBlogListQuery(toBlogLocale(detected))),
      getExclusiveCorridors(),
    ]);
    return { corridors };
  },
  // Title/description/OG come from the root head, which is per-language
  // (SEO_META). The home just adds its own canonical, og:url, hreflang and
  // JSON-LD so it doesn't re-pin an English-only title over the localized one.
  head: ({ match }) => {
    const canonical = selfCanonical("/", match.search.lang);
    return {
      meta: [
        { property: "og:url", content: canonical },
        // FlexOffers site-ownership verification (Option 1: meta tag) —
        // home page only, per their own instructions, not site-wide.
        { name: "fo-verify", content: "63daa6c1-d68c-4c7a-ae08-7ff9a05df2b3" },
      ],
      links: [{ rel: "canonical", href: canonical }, ...hreflangLinks("/")],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "mangomundi",
            url: `${SITE_URL}/`,
            logo: `${SITE_URL}/brand/icon-512.png`,
            sameAs: [
              "https://www.linkedin.com/company/mangomundi",
              "https://x.com/mangomundi",
              "https://www.facebook.com/people/Mangomundi/61591687365990/",
              "https://www.instagram.com/mangomundi/",
            ],
            description:
              "AI-powered currency exchange comparator — compare exchange rates, fees, routes and delivery speeds across 50+ providers in real time.",
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "mangomundi",
            url: `${SITE_URL}/`,
          }),
        },
      ],
    };
  },
  component: Index,
});

function Index() {
  // Geo defaults for the embedded comparator (same derivation /compare used).
  const rootData = useLoaderData({ from: "__root__" }) as {
    geoCountry?: string;
    geoCurrency?: string;
  };
  const geoCountry = rootData?.geoCountry ?? "GB";
  const geoCurrency = rootData?.geoCurrency ?? "GBP";
  const { corridors } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  // The comparator is THE single box now (basic row + fold-out advanced
  // options live inside it) — no hero widget to bridge, no remount machinery.
  // Destination starts empty (unless the URL already names one) so the user
  // picks it (the CTA validates). A URL corridor wins over the geo-detected
  // one — someone opening a shared /?from=GBP&to=MXN&... link should land on
  // THAT corridor, not their own geo-detected default.
  const geoDefaults: ComparatorQuery = {
    origin: search.origin ?? geoCountry,
    destination: search.destination ?? "",
    segment: search.segment ?? "retail",
    from: search.from ?? geoCurrency,
    to: search.to ?? defaultCounterCurrency(search.from ?? geoCurrency),
    amount: search.amount ?? 1000,
    // A URL that already names a full corridor (shared/bookmarked link) runs
    // the comparison immediately instead of waiting for the user to press
    // Compare again — same intent this prop already had (see its own comment
    // in ComparatorSection.tsx), just never wired to anything until now.
    // `search.autoRun === false` (the segment switch's own explicit override,
    // see the searchSchema's own comment above) wins over that default.
    autoRun: search.autoRun ?? Boolean(search.origin && search.destination),
  };

  // Fase A of design/HANDOFF.md §2 ("el estado vive en la URL, no solo en
  // React") — see docs/handoff/handoff-2026-08-29-rediseno-mangomundi-4.md
  // §4.5. Pure one-way sync: ComparatorSection keeps its own useState as the
  // live source of truth (untouched internally) and just reports its
  // debounced corridor state up here, which pushes it into the URL via
  // `replace` (no history entry per keystroke/selection). This alone makes a
  // comparison shareable/bookmarkable/crawlable — Fase B (real /send/:from-to
  // and /business route files reusing this same synced state) is separate,
  // deliberately not part of this change.
  const handleQueryChange = useCallback(
    (q: {
      from: string;
      to: string;
      amount: number;
      segment: ComparatorQuery["segment"];
      sendingCountry: string;
      receivingCountry: string;
    }) => {
      navigate({
        search: (prev) => ({
          ...prev,
          from: q.from || undefined,
          to: q.to || undefined,
          amount: q.amount || undefined,
          segment: q.segment === "retail" ? undefined : q.segment,
          origin: q.sendingCountry || undefined,
          destination: q.receivingCountry || undefined,
        }),
        replace: true,
      });
    },
    [navigate],
  );

  return (
    <HomePageBody
      initialQuery={geoDefaults}
      onQueryChange={handleQueryChange}
      todaysRoutesData={corridors}
    />
  );
}
