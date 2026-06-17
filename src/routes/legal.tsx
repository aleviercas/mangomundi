import { createFileRoute } from "@tanstack/react-router";

const SECTIONS = [
  {
    id: "terms",
    title: "Terms of Service",
    intro:
      "These Terms govern your access to and use of mangomundi. By using the service you accept these Terms.",
    body: [
      {
        h: "01 — Service",
        p: "mangomundi is a neutral decision engine that compares foreign exchange providers and corridors. We do not execute transactions or hold customer funds.",
      },
      {
        h: "02 — Information accuracy",
        p: "Quotes and provider data are sourced in real time from third parties. Final terms are governed by each provider at execution.",
      },
      {
        h: "03 — Acceptable use",
        p: "You agree to use the service only for lawful purposes and to not misuse the platform, attempt to interfere with its operation, or scrape data without permission.",
      },
      {
        h: "04 — Liability",
        p: "The service is provided on an \"as is\" basis. To the maximum extent permitted by law, mangomundi is not liable for indirect or consequential losses arising from use of the service.",
      },
      {
        h: "05 — Contact",
        p: "Questions about these Terms can be sent to legal@mangomundi.com.",
      },
    ],
  },
  {
    id: "risk",
    title: "Risk Disclosure",
    intro:
      "Foreign exchange markets are volatile. Quoted rates, fees and delivery times can change between comparison and execution.",
    body: [
      {
        h: "01 — Market risk",
        p: "Exchange rates fluctuate continuously. Comparisons shown are indicative at the moment of query and may differ from the rate offered by a provider at the moment of execution.",
      },
      {
        h: "02 — Counterparty risk",
        p: "Transactions are executed by the provider you select. mangomundi does not guarantee the performance, solvency or regulatory status of any third-party provider.",
      },
      {
        h: "03 — Regulatory variation",
        p: "Availability of corridors and providers varies by jurisdiction. You are responsible for ensuring use of a provider complies with local laws.",
      },
      {
        h: "04 — No financial advice",
        p: "Information presented is for comparison purposes only and does not constitute financial, tax, or legal advice.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    intro:
      "We collect only what we need to operate the comparison engine and improve the product. We do not sell personal data.",
    body: [
      {
        h: "01 — Data we collect",
        p: "Query parameters (corridor, amount, segment), basic device and geolocation signals, and any information you voluntarily provide via inquiry forms.",
      },
      {
        h: "02 — How we use it",
        p: "To return relevant comparisons, improve accuracy of the decision engine, and respond to partnership or institutional inquiries.",
      },
      {
        h: "03 — Sharing",
        p: "We share data with sub-processors strictly necessary to operate the service (e.g. hosting, analytics). We never sell personal data.",
      },
      {
        h: "04 — Your rights",
        p: "You can request access, correction, or deletion of your personal data by writing to privacy@mangomundi.com.",
      },
    ],
  },
];

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal — mangomundi" },
      {
        name: "description",
        content: "Terms of Service, Risk Disclosure and Privacy Policy for mangomundi.",
      },
      { property: "og:title", content: "Legal — mangomundi" },
      { property: "og:url", content: "https://mangomundi.lovable.app/legal" },
    ],
    links: [{ rel: "canonical", href: "https://mangomundi.lovable.app/legal" }],
  }),
  component: LegalPage,
});

function LegalPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 pt-28 pb-20 sm:px-8">
      <h1 className="font-heading text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
        Legal &amp; Compliance
      </h1>
      <p className="mt-4 text-base text-slate-500">
        Terms of Service, Risk Disclosure and Privacy Policy.
      </p>

      <nav className="mt-8 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-black hover:text-white"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className="mt-12 space-y-12">
        {SECTIONS.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className="scroll-mt-24 rounded-[2rem] bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_-20px_rgba(15,23,42,0.12)] sm:p-12"
          >
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {s.title}
            </h2>
            <p className="mt-3 text-sm text-slate-500">{s.intro}</p>
            <div className="mt-8 space-y-6">
              {s.body.map((b) => (
                <div key={b.h}>
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">
                    {b.h}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{b.p}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
