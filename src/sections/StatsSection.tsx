import { Globe, DollarSign, Calendar } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function StatsSection() {
  const { t } = useI18n();
  const stats = [
    { icon: Calendar, value: "2026", label: t("home.stats.founded") },
    { icon: Globe, value: "150+", label: t("home.stats.countries") },
    { icon: DollarSign, value: "100+", label: t("home.stats.currencies") },
  ];
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <stat.icon className="h-6 w-6 text-primary mb-3" />
              <div className="font-heading text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
