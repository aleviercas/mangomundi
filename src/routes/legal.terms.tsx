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
    <main className="mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
      <div className="terminal-card rounded-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="flex items-center gap-2 border-b terminal-divider px-4 py-2.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
          </span>
          <span className="text-[11px] uppercase tracking-widest terminal-text-comment">
            mangoglobal · terms.exec
          </span>
          <span className="ml-auto text-[10px] terminal-text-comment">// v 07/06/2026</span>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          {/* Title */}
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight terminal-text-bright sm:text-4xl">
              {t("legal.terms.title")}
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
              Nature of the Platform
            </h2>
            <p className="mt-3 font-mono text-sm leading-relaxed terminal-text-bright sm:text-[15px]">
              mangoglobal operates as a neutral information and decision-engine platform. We do not
              custody client funds, transmit money, or act as a money-services business. All
              comparisons, routing suggestions, and analytics are generated algorithmically for
              informational purposes only. Execution and settlement occur directly between the user
              and the regulated third-party provider selected by the user.
            </p>
          </section>

          <div className="h-px w-full terminal-divider border-t" />

          {/* Section 2 */}
          <section>
            <div className="terminal-text-comment text-[10px] uppercase tracking-[0.2em] mb-2">
              // section_02
            </div>
            <h2 className="font-mono text-lg font-semibold terminal-text-exec sm:text-xl">
              Disclaimer
            </h2>
            <p className="mt-3 font-mono text-sm leading-relaxed terminal-text-bright sm:text-[15px]">
              The AI-powered tools, market analytics, and routing recommendations provided on this
              platform do not constitute financial, tax, legal, or investment advice. Users are solely
              responsible for conducting their own due diligence and for verifying the regulatory
              status, pricing, and terms of any provider before initiating a transfer. mangoglobal
              makes no representation or warranty regarding the accuracy, completeness, or
              timeliness of any data shown.
            </p>
          </section>

          <div className="h-px w-full terminal-divider border-t" />

          {/* Section 3 */}
          <section>
            <div className="terminal-text-comment text-[10px] uppercase tracking-[0.2em] mb-2">
              // section_03
            </div>
            <h2 className="font-mono text-lg font-semibold terminal-text-exec sm:text-xl">
              Compensation Disclosure
            </h2>
            <p className="mt-3 font-mono text-sm leading-relaxed terminal-text-bright sm:text-[15px]">
              mangoglobal may receive commissions or referral fees from regulated providers for
              transactions facilitated through the platform. This compensation is received at no
              additional cost to the user and does not influence the neutrality of the comparison
              algorithm. Providers are ranked exclusively on objective cost, speed, and reliability
              metrics derived from real-time market data.
            </p>
          </section>

          <div className="h-px w-full terminal-divider border-t" />

          {/* Section 4 */}
          <section>
            <div className="terminal-text-comment text-[10px] uppercase tracking-[0.2em] mb-2">
              // section_04
            </div>
            <h2 className="font-mono text-lg font-semibold terminal-text-exec sm:text-xl">
              Limitation of Liability
            </h2>
            <p className="mt-3 font-mono text-sm leading-relaxed terminal-text-bright sm:text-[15px]">
              To the maximum extent permitted by applicable law, mangoglobal and its affiliates,
              officers, employees, and agents shall not be liable for any direct, indirect,
              incidental, special, consequential, or punitive damages arising out of or relating to the
              use of the platform. This includes, without limitation, losses resulting from
              foreign-exchange rate fluctuations, transfer delays, provider insolvency, technical
              failures, or errors in algorithmic recommendations.
            </p>
          </section>

          <div className="h-px w-full terminal-divider border-t" />

          {/* Section 5 */}
          <section>
            <div className="terminal-text-comment text-[10px] uppercase tracking-[0.2em] mb-2">
              // section_05
            </div>
            <h2 className="font-mono text-lg font-semibold terminal-text-exec sm:text-xl">
              Contact
            </h2>
            <p className="mt-3 font-mono text-sm leading-relaxed terminal-text-bright sm:text-[15px]">
              For questions, clarifications, or regulatory inquiries regarding these Terms of
              Service, please contact{" "}
              <a
                href="mailto:legal@mangoglobal.com"
                className="terminal-text-exec hover:underline"
              >
                legal@mangoglobal.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
