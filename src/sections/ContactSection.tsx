import { useI18n } from "@/lib/i18n";

export function ContactSection() {
  const { t } = useI18n();
  const cards = [
    { title: t("home.contact.treasury.title"), body: t("home.contact.treasury.body") },
    { title: t("home.contact.partners.title"), body: t("home.contact.partners.body") },
  ];
  return (
    <section id="contact" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">{t("home.contact.eyebrow")}</p>
          <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            {t("home.contact.title")}
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {cards.map((c) => (
            <div
              key={c.title}
              className="rounded-[2rem] bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_-20px_rgba(15,23,42,0.12)]"
            >
              <h3 className="font-heading text-xl font-extrabold text-slate-900">{c.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-500">{c.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <a
            href="mailto:hello@mangomundi.com"
            className="inline-flex h-14 items-center justify-center rounded-full bg-slate-900 px-10 text-base font-semibold text-white transition-colors hover:bg-black"
          >
            hello@mangomundi.com
          </a>
        </div>
      </div>
    </section>
  );
}
