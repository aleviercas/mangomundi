import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { HOME_NAV } from "@/config/nav";
import { useI18n } from "@/lib/i18n";

/** Main nav — anchors into the home sections (Link with hash works from any
 *  route). Legal lives in the footer per convention; language is auto-detected
 *  (?lang=, localStorage, geo-IP) so there is no switcher. */
export function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const links = HOME_NAV.map(({ hash, labelKey }) => ({ hash, label: t(labelKey) }));
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/90 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          to="/"
          aria-label="mangomundi home"
          className="flex items-center"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <Wordmark className="text-xl" />
        </Link>

        {/* Desktop nav — right-aligned (logo left). */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.hash}
              to="/"
              hash={l.hash}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
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
            {links.map((l) => (
              <li key={l.hash}>
                <Link
                  to="/"
                  hash={l.hash}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
