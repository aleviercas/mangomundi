import { useI18n, type Lang } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { useState } from "react";

const LANGS: { code: Lang; label: string; flag: string; native: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧", native: "English" },
  { code: "es", label: "ES", flag: "🇪🇸", native: "Español" },
  { code: "pt", label: "PT", flag: "🇧🇷", native: "Português" },
  { code: "it", label: "IT", flag: "🇮🇹", native: "Italiano" },
  { code: "fr", label: "FR", flag: "🇫🇷", native: "Français" },
  { code: "de", label: "DE", flag: "🇩🇪", native: "Deutsch" },
  { code: "pl", label: "PL", flag: "🇵🇱", native: "Polski" },
  { code: "uk", label: "UK", flag: "🇺🇦", native: "Українська" },
  { code: "kk", label: "KK", flag: "🇰🇿", native: "Qazaqsha" },
  { code: "hi", label: "HI", flag: "🇮🇳", native: "हिन्दी" },
  { code: "zh", label: "ZH", flag: "🇨🇳", native: "中文" },
  { code: "id", label: "ID", flag: "🇮🇩", native: "Indonesia" },
  { code: "tl", label: "TL", flag: "🇵🇭", native: "Tagalog" },
  { code: "ar", label: "AR", flag: "🇸🇦", native: "العربية" },
  { code: "vi", label: "VI", flag: "🇻🇳", native: "Tiếng Việt" },
  { code: "ja", label: "JA", flag: "🇯🇵", native: "日本語" },
  { code: "ko", label: "KO", flag: "🇰🇷", native: "한국어" },
];

export function LangSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
        aria-label="Change language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{current.label}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-1 max-h-[70vh] min-w-[200px] overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${
                  l.code === lang
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-surface-elevated"
                }`}
              >
                <span>{l.flag}</span>
                <span className="font-medium w-6">{l.label}</span>
                <span className="text-xs text-muted-foreground truncate">{l.native}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
