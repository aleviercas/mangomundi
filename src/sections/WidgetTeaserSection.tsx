import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/Wordmark";
import { useI18n } from "@/lib/i18n";

/** design/Mangomundi 4 - Final.dc.html (line 204-213) — the home page's own
 *  widget mention is a small card, not the full explanation + live
 *  preview section that used to sit here (moved to /widget — see
 *  WidgetPage.tsx). Literal to the mockup: bordered card, eyebrow + title
 *  + body + "Get the embed code" CTA and a 36×36 dark icon-mark badge —
 *  the one deliberate real use of the icon mark left after Header/Footer
 *  went text-only (2026-08-30 feedback item 1). */
export function WidgetTeaserSection() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col justify-between rounded-[20px] border border-border p-5">
      <div>
        <p className="text-eyebrow font-bold uppercase text-accent-text">
          {t("home.widget.eyebrow")}
        </p>
        <h2 className="mt-2.5 font-heading text-[22px] font-extrabold leading-[1.2] tracking-[-0.025em] text-foreground">
          {t("home.widget.card.title")}
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          {t("home.widget.card.body")}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Link
          to="/widget"
          className="inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-foreground px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
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
