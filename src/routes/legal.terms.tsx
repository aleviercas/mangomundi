import { createFileRoute } from "@tanstack/react-router";
import { getRouteSeo, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/legal/terms")({
  head: () => {
    const seo = getRouteSeo("en", "/legal/terms");
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
      ],
      links: [{ rel: "canonical", href: "https://mangoglobal.lovable.app/legal/terms" }],
    };
  },
  component: TermsPage,
});

function TermsPage() {
  const { t } = useI18n();
  const sections = [1, 2, 3, 4] as const;
  return (
    <main className="mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
      <div className="surface-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            mangoglobal · Terms of Service
          </span>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("legal.terms.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("legal.lastUpdated")}</p>
          </div>

          <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-4">
            <p className="text-sm leading-relaxed text-amber-900">{t("footer.disclaimer")}</p>
          </div>

          {sections.map((n) => (
            <div key={n}>
              <div className="h-px w-full border-t border-border" />
              <section className="pt-8">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Section 0{n}
                </div>
                <h2 className="font-heading text-lg font-semibold text-foreground sm:text-xl">
                  {t(`legal.terms.s${n}.title`)}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  {t(`legal.terms.s${n}.body`)}
                </p>
              </section>
            </div>
          ))}

          <div className="h-px w-full border-t border-border" />
          <section>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Section 05
            </div>
            <h2 className="font-heading text-lg font-semibold text-foreground sm:text-xl">
              {t("legal.terms.s5.title")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {t("legal.terms.s5.body")}{" "}
              <a href="mailto:legal@mangoglobal.com" className="text-primary hover:underline">
                legal@mangoglobal.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
