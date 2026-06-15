const PILLARS = [
  {
    label: "Mission",
    body: "Facilitate access to the best foreign exchange decisions through neutral, AI-powered intelligence, eliminating information asymmetry and hidden costs from global payments.",
  },
  {
    label: "Vision",
    body: "A world where every local FX or cross-border payment, from a family remittance to a multinational treasury operation, runs through a transparent and equitable decision layer.",
  },
  {
    label: "Problem",
    body: "A two-sided inefficiency. On one side, retail clients and businesses face a frustrating maze regarding best rates. On the other, financial institutions struggle with high acquisition costs and fragmented channels.",
  },
];

export function AboutManifestoSection() {
  return (
    <section id="about" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="rounded-[2rem] bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_50px_-22px_rgba(15,23,42,0.14)] sm:p-14">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">About</p>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Financial intelligence for every currency decision.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-500">
              A neutral decision engine: we connect retail and corporate flows to the best available cross-border route or local currency exchange operator — without bias or hidden margins.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.label} className="rounded-[1.5rem] bg-slate-50 p-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{p.label}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
