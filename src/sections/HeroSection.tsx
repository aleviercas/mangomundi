import { useI18n } from "@/lib/i18n";
import { HomeSearch } from "@/components/HomeSearch";
import { Wordmark } from "@/components/Wordmark";

export function HeroSection() {
  const { t } = useI18n();

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,color-mix(in_oklab,var(--accent)_12%,transparent),transparent_42%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Wordmark tone="light" className="text-sm tracking-[0.22em]" />
          <h1 className="mt-8 font-heading text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">{t("hero.headline")}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{t("hero.subheadline.short")}</p>
        </div>
        <div className="mx-auto mt-12 max-w-6xl rounded-2xl border border-border bg-card/80 p-5 shadow-2xl backdrop-blur sm:p-8">
          <HomeSearch />
        </div>
      </div>
    </section>
  );
}
