import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

function HexCoin({
  symbol,
  className = "",
  size = 96,
}: {
  symbol: string;
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <polygon
          points="50,4 92,27 92,73 50,96 8,73 8,27"
          fill="white"
          stroke="#0F172A"
          strokeWidth="1.25"
        />
        <polygon
          points="50,12 85,31 85,69 50,88 15,69 15,31"
          fill="none"
          stroke="#0F172A"
          strokeWidth="0.5"
          opacity="0.25"
        />
      </svg>
      <span
        className="relative font-heading font-extrabold text-slate-950 select-none"
        style={{ fontSize: size * 0.42 }}
      >
        {symbol}
      </span>
    </div>
  );
}

function CurrencyConstellation() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[210px] opacity-90">
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0F172A" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <line x1="110" y1="90" x2="290" y2="120" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="290" y1="120" x2="310" y2="300" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="310" y1="300" x2="100" y2="280" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="100" y1="280" x2="110" y2="90" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="110" y1="90" x2="310" y2="300" stroke="url(#lineGrad)" strokeWidth="0.5" strokeDasharray="3 4" />
        <line x1="290" y1="120" x2="100" y2="280" stroke="url(#lineGrad)" strokeWidth="0.5" strokeDasharray="3 4" />
        {[[60, 60], [340, 70], [360, 250], [50, 340], [200, 30], [200, 370]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill="#0F172A" opacity="0.22" />
        ))}
      </svg>

      <div className="absolute" style={{ top: "8%", left: "12%" }}>
        <HexCoin symbol="£" size={56} />
      </div>
      <div className="absolute" style={{ top: "14%", right: "8%" }}>
        <HexCoin symbol="€" size={48} />
      </div>
      <div className="absolute" style={{ bottom: "10%", right: "12%" }}>
        <HexCoin symbol="$" size={60} />
      </div>
      <div className="absolute" style={{ bottom: "12%", left: "10%" }}>
        <HexCoin symbol="¥" size={46} />
      </div>
    </div>
  );
}

export function HeroSection() {
  const { t } = useI18n();

  return (
    <section className="relative pt-16 pb-12 lg:pt-20 lg:pb-16">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1.4fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <CurrencyConstellation />
          </div>

          <div className="order-1 min-w-0 max-w-2xl lg:order-2">
            <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.5rem]">
              {t("hero.headline")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
              {t("hero.subheadline.short")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/"
                hash="comparator"
                className="btn-cta inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold"
              >
                {t("comparator.cta.compare")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
