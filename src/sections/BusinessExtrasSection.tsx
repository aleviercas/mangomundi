import { useI18n } from "@/lib/i18n";

/** design/AJUSTES-4.md §3 — below the quote form and results table on
 *  /business only (never on the home band, which stays the simple hook it
 *  already was per AJUSTES-1 §G — see BusinessSection.tsx's own comment).
 *
 *  2026-08-30 feedback: replaced the generic "Two ways we work with
 *  companies" copy (written when no real text existed anywhere for these
 *  two cards — see the git history on this file) with the actual original
 *  "Institutional & Partnership Inquiries" section text the user supplied
 *  verbatim, from the site's previous design. Card styling stays literal
 *  to AJUSTES-4 §3: white, 1px #EBE3D9 border, 18px radius, 16.5px/800
 *  title, 14px #6B5F55 body. */
export function BusinessExtrasSection() {
  const { t } = useI18n();
  const cards = [
    {
      title: t("business.extras.treasury.title"),
      body: t("business.extras.treasury.body"),
    },
    {
      title: t("business.extras.partnerships.title"),
      body: t("business.extras.partnerships.body"),
    },
  ];
  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground">
              {t("business.extras.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#6B5F55]">
              {t("business.extras.subtitle")}
            </p>
          </div>
          <a
            href="mailto:hello@mangomundi.com?subject=Business%20FX%20inquiry"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-foreground/30"
          >
            {t("business.extras.cta")}
          </a>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <div key={c.title} className="rounded-[18px] border border-[#EBE3D9] bg-white p-6">
              <h3 className="text-[16.5px] font-extrabold text-foreground">{c.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B5F55]">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
