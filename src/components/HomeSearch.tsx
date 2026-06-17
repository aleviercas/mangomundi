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
  const promiseItems = t("search.promise")
    .split(/\.\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
  const promiseIcons = [CircleCheck, Eye, ShieldCheck];

  useEffect(() => {
    detectCountry()
      .then(setOrigin)
      .catch(() => setOrigin("US"));
  }, [detectCountry]);

  return (
    <div className="mx-auto w-full max-w-lg lg:mx-0">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        {/* Compact segment toggle, top-right */}
        <div className="flex justify-end">
          <div
            className="inline-flex rounded-full bg-slate-100 p-1"
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
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t(`search.segment.${value}`)}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            {t("search.destination")}
          </span>
          <CountrySelect
            value={destination}
            onChange={setDestination}
            placeholder={t("search.selectCountry")}
            searchPlaceholder={t("comparator.combobox.search")}
            emptyLabel={t("comparator.combobox.empty")}
            ariaLabel={t("search.destination")}
            triggerClassName="h-14 rounded-xl border border-slate-200 bg-white px-4 text-base font-medium hover:border-slate-300 focus:ring-2 focus:ring-slate-900/10"
          />
        </label>

        <Button
          asChild
          size="lg"
          className="mt-5 h-14 w-full rounded-xl bg-[#ff6b5b] text-base font-semibold text-white hover:bg-[#ff5a48]"
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

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {promiseItems.map((item, index) => {
          const Icon = promiseIcons[index] ?? CircleCheck;
          return (
            <span
              key={item}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-medium text-slate-700"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-[#ff6b5b]" />
              {item}
            </span>
          );
        })}
      </div>
    </div>
  );
}
