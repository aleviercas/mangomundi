import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleCheck, Eye, ShieldCheck } from "lucide-react";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { CurrencyCombobox } from "@/components/ui/CurrencyCombobox";
import { Button } from "@/components/ui/button";
import { localCurrency } from "@/lib/countries";
import { useI18n } from "@/lib/i18n";
import { useAnalytics } from "@/hooks/use-analytics";
import { getVisitorCountry } from "@/lib/geo.functions";

type Segment = "retail" | "business";

export function HomeSearch() {
  const { t, lang } = useI18n();
  const { track } = useAnalytics();
  const [origin, setOrigin] = useState("US");
  const [destination, setDestination] = useState("");
  const [segment, setSegment] = useState<Segment>("retail");
  const [amount, setAmount] = useState(1000);
  // null = follow the geo-detected origin's currency; set once the user picks.
  const [fromOverride, setFromOverride] = useState<string | null>(null);
  const detectCountry = useServerFn(getVisitorCountry);
  const ready = Boolean(destination) && amount > 0;
  const from = fromOverride ?? localCurrency(origin);
  let to = localCurrency(destination);
  // Same-currency corridors aren't comparable; nudge the target to a sane pair.
  if (from === to) to = from === "USD" ? "EUR" : "USD";
  const promiseItems = [t("home.feat.liveRates"), t("home.feat.zeroFees"), t("home.feat.noSignup")];
  const promiseIcons = [CircleCheck, Eye, ShieldCheck];

  useEffect(() => {
    detectCountry()
      .then(setOrigin)
      .catch(() => setOrigin("US"));
  }, [detectCountry]);

  return (
    <div className="mx-auto w-full max-w-lg lg:mx-0">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-3 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.4)] sm:p-7">
        {/* Header: COMPARE label + segment toggle */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b] sm:text-sm">
            {t("home.search.compareLabel")}
          </p>
          <div
            className="inline-flex rounded-full bg-white/10 p-1"
            role="tablist"
            aria-label={t("search.segment")}
          >
            {(["retail", "business"] as Segment[]).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={segment === value}
                onClick={() => setSegment(value)}
                className={`h-7 rounded-full px-3 text-xs font-semibold transition ${
                  segment === value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {t(`search.segment.${value}`)}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-2 block sm:mt-4">
          <span className="mb-1.5 block text-xs font-medium text-slate-300 sm:text-sm">
            {t("comparator.field.amount")}
          </span>
          <div className="grid grid-cols-[1.5fr_1fr] gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={1}
              value={amount || ""}
              placeholder="1000"
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
              aria-label={t("comparator.field.amount")}
              className="h-12 w-full min-w-0 rounded-xl border border-transparent bg-white px-4 text-sm font-medium tabular-nums text-slate-900 shadow-sm placeholder:text-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#ff6b5b]/40 sm:h-14 sm:text-base"
            />
            <CurrencyCombobox
              value={from}
              onChange={setFromOverride}
              placeholder={t("comparator.combobox.placeholder")}
              searchPlaceholder={t("comparator.combobox.search")}
              emptyLabel={t("comparator.combobox.empty")}
              ariaLabel={t("comparator.field.sourceCurrency")}
              triggerClassName="h-12 sm:h-14 rounded-xl border border-transparent bg-white px-4 text-sm sm:text-base font-medium text-slate-900 shadow-sm hover:bg-slate-50 hover:border-transparent focus:ring-2 focus:ring-[#ff6b5b]/40"
            />
          </div>
        </label>

        <label className="mt-2 block sm:mt-4">
          <span className="mb-1.5 block text-xs font-medium text-slate-300 sm:text-sm">
            {t("search.destination")}
          </span>
          <CountrySelect
            value={destination}
            onChange={setDestination}
            placeholder={t("search.selectCountry")}
            searchPlaceholder={t("comparator.combobox.search")}
            emptyLabel={t("comparator.combobox.empty")}
            ariaLabel={t("search.destination")}
            triggerClassName="h-12 sm:h-14 rounded-xl border border-transparent bg-white px-4 text-sm sm:text-base font-medium text-slate-900 shadow-sm hover:bg-slate-50 hover:border-transparent focus:ring-2 focus:ring-[#ff6b5b]/40"
          />
        </label>

        <Button
          asChild
          size="lg"
          className="mt-3 h-12 w-full rounded-xl bg-[#ff6b5b] text-sm font-semibold text-white hover:bg-[#ff5a48] sm:mt-5 sm:h-14 sm:text-base"
        >
          <Link
            to="/compare"
            search={{ origin, destination, segment, from, to, amount, lang, run: 1 }}
            aria-disabled={!ready}
            className={!ready ? "pointer-events-none opacity-50" : ""}
            onClick={() =>
              track("comparator_query", {
                amount,
                from_currency: from,
                to_currency: to,
                segment,
                source: "home_search",
              })
            }
          >
            {t("search.cta")} <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:mt-6 sm:gap-2">
        {promiseItems.map((item, index) => {
          const Icon = promiseIcons[index] ?? CircleCheck;
          return (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 sm:px-3.5 sm:py-1.5 sm:text-xs"
            >
              <Icon className="h-3 w-3 shrink-0 text-[#ff6b5b] sm:h-3.5 sm:w-3.5" />
              {item}
            </span>
          );
        })}
      </div>
    </div>
  );
}
