import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { SUPPORTED_LANGS } from "@/lib/i18n";

// 2026-09-19 -- ?lang= real, no basura. Encontrado en vivo (verificacion
// con servidor real): sin esto, "/fx-tool?lang=es" perdia el idioma y
// siempre redirigia a "/" en ingles, mientras que /compare.tsx (que ya
// tenia esta logica) si lo preservaba -- inconsistencia entre los 7
// redirects legacy, no algo que rompiera nada, pero igualado por
// consistencia. Mismo patron que compare.tsx.
const searchSchema = z.object({ lang: z.string().optional() }).catch({});

// Legacy alias — the comparator lives on the home page now. Straight redirect
// (not via /compare) to avoid a redirect chain.
export const Route = createFileRoute("/fx-tool")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: ({ search }) => {
    const q = search.lang?.toLowerCase();
    const target = q && (SUPPORTED_LANGS as string[]).includes(q) && q !== "en" ? q : undefined;
    throw redirect({ to: "/{-$lang}", params: { lang: target }, statusCode: 301 });
  },
});
