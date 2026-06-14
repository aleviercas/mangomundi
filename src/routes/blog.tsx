import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { getRouteSeo, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/blog")({
  head: () => {
    const seo = getRouteSeo("en", "/blog");
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:url", content: "https://mangoglobal.lovable.app/blog" },
      ],
      links: [{ rel: "canonical", href: "https://mangoglobal.lovable.app/blog" }],
    };
  },
  component: BlogIndex,
});

function BlogIndex() {
  const { lang, t } = useI18n();

  return (
    <div key={lang} className="bg-background">
      <section className="pt-24 pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
              <BookOpen className="h-3 w-3 text-primary" /> 
              <span><span className="font-black lowercase">mango</span><span className="font-extralight lowercase">global</span> &nbsp;· {t("brand.blog")}</span>
            </div>
            <p className="text-muted-foreground whitespace-pre-line">{t("blog.emptyState")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
