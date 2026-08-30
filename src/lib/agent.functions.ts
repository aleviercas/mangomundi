import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendLeadNotificationEmail } from "./email";

const LeadInput = z.object({
  email: z.string().email().max(255),
  featureSource: z.string().min(1).max(120),
  consent: z.literal(true),
  // Optional route context — populated by callers that have one (e.g. the
  // comparator's rate-alert card), so a captured lead isn't just an email
  // with no idea which corridor/rate the person actually cares about.
  // Same columns captureBusinessLead already writes on this same table.
  fromCurrency: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/)
    .optional(),
  toCurrency: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/)
    .optional(),
  sendingCountry: z.string().length(2).optional(),
  receivingCountry: z.string().length(2).optional(),
  amount: z.number().positive().finite().optional(),
});

const BusinessLeadInput = z.object({
  email: z.string().trim().email().max(255),
  monthlyVolume: z.number().positive().finite().max(1e15),
  // Optional: the "Your request" panel (BusinessRequestPanel) doesn't ask
  // for an industry sector — only the older chat-wizard flow does. Nullable
  // on enterprise_leads already; no default fabricated here when absent.
  sector: z.string().trim().min(2).max(120).optional(),
  fromCurrency: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/),
  toCurrency: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/),
  sendingCountry: z.string().length(2),
  receivingCountry: z.string().length(2),
  locale: z.string().min(2).max(5),
  consent: z.literal(true),
  topProviders: z.array(z.string().trim().min(1).max(120)).max(2).default([]),
  // "Your request" panel (design/Mangomundi 4 - Final.dc.html line 526-560)
  // — the broker slugs the user explicitly added via "Add to request",
  // distinct from topProviders above (the AI wizard's own suggestions).
  // Optional: the AI-wizard flow that predates this panel never sends them.
  contractType: z.string().trim().max(60).optional(),
  frequency: z.string().trim().max(60).optional(),
  selectedProviderSlugs: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  // Distinguishes which UI produced this lead (defaults to the original
  // chat-wizard flow's value, so existing callers don't need to change).
  featureSource: z.string().trim().min(1).max(120).default("comparator_conversational_agent"),
});

const InquiryInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10).max(2000),
});

export const captureEnterpriseLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LeadInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("enterprise_leads").insert({
      email: data.email,
      feature_source: data.featureSource,
      status: "beta_pending",
      privacy_consent: true,
      consent_timestamp: new Date().toISOString(),
      ...(data.fromCurrency ? { from_currency: data.fromCurrency } : {}),
      ...(data.toCurrency ? { to_currency: data.toCurrency } : {}),
      ...(data.sendingCountry ? { sending_country: data.sendingCountry } : {}),
      ...(data.receivingCountry ? { receiving_country: data.receivingCountry } : {}),
      ...(data.amount ? { amount: data.amount } : {}),
    });
    if (error) {
      console.error("[server-fn]", error);
      throw new Error("An unexpected error occurred. Please try again.");
    }
    return { ok: true };
  });

export const captureBusinessLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BusinessLeadInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const consentAt = new Date().toISOString();
    const requestId = `B2B-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const { error } = await supabaseAdmin.from("enterprise_leads").insert({
      email: data.email,
      feature_source: data.featureSource,
      status: "pending",
      request_id: requestId,
      from_currency: data.fromCurrency,
      to_currency: data.toCurrency,
      amount: data.monthlyVolume,
      monthly_volume: data.monthlyVolume,
      segment: "business",
      sending_country: data.sendingCountry,
      receiving_country: data.receivingCountry,
      locale: data.locale,
      privacy_consent: true,
      consent_timestamp: consentAt,
      ...(data.sector ? { sector: data.sector } : {}),
      ...(data.contractType ? { contract_type: data.contractType } : {}),
      ...(data.frequency ? { frequency: data.frequency } : {}),
      ...(data.selectedProviderSlugs.length
        ? { selected_provider_slugs: data.selectedProviderSlugs }
        : {}),
    });
    if (error) {
      console.error("[server-fn]", error);
      throw new Error("An unexpected error occurred. Please try again.");
    }

    const webhookUrl = process.env.RFQ_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "enterprise_lead.created",
            request_id: requestId,
            email: data.email,
            monthly_volume: data.monthlyVolume,
            sector: data.sector,
            from_currency: data.fromCurrency,
            to_currency: data.toCurrency,
            sending_country: data.sendingCountry,
            receiving_country: data.receivingCountry,
            consent_at: consentAt,
            top_providers: data.topProviders,
            contract_type: data.contractType ?? null,
            frequency: data.frequency ?? null,
            selected_provider_slugs: data.selectedProviderSlugs,
          }),
        });
      } catch (error) {
        console.error("[enterprise-lead] webhook dispatch failed", error);
      }
    }
    // Internal notification — separate from the outbound webhook above (that
    // one is for third-party automations; this one is for us). Best-effort:
    // never blocks the response, the lead is already saved in Supabase.
    const emailQueued = await sendLeadNotificationEmail({
      subject: `New B2B lead ${requestId} — ${data.fromCurrency} → ${data.toCurrency}`,
      html: `
        <h2>New business FX lead</h2>
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Monthly volume:</strong> ${data.monthlyVolume.toLocaleString()} ${data.fromCurrency}</p>
        <p><strong>Sector:</strong> ${data.sector ?? "—"}</p>
        <p><strong>Route:</strong> ${data.fromCurrency} → ${data.toCurrency} (${data.sendingCountry} → ${data.receivingCountry})</p>
        <p><strong>Providers suggested to the user:</strong> ${data.topProviders.join(", ") || "—"}</p>
        <p><strong>Added to request:</strong> ${data.selectedProviderSlugs.join(", ") || "—"}</p>
        <p><strong>Contract type:</strong> ${data.contractType ?? "—"}</p>
        <p><strong>Frequency:</strong> ${data.frequency ?? "—"}</p>
        <p><strong>Locale:</strong> ${data.locale}</p>
        <p><strong>Consent recorded at:</strong> ${consentAt}</p>
      `,
    });
    return { ok: true, requestId, emailQueued };
  });

export const captureGeneralInquiry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InquiryInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("leads").insert({
      name: data.name,
      email: data.email,
      company: data.company ?? null,
      message: data.message,
      source: "about_contact_form",
    });
    if (error) {
      console.error("[server-fn]", error);
      throw new Error("An unexpected error occurred. Please try again.");
    }
    return { ok: true };
  });
