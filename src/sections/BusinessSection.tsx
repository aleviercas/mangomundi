import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

/** design/Mangomundi 4 - Final.dc.html (line 191-203) — "For business" is a
 *  full bordered card (border 1px #EBE3D9, radius 20px, padding 20px)
 *  sitting next to the small "Widget" card in a 1.5fr/1fr row (see
 *  BusinessWidgetRow.tsx), not a full-width band on its own. Previously
 *  (design/AJUSTES-1.md §G) only the photo had its own border/radius —
 *  the whole card gets that treatment now, matching the mockup. Copy/CTAs
 *  unchanged from §G: "Get business quotes" → /business, "Talk to us" →
 *  the same real mailto. */
export function BusinessSection() {
  const { t } = useI18n();
  return (
    <div
      id="business"
      className="scroll-mt-24 grid items-center gap-6 rounded-[20px] border border-border p-5 lg:grid-cols-[300px_1fr]"
    >
      <div className="overflow-hidden rounded-[14px]">
        <img
          src="/images/business-person.jpg"
          alt=""
          width={300}
          height={225}
          className="aspect-[4/3] w-full object-cover"
          loading="lazy"
        />
      </div>
      <div>
        <p className="text-eyebrow font-bold uppercase text-accent">{t("nav.business")}</p>
        <h2 className="mt-2.5 font-heading text-[24px] font-extrabold leading-[1.18] tracking-[-0.025em] text-foreground">
          {t("home.contact.title")}
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          {t("home.contact.subtitle")}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/business"
            className="btn-cta inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold"
          >
            {t("home.contact.getQuotes")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <a
            href="mailto:hello@mangomundi.com?subject=Business%20FX%20inquiry"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-foreground/30"
          >
            {t("comparator.b2b.cta")}
          </a>
        </div>
      </div>
    </div>
  );
}
