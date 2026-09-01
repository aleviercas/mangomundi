/**
 * Minimal Resend wrapper — a plain fetch() to Resend's REST API, no SDK
 * dependency. Used to notify hello@mangomundi.com whenever a business/RFQ
 * lead is captured, in addition to the Supabase insert (source of truth)
 * and the optional outbound webhook.
 *
 * Best-effort by design: the lead is already persisted in Supabase before
 * this runs, so a failed send here must never throw or block the caller.
 *
 * Env vars:
 *   RESEND_API_KEY      — required. Without it, sends are skipped (returns false).
 *   RESEND_FROM_EMAIL   — optional. Defaults to Resend's shared test sender,
 *                         which works with zero setup. Once mangomundi.com is
 *                         verified in the Resend dashboard (SPF/DKIM records),
 *                         set this to e.g. "mangomundi <hello@mangomundi.com>".
 *   LEAD_NOTIFICATION_EMAIL — optional. Defaults to mangomundi@gmail.com (the
 *                             Resend account's own signup address — required
 *                             recipient while using the onboarding@resend.dev
 *                             sandbox sender; any address works once
 *                             RESEND_FROM_EMAIL points at a verified domain).
 */
const RESEND_API_URL = "https://api.resend.com/emails";

async function sendEmail(params: { to: string; subject: string; html: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.RESEND_FROM_EMAIL || "mangomundi <onboarding@resend.dev>";

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [params.to], subject: params.subject, html: params.html }),
    });
    if (!res.ok) {
      console.error("[email] resend send failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] resend send error", err);
    return false;
  }
}

export async function sendLeadNotificationEmail(params: {
  subject: string;
  html: string;
}): Promise<boolean> {
  const to = process.env.LEAD_NOTIFICATION_EMAIL || "mangomundi@gmail.com";
  return sendEmail({ to, ...params });
}

/** 2026-09-02 feedback — "una vez que me llega el mail hay que contestarle
 *  con un mail al cliente que recibimos el pedido y que responderemos a la
 *  brevedad": the client-facing half of captureBusinessLead's own email —
 *  sendLeadNotificationEmail above already covers "el mail para mí con el
 *  pedido" (the internal team notification), this is the missing outbound
 *  leg back to the customer who submitted the request. Same best-effort
 *  contract as the internal one: the lead is already persisted in Supabase
 *  before this runs, so a failed send here must never throw or block the
 *  caller — captureBusinessLead's own return already reports whether this
 *  queued so the UI can decide whether to mention it. */
export async function sendClientConfirmationEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  return sendEmail(params);
}
