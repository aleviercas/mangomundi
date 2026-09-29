import { useEffect, useState } from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { z } from "zod";
import { getRouteSeo, useI18n, SUPPORTED_LANGS, coerceLang, localeTagForLang } from "@/lib/i18n";
import { hreflangLinks, selfCanonical } from "@/config/site";
import { COUNTRY_BY_CODE } from "@/lib/countries";
import {
  readSavedFavorites,
  removeSavedFavorite,
  type SavedFavorite,
} from "@/sections/ComparatorSection";
import { Heart, ArrowRight } from "lucide-react";

const searchSchema = z.object({ lang: z.string().optional() }).catch({});

export const Route = createFileRoute("/{-$lang}/favorites")({
  validateSearch: (search) => searchSchema.parse(search),
  // Mismo patrón que {-$lang}.legal.tsx: ?lang=xx viejo → 301 a
  // /xx/favorites, params.lang inválido/mal casado → normaliza.
  beforeLoad: ({ params, search }) => {
    if (search.lang) {
      const q = search.lang.toLowerCase();
      const target = (SUPPORTED_LANGS as string[]).includes(q) && q !== "en" ? q : undefined;
      throw redirect({ to: "/{-$lang}/favorites", params: { lang: target }, statusCode: 301 });
    }
    if (params.lang && !(SUPPORTED_LANGS as string[]).includes(params.lang)) {
      const q = params.lang.toLowerCase();
      const target = (SUPPORTED_LANGS as string[]).includes(q) && q !== "en" ? q : undefined;
      throw redirect({ to: "/{-$lang}/favorites", params: { lang: target }, statusCode: 301 });
    }
  },
  head: ({ params }) => {
    const lang = coerceLang(params.lang ?? "en");
    const canonical = selfCanonical("/favorites", lang);
    // "/favorites" no está en SEO_PER_ROUTE (getRouteSeo cae al default de
    // SEO_META[lang], ver su propio comment en i18n.tsx) — está bien para
    // una página personalizada por navegador, no una landing que necesite
    // copy de SEO a medida. `noindex`: el contenido varía 100% por
    // visitante (localStorage) y puede estar vacío — no hay nada acá que
    // valga la pena que un buscador indexe, mismo criterio que
    // embed.tsx/admin.i18n-status.tsx.
    const seo = getRouteSeo(lang, "/favorites");
    return {
      meta: [
        { title: seo.title },
        { name: "robots", content: "noindex, nofollow" },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { name: "twitter:title", content: seo.title },
        { name: "twitter:description", content: seo.description },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }, ...hreflangLinks("/favorites")],
    };
  },
  component: FavoritesPage,
});

/** Agrupa favoritos por corredor (país+país+moneda+moneda+segmento) — el
 *  mismo proveedor guardado dos veces desde el mismo corredor no debería
 *  pasar (la clave del Map en ComparatorSection.tsx es el slug), pero dos
 *  proveedores DISTINTOS guardados desde el mismo corredor sí deben
 *  quedar juntos bajo una sola tarjeta. */
function groupByCorridor(favorites: SavedFavorite[]) {
  const groups = new Map<string, SavedFavorite[]>();
  for (const fav of favorites) {
    const key = `${fav.sendingCountry}|${fav.receivingCountry}|${fav.from}|${fav.to}|${fav.segment}`;
    const list = groups.get(key) ?? [];
    list.push(fav);
    groups.set(key, list);
  }
  // Más reciente primero — el corredor que tocaste últimamente arriba de
  // todo, no un orden arbitrario de inserción.
  return Array.from(groups.values())
    .map((list) => list.sort((a, b) => b.savedAt - a.savedAt))
    .sort((a, b) => b[0].savedAt - a[0].savedAt);
}

function FavoritesPage() {
  const { t, lang } = useI18n();
  const [favorites, setFavorites] = useState<SavedFavorite[] | null>(null);

  // localStorage no existe en el render de servidor — se lee recién en el
  // cliente, después del montaje, mismo patrón que `savedFavorites` en
  // ComparatorSection.tsx (evita un mismatch de hidratación).
  useEffect(() => {
    setFavorites(readSavedFavorites());
  }, []);

  const handleRemove = (slug: string) => {
    setFavorites(removeSavedFavorite(slug));
  };

  const groups = favorites ? groupByCorridor(favorites) : [];

  return (
    <div className="mx-auto max-w-4xl px-5 pt-[46px] pb-20 sm:px-8">
      <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-h1">
        {t("favorites.title")}
      </h1>
      <p className="mt-4 text-base text-muted-foreground">{t("favorites.subtitle")}</p>

      {favorites === null ? null : groups.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-compact border border-border bg-card px-6 py-14 text-center">
          <Heart className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-lg font-semibold text-foreground">{t("favorites.empty.title")}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t("favorites.empty.body")}</p>
          <Link
            {...langLinkPropsHome(lang)}
            className="btn-cta-gradient mt-2 inline-flex items-center gap-1.5 rounded-compact px-4 py-2 text-meta font-semibold"
          >
            {t("favorites.empty.cta")}
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {groups.map((group) => {
            const first = group[0];
            const origin = COUNTRY_BY_CODE[first.sendingCountry];
            const dest = COUNTRY_BY_CODE[first.receivingCountry];
            return (
              <div
                key={`${first.sendingCountry}-${first.receivingCountry}-${first.from}-${first.to}-${first.segment}`}
                className="rounded-compact border border-border bg-card p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2 text-metric font-bold text-foreground">
                    <span className="truncate">
                      {origin?.flag} {origin?.name ?? first.sendingCountry} ({first.from})
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate">
                      {dest?.flag} {dest?.name ?? first.receivingCountry} ({first.to})
                    </span>
                  </div>
                  <span className="shrink-0 rounded-control bg-muted px-2 py-1 text-badge font-semibold text-muted-foreground">
                    {t(`comparator.segment.${first.segment}`)}
                  </span>
                </div>

                <ul className="mt-3 divide-y divide-border">
                  {group.map((fav) => (
                    <li
                      key={fav.slug}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {fav.providerName}
                        </p>
                        <p className="text-badge text-muted-foreground">
                          {t("favorites.savedOn").replace(
                            "{date}",
                            new Date(fav.savedAt).toLocaleDateString(localeTagForLang(lang), {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }),
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(fav.slug)}
                        aria-label={t("comparator.saved.remove")}
                        className="shrink-0 rounded-control p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                      >
                        <Heart className="h-4 w-4 fill-current" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>

                <Link
                  {...langLinkPropsHome(lang)}
                  search={{
                    origin: first.sendingCountry,
                    destination: first.receivingCountry,
                    from: first.from,
                    to: first.to,
                    amount: first.amount,
                    segment: first.segment,
                    autoRun: true,
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 text-meta font-semibold text-brand-cta hover:underline"
                >
                  {t("favorites.viewLive")}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// langLinkProps (config/nav.ts) no acepta `search` en su firma — helper
// local mínimo, sólo para el link a home de esta página.
function langLinkPropsHome(lang: string) {
  return { to: "/{-$lang}" as const, params: { lang: lang === "en" ? undefined : lang } };
}
