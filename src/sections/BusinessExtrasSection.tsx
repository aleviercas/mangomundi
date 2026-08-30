import { useI18n } from "@/lib/i18n";

/** design/AJUSTES-4.md §3 — "Two ways we work with companies", below the
 *  quote form and results table on /business only (never on the home
 *  band, which stays the simple hook it already was per AJUSTES-1 §G —
 *  see BusinessSection.tsx's own comment). Card styling is literal to the
 *  doc: white, 1px #EBE3D9 border, 18px radius, 16.5px/800 title, 14px
 *  #6B5F55 body.
 *
 *  Neither card had body copy anywhere in the app or the mockup — only
 *  the two titles are named in the doc. Rather than invent claims, each
 *  body describes only what the product actually does today: real
 *  contract-type/frequency fields already in ComparatorSection's business
 *  mode (spot/forward/option, one-off/monthly/quarterly) for Treasury
 *  Operations, and the same real quote-request flow (captureBusinessLead)
 *  for FX & Payment Partnerships, framed for an embedded/ongoing-volume
 *  relationship rather than a one-off quote. Adapted from the old
 *  "Corporate Treasury & Operations" / "Institutional & Partnership
 *  Inquiries" copy already sitting unused in i18n.tsx (home.dual.corporate,
 *  contact.intro) since before AJUSTES-1 §G replaced that section — not
 *  written from nothing. */
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
        <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground">
          {t("business.extras.title")}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <div key={c.title} className="rounded-[18px] border border-[#EBE3D9] bg-white p-6">
              <h3 className="text-[16.5px] font-extrabold text-foreground">{c.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B5F55]">{c.body}</p>
            </div>
          ))}
        </div>

        {/* "Contacto directo del equipo de negocio" — same real mailto the
            home band's "Talk to us" already uses (comparator.b2b.cta),
            not a new form. */}
        <div className="mt-6 rounded-[18px] border border-[#EBE3D9] bg-white p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h3 className="text-[16.5px] font-extrabold text-foreground">
              {t("business.extras.contact.title")}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6B5F55]">
              {t("business.extras.contact.body")}
            </p>
          </div>
          <a
            href="mailto:hello@mangomundi.com?subject=Business%20FX%20inquiry"
            className="mt-4 inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-foreground/30 sm:mt-0"
          >
            {t("comparator.b2b.cta")}
          </a>
        </div>
      </div>
    </section>
  );
}
