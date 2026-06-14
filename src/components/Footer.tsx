import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/Wordmark";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();

  const navigateLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/about", label: t("nav.about") },
    { to: "/blog", label: t("nav.blog") },
  ] as const;

  const complianceLinks = [
    { to: "/legal/terms", label: t("legal.terms.title") },
    { to: "/legal/risk", label: t("legal.risk.title") },
  ] as const;

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="flex items-center">
              <Wordmark tone="light" className="text-lg" />
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="#"
                className="inline-flex h-5 w-5 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="X (Twitter)"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                className="inline-flex h-5 w-5 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="LinkedIn"
              >
                <span className="text-xs font-bold" aria-hidden>in</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">{t("footer.navigate")}</h3>
            <ul className="mt-3 space-y-2">
              {navigateLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">
              {t("footer.compliance")}
            </h3>
            <ul className="mt-3 space-y-2">
              {complianceLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()}{" "}
            <span className="font-black lowercase">mango</span>
            <span className="font-extralight lowercase">global</span>
            . {t("footer.copyright")}
          </p>
        </div>

        <div className="mt-6 border-t border-border/60 pt-5">
          <p
            className="font-mono text-[10.5px] leading-relaxed text-muted-foreground/70"
            style={{ letterSpacing: "0.01em" }}
          >
            <span className="opacity-60"># {t("footer.disclaimerLabel")} &nbsp;</span>
            {t("footer.disclaimer")}
          </p>
        </div>
      </div>
    </footer>
  );
}
