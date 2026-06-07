import { useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { trackAffiliateClick } from "@/lib/fx.functions";

/**
 * Centralised, fail-silent analytics hook. Persists strategic business events
 * (provider clicks, comparator queries, RFQ interactions, simulated conversions)
 * to the `affiliate_clicks` table via the existing trackAffiliateClick server
 * function. UI must never block or break if the writes fail.
 */
export type AnalyticsEvent =
  | "provider_click"
  | "comparator_query"
  | "rfq_interaction"
  | "conversion_completed";

export interface AnalyticsPayload {
  provider_slug?: string;
  amount?: number;
  from_currency?: string;
  to_currency?: string;
  segment?: string;
  urgency?: string;
  source?: string;
}

const SAFE_SLUG: Record<AnalyticsEvent, string> = {
  provider_click: "provider_click",
  comparator_query: "comparator_query",
  rfq_interaction: "rfq_interaction",
  conversion_completed: "conversion_completed",
};

export function useAnalytics() {
  const trackFn = useServerFn(trackAffiliateClick);

  const track = useCallback(
    (event: AnalyticsEvent, payload: AnalyticsPayload = {}) => {
      try {
        const rawSegment = [payload.segment, payload.urgency, payload.source, event]
          .filter(Boolean)
          .join(":");
        const segmentTag = rawSegment.slice(0, 32);
        const referrer = typeof window !== "undefined" ? window.location.href : undefined;

        // Fire-and-forget: never await, never throw to UI.
        void trackFn({
          data: {
            provider_slug: payload.provider_slug || SAFE_SLUG[event],
            amount: payload.amount ?? null,
            from_currency: payload.from_currency,
            to_currency: payload.to_currency,
            segment: segmentTag || event,
            referrer,
          },
        }).catch(() => {
          /* swallow — analytics must never break the UI */
        });
      } catch {
        /* swallow */
      }
    },
    [trackFn],
  );

  return { track };
}
