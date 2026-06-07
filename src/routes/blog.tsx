import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, BookOpen } from "lucide-react";
import { listBlogPosts } from "@/lib/blog.functions";
import { useI18n } from "@/lib/i18n";

const postsQuery = (locale: string) =>
  queryOptions({
    queryKey: ["blog", "list", locale],
    queryFn: () => listBlogPosts({ data: { locale } }),
  });

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — mangoglobal" },
      {
        name: "description",
        content:
          "Guides, deep-dives, and analyses on cross-border payments, FX transparency, and how to send money smarter — for individuals and businesses.",
      },
      { property: "og:title", content: "Blog — mangoglobal" },
      {
        property: "og:description",
        content: "Cross-border payments, FX, and decision-engine insights.",
      },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { lang } = useI18n();
  const { data: posts } = useQuery({ ...postsQuery(lang), initialData: [] });

  return (
    <div className="bg-background">
      <section className="pt-24 pb-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-5">
            <BookOpen className="h-3 w-3 text-primary" /> Insights
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            The mangoglobal blog
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Plain-English guides on sending money internationally, FX transparency, and how
            decision engines change cross-border finance.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-muted-foreground">No posts yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {posts.map((p) => (
                <Link
                  key={p.slug}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
                      {p.audience === "business"
                        ? "Business"
                        : p.audience === "retail"
                          ? "Retail"
                          : "Both"}
                    </span>
                    {p.published_at && (
                      <span>
                        {new Date(p.published_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <h2 className="font-heading text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                      {p.excerpt}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Read more <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
