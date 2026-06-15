import { useI18n } from "@/lib/i18n";

const STEPS = [
  {
    n: "01",
    title: "Select your corridor",
    desc: "Choose origin and destination countries plus currencies.",
  },
  {
    n: "02",
    title: "Run the comparison",
    desc: "Our AI engine scans 50+ providers simultaneously in real time.",
  },
  {
    n: "03",
    title: "Pick the best offer",
    desc: "See a transparent breakdown: rate, fees, speed, and total received.",
  },
  {
    n: "04",
    title: "Transfer directly",
    desc: "Go straight to the provider, no middleman, no extra margin.",
  },
];

export function HowItWorksSection() {
  const { t } = useI18n();
  return (
    <section id="how-it-works" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">How it works</p>
          <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Four steps to a better exchange rate.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-slate-500 sm:text-lg">
            {t("search.guide")}
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-[2rem] bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_-20px_rgba(15,23,42,0.12)] transition-shadow hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_50px_-18px_rgba(15,23,42,0.18)]"
            >
              <div className="font-heading text-sm font-bold text-[#ff6b5b]">{s.n}</div>
              <h3 className="mt-4 font-heading text-xl font-extrabold text-slate-900">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
