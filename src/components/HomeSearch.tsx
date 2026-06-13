import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Route } from "lucide-react";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { Button } from "@/components/ui/button";
import { localCurrency } from "@/lib/countries";
import { useI18n } from "@/lib/i18n";
import { useAnalytics } from "@/hooks/use-analytics";

type Segment = "retail" | "business";

export function HomeSearch() {
  const { t, lang } = useI18n();
  const { track } = useAnalytics();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [segment, setSegment] = useState<Segment>("retail");
  const ready = Boolean(origin && destination);
  const from = localCurrency(origin);
  let to = localCurrency(destination);
  if (origin === destination && from === to) to = from === "USD" ? "EUR" : "USD";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        <Route className="h-4 w-4" /> {t("search.eyebrow")}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <label className="block min-w-0">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("search.origin")}</span>
          <CountrySelect value={origin} onChange={setOrigin} placeholder={t("search.selectCountry")} searchPlaceholder={t("comparator.combobox.search")} emptyLabel={t("comparator.combobox.empty")} />
        </label>
        <label className="block min-w-0">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("search.destination")}</span>
          <CountrySelect value={destination} onChange={setDestination} placeholder={t("search.selectCountry")} searchPlaceholder={t("comparator.combobox.search")} emptyLabel={t("comparator.combobox.empty")} />
        </label>
        <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("search.segment")}</span>
          <div className="flex h-11 rounded-md border border-border bg-muted p-1" role="tablist">
            {(["retail", "business"] as Segment[]).map((value) => (
              <Button key={value} type="button" variant={segment === value ? "default" : "ghost"} size="sm" role="tab" aria-selected={segment === value} onClick={() => setSegment(value)} className="h-9 flex-1 px-4">
                {t(`search.segment.${value}`)}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <Button asChild size="lg" className="mt-5 h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90">
        <Link
          to="/compare"
          search={{ origin, destination, segment, from, to, amount: 1000, lang }}
          aria-disabled={!ready}
          className={!ready ? "pointer-events-none opacity-50" : ""}
          onClick={() => track("comparator_query", { from_currency: from, to_currency: to, segment, source: "home_search" })}
        >
          {t("search.cta")} <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">{t("search.hint")}</p>
    </div>
  );
}