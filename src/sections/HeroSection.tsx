import { useI18n } from "@/lib/i18n";
import { HomeSearch } from "@/components/HomeSearch";
import { Wordmark } from "@/components/Wordmark";

export function HeroSection() {
  const { t } = useI18n();

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden py-16 sm:py-24">
      <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-secondary/70 blur-[120px]" />
      <div className="absolute -bottom-52 right-0 h-[34rem] w-[34rem] rounded-full bg-accent/10 blur-[130px]" />
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Wordmark className="text-xl" />
          <h1 className="mt-10 font-heading text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">{t("hero.headline")}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground sm:text-xl">{t("hero.subheadline.short")}</p>
        </div>
        <div className="mx-auto mt-14 max-w-6xl">
          <HomeSearch />
        </div>
      </div>
    </section>
  );
}
