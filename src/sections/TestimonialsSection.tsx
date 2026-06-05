import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "mangoglobal saved us $340K in FX costs in the first quarter alone. The transparency is unlike anything we've seen.",
    author: "Sarah Chen",
    role: "CFO, TechVentures Inc.",
    rating: 5,
  },
  {
    quote: "I send money to my family in Manila every month. mangoglobal consistently beats Wise and Revolut on rates.",
    author: "Marco Reyes",
    role: "Healthcare Professional",
    rating: 5,
  },
  {
    quote: "The API integration took our engineers two days. We now automate FX hedging for 12 currencies.",
    author: "James Okafor",
    role: "Head of Treasury, AfriTrade",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Trusted Worldwide
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            From solo remitters to Fortune 500 treasury teams
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <Quote className="h-8 w-8 text-primary/30 mb-4" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-6">{t.quote}</p>
              <div>
                <div className="font-heading font-semibold text-foreground">{t.author}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
