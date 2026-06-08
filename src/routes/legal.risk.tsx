import { createFileRoute } from "@tanstack/react-router";
import { getRouteSeo, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/legal/risk")({
  head: () => {
    const seo = getRouteSeo("en", "/legal/risk");
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
      ],
      links: [{ rel: "canonical", href: "https://mangoglobal.lovable.app/legal/risk" }],
    };
  },
  component: RiskPage,
});

function RiskPage() {
  const { t } = useI18n();
  const sections = [1, 2, 3, 4] as const;
  return (
    <main className="mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
      <div className="terminal-card rounded-2xl overflow-hidden font-mono">
        <div className="flex items-center gap-2 border-b terminal-divider px-4 py-2.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
          </span>
          <span className="text-[11px] uppercase tracking-widest terminal-text-comment">
            mangoglobal · risk.exec
          </span>
          <span className="ml-auto text-[10px] terminal-text-comment">// v 07/06/2026</span>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight terminal-text-bright sm:text-4xl">
              {t("legal.risk.title")}
            </h1>
            <p className="mt-2 text-sm terminal-text-comment">{t("legal.lastUpdated")}</p>
          </div>

          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
            <p className="text-sm leading-relaxed terminal-text-bright">{t("footer.disclaimer")}</p>
          </div>

          {sections.map((n) => (
            <div key={n}>
              <div className="h-px w-full terminal-divider border-t" />
              <section className="pt-8">
                <div className="terminal-text-comment text-[10px] uppercase tracking-[0.2em] mb-2">
                  // section_0{n}
                </div>
                <h2 className="font-mono text-lg font-semibold terminal-text-exec sm:text-xl">
                  {t(`legal.risk.s${n}.title`)}
                </h2>
                <p className="mt-3 font-mono text-sm leading-relaxed terminal-text-bright sm:text-[15px]">
                  {t(`legal.risk.s${n}.body`)}
                </p>
              </section>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
