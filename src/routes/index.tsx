import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { z } from "zod";
import { HeroSection } from "@/sections/HeroSection";
import { ComparatorSection, type ComparatorQuery } from "@/sections/ComparatorSection";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { AboutManifestoSection } from "@/sections/AboutManifestoSection";
import { EmbedWidgetSection } from "@/sections/EmbedWidgetSection";
import { BusinessSection } from "@/sections/BusinessSection";
import { ContactSection } from "@/sections/ContactSection";
import { BlogSection } from "@/sections/BlogSection";
import { SITE_URL, hreflangLinks, selfCanonical } from "@/config/site";
import { defaultCounterCurrency } from "@/lib/countries";
import { listBlogPosts, toBlogLocale } from "@/lib/blog.functions";

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
    await context.queryClient.ensureQueryData(homeBlogListQuery(toBlogLocale(detected)));
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
    autoRun: Boolean(search.origin && search.destination),
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

  // Drives the Kayak/Skyscanner-style "search mode" swap: once a comparison
  // has a result, the hero collapses and the comparator card (see its own
  // `result && !embedded` check) sticks under the header — same content,
  // just no longer competing with the results list for the first screenful.
  const [hasResult, setHasResult] = useState(false);

  return (
    <>
      <HeroSection compact={hasResult} />
      <ComparatorSection
        initialQuery={geoDefaults}
        onHasResultChange={setHasResult}
        onQueryChange={handleQueryChange}
      />
      <HowItWorksSection />
      <AboutManifestoSection />
      <EmbedWidgetSection />
      <BusinessSection />
      <ContactSection />
      <BlogSection />
    </>
  );
}
