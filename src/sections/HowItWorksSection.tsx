import { useI18n } from "@/lib/i18n";

export function HowItWorksSection() {
  const { t } = useI18n();
  const steps = [
    { n: "01", title: t("home.how.s1.title"), desc: t("home.how.s1.desc") },
    { n: "02", title: t("home.how.s2.title"), desc: t("home.how.s2.desc") },
    { n: "03", title: t("home.how.s3.title"), desc: t("home.how.s3.desc") },
  ];
  return (
    <section id="how-it-works" className="scroll-mt-24 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_470px] lg:gap-12">
          <div>
            <p className="text-eyebrow font-bold uppercase text-accent">{t("home.how.eyebrow")}</p>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-h2">
              {t("home.how.title")}
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("search.guide")}
            </p>
          </div>
          {/* 470×340 (design/HANDOFF.md §6) — big enough to carry its own
              weight next to the 3 steps, not a small aside thumbnail. */}
          <img
            src="/images/howitworks-person.jpg"
            alt=""
            width={470}
            height={340}
            className="aspect-[47/34] w-full rounded-2xl object-cover object-[center_30%] shadow-[0_16px_40px_-20px_rgba(15,23,42,0.3)]"
            loading="lazy"
          />
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-[2rem] bg-card p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_-20px_rgba(15,23,42,0.12)] transition-shadow hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_50px_-18px_rgba(15,23,42,0.18)]"
            >
              <div className="font-heading text-sm font-bold text-accent">{s.n}</div>
              <h3 className="mt-4 font-heading text-h3 font-extrabold text-foreground">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
        {/* The AI agent is optional and not part of the core 3-step flow, so it
            gets a lighter mention instead of its own numbered card. */}
        <p className="mt-8 text-center text-sm text-muted-foreground">{t("home.how.aiAside")}</p>
      </div>
    </section>
  );
}
