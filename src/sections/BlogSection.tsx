import { useI18n } from "@/lib/i18n";

interface BlogCard {
  eyebrow: string;
  title: string;
  body: string;
  placeholder?: boolean;
}

export function BlogSection() {
  const { t } = useI18n();
  const cards: BlogCard[] = [
    {
      eyebrow: t("home.blog.eyebrow"),
      title: t("home.blog.title"),
      body: t("home.blog.body"),
      placeholder: true,
    },
  ];
  return (
    <section id="blog" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">
            {t("home.blog.eyebrow")}
          </p>
          <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            {t("home.blog.title")}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {cards.map((c, i) => (
            <article
              key={i}
              className="group flex h-full flex-col rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.4)] transition-shadow hover:shadow-[0_30px_70px_-25px_rgba(15,23,42,0.55)]"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">
                {c.placeholder ? "Coming soon" : c.eyebrow}
              </p>
              <h3 className="mt-3 font-heading text-xl font-extrabold text-white sm:text-2xl">
                {c.placeholder ? "Insights on global FX, coming soon" : c.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {c.placeholder
                  ? "We're preparing in-depth analysis on cross-border payments, corridor economics, and FX intelligence. Check back soon."
                  : c.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
