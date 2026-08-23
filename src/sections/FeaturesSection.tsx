import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function FeaturesSection() {
  const { t } = useI18n();

  return (
    <section className="bg-background py-14 lg:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-h2">
            {t("home.infra.title")}
          </h2>
        </div>
        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-h3 font-semibold text-foreground mb-2">
              {t("home.infra.routing.title")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("home.infra.routing.body")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
