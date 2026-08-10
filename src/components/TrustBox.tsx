/**
 * Trustpilot "Review Collector" TrustBox — invites a visitor to leave a
 * review for mangomundi.com directly on the site, no email step involved
 * (unlike AFS, which needs an outbound customer email to BCC — something
 * this site doesn't send yet). The bootstrap script that actually renders
 * this (see TrustpilotBootstrap in routes/__root.tsx) is loaded once,
 * site-wide; this component just renders the target div wherever it's used.
 *
 * The `data-token`, `data-businessunit-id`, and `data-template-id` values
 * are specific to mangomundi's Trustpilot business account — copied as-is
 * from the snippet in the Trustpilot dashboard, not something to invent or
 * guess if this ever needs to move.
 *
 * Fixed height (data-style-height) reserves the space up front, so this
 * doesn't reintroduce the kind of layout shift fixed elsewhere on the site
 * (see BlogSection's skeleton loader for the same concern with different
 * async content).
 */
export function TrustBox() {
  return (
    <div
      className="trustpilot-widget"
      data-locale="en-US"
      data-template-id="56278e9abfbbba0bdcd568bc"
      data-businessunit-id="6a7a14b6f29ac72f7bd2792e"
      data-style-height="52px"
      data-style-width="100%"
      data-token="ef14895d-6018-44c4-9b24-4bb39ed6b2e5"
    >
      <a
        href="https://www.trustpilot.com/review/mangomundi.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        Trustpilot
      </a>
    </div>
  );
}
