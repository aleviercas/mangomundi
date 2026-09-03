import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/Wordmark";
import { EmbedComparator } from "@/components/EmbedComparator";
import { useI18n } from "@/lib/i18n";

/** design/Mangomundi 4 - Final.dc.html (line 204-213) — the home page's own
 *  widget mention is a small card, not the full explanation + live
 *  preview section that used to sit here (moved to /widget — see
 *  WidgetPage.tsx). Literal to the mockup: bordered card, eyebrow + title
 *  + body + "Get the embed code" CTA and a 36×36 dark icon-mark badge —
 *  the one deliberate real use of the icon mark left after Header/Footer
 *  went text-only (2026-08-30 feedback item 1).
 *
 *  2026-09-02 feedback — "poner una imagen del widget de fondo
 *  semitransparente... quedo espacio en blanco": `items-stretch` on the
 *  parent row (BusinessWidgetRow) stretches this card to match its
 *  taller sibling (photo + 3-line body + two buttons), leaving this
 *  card's own short copy sitting over a lot of unused height. Rather
 *  than inventing a screenshot/illustration, this reuses the actual
 *  widget component itself (EmbedComparator, the same one /widget's
 *  live preview and the real embed both run) as a faded, rotated,
 *  non-interactive backdrop filling that space — a real product shot,
 *  not fabricated art. `pointer-events-none` + `aria-hidden` + `inert`
 *  keep it out of the tab order and click-through to the real CTAs
 *  below; the `mask-image` fade keeps it from competing with the
 *  actual text for attention. */
export function WidgetTeaserSection() {
  const { t } = useI18n();
  return (
    <div className="relative isolate flex flex-col justify-between overflow-hidden rounded-[20px] border border-border p-5">
      <div
        aria-hidden
        inert
        className="pointer-events-none absolute -bottom-24 -right-24 top-[92px] -z-10 w-[280px] rotate-[10deg] opacity-45 [mask-image:linear-gradient(to_top_left,black,black_55%,transparent_85%)]"
      >
        {/* A mostly-white widget card faded straight onto this equally-light
            page background nearly disappears (measured: imperceptible below
            ~30% opacity) — the accent-tinted wash behind it is what actually
            keeps the shape's outline/shadow legible at a "background", not
            "foreground", strength. */}
        <div className="h-full w-full rounded-2xl bg-gradient-to-br from-accent/15 via-transparent to-transparent p-3">
          <div className="h-full w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            <EmbedComparator initialCurrency="USD" />
          </div>
        </div>
      </div>
      <div>
        <p className="text-eyebrow font-bold uppercase text-accent-text">
          {t("home.widget.eyebrow")}
        </p>
        <h2 className="mt-2.5 font-heading text-[22px] font-extrabold leading-[1.2] tracking-[-0.025em] text-foreground">
          {t("home.widget.card.title")}
        </h2>
        <p className="mt-2.5 max-w-[75%] text-sm leading-relaxed text-muted-foreground">
          {t("home.widget.card.body")}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Link
          to="/widget"
          className="inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-foreground bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
        >
          {t("home.widget.card.cta")}
        </Link>
        <Link
          to="/widget"
          aria-label={t("home.widget.card.title")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-foreground"
        >
          <BrandMark tone="light" />
        </Link>
      </div>
    </div>
  );
}
