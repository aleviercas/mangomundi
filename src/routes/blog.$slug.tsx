import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getBlogPost } from "@/lib/blog.functions";
import { useI18n } from "@/lib/i18n";

const postQuery = (slug: string, locale: string) =>
  queryOptions({
    queryKey: ["blog", "post", slug, locale],
    queryFn: () => getBlogPost({ data: { slug, locale } }),
  });

const truncate = (s: string, max = 160) =>
  s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(postQuery(params.slug, "en")),
  head: ({ params, loaderData }) => {
    const url = `https://mangomundi.lovable.app/blog/${params.slug}`;
    const post = loaderData ?? null;
    const title = post?.title ? `${post.title} — Mangomundi` : `${params.slug} — Mangomundi`;
    const description = post?.excerpt
      ? truncate(post.excerpt, 160)
      : "Read this guide on cross-border payments, FX rates and smarter money transfers — from the Mangomundi team.";
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
    ];
    if (post?.cover_url) {
      meta.push({ property: "og:image", content: post.cover_url });
      meta.push({ name: "twitter:image", content: post.cover_url });
    }
    const scripts: Array<Record<string, string>> = [];
    if (post) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt ?? undefined,
          image: post.cover_url ?? undefined,
          datePublished: post.published_at ?? undefined,
          author: { "@type": "Organization", name: "Mangomundi" },
          publisher: {
            "@type": "Organization",
            name: "Mangomundi",
            logo: {
              "@type": "ImageObject",
              url: "https://mangomundi.lovable.app/og-image.png",
            },
          },
          mainEntityOfPage: url,
        }),
      });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts,
    };
  },
  notFoundComponent: () => <PostNotFound />,
  errorComponent: ({ error }) => <PostError error={error} />,
  component: BlogPostPage,
});

function PostNotFound() {
  const { t } = useI18n();
  return (
    <div className="bg-background min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="font-heading text-3xl font-bold text-foreground">{t("errors.post.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("errors.post.body")}</p>
        <Link
          to="/blog"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" /> {t("errors.post.back")}
        </Link>
      </div>
    </div>
  );
}

function PostError({ error }: { error: Error }) {
  const { t } = useI18n();
  console.error("blog post load error", error);
  return (
    <div className="bg-background min-h-[60vh] flex items-center justify-center px-4">
      <p className="text-muted-foreground">{t("errors.post.load")}</p>
    </div>
  );
}

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { lang, t } = useI18n();
  const { data: post, isLoading } = useQuery(postQuery(slug, lang));

  if (isLoading) {
    return (
      <div className="bg-background min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    throw notFound();
  }

  return (
    <article className="bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> {t("blog.backShort")}
        </Link>

        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
            {post.audience === "business" ? t("blog.audience.business") : post.audience === "retail" ? t("blog.audience.retail") : t("blog.audience.both")}
          </span>
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

        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
        )}

        {post.cover_url && (
          <img
            src={post.cover_url}
            alt={post.title}
            className="mt-8 w-full rounded-2xl border border-border"
          />
        )}

        <div className="prose prose-invert mt-10 max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground prose-code:text-primary prose-h2:text-2xl prose-h3:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:mt-8 prose-h3:mb-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content_md ?? ""}
          </ReactMarkdown>
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("blog.cta.prompt")}</p>
          <Link
            to="/compare"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t("blog.cta.button")}
          </Link>
        </div>
      </div>
    </article>
  );
}
