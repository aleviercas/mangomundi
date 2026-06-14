import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function CTASection() {
  const { t } = useI18n();
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="surface-card p-8 sm:p-12">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("home.cta.badge")}
          </div>
          <h2 className="font-heading text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {t("home.cta.title")}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {t("home.cta.subtitle")}
          </p>
          <div className="mt-8">
            <Link
              to="/compare"
              search={{ origin: "GB", destination: "US", segment: "business", from: "GBP", to: "USD", amount: 10000 }}
              className="btn-cta inline-flex h-11 items-center gap-2 rounded-md px-6 text-sm font-semibold"
            >
              {t("home.cta.button")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
