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
    <main className="mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
      <div className="terminal-card rounded-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="flex items-center gap-2 border-b terminal-divider px-4 py-2.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
          </span>
          <span className="text-[11px] uppercase tracking-widest terminal-text-comment">
            mangoglobal · risk.exec
          </span>
          <span className="ml-auto text-[10px] terminal-text-comment">// v 07/06/2026</span>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          {/* Title */}
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight terminal-text-bright sm:text-4xl">
              {t("legal.risk.title")}
            </h1>
            <p className="mt-2 text-sm terminal-text-comment">
              Last updated: 07/06/2026
            </p>
          </div>

          {/* Disclaimer — once, prominent */}
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
            <p className="text-sm leading-relaxed terminal-text-bright">
              {t("footer.disclaimer")}
            </p>
          </div>

          <div className="h-px w-full terminal-divider border-t" />

          {/* Section 1 */}
          <section>
            <div className="terminal-text-comment text-[10px] uppercase tracking-[0.2em] mb-2">
              // section_01
            </div>
            <h2 className="font-mono text-lg font-semibold terminal-text-exec sm:text-xl">
              FX Market Risk
            </h2>
            <p className="mt-3 font-mono text-sm leading-relaxed terminal-text-bright sm:text-[15px]">
              Foreign-exchange rates fluctuate continuously and unpredictably. The mid-market
              reference rates displayed on this platform are indicative estimates sourced from
              wholesale interbank data and may deviate from the actual execution rate offered by the
              provider. Users bear the full foreign-exchange risk of any transaction, including the
              risk that the rate may move adversely between the time a comparison is generated and the
              time the provider executes the transfer.
            </p>
          </section>

          <div className="h-px w-full terminal-divider border-t" />

          {/* Section 2 */}
          <section>
            <div className="terminal-text-comment text-[10px] uppercase tracking-[0.2em] mb-2">
              // section_02
            </div>
            <h2 className="font-mono text-lg font-semibold terminal-text-exec sm:text-xl">
              Provider, Settlement, and Counterparty Risk
            </h2>
            <p className="mt-3 font-mono text-sm leading-relaxed terminal-text-bright sm:text-[15px]">
              mangoglobal does not custody funds. All transfers settle directly with the regulated
              provider selected by the user. Users are exposed to the solvency, operational
              reliability, and regulatory status of that provider. It is the user's responsibility to
              verify licensing, regulatory standing, and financial health in the relevant
              jurisdictions before sending funds. mangoglobal assumes no liability for provider
              failure, settlement delays, or loss of funds.
            </p>
          </section>

          <div className="h-px w-full terminal-divider border-t" />

          {/* Section 3 */}
          <section>
            <div className="terminal-text-comment text-[10px] uppercase tracking-[0.2em] mb-2">
              // section_03
            </div>
            <h2 className="font-mono text-lg font-semibold terminal-text-exec sm:text-xl">
              AI-Assisted Routing Risk
            </h2>
            <p className="mt-3 font-mono text-sm leading-relaxed terminal-text-bright sm:text-[15px]">
              AI-assisted routing recommendations are decision-support tools based on indexed
              liquidity paths, retail remittance channels, flat-fee optimisation models, and
              real-time interbank rates. Actual delivery times, intermediary bank fees, correspondent
              banking charges, and beneficiary receipt amounts may vary materially from the estimates
              presented. Users should confirm all final terms directly with the chosen provider
              before execution.
            </p>
          </section>

          <div className="h-px w-full terminal-divider border-t" />

          {/* Section 4 */}
          <section>
            <div className="terminal-text-comment text-[10px] uppercase tracking-[0.2em] mb-2">
              // section_04
            </div>
            <h2 className="font-mono text-lg font-semibold terminal-text-exec sm:text-xl">
              Sanctions and Regulatory Compliance
            </h2>
            <p className="mt-3 font-mono text-sm leading-relaxed terminal-text-bright sm:text-[15px]">
              Users are solely responsible for ensuring that any cross-border transfer complies with
              applicable sanctions regimes, anti-money laundering (AML) laws, know-your-customer (KYC)
              requirements, and cross-border reporting obligations in their jurisdiction. mangoglobal
              does not facilitate transactions to embargoed jurisdictions or sanctioned
              counterparties. Violations may result in frozen funds, regulatory penalties, or
              criminal liability.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
