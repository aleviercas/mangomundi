import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

// The comparator now lives on the home page — /compare only redirects there.
// ?lang is preserved (the e2e suite and old links rely on it); every other
// legacy search param is intentionally dropped. `.catch({})` keeps garbage
// params from erroring the route before the redirect can fire.
const redirectSearchSchema = z.object({ lang: z.string().optional() }).catch({});

export const Route = createFileRoute("/compare")({
  validateSearch: (search) => redirectSearchSchema.parse(search),
  beforeLoad: ({ search }) => {
    throw redirect({ href: search.lang ? `/?lang=${search.lang}` : "/" });
  },
});
