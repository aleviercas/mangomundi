import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";
import { getBlogPost } from "@/lib/blog.functions";

const postQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog", "post", slug],
    queryFn: () => getBlogPost({ data: { slug } }),
  });

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => {
    const post = loaderData;
    if (!post) {
      return { meta: [{ title: "Post not found — MangoGlobal" }] };
    }
    const desc = post.excerpt ?? "Read this post on MangoGlobal.";
    return {
      meta: [
        { title: `${post.title} — MangoGlobal` },
        { name: "description", content: desc },
        { property: "og:title", content: post.title },
        { property: "og:description", content: desc },
        ...(post.cover_url ? [{ property: "og:image", content: post.cover_url }] : []),
        { property: "og:type", content: "article" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="bg-background min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="font-heading text-3xl font-bold text-foreground">Post not found</h1>
        <p className="mt-2 text-muted-foreground">This article doesn't exist or was unpublished.</p>
        <Link
          to="/blog"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" /> Back to the blog
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="bg-background min-h-[60vh] flex items-center justify-center px-4">
      <p className="text-muted-foreground">Couldn't load this post: {error.message}</p>
    </div>
  ),
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(postQuery(slug));
  if (!post) return null;

  return (
    <article className="bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to blog
        </Link>

        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
            {post.audience === "business" ? "Business" : post.audience === "retail" ? "Retail" : "Both"}
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
          <p className="text-sm text-muted-foreground">Ready to compare your transfer?</p>
          <Link
            to="/compare"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Open the comparator
          </Link>
        </div>
      </div>
    </article>
  );
}
