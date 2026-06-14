import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, Globe2 } from "lucide-react";
import { getRouteSeo, useI18n } from "@/lib/i18n";
import { captureGeneralInquiry } from "@/lib/agent.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const saveInquiry = useServerFn(captureGeneralInquiry);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const chapters = [
    [t("about.manifesto.chapterMission"), t("about.manifesto.missionTitle"), t("about.manifesto.missionText")],
    [t("about.manifesto.chapterVision"), t("about.manifesto.visionTitle"), t("about.manifesto.visionText")],
    [t("about.manifesto.chapterProblem"), t("about.manifesto.problemTitle"), t("about.manifesto.problemText")],
  ];

  return (
    <div className="bg-background">
      <section className="px-4 pb-16 pt-24 text-center sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{t("about.badge")}</p>
        <h1 className="mx-auto mt-5 max-w-4xl font-heading text-4xl font-bold tracking-tight text-foreground sm:text-6xl">{t("about.title")}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t("about.heroSubtitle")}</p>
      </section>

      <section className="border-y border-border bg-card/70 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("about.manifesto.kicker")}</p>
          <h2 className="mt-4 max-w-3xl font-heading text-3xl font-bold text-foreground">{t("about.manifesto.headline")}</h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-3">
            {chapters.map(([chapter, title, body]) => (
              <article key={chapter} className="border-t border-border pt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{chapter}</p>
                <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-4">
          {[["2026", "about.metric1.label"], ["150+", "about.metric2.label"], ["100+", "about.metric3.label"], ["50+", "about.metric4.label"]].map(([value, key]) => (
            <div key={key} className="bg-card p-7 text-center">
              <p className="font-heading text-4xl font-bold text-foreground">{value}</p>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">{t(key)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Globe2 className="h-10 w-10 text-accent" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{t("about.coverage.eyebrow")}</p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-foreground">{t("about.coverage.title")}</h2>
            <p className="mt-4 leading-7 text-muted-foreground">{t("about.coverage.body")}</p>
          </div>
        </div>
      </section>

      <section id="institutional-inquiries" className="border-t border-border bg-card/70 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl font-bold text-foreground">{t("contact.heading")}</h2>
          <p className="mt-3 text-muted-foreground">{t("contact.intro")}</p>
          {submitted ? (
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-sm text-foreground"><CheckCircle2 className="h-5 w-5 text-accent" />{t("contact.success")}</div>
          ) : (
            <form key={`contact-${lang}`} className="mt-8 grid gap-4" onSubmit={async (event) => {
              event.preventDefault();
              setSubmitting(true);
              setFormError("");
              const form = new FormData(event.currentTarget);
              try {
                await saveInquiry({ data: { name: String(form.get("name") ?? ""), email: String(form.get("email") ?? ""), company: String(form.get("company") ?? ""), message: String(form.get("message") ?? "") } });
                setSubmitted(true);
              } catch {
                setFormError(t("contact.error"));
              } finally {
                setSubmitting(false);
              }
            }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input name="name" required minLength={2} maxLength={120} placeholder={t("contact.fullName")} className="h-12 bg-card" />
                <Input name="email" type="email" required maxLength={255} placeholder={t("contact.workEmail")} className="h-12 bg-card" />
              </div>
              <Input name="company" maxLength={200} placeholder={t("contact.institution")} className="h-12 bg-card" />
              <Textarea name="message" required minLength={10} maxLength={2000} rows={5} placeholder={t("contact.scopePlaceholder")} className="bg-card" />
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <Button type="submit" disabled={submitting} size="lg" className="h-12 justify-self-start px-7">{t("contact.submit")}<ArrowRight className="h-4 w-4" /></Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

