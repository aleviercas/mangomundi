import { useI18n, type Lang } from "@/lib/i18n";
import { Globe, ChevronDown } from "lucide-react";
import { useState } from "react";

const LANGS: { code: Lang; label: string; flag: string; native: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧", native: "English" },
  { code: "es", label: "ES", flag: "🇪🇸", native: "Español" },
  { code: "pt", label: "PT", flag: "🇧🇷", native: "Português" },
  { code: "ru", label: "RU", flag: "🇷🇺", native: "Русский" },
  { code: "tr", label: "TR", flag: "🇹🇷", native: "Türkçe" },
  { code: "bn", label: "BN", flag: "🇧🇩", native: "বাংলা" },
  { code: "ur", label: "UR", flag: "🇵🇰", native: "اردو" },
  { code: "zh", label: "ZH", flag: "🇨🇳", native: "中文" },
  { code: "pl", label: "PL", flag: "🇵🇱", native: "Polski" },
  { code: "hi", label: "HI", flag: "🇮🇳", native: "हिन्दी" },
  { code: "tl", label: "TL", flag: "🇵🇭", native: "Tagalog" },
  { code: "vi", label: "VI", flag: "🇻🇳", native: "Tiếng Việt" },
  { code: "ar", label: "AR", flag: "🇸🇦", native: "العربية" },
  { code: "de", label: "DE", flag: "🇩🇪", native: "Deutsch" },
  { code: "fr", label: "FR", flag: "🇫🇷", native: "Français" },
  { code: "it", label: "IT", flag: "🇮🇹", native: "Italiano" },
  { code: "ja", label: "JA", flag: "🇯🇵", native: "日本語" },
  { code: "ko", label: "KO", flag: "🇰🇷", native: "한국어" },
  { code: "id", label: "ID", flag: "🇮🇩", native: "Indonesia" },
  { code: "th", label: "TH", flag: "🇹🇭", native: "ไทย" },
];

export function LangSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div className="relative">
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
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="listbox"
            className="absolute right-0 z-50 mt-1.5 max-h-[60vh] min-w-[220px] overflow-y-auto rounded-lg border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl ring-1 ring-primary/10"
          >
            <div className="sticky top-0 border-b border-border/60 bg-background/95 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              · Language · 20 locales
            </div>
            {LANGS.map((l) => {
              const active = l.code === lang;
              return (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setOpen(false);
                  }}
                  role="option"
                  aria-selected={active}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-surface-elevated hover:text-primary"
                  }`}
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className="w-7 font-mono text-xs font-semibold">{l.label}</span>
                  <span className="flex-1 truncate text-xs text-muted-foreground">
                    {l.native}
                  </span>
                  {active && <span className="text-[10px] font-mono text-primary">●</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
