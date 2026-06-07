import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/legal/risk")({
  head: () => ({
    meta: [
      { title: "Risk Disclosure — mangoglobal" },
      {
        name: "description",
        content:
          "Risk disclosure for foreign-exchange and cross-border payment activity routed through mangoglobal.",
      },
    ],
  }),
  component: RiskPage,
});

function RiskPage() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
        {t("legal.risk.title")}
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div className="mt-6 rounded-lg border border-border bg-card/60 p-4">
        <p className="text-sm leading-relaxed text-foreground/90">{t("legal.risk.intro")}</p>
        <p className="mt-3 font-mono text-[10.5px] leading-relaxed text-muted-foreground/70">
          <span className="opacity-60"># disclaimer &nbsp;</span>
          {t("footer.disclaimer")}
        </p>
      </div>

      <div className="prose prose-invert mt-8 max-w-none text-foreground/90">
        <h2>FX market risk</h2>
        <p>
          Foreign-exchange rates fluctuate continuously. The mid-market reference rate shown is
          indicative and may change between the time a comparison is generated and the time a
          provider executes the transfer. Users bear the full FX risk of any transaction.
        </p>
        <h2>Provider, settlement and counterparty risk</h2>
        <p>
          mangoglobal does not custody funds. All transfers settle directly with the regulated
          provider selected by the user. Users are exposed to that provider&apos;s solvency,
          operational reliability, and regulatory status. Verify licensing in the relevant
          jurisdictions before sending funds.
        </p>
        <h2>Routing &amp; execution risk</h2>
        <p>
          AI-assisted routing is a decision aid based on indexed liquidity paths, retail remittance
          channels, flat-fee optimisation, and real-time interbank rates. Actual delivery times,
          intermediary bank fees, and beneficiary receipt amounts may vary.
        </p>
        <h2>Sanctions &amp; compliance</h2>
        <p>
          Users are responsible for ensuring that transfers comply with applicable sanctions, AML,
          and cross-border reporting obligations in their jurisdiction. mangoglobal does not
          facilitate transactions to embargoed jurisdictions or sanctioned counterparties.
        </p>
        <h2>No guarantee of best execution</h2>
        <p>
          Comparisons reflect the providers indexed at the moment of the query. The market includes
          additional channels that may not be indexed; absence of a provider is not a judgement of
          its quality or pricing.
        </p>
      </div>
    </main>
  );
}
