import { HomeSearch } from "@/components/HomeSearch";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <h1 className="font-heading text-[2.75rem] font-extrabold leading-[1.02] tracking-tight text-slate-900 sm:text-6xl lg:text-[4.5rem]">
              Intelligent currency exchange{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg, #000000 0%, #ff6b5b 100%)" }}
              >
                decisions
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-slate-500 sm:text-lg lg:mx-0">
              A transparent AI agent for global and local payments, comparing exchange rates, fees,
              routes, and delivery speeds in real time to find the best option for every transfer.
            </p>
          </div>
          <div className="mt-4 lg:mt-0">
            <HomeSearch />
          </div>
        </div>
      </div>
    </section>
  );
}
