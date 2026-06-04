import { Link } from "@tanstack/react-router";
import { Linkedin } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";


const retailLinks = [
  { to: "/compare", label: "Compare" },
  { to: "/blog", label: "Blog" },
];

const businessLinks = [
  { to: "/business", label: "Business" },
  { to: "/business", label: "Features" },
  { to: "/business", label: "Pricing" },
  { to: "/contact", label: "Talk to Sales" },
];

const companyLinks = [
  { to: "/about", label: "About" },
  { to: "/platform", label: "Platform" },
  { to: "/insurance", label: "Insurance (soon)" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

const legalLinks = [
  { to: "/about", label: "Privacy" },
  { to: "/about", label: "Terms" },
  { to: "/about", label: "Cookies" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center">
              <Wordmark className="text-lg" />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              The global FX decision engine. Neutral AI for smarter cross-border payments.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="X (Twitter)"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">Retail</h3>
            <ul className="mt-3 space-y-2">
              {retailLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">Business</h3>
            <ul className="mt-3 space-y-2">
              {businessLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">Company</h3>
            <ul className="mt-3 space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-3 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
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
            &copy; {new Date().getFullYear()} MangoGlobal. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Global FX, Made Intelligent
          </p>
        </div>
      </div>
    </footer>
  );
}
