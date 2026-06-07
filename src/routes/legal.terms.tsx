import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
        {t("legal.terms.title")}
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      {/* Localized institutional intro — mirrors footer compliance language */}
      <div className="mt-6 rounded-lg border border-border bg-card/60 p-4">
        <p className="text-sm leading-relaxed text-foreground/90">{t("legal.terms.intro")}</p>
        <p className="mt-3 font-mono text-[10.5px] leading-relaxed text-muted-foreground/70">
          <span className="opacity-60"># disclaimer &nbsp;</span>
          {t("footer.disclaimer")}
        </p>
      </div>

      <div className="prose prose-invert mt-8 max-w-none text-foreground/90">
        <h2>1. Use of the service</h2>
        <p>
          The platform is provided &quot;as is&quot; for informational purposes. Comparisons, AI
          explanations, and routing suggestions are estimates derived from third-party data and may
          differ from the final quote shown by the provider at execution time.
        </p>
        <h2>2. No financial advice</h2>
        <p>
          Nothing on this site constitutes financial, tax, legal or investment advice. Users are
          responsible for their own due diligence and for verifying regulatory status and pricing on
          the provider&apos;s own site before sending funds.
        </p>
        <h2>3. Affiliate disclosure</h2>
        <p>
          Some outbound links are affiliate links. mangoglobal may receive a commission at no
          additional cost to the user. This never affects the neutral ordering of comparison
          results.
        </p>
        <h2>4. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, mangoglobal shall not be liable for any loss
          arising from use of the platform, including but not limited to FX losses, transfer
          delays, or provider insolvency.
        </p>
        <h2>5. Contact</h2>
        <p>For questions about these terms, contact legal@mangoglobal.io.</p>
      </div>
    </main>
  );
}
