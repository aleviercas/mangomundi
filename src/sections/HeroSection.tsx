import { useState } from "react";
import { Terminal, TrendingUp, Shield, Zap, GitCompare } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { RfqTerminal } from "@/components/RfqTerminal";

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
  const [rfqOpen, setRfqOpen] = useState(false);

  return (
    <section className="relative pt-16 pb-16 lg:pt-20 lg:pb-20">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.4fr] lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <CurrencyConstellation />
          </div>

          <div className="order-1 lg:order-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium tracking-widest text-white uppercase mb-6 shadow-sm">
              ⚡ Agentic AI for Global FX <span className="text-slate-500 px-1">|</span>
              <span className="text-white font-black lowercase">mango</span>
              <span className="text-slate-300 font-light lowercase">global</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-slate-950 leading-[1.05]">
              {t("home.hero.title")}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-500 max-w-2xl font-normal leading-relaxed">
              {t("home.hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/compare"
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                <GitCompare className="h-4 w-4" />
                {t("home.hero.ctaCompare")}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              {[
                { Icon: TrendingUp, label: t("hero.trust.1") },
                { Icon: Shield, label: t("hero.trust.2") },
                { Icon: Zap, label: t("hero.trust.3") },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-slate-500">
                  <Icon className="h-4 w-4 text-slate-700" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <RfqTerminal open={rfqOpen} onOpenChange={setRfqOpen} />
    </section>
  );
}
