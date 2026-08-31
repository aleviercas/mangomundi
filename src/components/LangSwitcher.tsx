import { useI18n, LANGUAGE_METADATA, SUPPORTED_LANGS, type Lang } from "@/lib/i18n";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { Globe, ChevronDown, Search } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";

const LANGS = SUPPORTED_LANGS.map((code) => LANGUAGE_METADATA[code]);

export function LangSwitcher({
  direction = "down",
  variant = "default",
}: {
  direction?: "up" | "down";
  /** design/AJUSTES-2.md §7 (mockup line 253) — Header's language pill:
   *  flag + 13px code in a bordered rounded-full pill, no globe/chevron
   *  icons. Footer's own trigger (variant "default", unchanged) keeps its
   *  existing look; this only swaps the closed-state button, the dropdown
   *  panel underneath is identical either way. */
  variant?: "default" | "pill";
}) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const current = LANGUAGE_METADATA[lang] ?? LANGUAGE_METADATA.en;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGS;
    return LANGS.filter(
      (l) =>
        l.code.toLowerCase().includes(q) ||
        l.label.toLowerCase().includes(q) ||
        l.english.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 30);
      return () => window.clearTimeout(id);
    }
    setQuery("");
  }, [open]);

  const pick = (code: Lang) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <div className="relative">
      {variant === "pill" ? (
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-full border border-input px-3 py-1.5 text-[13px] text-foreground transition hover:border-foreground/40"
          aria-label="Change language"
          aria-expanded={open}
        >
          <FlagIcon country={current.flag} />
          <span>{current.label}</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-xs font-mono font-medium text-muted-foreground transition hover:border-primary/40 hover:bg-surface-elevated hover:text-primary"
          aria-label="Change language"
          aria-expanded={open}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>{current.label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      )}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="listbox"
            className={`absolute right-0 z-50 min-w-[240px] rounded-lg border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl ring-1 ring-primary/10 ${
              direction === "up" ? "bottom-full mb-1.5" : "mt-1.5"
            }`}
          >
            <div className="border-b border-border/60 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Language
            </div>
            <div className="border-b border-border/60 px-2 py-1.5">
              <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/60 px-2 py-1">
                <Search className="h-3 w-3 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                  aria-label="Search languages"
                />
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {filtered.length === 0 && (
                <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                  No matches
                </div>
              )}
              {filtered.map((l) => {
                const active = l.code === lang;
                return (
                  <button
                    key={l.code}
                    onClick={() => pick(l.code)}
                    role="option"
                    aria-selected={active}
                    className={`flex w-full min-w-0 items-center gap-2.5 px-3 py-2 text-sm transition ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-surface-elevated hover:text-primary"
                    }`}
                  >
                    <span className="shrink-0 text-base leading-none">
                      <FlagIcon country={l.flag} />
                    </span>
                    <span className="w-7 shrink-0 font-mono text-xs font-semibold">{l.label}</span>
                    <span className="min-w-0 flex-1 truncate whitespace-nowrap text-xs text-muted-foreground">
                      {l.native}
                    </span>
                    {active && (
                      <span className="shrink-0 text-[10px] font-mono text-primary">●</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
