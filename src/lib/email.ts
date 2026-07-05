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
 *   LEAD_NOTIFICATION_EMAIL — optional. Defaults to hello@mangomundi.com.
 */
const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendLeadNotificationEmail(params: {
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.RESEND_FROM_EMAIL || "mangomundi <onboarding@resend.dev>";
  const to = process.env.LEAD_NOTIFICATION_EMAIL || "hello@mangomundi.com";

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject: params.subject, html: params.html }),
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
