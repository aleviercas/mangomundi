import { Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Simple contact section: one email, no forms. Business/partnership content
 *  lives in BusinessSection. */
export function ContactSection() {
  const { t } = useI18n();
  return (
    <section id="contact" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">
          {t("home.contact.eyebrow")}
        </p>
        <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          {t("home.contact.simple.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500">
          {t("home.contact.simple.body")}
        </p>
        <div className="mt-8">
          <a
            href="mailto:hello@mangomundi.com"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-slate-900 px-10 text-base font-semibold text-white transition-colors hover:bg-black"
          >
            <Mail className="h-4 w-4" /> hello@mangomundi.com
          </a>
        </div>
      </div>
    </section>
  );
}
