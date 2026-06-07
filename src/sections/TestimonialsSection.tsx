import { Cpu, Users, Scale } from "lucide-react";

export function TestimonialsSection() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-5">
            <Scale className="h-3 w-3 text-primary" /> Auditable Neutrality
          </div>
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            How the Decision Engine Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Our human team is always available to support and guide users through operational
            complexity — yet absolute algorithmic impartiality is what processes, distributes and
            delivers the best optimised spreads to every party, equitably and without favouritism.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
              Algorithmic Impartiality
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every route is ranked by the engine on objective parameters — wholesale interbank
              rate, total fee, settlement speed and regulatory coverage — never by sponsorship or
              commercial preference. The same logic applies to retail remittances and corporate
              treasury flows.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
              Human Support When It Matters
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our specialists are always reachable to accompany users through operational
              complexity, compliance and large-ticket execution — without ever overriding the
              neutral decision engine that guarantees fair outcomes for every party.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
