import { createFileRoute } from "@tanstack/react-router";
import { Globe2, Sparkles, Scale } from "lucide-react";
import { getRouteSeo, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => {
    const seo = getRouteSeo("en", "/about");
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:url", content: "https://mangoglobal.lovable.app/about" },
      ],
      links: [{ rel: "canonical", href: "https://mangoglobal.lovable.app/about" }],
    };
  },
  component: AboutPage,
});

function AboutPage() {
  const { t, lang } = useI18n();

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

      {/* Manifesto */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="surface-card p-6 sm:p-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("about.manifesto.kicker")}
            </div>
            <h2 className="mt-3 font-heading text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              {t("about.manifesto.headline")}
            </h2>

            <div className="mt-8 space-y-8">
              {chapters.map((ch, i) => (
                <div key={ch.chapter}>
                  {i > 0 && <div className="mb-8 h-px w-full border-t border-border" />}
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {ch.chapter}
                  </div>
                  <h3 className="mt-2 font-heading text-lg font-semibold text-foreground sm:text-xl">
                    {ch.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
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

      {/* Institutional & Partnership Inquiries */}
      <section id="institutional-inquiries" className="py-20 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="surface-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <span className="font-black lowercase">mango</span><span className="font-extralight lowercase">global</span> · {t("brand.partnerships")}
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground sm:text-xl">
                  {t("contact.heading")}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t("contact.intro")}
                </p>
              </div>

              <form
                key={`contact-${lang}`}
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  window.location.href = "mailto:hello@mangoglobal.com";
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("contact.fullName")}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={t("contact.fullNamePlaceholder")}
                      className="flex h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("contact.workEmail")}
                    </span>
                    <input
                      type="email"
                      required
                      placeholder={t("contact.workEmailPlaceholder")}
                      className="flex h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("contact.institution")}
                  </span>
                  <input
                    type="text"
                    placeholder={t("contact.institutionPlaceholder")}
                    className="flex h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("contact.scope")}
                  </span>
                  <textarea
                    rows={4}
                    required
                    placeholder={t("contact.scopePlaceholder")}
                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </label>

                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    {t("contact.submitHint")}
                  </span>
                  <button
                    type="submit"
                    className="btn-cta inline-flex h-11 items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold"
                  >
                    {t("contact.submit")}
                  </button>
                </div>
              </form>

              <p className="text-xs text-muted-foreground">
                {t("contact.orWrite")}{" "}
                <a href="mailto:hello@mangoglobal.com" className="text-primary hover:underline">
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

