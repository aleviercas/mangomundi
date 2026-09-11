import { createFileRoute, redirect, useLoaderData } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";
import { HomePageBody, type ComparatorQueryChange } from "@/components/HomePageBody";
import type { ComparatorQuery } from "@/sections/ComparatorSection";
import { hreflangLinks, selfCanonical } from "@/config/site";
import { resolveRouteCode, primaryCountryForCurrency } from "@/lib/countries";
import { SUPPORTED_LANGS, coerceLang } from "@/lib/i18n";

const searchSchema = z
  .object({
    lang: z.string().optional(),
    // 2026-09-10 — antes ignorados por completo (siempre amount:1000,
    // segment:"retail" hardcodeados abajo). Sin esto, llegar acá desde "/"
    // o "/business" con un monto/segmento ya elegido se perdía en el
    // camino — ver docs/handoff/handoff-2026-09-09-auditoria-seo-completa.md
    // §14, paso 2. Mismo patrón .catch(undefined) que "/" y "/business".
    amount: z.coerce.number().positive().optional().catch(undefined),
    segment: z.enum(["retail", "business"]).optional().catch(undefined),
    // 2026-09-10 feedback — "no me mandes a comparar hasta que haga click
    // en compare, cuando estoy en el home... me esta llevando automatico":
    // el sync debounceado de ComparatorSection (300ms después de elegir
    // ambos países) ya navegaba PARA ACÁ vía `handleQueryChange` en
    // index.tsx, sin que el usuario hubiera tocado el botón — y esta ruta
    // corría la comparación sola al llegar (`autoRun: true` fijo, abajo),
    // pensado para el caso real de un link compartido/resultado de
    // búsqueda externo, no para ese sync de fondo. `run` es la señal
    // explícita que distingue los dos casos: index.tsx la manda en `false`
    // en esa navegación de fondo (ver su propio comentario); una llegada
    // externa genuina (alguien pega/comparte "/send/gb-mx" sin este
    // parámetro) sigue sin necesitarla — `search.run ?? true` más abajo
    // mantiene el default viejo para ese caso.
    run: z.coerce.boolean().optional().catch(undefined),
    // 2026-09-10 feedback — "el boton de compartir... hacer como hace
    // kayak, que en el link te manda a los resultados del comparador y
    // pone primero la que te compartieron y dice shared rate": el slug
    // del proveedor compartido (ver ProviderRow's handleShare en
    // ComparatorSection.tsx) — lee acá y se pasa como
    // `initialQuery.sharedSlug`.
    shared: z.string().optional().catch(undefined),
  })
  .catch({});

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

export const Route = createFileRoute("/{-$lang}/send/$corridor")({
  validateSearch: (search) => searchSchema.parse(search),
  // Bad slug ("/send/nonsense") → home, rather than a dead-end page. Runs
  // before head()/component, so both can safely assume params.corridor parses.
  //
  // 2026-09-10 — también normaliza acá la ÚNICA forma canónica del
  // corredor (país-país en minúsculas, la misma que ya genera
  // handleQueryChange más abajo para navegar entre corredores). Antes de
  // este fix, "/send/gb-mx", "/send/gbp-mxn" y "/send/GB-MX" resolvían al
  // mismo origin/destination/from/to (contenido 100% idéntico) pero cada
  // una se autocanonicalizaba a sí misma — confirmado con el código y con
  // el propio historial del proyecto (ver
  // docs/handoff/handoff-2026-09-09-auditoria-seo-completa.md §13). Un 301
  // real (no sólo un <link rel="canonical">) consolida todas esas
  // variantes en una sola URL indexable, igual que ya se hace con las 7
  // rutas legacy (§2 del mismo documento).
  //
  // 2026-09-10 (segunda vuelta) — sumado acá el mismo 301 de idioma que el
  // resto de las rutas migradas (?lang=xx viejo → /xx/send/:corridor,
  // params.lang inválido → sin prefijo). Un slug no-canónico Y un idioma
  // viejo a la vez redirige directo a la forma final correcta en un solo
  // salto, no en dos.
  beforeLoad: ({ params, search }) => {
    const parsed = parseCorridor(params.corridor);
    if (!parsed) throw redirect({ to: "/{-$lang}", params: { lang: params.lang }, statusCode: 301 });
    const canonicalSlug = `${parsed.origin.toLowerCase()}-${parsed.destination.toLowerCase()}`;

    let targetLang = params.lang;
    let targetSearch = search;
    if (search.lang) {
      const q = search.lang.toLowerCase();
      targetLang = (SUPPORTED_LANGS as string[]).includes(q) && q !== "en" ? q : undefined;
      const { lang: _drop, ...rest } = search;
      targetSearch = rest;
    } else if (params.lang && !(SUPPORTED_LANGS as string[]).includes(params.lang)) {
      targetLang = undefined;
    }

    if (params.corridor !== canonicalSlug || targetLang !== params.lang || targetSearch !== search) {
      throw redirect({
        to: "/{-$lang}/send/$corridor",
        params: { lang: targetLang, corridor: canonicalSlug },
        search: targetSearch,
        statusCode: 301,
      });
    }
  },
  head: ({ params, match }) => {
    const parsed = parseCorridor(params.corridor);
    if (!parsed) return {}; // unreachable in practice — beforeLoad already redirected
    const lang = coerceLang(params.lang ?? "en");
    const path = `/send/${params.corridor}`;
    const canonical = selfCanonical(path, lang);
    // Currency codes, not translated copy — safe to use as-is in every
    // language's version of this page (design/HANDOFF.md's own i18n
    // discipline: don't invent translated marketing copy outside a
    // reviewed batch — see decision 8 in docs/handoff/
    // handoff-2026-08-29-rediseno-mangomundi-4.md §4).
    const title = `Compare ${parsed.from} to ${parsed.to} exchange rates — mangomundi`;
    const description =
      match.search.segment === "business"
        ? `Corporate FX rates and transfer fees from ${parsed.from} to ${parsed.to}, compared across every mangomundi broker. No sign-up.`
        : `Real-time exchange rates and transfer fees from ${parsed.from} to ${parsed.to}, compared across every mangomundi provider. No sign-up.`;
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
  const { corridor, lang } = Route.useParams();
  const search = Route.useSearch();
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
    segment: search.segment ?? "retail",
    from: parsed.from,
    to: parsed.to,
    amount: search.amount ?? 1000,
    // Arriving at a named corridor (a shared link, or a search result) means
    // seeing it compared immediately, not pressing Compare again — salvo que
    // `run` diga explícitamente lo contrario (ver el comentario de `run` en
    // el searchSchema, arriba): la navegación de fondo desde "/" antes de
    // que el usuario haga click en Compare llega con `run: false`.
    autoRun: search.run ?? true,
    sharedSlug: search.shared,
  };

  // Unlike "/" and "/business" (query-string sync), this route's corridor
  // lives in the PATH — so a country change navigates to a new
  // /send/:corridor rather than patching search params. Amount/segment
  // (2026-09-10: now tracked, see the searchSchema comment above) travel
  // along as query params on whichever /send/:corridor URL is current.
  const handleQueryChange = useCallback(
    (q: ComparatorQueryChange) => {
      const nextCorridor = `${q.sendingCountry.toLowerCase()}-${q.receivingCountry.toLowerCase()}`;
      const nextSearch = {
        amount: q.amount || undefined,
        segment: q.segment === "retail" ? undefined : q.segment,
      };
      if (nextCorridor === corridor.toLowerCase()) {
        navigate({ search: nextSearch, replace: true });
        return;
      }
      navigate({
        to: "/{-$lang}/send/$corridor",
        params: { lang, corridor: nextCorridor },
        search: nextSearch,
        replace: true,
      });
    },
    [navigate, corridor, lang],
  );

  return (
    <HomePageBody
      initialQuery={initialQuery}
      onQueryChange={handleQueryChange}
      // 2026-09-10 — mismo criterio de i18n que el title/description de
      // arriba (códigos de moneda, no copy traducido — safe en cualquier
      // idioma). Antes el <h1> de esta página era idéntico al de la home
      // en cualquier idioma, sin mencionar el corredor específico, aunque
      // el <title> sí lo hace — ver
      // docs/handoff/handoff-2026-09-09-auditoria-seo-completa.md §5.
      heroHeadline={`Compare ${parsed.from} to ${parsed.to} exchange rates`}
    />
  );
}
