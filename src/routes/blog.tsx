import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { listBlogPosts, toBlogLocale, type BlogListItem } from "@/lib/blog.functions";
import { useI18n } from "@/lib/i18n";
import { hreflangLinks, selfCanonical } from "@/config/site";

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
    const detected = await getInitialLang().catch(() => "en");
    return context.queryClient.ensureQueryData(listQuery(toBlogLocale(detected)));
  },
  head: ({ match }) => {
    const canonical = selfCanonical("/blog", match.search.lang);
    return {
      meta: [
        { title: "Blog — Mangomundi" },
        {
          name: "description",
          content:
            "Guides and analysis on cross-border payments, FX rates, corridor economics and smarter money transfers — from the Mangomundi team.",
        },
        { property: "og:title", content: "Blog — Mangomundi" },
        {
          property: "og:description",
          content:
            "Guides and analysis on cross-border payments, FX rates and smarter money transfers.",
        },
        { property: "og:url", content: canonical },
      ],
      links: [
        { rel: "canonical", href: canonical },
        ...hreflangLinks("/blog"),
      ],
    };
  },
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const { t, lang } = useI18n();
  const { data: posts, isLoading } = useQuery(listQuery(toBlogLocale(lang)));

  return (
    <div className="min-h-screen bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">
          {t("home.blog.eyebrow")}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
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

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {(posts ?? []).map((post: BlogListItem) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
            >
              {post.cover_url && (
                <img
                  src={post.cover_url}
                  alt=""
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="flex flex-1 flex-col p-6">
                <h2 className="font-heading text-lg font-bold text-foreground group-hover:text-[#ff6b5b]">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ff6b5b]">
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
