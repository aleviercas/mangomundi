export function BlogSection() {
  return (
    <section id="blog" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="rounded-[2rem] bg-white p-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_-20px_rgba(15,23,42,0.12)] sm:p-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">Blog</p>
          <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Insights on global FX, coming soon.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500">
            We're preparing in-depth analysis on cross-border payments, corridor economics, and FX intelligence. Check back soon.
          </p>
        </div>
      </div>
    </section>
  );
}
