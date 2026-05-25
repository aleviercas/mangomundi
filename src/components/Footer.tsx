import { Link } from "@tanstack/react-router";
import { Twitter, Linkedin, Github } from "lucide-react";
import mangoLogo from "@/assets/mango-logo.svg";


const productLinks = [
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/features", label: "API Docs" },
  { to: "/features", label: "Integrations" },
];

const companyLinks = [
  { to: "/about", label: "About" },
  { to: "/about", label: "Careers" },
  { to: "/about", label: "Press" },
  { to: "/contact", label: "Contact" },
];

const resourceLinks = [
  { to: "/about", label: "Blog" },
  { to: "/about", label: "Help Center" },
  { to: "/about", label: "Community" },
  { to: "/about", label: "Status" },
];

const legalLinks = [
  { to: "/about", label: "Privacy" },
  { to: "/about", label: "Terms" },
  { to: "/about", label: "Cookies" },
  { to: "/about", label: "Licenses" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <img src={mangoLogo} alt="MangoGlobal" className="h-8 w-8" />
              <span className="font-heading text-lg font-semibold text-foreground">MangoGlobal</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              The global FX decision engine. Neutral AI for smarter cross-border payments.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">Product</h3>
            <ul className="mt-3 space-y-2">
              {productLinks.map((link) => (
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
            <h3 className="font-heading text-sm font-semibold text-foreground">Resources</h3>
            <ul className="mt-3 space-y-2">
              {resourceLinks.map((link) => (
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
