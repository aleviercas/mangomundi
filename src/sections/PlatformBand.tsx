import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function PlatformBand() {
  const { t } = useI18n();
  return (
    <section className="border-y border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center">
        <div className="inline-flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="text-muted-foreground">
            {t("home.platform.text")}{" "}
            <span className="text-foreground font-medium">{t("home.platform.brand")}</span>{" "}
            {t("home.platform.tail")}
          </span>
        </div>
        <Link
          to="/platform"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline shrink-0"
        >
          {t("home.platform.learn")} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
