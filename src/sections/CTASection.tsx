import { useState } from "react";
import { Terminal, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { RfqTerminal } from "@/components/RfqTerminal";

export function CTASection() {
  const { t } = useI18n();
  const [rfqOpen, setRfqOpen] = useState(false);

  return (
    <section className="relative overflow-hidden bg-card py-20 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_oklch(0.70_0.175_55)_0%,_transparent_60%)] opacity-10" />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
          {t("home.finalCta.title")}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          {t("home.finalCta.subtitle")}
        </p>
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setRfqOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20"
          >
            <Terminal className="h-5 w-5" />
            {t("home.finalCta.rfq")}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <RfqTerminal open={rfqOpen} onOpenChange={setRfqOpen} />
    </section>
  );
}
