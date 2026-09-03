import { useI18n } from "@/lib/i18n";

/** design/Mangomundi 4 - Final.dc.html (line 145-167) — "How it works" is a
 *  single vertical numbered list (01/02/03: number + title + body, no
 *  cards) next to the section photo, not the previous two-tier layout
 *  (a text+image header row followed by a separate 3-card grid below).
 *  2026-08-30 feedback: "el how it works se modifico por una lista
 *  vertical en el nuevo diseno". Literal to the mockup: eyebrow 11.5px/
 *  700/.16em/#C2410C, h2 30px/800/-0.03em, list gap 18px, each row a
 *  34px-wide Bricolage number in #EE5B3E next to a 16.5px/800 title and
 *  14px/#6B5F55 body — no subtitle paragraph, no AI-agent aside, no
 *  separate card grid: the mockup doesn't have either. */
export function HowItWorksSection() {
  const { t } = useI18n();
  const steps = [
    { n: "01", title: t("home.how.s1.title"), desc: t("home.how.s1.desc") },
    { n: "02", title: t("home.how.s2.title"), desc: t("home.how.s2.desc") },
    { n: "03", title: t("home.how.s3.title"), desc: t("home.how.s3.desc") },
  ];
  return (
    <section
      id="how-it-works"
      // 2026-08-31 feedback — "los espacios en general deberían estar más
      // compactos" vs. design/Mangomundi 4 - Final.dc.html: this band is
      // `padding:38px 30px` there (mockup line 146); py-14 sm:py-20 (56–80px)
      // ran noticeably looser than that on every breakpoint.
      className="scroll-mt-24 border-t border-border bg-card py-9 sm:py-12"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-11 lg:grid-cols-[1fr_470px]">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-[.16em] text-[#C2410C]">
              {t("home.how.eyebrow")}
            </p>
            <h2 className="mt-3 font-heading text-[30px] font-extrabold leading-[1.12] tracking-[-0.03em] text-foreground">
              {t("home.how.title")}
            </h2>
            <div className="mt-6 flex flex-col gap-[18px]">
              {steps.map((s) => (
                <div key={s.n} className="flex gap-[15px]">
                  <span className="w-[34px] shrink-0 font-heading text-[15px] font-extrabold text-accent-text">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="text-[16.5px] font-extrabold text-foreground">{s.title}</h3>
                    <p className="mt-[5px] text-[14px] leading-[1.55] text-[#6B5F55]">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* 470×340 (design/HANDOFF.md §6). */}
          <img
            src="/images/howitworks-person.jpg"
            alt=""
            width={470}
            height={340}
            className="aspect-[47/34] w-full rounded-2xl object-cover object-[center_30%] shadow-[0_16px_40px_-20px_rgba(15,23,42,0.3)]"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
