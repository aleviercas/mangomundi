import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleCheck, Eye, ShieldCheck } from "lucide-react";
import { CountrySelect } from "@/components/ui/CountrySelect";
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
  const detectCountry = useServerFn(getVisitorCountry);
  const ready = Boolean(destination);
  const from = localCurrency(origin);
  let to = localCurrency(destination);
  if (origin === destination && from === to) to = from === "USD" ? "EUR" : "USD";
  const promiseItems = [
    t("home.feat.liveRates"),
    t("home.feat.zeroFees"),
    t("home.feat.noSignup"),
  ];
  const promiseIcons = [CircleCheck, Eye, ShieldCheck];

  useEffect(() => {
    detectCountry()
      .then(setOrigin)
      .catch(() => setOrigin("US"));
  }, [detectCountry]);

  return (
    <div className="mx-auto w-full max-w-lg lg:mx-0">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.4)] sm:p-7">
        {/* Compact segment toggle, top-right */}
        <div className="flex justify-end">
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

        <label className="mt-3 block sm:mt-4">
          <span className="mb-2 block text-xs font-medium text-slate-300 sm:text-sm">
            {t("search.destination")}
          </span>
          <CountrySelect
            value={destination}
            onChange={setDestination}
            placeholder={t("search.selectCountry")}
            searchPlaceholder={t("comparator.combobox.search")}
            emptyLabel={t("comparator.combobox.empty")}
            ariaLabel={t("search.destination")}
            triggerClassName="h-12 sm:h-14 rounded-xl border border-white/10 bg-white/5 px-4 text-sm sm:text-base font-medium text-white hover:border-white/20 focus:ring-2 focus:ring-white/20"
          />
        </label>

        <Button
          asChild
          size="lg"
          className="mt-3 h-12 w-full rounded-xl bg-[#ff6b5b] text-sm font-semibold text-white hover:bg-[#ff5a48] sm:mt-5 sm:h-14 sm:text-base"
        >
          <Link
            to="/compare"
            search={{ origin, destination, segment, from, to, amount: 1000, lang }}
            aria-disabled={!ready}
            className={!ready ? "pointer-events-none opacity-50" : ""}
            onClick={() =>
              track("comparator_query", {
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
