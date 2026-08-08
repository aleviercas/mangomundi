import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Check, Link2, Loader2 } from "lucide-react";
import { getBlogPost, toBlogLocale } from "@/lib/blog.functions";
import { extractFaqPairs } from "@/lib/faq.functions";
import { useI18n } from "@/lib/i18n";
import { SITE_URL, hreflangLinks, selfCanonical } from "@/config/site";

const searchSchema = z.object({ lang: z.string().optional() }).catch({});

const postQuery = (slug: string, locale: string) =>
  queryOptions({
    queryKey: ["blog", "post", slug, locale],
    queryFn: () => getBlogPost({ data: { slug, locale } }),
  });

const truncate = (s: string, max = 160) =>
  s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";

export const Route = createFileRoute("/blog_/$slug")({
  validateSearch: (search) => searchSchema.parse(search),
  loader: async ({ params, context }) => {
    // SSR the post in the geo-detected language (cheap header read) so
    // crawlers and the first paint get the right locale; the client keeps
    // refetching with the live i18n lang. Falls back to "en" only if the
    // post doesn't exist yet in the detected language (see getBlogPost).
    const { getInitialLang } = await import("@/lib/geo.functions");
    const detected = await getInitialLang().catch(() => "en");
    const locale = toBlogLocale(detected);
    return context.queryClient.ensureQueryData(postQuery(params.slug, locale));
  },
  head: ({ params, loaderData, match }) => {
    const url = selfCanonical(`/blog/${params.slug}`, match.search.lang);
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
          inLanguage: post.locale,
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
              url: `${SITE_URL}/og-image.jpg`,
            },
          },
          mainEntityOfPage: url,
        }),
      });

      // Every blog post has a FAQ section written natively per locale (no
      // shared i18n key for the heading text), so the extractor detects it
      // structurally instead of matching a translated header string. Only
      // emit FAQPage when at least 2 real Q/A pairs were found, to avoid
      // ever shipping an empty/near-empty rich result.
      const faqPairs = extractFaqPairs(post.content_md);
      if (faqPairs && faqPairs.length >= 2) {
        scripts.push({
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqPairs.map((qa) => ({
              "@type": "Question",
              name: qa.question,
              acceptedAnswer: { "@type": "Answer", text: qa.answer },
            })),
          }),
        });
      }
    }
    return {
      meta,
      // Blog content is written natively one language at a time (see the
      // editorial plan) — not every post exists in all 20 site languages yet.
      // getBlogPost() falls back to the English row when a locale-specific
      // one is missing, so advertising all 20 hreflang alternates is safe:
      // each URL always resolves to real content (native or EN fallback),
      // never a blank page.
      links: [{ rel: "canonical", href: url }, ...hreflangLinks(`/blog/${params.slug}`)],
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
        <h1 className="font-heading text-3xl font-bold text-foreground">
          {t("errors.post.title")}
        </h1>
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

const SHARE_ICONS = [
  {
    label: "WhatsApp",
    path: "M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.71 14.02c-.24.68-1.39 1.32-1.93 1.4-.5.08-1.09.11-1.76-.11-.4-.13-.92-.3-1.58-.58-2.78-1.2-4.6-4-4.74-4.19-.14-.19-1.13-1.5-1.13-2.86 0-1.36.71-2.03.97-2.3.26-.28.56-.35.75-.35.19 0 .38 0 .54.01.17.01.41-.06.64.49.24.57.81 1.98.88 2.12.07.15.12.32.02.51-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.64-.14.26.09 1.66.79 1.94.93.28.14.47.21.54.33.07.12.07.68-.17 1.36z",
    href: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    label: "X",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    href: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    label: "LinkedIn",
    path: "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z",
    href: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
];

function ShareRow({ url, title }: { url: string; title: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — fail
      // silently rather than showing a broken "copied" state.
    }
  };

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("blog.share.label")}
      </span>
      {SHARE_ICONS.map((s) => (
        <a
          key={s.label}
          href={s.href(url, title)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t("blog.share.label")} — ${s.label}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d={s.path} />
          </svg>
        </a>
      ))}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={t("blog.share.copyLink")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { lang, t } = useI18n();
  // BUG FIX: `lang` can be any of the site's 19 UI languages, but blog
  // content only ships in en/es/pt. Passing the raw `lang` straight into the
  // query made the server function's Zod schema reject anything outside
  // en/es/pt (throwing → error screen) instead of ever reaching the
  // server-side "fall back to English" logic that already existed in
  // getBlogPost. This is exactly why clicking through from the listing
  // (which already normalizes via toBlogLocale) could still land on a
  // "not found" / error box instead of the full article.
  const { data: post, isLoading } = useQuery(postQuery(slug, toBlogLocale(lang)));

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
            {post.audience === "business"
              ? t("blog.audience.business")
              : post.audience === "retail"
                ? t("blog.audience.retail")
                : t("blog.audience.both")}
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

        <ShareRow url={`${SITE_URL}/blog/${post.slug}`} title={post.title} />

        {post.cover_url && (
          <img
            src={post.cover_url}
            alt={post.title}
            className="mt-8 w-full rounded-2xl border border-border"
          />
        )}

        {/* prose-invert removed on purpose — that variant is Tailwind
            Typography's DARK-background styling, but this site is light
            throughout. It wasn't visibly broken everywhere: headings,
            paragraphs, links, strong, and list items already had explicit
            prose-X overrides here, so those rendered fine — but blockquotes,
            table cells, code blocks, and hr didn't have an override, so
            they fell through to prose-invert's dark-mode colors (light
            gray/white), which read as barely-visible on this white
            background. Added explicit overrides for those too, instead of
            just dropping prose-invert and hoping the (still light-mode,
            but not this site's exact tokens) default prose looks right. */}
        <div className="prose mt-10 max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground prose-code:text-primary prose-h2:text-2xl prose-h3:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:mt-8 prose-h3:mb-3 prose-blockquote:border-l-accent prose-blockquote:text-foreground prose-th:text-foreground prose-td:text-muted-foreground prose-hr:border-border prose-pre:bg-muted prose-code:bg-muted">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content_md ?? ""}</ReactMarkdown>
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("blog.cta.prompt")}</p>
          <Link
            to="/"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t("blog.cta.button")}
          </Link>
        </div>
      </div>
    </article>
  );
}
