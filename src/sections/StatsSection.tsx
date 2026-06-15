const STATS = [
  { value: "2026", label: "Founded" },
  { value: "150+", label: "Countries Covered" },
  { value: "100+", label: "Currencies Supported" },
  { value: "50+", label: "Global providers evaluated in real time" },
];

export function StatsSection() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.4)] sm:p-12">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">Market coverage</p>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              One view across the global FX market.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              Our decision engine evaluates more than 50 global providers in real time, normalizing rates, fees, delivery speed and corridor availability into a clear comparison.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                  {s.value}
                </div>
                <div className="mt-2 text-xs font-medium leading-snug text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
