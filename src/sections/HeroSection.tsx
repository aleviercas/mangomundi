import { HomeSearch } from "@/components/HomeSearch";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-heading text-[2.75rem] font-extrabold leading-[1.02] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Intelligent currency exchange{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #000000 0%, #ff6b5b 100%)" }}
            >
              decisions
            </span>
            .
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-slate-500 sm:text-lg">
            A neutral decision engine that compares cross-border routes and local currency exchange operators in real time — without bias or hidden margins.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-6xl sm:mt-16">
          <HomeSearch />
        </div>
      </div>
    </section>
  );
}
