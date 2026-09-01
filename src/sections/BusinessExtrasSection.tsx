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
 *  2026-09-01 feedback (first round) — "mejorar la distribución de los
 *  cuadros y la imagen": the previous layout floated a loose text column
 *  next to a boxed 300×340 photo with no shared frame, reading thinner
 *  than the rest of the page. Rebuilt on the SAME bordered-panel pattern
 *  BusinessSection.tsx already uses one section up (`rounded-[20px] border
 *  border-border p-5`, photo in a fixed left column stretching the full
 *  panel height) — one visual language for "business panel with a photo"
 *  across the page instead of two different ones, and the photo now
 *  anchors the whole panel's height instead of sitting at its own
 *  arbitrary size.
 *
 *  2026-09-01 feedback (second round) — "el botón de email our business
 *  desk se puede poner a la derecha para ocupar el espacio en blanco,
 *  comprimir un poco las cards, los iconos ocupan mucho lugar": the header
 *  row used `items-end justify-between` on a `flex-wrap` container with a
 *  `max-w-2xl` subtitle — wide enough that the row always wrapped in
 *  practice (confirmed via screenshot: title+subtitle on one line, the
 *  button dropped to its own line below, leaving the whole right two
 *  thirds of that row empty instead of holding the button). Switched to
 *  `flex-col` (mobile, stacked) / `sm:flex-row sm:items-center` (button
 *  pinned to the panel's right edge, vertically centered against the
 *  title block) with no wrap — the title block keeps `min-w-0` so long
 *  copy wraps its own text instead of forcing the row to overflow or
 *  collapse. Cards tightened too: smaller icon chip (9→8) and less
 *  padding (p-6→p-5, mt-5→mt-4) so the icon doesn't eat as much of each
 *  card's own vertical rhythm. */
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
    <section className="py-7 sm:py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-stretch gap-6 rounded-[20px] border border-border p-5 lg:grid-cols-[300px_1fr] lg:p-6">
          {/* Same photo the home teaser and quote-form card already use —
              not a new asset, stretched to the panel's full height instead
              of a fixed box so it reads as one anchor, not a thumbnail. */}
          <div className="hidden overflow-hidden rounded-[14px] lg:block">
            <img
              src="/images/business-person.jpg"
              alt=""
              width={300}
              height={400}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>

          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 sm:max-w-md">
                <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground">
                  {t("business.extras.title")}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[#6B5F55]">
                  {t("business.extras.subtitle")}
                </p>
              </div>
              {/* 2026-08-31 feedback — "el botón de enviar un email respete
                  la paleta": was a plain neutral border/bg-card button. */}
              <a
                href="mailto:hello@mangomundi.com?subject=Business%20FX%20inquiry"
                className="btn-cta inline-flex shrink-0 items-center gap-1.5 self-start rounded-md px-4 py-2 text-sm font-semibold sm:self-center"
              >
                {t("business.extras.cta")}
              </a>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {cards.map((c) => (
                <div key={c.title} className="rounded-[18px] border border-[#EBE3D9] bg-white p-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5EFE8] text-accent-text">
                    <c.icon className="h-4 w-4" aria-hidden />
                  </div>
                  <h3 className="mt-2.5 text-[16.5px] font-extrabold text-foreground">{c.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#6B5F55]">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
