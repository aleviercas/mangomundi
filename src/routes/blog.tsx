import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { listBlogPosts, toBlogLocale, type BlogListItem } from "@/lib/blog.functions";
import { getRouteSeo, useI18n } from "@/lib/i18n";
import { hreflangLinks, selfCanonical } from "@/config/site";
import { BrandMark } from "@/components/Wordmark";

const searchSchema = z.object({ lang: z.string().optional() }).catch({});

const listQuery = (locale: string) =>
  queryOptions({
    queryKey: ["blog", "list", locale],
    queryFn: () => listBlogPosts({ data: { locale } }),
  });

export const Route = createFileRoute("/blog")({
  validateSearch: (search) => searchSchema.parse(search),
  loader: async ({ context }) => {
    // SSR the list in the geo-detected language; client refetches live lang.
    const { getInitialLang } = await import("@/lib/geo.functions");
    const detected = await getInitialLang().catch(() => "en" as const);
    await context.queryClient.ensureQueryData(listQuery(toBlogLocale(detected)));
    return { lang: detected };
  },
  head: ({ match, loaderData }) => {
    const canonical = selfCanonical("/blog", match.search.lang);
    const seo = getRouteSeo(loaderData?.lang ?? "en", "/blog");
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }, ...hreflangLinks("/blog")],
    };
  },
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const { t, lang } = useI18n();
  const { data: posts, isLoading } = useQuery(listQuery(toBlogLocale(lang)));

  return (
    <div className="min-h-screen bg-background pb-16 pt-20 sm:pb-20">
      {/* 2026-09-02 feedback — "el ícono se mueve o está en distinta
          posición" entre este listado y un post individual: este wrapper
          usaba py-16 sm:py-20 (64px/80px de padding-top), mientras que
          blog_.$slug.tsx usa pt-20 (80px) fijo — coinciden a partir de sm,
          pero no en mobile (64px acá contra 80px allá), así que el ícono
          (mismo BrandMark, misma fila) aterriza más arriba acá que en un
          post. 64px además queda por debajo de los 66px del header fijo
          (Header.tsx, h-[66px]) — un roce real, no solo estético. Se probó
          pt-28 (112px, el mismo valor que /about y /widget) para unificar,
          pero esas dos páginas tienen una imagen de fondo oscura debajo del
          header que absorbe ese aire visualmente — el blog, sobre fondo
          claro liso, se leía con "mucho espacio en blanco" con el mismo
          valor (2026-09-03 feedback). pt-20 (80px, el mismo número que
          blog_.$slug.tsx ya usaba antes de esa unificación) sigue
          despejando el header con margen (14px) sin ese exceso.
          2026-09-01 feedback — "el ancho de lectura es diferente que el de
          la pagina principal del blog": this listing was max-w-5xl (1024px)
          while the post page (blog_.$slug.tsx) is max-w-3xl (768px) — a
          real inconsistency, the page visibly narrows on every click-
          through. Matched to the post page's width, the narrower of the
          two, since that's the one actually governed by reading-width
          concerns (long-form prose). */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* 2026-08-31 feedback (twice now) — "a la altura de Blog": that
            means the eyebrow line, which literally reads "Blog"
            (home.blog.eyebrow) — not the long h1 sentence below it
            (home.blog.title, "Insights on global FX..."). Putting the icon
            level with the h1 instead put it visibly lower than intended;
            it belongs in this row instead. */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-eyebrow font-bold uppercase text-accent-text">
            {t("home.blog.eyebrow")}
          </p>
          <Link to="/" aria-label="mangomundi home" className="shrink-0">
            <BrandMark />
          </Link>
        </div>
        <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-h1">
          {t("home.blog.title")}
        </h1>

        {isLoading && (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && (posts?.length ?? 0) === 0 && (
          <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
            {t("home.blog.body")}
          </div>
        )}

        {/* 2026-08-31 feedback — full-width horizontal rows, stacked one
            below the other, instead of a 2-column card grid. */}
        <div className="mt-10 flex flex-col divide-y divide-border border-t border-border">
          {(posts ?? []).map((post: BlogListItem) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group flex flex-col gap-5 py-6 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
            >
              {post.cover_url && (
                <img
                  src={post.cover_url}
                  alt=""
                  className="h-44 w-full shrink-0 rounded-2xl object-cover sm:h-32 sm:w-52"
                  loading="lazy"
                />
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                {/* 2026-09-01 feedback — "agregales la fecha y si
                    corresponden a business retail o a ambas": same badges +
                    date the post page itself already renders
                    (blog_.$slug.tsx), just missing from this listing. */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {(post.audience === "business" || post.audience === "both") && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
                      {t("blog.audience.business")}
                    </span>
                  )}
                  {(post.audience === "retail" || post.audience === "both") && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
                      {t("blog.audience.retail")}
                    </span>
                  )}
                  {post.published_at && (
                    <span>
                      {new Date(post.published_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <h2 className="mt-1.5 font-heading text-h3 font-bold text-foreground group-hover:text-brand-cta">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text">
                  {t("home.blog.readMore")} <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
