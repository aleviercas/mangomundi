import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Code2, Copy } from "lucide-react";
import { z } from "zod";
import { EmbedComparator } from "@/components/EmbedComparator";
import { getRouteSeo, useI18n } from "@/lib/i18n";
import { hreflangLinks, selfCanonical } from "@/config/site";

const searchSchema = z.object({ lang: z.string().optional() }).catch({});

const SCRIPT_SNIPPET = `<script src="https://mangomundi.com/widget.js"
  data-currency="USD"
  data-lang="auto" async></script>`;

const IFRAME_SNIPPET = `<iframe src="https://mangomundi.com/embed"
  width="360" height="540" style="border:0;border-radius:16px"
  title="Currency comparison by mangomundi" loading="lazy"></iframe>`;

/** design/Mangomundi 4 - Final.dc.html's small home "Widget" card (line
 *  204-213) now links here instead of carrying the full explanation +
 *  live preview itself (previously EmbedWidgetSection.tsx, deleted, which
 *  rendered directly on the home page).
 *
 *  2026-08-30 feedback: "hay que extender un poco mas la explicacion de
 *  como se instala y para que sirve" — this page keeps the install
 *  snippets and live preview from that section, unchanged, and adds a
 *  "how it works"/"who it's for" block that didn't exist before. */
export const Route = createFileRoute("/widget")({
  validateSearch: (search) => searchSchema.parse(search),
  loader: async () => {
    const { getInitialLang } = await import("@/lib/geo.functions");
    const lang = await getInitialLang().catch(() => "en" as const);
    return { lang };
  },
  head: ({ match, loaderData }) => {
    const canonical = selfCanonical("/widget", match.search.lang);
    const seo = getRouteSeo(loaderData?.lang ?? "en", "/widget");
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }, ...hreflangLinks("/widget")],
    };
  },
  component: WidgetPage,
});

function WidgetPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"script" | "iframe">("script");
  const [copied, setCopied] = useState(false);
  const snippet = tab === "script" ? SCRIPT_SNIPPET : IFRAME_SNIPPET;

  const copy = () => {
    navigator.clipboard?.writeText(snippet).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {},
    );
  };

  return (
    <main className="mx-auto max-w-6xl px-5 pt-28 pb-20 sm:px-8">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        {/* 2026-09-02 feedback — W13 mobile audit: measured a real 10px
            horizontal overflow on /widget at 375px (docW 385 vs a 375
            viewport, confirmed via scrollWidth). Root cause: the code
            snippet's `<pre className="overflow-x-auto ...">` (unwrapped
            `<script>` text) has a min-content width wider than the
            viewport, and this grid item — like every grid/flex item by
            default — has an implicit `min-width: auto`, so the browser
            grows the COLUMN to fit that min-content instead of letting the
            `<pre>` scroll internally. `min-w-0` overrides that default so
            the item can shrink below its content's natural width, which is
            what actually lets overflow-x-auto contain the snippet instead
            of pushing the whole page wider. */}
        <div className="min-w-0">
          <p className="text-eyebrow font-bold uppercase text-accent-text">
            {t("home.widget.eyebrow")}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-h1">
            {t("home.widget.title")}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("home.widget.body")}
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-text">
            {t("home.widget.badge")}
          </span>

          <div className="surface-card mt-6 overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-1">
                {(["script", "iframe"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      tab === k
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {k === "script" ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Code2 className="h-3.5 w-3.5" /> {t("home.widget.tab.script")}
                      </span>
                    ) : (
                      t("home.widget.tab.iframe")
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" /> {t("home.widget.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> {t("home.widget.copy")}
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto bg-muted/40 p-4 text-[12px] leading-relaxed text-foreground">
              <code>{snippet}</code>
            </pre>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t("home.widget.hint")}
          </p>

          {/* 2026-08-30 feedback — the extended explanation the home card
              no longer has room for. */}
          <div className="mt-10 space-y-6 border-t border-border pt-8">
            <div>
              <h2 className="text-eyebrow font-bold uppercase text-accent-text">
                {t("widget.page.how.label")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {t("widget.page.how.body")}
              </p>
            </div>
            <div>
              <h2 className="text-eyebrow font-bold uppercase text-accent-text">
                {t("widget.page.who.label")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {t("widget.page.who.body")}
              </p>
            </div>
          </div>
        </div>

        {/* Live preview — the real widget, exactly what gets embedded. */}
        <div className="lg:pt-2">
          <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_-25px_rgba(15,23,42,0.25)]">
            <div className="h-[540px]">
              {/* 2026-09-02 feedback — "el widget sigue mostrando una
                  búsqueda por default, queremos mostrar todays rates":
                  design/AJUSTES-1.md §H previously auto-ran a real USD→MXN
                  comparison here on the theory that "this is the widget's
                  own demo, so it should show what embedding it actually
                  gets you" — but a real embedder never gets an auto-run
                  result on load (previewDestination is set ONLY here, never
                  by the actual /embed route), so the demo was showing
                  something a real integration never shows. Dropped
                  entirely: this preview now renders exactly what /embed
                  renders — the compact 2-line form plus WidgetExamples'
                  real today's-rates corridors (see EmbedComparator's own
                  comment), the actual default a person embedding this
                  widget gets. */}
              <EmbedComparator initialCurrency="USD" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
