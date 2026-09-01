import { Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { TrustBox } from "@/components/TrustBox";

/** Simple contact section: one email, no forms. Business/partnership content
 *  lives in BusinessSection. */
export function ContactSection() {
  const { t } = useI18n();
  // 2026-08-31 feedback — "los espacios en general deberían estar más
  // compactos" vs. design/Mangomundi 4 - Final.dc.html: every other content
  // band on the site matches the mockup's ~38–46px sections (see
  // HowItWorksSection/AboutManifestoSection/BusinessWidgetRow's own
  // comments); this one was still at the old py-14 sm:py-20 (56–80px).
  return (
    <section id="contact" className="scroll-mt-24 py-9 sm:py-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 text-center">
        <p className="text-eyebrow font-bold uppercase text-accent">{t("home.contact.eyebrow")}</p>
        <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-h2">
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
            (text-centered, narrow) section doesn't either.
            2026-09-01 feedback — "el trustpilot está desalineado": this
            section's `text-center` only centers inline content — once
            Trustpilot's script upgrades `.trustpilot-widget` it may not
            stay inline, so `text-align` alone stops centering it. Same fix
            as the rail's TrustpilotCard (see its own comment): `mx-auto`
            targeted straight at that div centers it by its own margins,
            independent of whatever display/width the script gives it. */}
        <div className="mx-auto mt-10 max-w-md [&_.trustpilot-widget]:mx-auto">
          <TrustBox />
        </div>
      </div>
    </section>
  );
}
