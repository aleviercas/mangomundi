import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { SUPPORTED_LANGS } from "@/lib/i18n";

// The comparator now lives on the home page — /compare only redirects there.
// ?lang is preserved (the e2e suite and old links rely on it): translated
// into the new /:lang path prefix now (2026-09-10, ver
// docs/handoff/handoff-2026-09-10-plan-urls-por-idioma.md), en vez de
// reenviarlo como query param. Every other legacy search param is
// intentionally dropped. `.catch({})` keeps garbage params from erroring
// the route before the redirect can fire.
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
    const q = search.lang?.toLowerCase();
    const target = q && (SUPPORTED_LANGS as string[]).includes(q) && q !== "en" ? q : undefined;
    throw redirect({ to: "/{-$lang}", params: { lang: target }, statusCode: 301 });
  },
});
