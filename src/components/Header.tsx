import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { LangSwitcher } from "@/components/LangSwitcher";
import { HEADER_NAV } from "@/config/nav";
import { useI18n } from "@/lib/i18n";

/** Main nav — anchors into the home sections (Link with hash works from any
 *  route). Legal lives in the footer per convention.
 *
 *  design/AJUSTES-2.md §7 (mockup line 249-254): 66px tall, solid white,
 *  1px #EBE3D9 bottom border, 30px lateral padding; nav 14px/600/#6B5F55
 *  with a 26px gap, in the literal order How it works · For business ·
 *  Widget · Blog · About (HEADER_NAV, see config/nav.ts); a language pill
 *  at the end. */
export function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[66px] border-b border-border bg-card">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 sm:px-[30px]">
        <Link
          to="/"
          aria-label="mangomundi home"
          className="flex items-center"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          {/* Text-only lockup here and in Footer — the icon mark is reserved
              for the widget card/embed surfaces. Still bicolor
              ("mundi" in mango): icon={false} only drops the icon,
              unlike `compact` which also flattens the color — see
              Wordmark's own doc comment (2026-08-30 feedback). */}
          <Wordmark className="text-2xl" icon={false} />
        </Link>

        {/* Desktop nav — right-aligned (logo left). */}
        <nav className="hidden items-center gap-[26px] md:flex" aria-label="Main">
          {HEADER_NAV.map((item) => (
            <Link
              key={item.labelKey}
              to={item.to ?? "/"}
              hash={item.hash}
              className="text-[14px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(item.labelKey)}
            </Link>
          ))}
          <LangSwitcher variant="pill" />
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          className="border-t border-border bg-card/95 px-5 py-3 backdrop-blur-xl md:hidden"
          aria-label="Main"
        >
          <ul className="space-y-1">
            {HEADER_NAV.map((item) => (
              <li key={item.labelKey}>
                <Link
                  to={item.to ?? "/"}
                  hash={item.hash}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
