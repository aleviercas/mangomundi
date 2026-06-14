import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleCheck } from "lucide-react";
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

  useEffect(() => {
    detectCountry()
      .then(setOrigin)
      .catch(() => setOrigin("US"));
  }, [detectCountry]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid items-stretch gap-2 rounded-[2rem] border border-border/70 bg-card/80 p-2 shadow-[0_32px_80px_-28px_color-mix(in_oklab,var(--foreground)_22%,transparent)] backdrop-blur-xl lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <label className="block min-w-0 rounded-3xl px-5 py-4 transition-colors hover:bg-background/70">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("search.destination")}
          </span>
          <CountrySelect
            value={destination}
            onChange={setDestination}
            placeholder={t("search.selectCountry")}
            searchPlaceholder={t("comparator.combobox.search")}
            emptyLabel={t("comparator.combobox.empty")}
            ariaLabel={t("search.destination")}
            triggerClassName="h-12 border-0 bg-transparent px-0 text-base font-semibold shadow-none focus:ring-0"
          />
        </label>
        <div className="px-3 py-3">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("search.segment")}
          </span>
          <div
            className="flex h-12 rounded-2xl border border-border/60 bg-muted/70 p-1.5"
            role="tablist"
          >
            {(["retail", "business"] as Segment[]).map((value) => (
              <Button
                key={value}
                type="button"
                variant={segment === value ? "default" : "ghost"}
                size="sm"
                role="tab"
                aria-selected={segment === value}
                onClick={() => setSegment(value)}
                className="h-9 flex-1 rounded-xl px-5"
              >
                {t(`search.segment.${value}`)}
              </Button>
            ))}
          </div>
        </div>
        <div className="p-1">
          <Button
            asChild
            size="lg"
            className="h-16 w-full rounded-[1.6rem] bg-foreground px-8 text-background shadow-xl hover:bg-foreground/90 lg:w-auto"
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
      </div>
      <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">
        {t("search.guide")}
      </p>
      <div className="mt-5 flex items-center justify-center text-[11px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <CircleCheck className="h-3.5 w-3.5 text-accent" />
          {t("search.promise")}
        </span>
      </div>
    </div>
  );
}
