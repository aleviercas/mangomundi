import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

/** Business pitch band (design/AJUSTES-1.md §G) — the former "Institutional &
 *  Partnership Inquiries" section with two treasury/partnership cards (bank
 *  language) is replaced by one direct pitch + two CTAs. "Get business
 *  quotes" links to /business — the real business-mode comparator route
 *  (design/HANDOFF.md §2's business segment), nothing linked to it from the
 *  nav before this. "Talk to us" keeps the section's original mailto (same
 *  address/subject, new label — comparator.b2b.cta, only ever used here).
 *  The plain contact-with-email section still lives separately in
 *  ContactSection. */
export function BusinessSection() {
  const { t } = useI18n();
  return (
    <section id="business" className="scroll-mt-24 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
          {/* 300px, bordered card, 20px radius — was a plain image floating
              right at up to 420px wide. */}
          <div className="overflow-hidden rounded-[20px] border border-border">
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
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-h2">
              {t("home.contact.title")}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              {t("home.contact.subtitle")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
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
      </div>
    </section>
  );
}
