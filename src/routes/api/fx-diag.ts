/**
 * GET /api/fx-diag
 *
 * Diagnostic endpoint — tests each FX provider in order and reports what
 * works. Only active in non-production or when ?secret=<DIAG_SECRET> matches
 * the DIAG_SECRET env var.
 *
 * Usage: https://mangomundi.com/api/fx-diag?secret=YOUR_SECRET
 * Remove this file once the comparator is confirmed working.
 */

import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/fx-diag")({
  GET: async ({ request }) => {
    // Guard: require secret or non-production
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    const diagSecret = process.env.DIAG_SECRET;
    const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

    if (isProd && (!diagSecret || secret !== diagSecret)) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results: Record<string, unknown> = {};

    // 1. Test Frankfurter v2
    try {
      const start = Date.now();
      const res = await fetch("https://api.frankfurter.dev/v2/rates?base=USD", {
        signal: AbortSignal.timeout(8000),
      });
      const ms = Date.now() - start;
      if (res.ok) {
        const json = (await res.json()) as { rates?: Record<string, number>; base?: string };
        results.frankfurter = {
          ok: true,
          ms,
          base: json.base,
          currencies: Object.keys(json.rates ?? {}).length,
          has_DKK: Boolean(json.rates?.DKK),
          has_GBP: Boolean(json.rates?.GBP),
          sample: { EUR: json.rates?.EUR, DKK: json.rates?.DKK, GBP: json.rates?.GBP },
        };
      } else {
        results.frankfurter = { ok: false, status: res.status, statusText: res.statusText, ms };
      }
    } catch (e) {
      results.frankfurter = { ok: false, error: String(e) };
    }

    // 2. Test ExchangeRate-API (open)
    try {
      const start = Date.now();
      const res = await fetch("https://open.er-api.com/v6/latest/USD", {
        signal: AbortSignal.timeout(8000),
      });
      const ms = Date.now() - start;
      if (res.ok) {
        const json = (await res.json()) as {
          result?: string;
          rates?: Record<string, number>;
          base_code?: string;
        };
        results.exchangerate_api = {
          ok: json.result === "success",
          ms,
          result: json.result,
          currencies: Object.keys(json.rates ?? {}).length,
          has_DKK: Boolean(json.rates?.DKK),
          has_GBP: Boolean(json.rates?.GBP),
        };
      } else {
        results.exchangerate_api = { ok: false, status: res.status, ms };
      }
    } catch (e) {
      results.exchangerate_api = { ok: false, error: String(e) };
    }

    // 3. Test Supabase rate_cache table
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceKey) {
        results.supabase_rate_cache = {
          ok: false,
          error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars",
        };
      } else {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/rate_cache?id=eq.global&select=id,base,source,fetched_at,updated_at`,
          {
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
            },
            signal: AbortSignal.timeout(5000),
          },
        );
        const json = (await res.json()) as unknown[];
        const row = json[0] as Record<string, unknown> | undefined;
        results.supabase_rate_cache = {
          ok: res.ok,
          table_exists: res.ok,
          row_found: Boolean(row),
          row: row
            ? { id: row.id, base: row.base, source: row.source, updated_at: row.updated_at }
            : null,
        };
      }
    } catch (e) {
      results.supabase_rate_cache = { ok: false, error: String(e) };
    }

    // 4. Check env vars (masked)
    results.env = {
      SUPABASE_URL: process.env.SUPABASE_URL ? "SET" : "MISSING",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING",
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? "SET" : "MISSING",
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_REGION: process.env.VERCEL_REGION,
    };

    return new Response(JSON.stringify(results, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});
