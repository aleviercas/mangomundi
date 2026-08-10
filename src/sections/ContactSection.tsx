import { Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { TrustBox } from "@/components/TrustBox";

/** Simple contact section: one email, no forms. Business/partnership content
 *  lives in BusinessSection. */
export function ContactSection() {
  const { t } = useI18n();
  return (
    <section id="contact" className="scroll-mt-24 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          {t("home.contact.eyebrow")}
        </p>
        <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
          {t("home.contact.simple.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          {t("home.contact.simple.body")}
        </p>
        <div className="mt-8">
          {/* .btn-cta, not a bespoke bg-slate-900 black button — this is the
              one and only action of this section (send an email), the same
              functional role CTASection's button plays for the comparator.
              It used to be the only primary-looking button on the site that
              wasn't actually orange; nothing else in the design system
              signals "black solid" as a valid alternate primary style. */}
          <a
            href="mailto:hello@mangomundi.com"
            className="btn-cta inline-flex h-11 items-center justify-center gap-2 rounded-md px-8 text-sm font-semibold"
          >
            <Mail className="h-4 w-4" /> hello@mangomundi.com
          </a>
        </div>
        {/* Placed here (light background) rather than the dark Footer —
            Trustpilot's widget renders its own styling into this div via
            the bootstrap script (see __root.tsx), which is designed for a
            light surface. A narrow max-width keeps it from stretching
            edge-to-edge on wide screens the way the rest of this
            (text-centered, narrow) section doesn't either. */}
        <div className="mx-auto mt-10 max-w-md">
          <TrustBox />
        </div>
      </div>
    </section>
  );
}
