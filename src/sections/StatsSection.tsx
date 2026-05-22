import { Globe, DollarSign, Building2, Activity } from "lucide-react";

const stats = [
  { icon: Globe, value: "150+", label: "Currencies Supported" },
  { icon: DollarSign, value: "$2B+", label: "Volume Processed" },
  { icon: Building2, value: "50+", label: "Banking Partners" },
  { icon: Activity, value: "99.9%", label: "Uptime SLA" },
];

export function StatsSection() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
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
