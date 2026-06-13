import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ComparatorSection } from "@/sections/ComparatorSection";

const compareSearchSchema = z.object({
  origin: z.string().length(2).default("GB"),
  destination: z.string().length(2).default("US"),
  segment: z.enum(["retail", "business"]).default("retail"),
  from: z.string().length(3).default("GBP"),
  to: z.string().length(3).default("USD"),
  amount: z.coerce.number().positive().default(1000),
  lang: z.string().length(2).optional(),
});

export const Route = createFileRoute("/compare")({
  validateSearch: (search) => compareSearchSchema.parse(search),
  component: ComparePage,
});

function ComparePage() {
  const search = Route.useSearch();
  return <ComparatorSection initialQuery={search} />;
}
