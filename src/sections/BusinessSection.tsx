import { useI18n } from "@/lib/i18n";

/** Institutional / partnership cards — the former "Contact" section, renamed:
 *  its content is business-facing (treasury ops + FX partnerships). The plain
 *  contact-with-email section now lives in ContactSection. */
export function BusinessSection() {
  const { t } = useI18n();
  const cards = [
    { title: t("home.contact.treasury.title"), body: t("home.contact.treasury.body") },
    { title: t("home.contact.partners.title"), body: t("home.contact.partners.body") },
  ];
  return (
    <section id="business" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">
            {t("nav.business")}
          </p>
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
      </div>
    </section>
  );
}
