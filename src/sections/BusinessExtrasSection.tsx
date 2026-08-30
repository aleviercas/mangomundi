import { Handshake, Landmark } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** design/AJUSTES-4.md §3 — below the quote form and results table on
 *  /business only (never on the home band, which stays the simple hook it
 *  already was per AJUSTES-1 §G — see BusinessSection.tsx's own comment).
 *
 *  2026-08-30 feedback: replaced the generic "Two ways we work with
 *  companies" copy (written when no real text existed anywhere for these
 *  two cards — see the git history on this file) with the actual original
 *  "Institutional & Partnership Inquiries" section text the user supplied
 *  verbatim, from the site's previous design.
 *
 *  Second round: plain white/border/text cards read flat next to the rest
 *  of the redesigned page — an icon per card (real distinction: Treasury
 *  vs. Partnerships, not decoration) and the same business-person photo the
 *  home teaser and this page's own quote form already use, so the section
 *  doesn't read as pure text next to everything else that's photo-anchored. */
export function BusinessExtrasSection() {
  const { t } = useI18n();
  const cards = [
    {
      icon: Landmark,
      title: t("business.extras.treasury.title"),
      body: t("business.extras.treasury.body"),
    },
    {
      icon: Handshake,
      title: t("business.extras.partnerships.title"),
      body: t("business.extras.partnerships.body"),
    },
  ];
  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
          <div>
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5EFE8] text-accent">
                    <c.icon className="h-4.5 w-4.5" aria-hidden />
                  </div>
                  <h3 className="mt-3 text-[16.5px] font-extrabold text-foreground">{c.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#6B5F55]">{c.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Same photo the home teaser and quote-form card already use —
              not a new asset, just anchoring this text section visually the
              way the rest of the page is. */}
          <div className="hidden overflow-hidden rounded-[18px] border border-[#EBE3D9] lg:block">
            <img
              src="/images/business-person.jpg"
              alt=""
              width={300}
              height={340}
              className="aspect-[3/3.4] w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
