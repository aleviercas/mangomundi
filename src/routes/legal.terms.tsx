import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — mangoglobal" },
      { name: "description", content: "Terms of Service for the mangoglobal FX decision engine." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      <div className="prose prose-invert mt-8 max-w-none text-foreground/90">
        <p>
          mangoglobal operates as a neutral information and decision-engine platform that aggregates publicly
          available FX rates and provider data. We do not hold client funds, do not execute transfers, and do
          not act as a money transmitter. All transactions occur directly between the user and the chosen
          regulated provider, under that provider&apos;s terms.
        </p>
        <h2>1. Use of the service</h2>
        <p>
          The platform is provided &quot;as is&quot; for informational purposes. Comparisons, AI explanations,
          and routing suggestions are estimates derived from third-party data and may differ from the final
          quote shown by the provider at execution time.
        </p>
        <h2>2. No financial advice</h2>
        <p>
          Nothing on this site constitutes financial, tax, legal or investment advice. Users are responsible
          for their own due diligence and for verifying regulatory status and pricing on the provider&apos;s
          own site before sending funds.
        </p>
        <h2>3. Affiliate disclosure</h2>
        <p>
          Some outbound links are affiliate links. mangoglobal may receive a commission at no additional cost
          to the user. This never affects the neutral ordering of comparison results.
        </p>
        <h2>4. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, mangoglobal shall not be liable for any loss arising from
          use of the platform, including but not limited to FX losses, transfer delays, or provider
          insolvency.
        </p>
        <h2>5. Contact</h2>
        <p>For questions about these terms, contact legal@mangoglobal.io.</p>
      </div>
    </main>
  );
}
