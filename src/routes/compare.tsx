import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

// The comparator now lives on the home page — /compare only redirects there.
// ?lang is preserved (the e2e suite and old links rely on it); every other
// legacy search param is intentionally dropped. `.catch({})` keeps garbage
// params from erroring the route before the redirect can fire.
//
// Uses `redirect({ to, search })` (same pattern as every other redirect
// stub route) instead of a manually-built `href` string — GSC flagged this
// route specifically as a "Redirect error" (distinct from the normal/expected
// "Page with redirect" seen on the other stubs), and this was the only route
// not using the router-native `to` API.
const redirectSearchSchema = z.object({ lang: z.string().optional() }).catch({});

export const Route = createFileRoute("/compare")({
  validateSearch: (search) => redirectSearchSchema.parse(search),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/", search: search.lang ? { lang: search.lang } : undefined });
  },
});
