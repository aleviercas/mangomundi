import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// CRITICAL: no upper bound on amount — corporate notional can be arbitrarily large.
// Reject only non-positive / non-finite values.
const RfqInput = z.object({
  email: z.string().email().max(255),
  amount: z.number().positive().finite(),
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
  sendingCountry: z.string().min(2).max(64),
  receivingCountry: z.string().min(2).max(64),
  locale: z.enum(["en", "es", "pt"]).default("en"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Privacy consent is required (GDPR)." }),
  }),
});

function genRequestId(): string {
  // Compact, URL-safe, time-prefixed
  return `RFQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

/**
 * Initiate an asynchronous Request-For-Quote (RFQ) for corporate FX.
 *
 * GDPR / Anti-leak design:
 *   - Stores PII (email) ONLY in Supabase under our control + consent flag + timestamp.
 *   - Outbound webhook (Zapier/Make) receives ONLY transactional metadata.
 *     The email is intentionally omitted to prevent commercial bypass and PII leakage.
 */
export const initiateRfq = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RfqInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const requestId = genRequestId();
    const consentAt = new Date().toISOString();

    const { error } = await supabaseAdmin.from("enterprise_leads").insert({
      email: data.email,
      feature_source: "rfq_corporate_desk",
      status: "rfq_pending",
      request_id: requestId,
      from_currency: data.fromCurrency.toUpperCase(),
      to_currency: data.toCurrency.toUpperCase(),
      amount: data.amount,
      sending_country: data.sendingCountry,
      receiving_country: data.receivingCountry,
      locale: data.locale,
      privacy_consent: true,
      consent_timestamp: consentAt,
    });
    if (error) throw new Error(error.message);

    // Outbound webhook — ANONYMISED payload (no email, no PII)
    const webhookUrl = process.env.RFQ_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request_id: requestId,
            from_currency: data.fromCurrency.toUpperCase(),
            to_currency: data.toCurrency.toUpperCase(),
            amount: data.amount,
            sending_country: data.sendingCountry,
            receiving_country: data.receivingCountry,
            locale: data.locale,
            submitted_at: consentAt,
          }),
        });
      } catch (err) {
        // Non-blocking: the lead is already saved; webhook is best-effort.
        console.error("[rfq] webhook dispatch failed", err);
      }
    }

    return { ok: true, requestId };
  });
