import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";
import { HomePageBody, type ComparatorQueryChange } from "@/components/HomePageBody";
import type { ComparatorQuery } from "@/sections/ComparatorSection";
import { hreflangLinks, selfCanonical } from "@/config/site";
import { getRouteSeo } from "@/lib/i18n";
import { defaultCounterCurrency } from "@/lib/countries";
import { getBusinessTodaysRoutes } from "@/lib/fx.functions";

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
    // See index.tsx's identical field — the Individual/Business segment
    // switch's explicit override so carrying origin/destination over on a
    // switch doesn't also auto-fire a comparison the user didn't ask for.
    autoRun: z.coerce.boolean().optional().catch(undefined),
  })
  .catch({});

export const Route = createFileRoute("/business")({
  validateSearch: (search) => searchSchema.parse(search),
  // See index.tsx's identical fix comment on its own loader — corridors
  // come back as loaderData (the router's own, always-hydration-safe
  // serialization) rather than through context.queryClient.ensureQueryData,
  // since this app has no queryClient dehydration wired up to carry that
  // cache entry to the client's first render.
  //
  // 2026-09-10 — `lang` sumado acá (mismo patrón que about.tsx) para que
  // head() pueda pasar por getRouteSeo() en vez del title/description
  // hardcodeados en inglés que tenía antes — ver
  // docs/handoff/handoff-2026-09-09-auditoria-seo-completa.md §4.
  loader: async () => {
    const { getInitialLang } = await import("@/lib/geo.functions");
    const [corridors, lang] = await Promise.all([
      getBusinessTodaysRoutes(),
      getInitialLang().catch(() => "en" as const),
    ]);
    return { corridors, lang };
  },
  head: ({ match, loaderData }) => {
    const canonical = selfCanonical("/business", match.search.lang);
    const seo = getRouteSeo(loaderData?.lang ?? "en", "/business");
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
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
  const { corridors } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const initialQuery: ComparatorQuery = {
    origin: search.origin ?? geoCountry,
    destination: search.destination ?? "",
    segment: "business",
    from: search.from ?? geoCurrency,
    to: search.to ?? defaultCounterCurrency(search.from ?? geoCurrency),
    amount: search.amount ?? 1000,
    autoRun: search.autoRun ?? Boolean(search.origin && search.destination),
  };

  // Same one-way state→URL sync as "/" (see its own comment) for the
  // "no corredor completo todavía" case — este route tampoco escribe
  // `segment` de vuelta en su propia URL, ya que estar en /business ya lo
  // dice.
  //
  // 2026-09-10 — mismo fix que index.tsx: con un corredor completo,
  // navega a "/send/:corridor?segment=business" en vez de seguir sobre
  // "/business" (que hoy no tiene ninguna URL indexable por corredor para
  // el segmento business — ver
  // docs/handoff/handoff-2026-09-09-auditoria-seo-completa.md §14). Mismo
  // `push` puntual que index.tsx, mismas razones.
  const handleQueryChange = useCallback(
    (q: ComparatorQueryChange) => {
      if (q.sendingCountry && q.receivingCountry) {
        navigate({
          to: "/send/$corridor",
          params: { corridor: `${q.sendingCountry.toLowerCase()}-${q.receivingCountry.toLowerCase()}` },
          // 2026-09-10 feedback — mismo fix que index.tsx (ver su propio
          // comentario): `run: false` para que esta navegación de fondo no
          // dispare `autoRun` en send.$corridor.tsx antes de un click real
          // en Compare.
          search: { lang: search.lang, amount: q.amount || undefined, segment: "business", run: false },
        });
        return;
      }
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
    [navigate, search.lang],
  );

  return (
    <HomePageBody
      initialQuery={initialQuery}
      onQueryChange={handleQueryChange}
      hideMarketingSections
      businessExtras
      businessTodaysRoutesData={corridors}
    />
  );
}
