import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/Wordmark";

const socials = [
  {
    label: "X",
    href: "#",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "LinkedIn",
    href: "#",
    path: "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z",
  },
  {
    label: "Facebook",
    href: "#",
    path: "M22.675 0H1.325C.593 0 0 .593 0 1.326v21.348C0 23.408.593 24 1.325 24H12.82V14.706h-3.13v-3.62h3.13V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24h-1.918c-1.504 0-1.795.715-1.795 1.763v2.31h3.587l-.467 3.62h-3.12V24h6.116C23.408 24 24 23.408 24 22.674V1.326C24 .593 23.408 0 22.675 0z",
  },
  {
    label: "Instagram",
    href: "#",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.327 3.608 1.302.975.975 1.24 2.242 1.302 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.327 2.633-1.302 3.608-.975.975-2.242 1.24-3.608 1.302-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.327-3.608-1.302-.975-.975-1.24-2.242-1.302-3.608C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.062-1.366.327-2.633 1.302-3.608.975-.975 2.242-1.24 3.608-1.302C8.416 2.175 8.796 2.163 12 2.163zm0 1.838c-3.148 0-3.512.012-4.747.068-1.005.046-1.55.215-1.913.357-.48.187-.823.41-1.184.77-.36.36-.583.703-.77 1.184-.142.362-.311.908-.357 1.913C3 8.488 2.988 8.852 2.988 12s.012 3.512.068 4.747c.046 1.005.215 1.55.357 1.913.187.48.41.823.77 1.184.36.36.703.583 1.184.77.362.142.908.311 1.913.357 1.235.056 1.599.068 4.747.068s3.512-.012 4.747-.068c1.005-.046 1.55-.215 1.913-.357.48-.187.823-.41 1.184-.77.36-.36.583-.703.77-1.184.142-.362.311-.908.357-1.913.056-1.235.068-1.599.068-4.747s-.012-3.512-.068-4.747c-.046-1.005-.215-1.55-.357-1.913a3.18 3.18 0 0 0-.77-1.184 3.18 3.18 0 0 0-1.184-.77c-.362-.142-.908-.311-1.913-.357C15.512 4.013 15.148 4 12 4zm0 3.135A4.865 4.865 0 1 1 12 16.865 4.865 4.865 0 0 1 12 7.135zm0 8.027A3.162 3.162 0 1 0 12 8.838a3.162 3.162 0 0 0 0 6.324zm6.406-8.244a1.137 1.137 0 1 1-2.274 0 1.137 1.137 0 0 1 2.274 0z",
  },
];

export function Footer() {
  const navigate: Array<{ to: "/"; hash?: string; label: string }> = [
    { to: "/", label: "Home" },
    { to: "/", hash: "about", label: "About" },
    { to: "/", hash: "how-it-works", label: "How it works" },
    { to: "/", hash: "contact", label: "Contact" },
    { to: "/", hash: "blog", label: "Blog" },
  ];

  const legal = [
    { to: "/legal", hash: "terms", label: "Terms of Service" },
    { to: "/legal", hash: "risk", label: "Risk Disclosure" },
    { to: "/legal", hash: "privacy", label: "Privacy Policy" },
  ] as const;

  return (
    <footer className="bg-[#fcfcfc] border-t border-slate-200/70">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center">
              <Wordmark className="text-2xl" />
            </Link>
            <p className="mt-4 max-w-sm text-sm text-slate-500">
              Intelligent currency exchange decisions.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="group inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-black hover:text-white"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading text-sm font-bold text-slate-900">Navigate</h3>
            <ul className="mt-4 space-y-3">
              {navigate.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    hash={l.hash}
                    className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-bold text-slate-900">Legal &amp; Compliance</h3>
            <ul className="mt-4 space-y-3">
              {legal.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    hash={l.hash}
                    className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-slate-200/70 pt-8">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Mangomundi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
