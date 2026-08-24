import { Cpu, ShieldCheck, Scale } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function TestimonialsSection() {
  const { t } = useI18n();
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-5">
            <Scale className="h-3 w-3 text-primary" /> {t("home.test.badge")}
          </div>
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-h2">
            {t("home.test.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("home.test.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-h3 font-semibold text-foreground mb-2">
              {t("home.test.c1.title")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("home.test.c1.desc")}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-h3 font-semibold text-foreground mb-2">
              {t("home.test.c2.title")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("home.test.c2.desc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
