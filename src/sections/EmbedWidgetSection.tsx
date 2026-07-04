import { Code2, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Presents the upcoming embeddable comparator widget ("powered by
 *  mangomundi") that any site or app will be able to drop in. The widget
 *  itself ships later (roadmap Sprint 7) — this section announces it and
 *  collects early-access interest via email. */
export function EmbedWidgetSection() {
  const { t } = useI18n();
  return (
    <section id="widget" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">
              {t("home.widget.eyebrow")}
            </p>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              {t("home.widget.title")}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              {t("home.widget.body")}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff6b5b]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#ff6b5b]">
                {t("home.widget.badge")}
              </span>
              <a
                href="mailto:hello@mangomundi.com?subject=mangomundi%20widget%20early%20access"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                <Mail className="h-4 w-4 text-[#ff6b5b]" /> {t("home.widget.cta")}
              </a>
            </div>
          </div>

          {/* Mock embed snippet — what the integration will look like. */}
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.4)] sm:p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Code2 className="h-4 w-4 text-[#ff6b5b]" /> embed.html
            </div>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-black/30 p-4 text-[12px] leading-relaxed text-slate-200">
              <code>{`<script src="https://mangomundi.com/widget.js"
  data-currency="USD"
  data-lang="auto">
</script>`}</code>
            </pre>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="font-semibold uppercase tracking-wider">FX Compare</span>
                <span className="text-slate-500">
                  powered by <span className="font-semibold text-[#ff6b5b]">mangomundi</span>
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="h-9 rounded-lg bg-white/90" />
                <div className="h-9 rounded-lg bg-white/90" />
              </div>
              <div className="mt-2 h-9 rounded-lg bg-[#ff6b5b]/80" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
