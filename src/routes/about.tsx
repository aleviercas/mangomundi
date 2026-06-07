import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Globe2, Sparkles, Scale } from "lucide-react";
import { useI18n, CORPORATE_LANGS, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — mangoglobal" },
      { name: "description", content: "mangoglobal is a neutral FX decision engine connecting retail and corporate flows to the best cross-border route." },
      { property: "og:title", content: "About — mangoglobal" },
      { property: "og:description", content: "Neutral FX decision engine for borderless payments." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t, lang, setLang } = useI18n();

  // Corporate compliance gate: /about is restricted to the verified locales.
  useEffect(() => {
    if (!(CORPORATE_LANGS as readonly Lang[]).includes(lang)) {
      setLang("en");
    }
  }, [lang, setLang]);

  const values = [
    { icon: Globe2, title: t("about.v1.title"), body: t("about.v1.body") },
    { icon: Sparkles, title: t("about.v2.title"), body: t("about.v2.body") },
    { icon: Scale, title: t("about.v3.title"), body: t("about.v3.body") },
  ];

  const chapters = [
    {
      chapter: t("about.manifesto.chapterMission"),
      title: t("about.manifesto.missionTitle"),
      body: t("about.manifesto.missionText"),
    },
    {
      chapter: t("about.manifesto.chapterVision"),
      title: t("about.manifesto.visionTitle"),
      body: t("about.manifesto.visionText"),
    },
    {
      chapter: t("about.manifesto.chapterProblem"),
      title: t("about.manifesto.problemTitle"),
      body: t("about.manifesto.problemText"),
    },
  ];

  return (
    <div className="bg-background">
      <section className="pt-20 pb-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-5">
            {t("about.badge")}
          </div>
          <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
            {t("about.heroTitle1")} <span className="text-primary">{t("about.heroTitleAccent")}</span> {t("about.heroTitle2")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t("about.heroSubtitle")}
          </p>
        </div>
      </section>

      {/* Manifesto — Dark Terminal */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="terminal-card rounded-2xl p-6 font-mono sm:p-10">
            <div className="terminal-text-comment text-[11px] tracking-wider">
              {t("about.manifesto.kicker")}
            </div>
            <h2 className="mt-3 font-heading text-2xl font-bold leading-tight terminal-text-bright sm:text-3xl terminal-cursor">
              {t("about.manifesto.headline")}
            </h2>

            <div className="mt-8 space-y-8">
              {chapters.map((ch, i) => (
                <div key={ch.chapter}>
                  {i > 0 && (
                    <div className="mb-8 h-px w-full terminal-divider border-t" />
                  )}
                  <div className="terminal-text-comment text-[10px] uppercase tracking-[0.2em]">
                    {ch.chapter}
                  </div>
                  <h3 className="mt-2 font-mono text-lg font-semibold terminal-text-exec sm:text-xl">
                    {ch.title}
                  </h3>
                  <p className="mt-3 font-mono text-sm leading-relaxed terminal-text-bright sm:text-[15px]">
                    {ch.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-center text-2xl font-bold text-foreground mb-12">
            {t("about.valuesTitle")}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-semibold text-foreground text-lg">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Factual metrics */}
      <section className="py-16 border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="font-heading text-4xl font-bold text-primary tabular-nums">
                  {t(`about.metric${i}.value`)}
                </div>
                <div className="mt-2 text-sm font-semibold text-foreground">
                  {t(`about.metric${i}.label`)}
                </div>
                {i > 1 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t(`about.metric${i}.note`)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional & Partnership Inquiries — Send Console */}
      <section id="institutional-inquiries" className="py-20 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="terminal-card rounded-2xl overflow-hidden font-mono">
            {/* Header */}
            <div className="flex items-center gap-2 border-b terminal-divider px-4 py-2.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
              </span>
              <span className="text-[11px] uppercase tracking-widest terminal-text-comment">
                mangoglobal · partnerships.exec
              </span>
              <span className="ml-auto text-[10px] terminal-text-comment">// secure channel</span>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <div className="terminal-text-exec text-sm font-semibold">
                  $ Institutional &amp; Partnership Inquiries
                </div>
                <p className="mt-2 text-[12px] terminal-text-comment leading-relaxed">
                  // For treasury operations, liquidity partnerships, regulatory diligence and institutional onboarding.
                </p>
              </div>

              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  window.location.href = "mailto:hello@mangoglobal.com";
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-[10px] uppercase tracking-widest terminal-text-comment mb-1">
                      // full_name
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      className="terminal-input w-full rounded-md px-3 py-2 text-sm font-mono"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-[10px] uppercase tracking-widest terminal-text-comment mb-1">
                      // work_email
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="jane@institution.com"
                      className="terminal-input w-full rounded-md px-3 py-2 text-sm font-mono"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="block text-[10px] uppercase tracking-widest terminal-text-comment mb-1">
                    // institution
                  </span>
                  <input
                    type="text"
                    placeholder="Institution / Company"
                    className="terminal-input w-full rounded-md px-3 py-2 text-sm font-mono"
                  />
                </label>

                <label className="block">
                  <span className="block text-[10px] uppercase tracking-widest terminal-text-comment mb-1">
                    // scope
                  </span>
                  <textarea
                    rows={4}
                    required
                    placeholder="Briefly describe your flow, corridor or partnership scope."
                    className="terminal-input w-full rounded-md px-3 py-2 text-sm font-mono"
                  />
                </label>

                <div className="flex items-center justify-between gap-3 border-t terminal-divider pt-4">
                  <span className="terminal-text-comment text-[11px] font-mono">
                    $ submit → hello@mangoglobal.com
                  </span>
                  <button
                    type="submit"
                    className="terminal-btn-primary inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-xs font-bold uppercase tracking-widest"
                  >
                    ▶ Open secure channel
                  </button>
                </div>
              </form>

              <p className="text-[11px] terminal-text-comment">
                // Or write directly to{" "}
                <a href="mailto:hello@mangoglobal.com" className="terminal-text-exec hover:underline">
                  hello@mangoglobal.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

