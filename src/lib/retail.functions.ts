import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RetailInput = z.object({
  email: z.string().email().max(255),
  amount: z.number().positive().finite(),
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
  sendingCountry: z.string().min(2).max(64).optional(),
  receivingCountry: z.string().min(2).max(64).optional(),
  providerSlug: z.string().min(1).max(120).optional(),
  affiliateBaseUrl: z.string().url().optional(),
  locale: z.enum(["en", "es", "pt"]).default("en"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Privacy consent is required (GDPR)." }),
  }),
});

const AFFILIATE_CODE = "MANGOMUNDI05";

/**
 * Capture a retail "preferred rate" lead under GDPR compliance.
 *
 * - Records privacy_consent + consent_timestamp for audit.
 * - Returns an affiliate URL stamped with MANGOMUNDI05 + affiliate_id=mangomundi.
 */
export const captureRetailLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RetailInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("retail_leads").insert({
      email: data.email,
      locale: data.locale,
      from_currency: data.fromCurrency.toUpperCase(),
      to_currency: data.toCurrency.toUpperCase(),
      amount: data.amount,
      sending_country: data.sendingCountry ?? null,
      receiving_country: data.receivingCountry ?? null,
      provider_slug: data.providerSlug ?? null,
      affiliate_code: AFFILIATE_CODE,
      privacy_consent: true,
      // consent_timestamp defaults to now() in DB
      status: "preferred_rate_requested",
    });
    if (error) {
      console.error("[server-fn]", error);
      throw new Error("An unexpected error occurred. Please try again.");
    }

    let redirectUrl: string | null = null;
    if (data.affiliateBaseUrl) {
      try {
        const u = new URL(data.affiliateBaseUrl);
        u.searchParams.set("ref", AFFILIATE_CODE);
        u.searchParams.set("affiliate_id", "mangomundi");
        redirectUrl = u.toString();
      } catch {
        redirectUrl = data.affiliateBaseUrl;
      }
    }

    return { ok: true, redirectUrl, affiliateCode: AFFILIATE_CODE };
  });
