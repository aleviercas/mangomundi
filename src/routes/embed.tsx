import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { z } from "zod";
import { EmbedComparator } from "@/components/EmbedComparator";
import { SUPPORTED_LANGS, I18nOverride, coerceLang } from "@/lib/i18n";

// Embeddable widget target — loaded inside a third-party iframe by widget.js
// (or a hand-written <iframe>). Renders bare (no Header/Footer; see
// __root.tsx) so it drops cleanly into any host page.
// Per-field `.catch(undefined)` keeps the shape a clean {currency?, amount?,
// lang?} (an object-level .catch({}) would union in {} and drop the fields'
// types) while still swallowing garbage params.
const embedSearchSchema = z.object({
  currency: z.string().optional().catch(undefined),
  amount: z.coerce.number().positive().optional().catch(undefined),
  lang: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/embed")({
  validateSearch: (search) => embedSearchSchema.parse(search),
  // 2026-09-13 — este `?lang=` es el único que sigue vivo en todo el sitio
  // (el resto migró a prefijo de path, ver
  // docs/handoff/handoff-2026-09-10-plan-urls-por-idioma.md) porque /embed
  // no tiene ni puede tener su propio `{-$lang}` — es un target de
  // iframe, no una página navegable. Con `?lang=` explícito, se usa tal
  // cual; sin él (el default `data-lang="auto"` de widget.js), se detecta
  // por geo-IP/Accept-Language — ver el comentario grande de
  // detectEmbedLang() en geo.functions.ts sobre por qué acá sí corresponde
  // hacer esto, a diferencia del resto del sitio.
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: async ({ deps }) => {
    const q = deps.lang?.toLowerCase();
    if (q && (SUPPORTED_LANGS as string[]).includes(q)) {
      return { lang: coerceLang(q) };
    }
    const { detectEmbedLang } = await import("@/lib/geo.functions");
    return { lang: await detectEmbedLang().catch(() => "en" as const) };
  },
  head: () => ({
    meta: [
      { title: "Currency comparison widget — mangomundi" },
      // An embed target is not a standalone page; keep it out of the index.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EmbedPage,
});

function EmbedPage() {
  const { currency, amount } = Route.useSearch();
  const { lang } = Route.useLoaderData();
  // Same geo the home page uses (computed once in __root.tsx's loader from
  // the visitor's real IP) — an iframe embed is still a direct request from
  // the visitor's browser to mangomundi.com, so this is accurate even on a
  // third-party host page. Previously this route ignored it entirely and
  // EmbedComparator defaulted to a hardcoded US/USD.
  const rootData = useLoaderData({ from: "__root__" }) as {
    geoCountry?: string;
    geoCurrency?: string;
  };
  return (
    <div className="h-screen w-full">
      <I18nOverride lang={lang}>
        <EmbedComparator
          initialCurrency={currency}
          initialAmount={amount}
          geoCountry={rootData?.geoCountry}
          geoCurrency={rootData?.geoCurrency}
        />
      </I18nOverride>
    </div>
  );
}
