import { useState } from "react";
import { Check, Code2, Copy } from "lucide-react";
import { EmbedComparator } from "@/components/EmbedComparator";
import { useI18n } from "@/lib/i18n";

const SCRIPT_SNIPPET = `<script src="https://mangomundi.com/widget.js"
  data-currency="USD"
  data-lang="auto" async></script>`;

const IFRAME_SNIPPET = `<iframe src="https://mangomundi.com/embed"
  width="360" height="540" style="border:0;border-radius:16px"
  title="Currency comparison by mangomundi" loading="lazy"></iframe>`;

/** The embeddable "powered by mangomundi" comparator: a live preview of the
 *  real widget next to copy-paste install instructions. */
export function EmbedWidgetSection() {
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
    <section id="widget" className="scroll-mt-24 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* Copy + install instructions */}
          <div>
            <p className="text-eyebrow font-bold uppercase text-accent">
              {t("home.widget.eyebrow")}
            </p>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-h2">
              {t("home.widget.title")}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              {t("home.widget.body")}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
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
          </div>

          {/* Live preview — the real widget, exactly what gets embedded. */}
          <div className="lg:pt-2">
            <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_-25px_rgba(15,23,42,0.25)]">
              <div className="h-[540px]">
                {/* design/AJUSTES-1.md §H — a real result, not the empty
                    "Select…" state: this is the widget's own demo, so it
                    should show what embedding it actually gets you. Same
                    USD→MXN pair TodaysRoutesSection's candidate list already
                    checks, not a new one-off example. */}
                <EmbedComparator
                  initialCurrency="USD"
                  previewDestination={{ country: "MX", currency: "MXN" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
