import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  validateDictionaries,
  SUPPORTED_LANGS,
  LANGUAGE_METADATA,
  type Lang,
} from "@/lib/i18n";
import { Check, Copy, AlertTriangle, ArrowLeft, RefreshCw, Filter, X } from "lucide-react";

export const Route = createFileRoute("/admin/i18n-status")({
  head: () => ({
    meta: [
      { title: "i18n status · admin · mangoglobal" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Internal i18n coverage dashboard." },
    ],
  }),
  component: I18nStatusPage,
});

function statusOf(pct: number, missing: number, empty: number) {
  if (missing === 0 && empty === 0) return "ok" as const;
  if (pct >= 95) return "warn" as const;
  return "err" as const;
}

function I18nStatusPage() {
  // Validate on-demand on the client; DICTS is fully merged at this point.
  const [report, setReport] = useState(() => validateDictionaries());
  const [lastValidated, setLastValidated] = useState(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Lang | null>(null);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setReport(validateDictionaries());
    setLastValidated(new Date());
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch { /* ignore */ }
  };

  const rows = SUPPORTED_LANGS
    .filter((c) => c !== "en")
    .map((code) => {
      const r = report.perLang[code];
      const pct = Math.round(r.coverage * 100);
      return {
        code,
        meta: LANGUAGE_METADATA[code],
        pct,
        missing: r.missing,
        empty: r.empty,
        status: statusOf(pct, r.missing.length, r.empty.length),
      };
    })
    .sort((a, b) => a.pct - b.pct);

  const incompleteCount = rows.filter((r) => r.status !== "ok").length;

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to site
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              i18n Status
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live coverage of <span className="font-mono">DICTS.en</span> ({report.enKeyCount} keys)
              against {SUPPORTED_LANGS.length - 1} target locales.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground">
              Validated {lastValidated.toLocaleTimeString()}
            </span>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
              title="Refresh now"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <div
              className={`rounded-md px-3 py-1.5 text-xs font-mono font-semibold ${
                report.ok
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "bg-amber-500/15 text-amber-500"
              }`}
            >
              {report.ok ? "● ALL GREEN" : `▲ ${incompleteCount} incomplete`}
            </div>
          </div>
        </div>

        {report.brokenLangs.length > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-semibold">Broken dictionaries</div>
              <div className="text-xs">{report.brokenLangs.join(", ")}</div>
            </div>
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Lang</th>
                <th className="px-4 py-2.5 text-left">Name</th>
                <th className="px-4 py-2.5 text-right">Coverage</th>
                <th className="px-4 py-2.5 text-right">Missing</th>
                <th className="px-4 py-2.5 text-right">Empty</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const cmd = `bun run scripts/translate.ts ${r.code}`;
                const isOpen = expanded === r.code;
                return (
                  <>
                    <tr key={r.code} className="border-t border-border/60">
                      <td className="px-4 py-2.5 font-mono text-xs font-semibold">
                        <span className="mr-1.5">{r.meta.flag}</span>{r.meta.label}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.meta.english}</td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        <span
                          className={
                            r.status === "ok"
                              ? "text-emerald-500"
                              : r.status === "warn"
                              ? "text-amber-500"
                              : "text-destructive"
                          }
                        >
                          {r.pct}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">{r.missing.length}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{r.empty.length}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          {(r.missing.length > 0 || r.empty.length > 0) && (
                            <button
                              onClick={() => setExpanded(isOpen ? null : r.code)}
                              className="rounded-md border border-border bg-background px-2 py-1 text-xs hover:border-primary/40 hover:text-primary"
                            >
                              {isOpen ? "Hide" : "View"} keys
                            </button>
                          )}
                          <button
                            onClick={() => copy(cmd, r.code)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
                            title="Copy re-translate command"
                          >
                            {copied === r.code ? (
                              <><Check className="h-3 w-3" /> Copied</>
                            ) : (
                              <><Copy className="h-3 w-3" /> Re-translate</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-t border-border/40 bg-muted/20">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            {r.missing.length > 0 && (
                              <div>
                                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-destructive">
                                  Missing ({r.missing.length})
                                </div>
                                <ul className="max-h-48 overflow-y-auto rounded-md bg-background/60 p-2 font-mono text-[11px] leading-relaxed">
                                  {r.missing.slice(0, 60).map((k: string) => (
                                    <li key={k} className="truncate">{k}</li>
                                  ))}
                                  {r.missing.length > 60 && (
                                    <li className="text-muted-foreground">… +{r.missing.length - 60} more</li>
                                  )}
                                </ul>
                              </div>
                            )}
                            {r.empty.length > 0 && (
                              <div>
                                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-500">
                                  Empty / non-string ({r.empty.length})
                                </div>
                                <ul className="max-h-48 overflow-y-auto rounded-md bg-background/60 p-2 font-mono text-[11px] leading-relaxed">
                                  {r.empty.slice(0, 60).map((k) => (
                                    <li key={k} className="truncate">{k}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-md border border-border bg-card p-4 text-xs text-muted-foreground">
          <div className="mb-1 font-semibold text-foreground">How re-translate works</div>
          <p>
            The button copies <code className="font-mono">bun run scripts/translate.ts &lt;lang&gt;</code>.
            Run it in the project terminal — the script only fills missing keys (incremental) and
            writes <code className="font-mono">scripts/translations/&lt;lang&gt;.json</code>. Refresh
            this page after the script finishes; the next build runs the CI gate
            (<code className="font-mono">I18N_STRICT=1</code>) automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
