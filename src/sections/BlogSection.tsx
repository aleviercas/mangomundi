import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listBlogPosts, toBlogLocale, type BlogListItem } from "@/lib/blog.functions";
import { useI18n } from "@/lib/i18n";

/** design/AJUSTES-2.md §4 — the blog stops being a big three-tall-card
 *  section and becomes a compact band at the foot of the page: a title
 *  row and three small white cards with just a date and a headline, no
 *  image, no excerpt, no "Read more". Mockup line 217-230: the band's
 *  own background/border and every card measurement are literal (bg
 *  #F5EFE8 = --secondary, border #EBE3D9 = --border, both already tokens
 *  from §0). The mockup's `{{ p.date }} · {{ p.mins }}` reading-time
 *  figure has no backing field anywhere in the schema or the rest of the
 *  app (no reading_time column, no word-count computation) — per the
 *  "no inventar datos" rule already applied to §2's mid-market-rate
 *  delta, only the real date renders, the "· N MIN" half is dropped. */
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
    <section id="blog" className="scroll-mt-24 border-t border-border bg-secondary py-7">
      {/* 2026-09-04 feedback (ronda 6, cont.) — ver AboutManifestoSection:
          tope de ancho subido a 1340px, medido en vivo contra kayak.com. */}
      <div className="mx-auto max-w-[1340px] px-5 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-heading text-[19px] font-extrabold tracking-[-0.02em] text-foreground">
            {t("home.blog.compactTitle")}
          </h2>
          <Link
            to="/blog"
            className="shrink-0 text-[13px] font-bold text-[#C2410C] hover:underline"
          >
            {t("home.blog.allArticles")}
          </Link>
        </div>

        {isLoading ? (
          // Skeleton, not the empty-state placeholder — this section's data
          // is fetched client-side only (no server loader/prefetch, see
          // route index.tsx), so on every first visit this renders for
          // real, however briefly. Sized to match the real 3-card grid so
          // swapping skeleton → real content doesn't shift page height
          // (see the CLS note this replaced, same reasoning still applies
          // at the new, smaller card size).
          <div aria-hidden className="mt-3.5 grid animate-pulse grid-cols-1 gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-[14px] border border-border bg-card px-[17px] py-[15px]"
              >
                <div className="h-2.5 w-24 rounded bg-muted" />
                <div className="mt-2 h-4 w-4/5 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : latest.length === 0 ? (
          <p className="mt-3.5 text-sm leading-relaxed text-muted-foreground">
            {t("home.blog.body")}
          </p>
        ) : (
          <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {latest.map((post: BlogListItem) => (
              <div
                key={post.slug}
                className="rounded-[14px] border border-border bg-card px-[17px] py-[15px]"
              >
                {post.published_at && (
                  <div className="text-[10.5px] font-bold uppercase tracking-[.08em] text-muted-foreground">
                    {new Date(post.published_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                )}
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="mt-[7px] block font-heading text-[16.5px] font-extrabold leading-[1.25] tracking-[-0.02em] text-foreground"
                >
                  {post.title}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
