import { useI18n, type Lang, CORPORATE_LANGS } from "@/lib/i18n";
import { useLocation } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { useEffect, useState } from "react";

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
];

export function LangSwitcher() {
  const { lang, setLang } = useI18n();
  const pathname = useLocation({ select: (s) => s.pathname });
  const [open, setOpen] = useState(false);

  // Corporate route restriction: /business is limited to verified locales.
  const isCorporateRoute = pathname.startsWith("/business");
  const visibleLangs = isCorporateRoute
    ? LANGS.filter((l) => (CORPORATE_LANGS as readonly Lang[]).includes(l.code))
    : LANGS;

  // Auto-fallback when navigating into /business with a non-corporate locale.
  useEffect(() => {
    if (isCorporateRoute && !(CORPORATE_LANGS as readonly Lang[]).includes(lang)) {
      setLang("en");
    }
  }, [isCorporateRoute, lang, setLang]);

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
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-50 mt-1 max-h-[70vh] min-w-[180px] overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
            {isCorporateRoute && (
              <div className="border-b border-border px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                Corporate verified
              </div>
            )}
            {visibleLangs.map((l) => (
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
