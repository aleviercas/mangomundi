import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { SUPPORTED_LANGS } from "@/lib/i18n";

// 2026-09-19 -- ?lang= real, no basura. Encontrado en vivo (verificacion
// con servidor real): sin esto, "/insurance?lang=es" perdia el idioma y
// siempre redirigia a "/" en ingles, mientras que /compare.tsx (que ya
// tenia esta logica) si lo preservaba -- inconsistencia entre los 7
// redirects legacy, no algo que rompiera nada, pero igualado por
// consistencia. Mismo patron que compare.tsx.
const searchSchema = z.object({ lang: z.string().optional() }).catch({});

// Leftover from a previous site version — not linked anywhere in the
// current nav/footer and won't be used going forward. Kept as a redirect
// (not deleted outright) so any old bookmark, backlink, or previously-
// indexed URL doesn't 404.
export const Route = createFileRoute("/insurance")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: ({ search }) => {
    const q = search.lang?.toLowerCase();
    const target = q && (SUPPORTED_LANGS as string[]).includes(q) && q !== "en" ? q : undefined;
    throw redirect({ to: "/{-$lang}", params: { lang: target }, statusCode: 301 });
  },
});
