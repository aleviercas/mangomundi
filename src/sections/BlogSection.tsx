import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { listBlogPosts, toBlogLocale, type BlogListItem } from "@/lib/blog.functions";
import { useI18n } from "@/lib/i18n";

export function BlogSection() {
  const { t, lang } = useI18n();
  const locale = toBlogLocale(lang);
  const { data: posts } = useQuery({
    queryKey: ["blog", "list", locale],
    queryFn: () => listBlogPosts({ data: { locale } }),
    staleTime: 5 * 60_000,
  });
  const latest = (posts ?? []).slice(0, 3);

  return (
    <section id="blog" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">
              {t("home.blog.eyebrow")}
            </p>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
              {t("home.blog.title")}
            </h2>
          </div>
        </div>

        {latest.length === 0 ? (
          // Quiet placeholder — the section heading already carries the
          // "coming soon" message, so this stays light (no repeated title, no
          // heavy dark card competing with the Widget section above it).
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center sm:py-12">
            <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
              {t("home.blog.body")}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((post: BlogListItem) => (
              <Link
                key={post.slug}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg"
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
                  <h3 className="font-heading text-lg font-bold text-slate-900 group-hover:text-[#ff6b5b]">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
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
        )}
      </div>
    </section>
  );
}
