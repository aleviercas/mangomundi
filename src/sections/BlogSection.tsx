import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { listBlogPosts, toBlogLocale, type BlogListItem } from "@/lib/blog.functions";
import { useI18n } from "@/lib/i18n";

export function BlogSection() {
  const { t, lang } = useI18n();
  const locale = toBlogLocale(lang);
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog", "list", locale],
    queryFn: () => listBlogPosts({ data: { locale } }),
    staleTime: 5 * 60_000,
  });
  const latest = (posts ?? []).slice(0, 3);

  return (
    <section id="blog" className="scroll-mt-24 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              {t("home.blog.eyebrow")}
            </p>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              {t("home.blog.title")}
            </h2>
          </div>
        </div>

        {isLoading ? (
          // Skeleton, not the empty-state placeholder — this section's data
          // is fetched client-side only (no server loader/prefetch, see
          // route index.tsx), so on every first visit this renders for
          // real, however briefly. Sized to match the real 3-card grid as
          // closely as possible (same h-40 image block, same title/excerpt
          // line count) specifically so swapping skeleton → real content
          // doesn't change this section's height and push the Stats/CTA/
          // Contact sections below it down — that swap, when it rendered
          // the much-shorter "coming soon" placeholder instead while
          // loading, was a real, measured contributor to Desktop's CLS
          // (Vercel Speed Insights: 0.51, "Needs Improvement" — Mobile
          // was already 0, most likely because taller single-column mobile
          // layouts push this section below the viewport before the query
          // resolves, while desktop's shorter multi-column layout doesn't).
          <div aria-hidden className="grid animate-pulse gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="h-40 w-full bg-muted" />
                <div className="flex flex-col gap-3 p-6">
                  <div className="h-5 w-4/5 rounded bg-muted" />
                  <div className="h-5 w-2/5 rounded bg-muted" />
                  <div className="mt-1 h-3.5 w-full rounded bg-muted" />
                  <div className="h-3.5 w-full rounded bg-muted" />
                  <div className="h-3.5 w-2/3 rounded bg-muted" />
                  <div className="mt-1 h-4 w-24 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : latest.length === 0 ? (
          // Quiet placeholder — the section heading already carries the
          // "coming soon" message, so this stays light (no repeated title, no
          // heavy dark card competing with the Widget section above it).
          <div className="rounded-2xl border border-dashed border-border bg-muted/60 px-6 py-10 text-center sm:py-12">
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              {t("home.blog.body")}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((post: BlogListItem) => (
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
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-accent">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                      {t("home.blog.readMore")} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            {/* Separate from each card's own "Read more" — this one goes to
                the full listing, not a specific post. Deliberately kept as
                a secondary/outline treatment, NOT .btn-cta: it's a real
                secondary action (browse everything) sharing the page with
                each card's own primary "Read more", so making it look like
                a second primary CTA would muddy which action matters more.
                Tokenized (border-border/text-foreground/hover:accent)
                instead of raw slate so it's still part of the same design
                system, just intentionally the quieter button. */}
            <div className="mt-10 text-center">
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                {t("home.blog.viewAll")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
