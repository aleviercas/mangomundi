/**
 * Central provider configuration for FX rate sources and AI gateways.
 *
 * Endpoints and health-checks are declared here. Secrets are NEVER stored in
 * this file — they are read from environment variables at request time inside
 * server boundaries (createServerFn handlers / server routes).
 *
 * Client-exposed VITE_ placeholders are documented at the bottom; the actual
 * key material lives in `.env` (local) and the Vercel project env vars (production).
 */

export interface FxProviderConfig {
  key: string;
  label: string;
  /** Lower number = higher priority in the fallback chain. */
  priority: number;
  /** Minimum interval between refreshes for this provider (ms). */
  refreshIntervalMs: number;
  /** Optional health-check URL used by `refreshRates()` to verify liveness. */
  healthCheckUrl?: string;
  /** Whether this provider requires an API key env var to function. */
  requiresEnv?: string;
}

export interface AiProviderConfig {
  key: string;
  label: string;
  /** Model identifier passed to the OpenRouter gateway. */
  model: string;
  /** Lower number = tried first by the smart load balancer. */
  priority: number;
  /** Per-request timeout in ms. */
  timeoutMs: number;
}

// ---------- FX rate providers (transparent fallback) ----------
// IMPORTANT: Free providers (no requiresEnv) MUST have the lowest priority
// numbers so they are always tried first. Keyed providers are attempted only
// as tertiary fallbacks — and only if their env var is present.
//
// Priority 1: Frankfurter (ECB data, open-source, no key)
// Priority 2: ExchangeRate-API open endpoint (no key, USD base)  ← moved up from 5
// Priority 3+: Keyed providers (only active if env var is set)
export const FX_PROVIDERS: FxProviderConfig[] = [
  {
    key: "frankfurter",
    label: "Frankfurter (ECB, open-source)",
    priority: 1,
    // Free, no key. Safe to refresh hourly.
    refreshIntervalMs: 60 * 60 * 1000,
    healthCheckUrl: "https://api.frankfurter.dev/v2/rates?base=USD", // v2 (fixed from v1)
  },
  {
    // Second free provider — no key required. Moved to priority 2 so the
    // factory reaches it immediately if Frankfurter is slow or unavailable,
    // instead of exhausting three keyed providers first.
    key: "exchangerate-api",
    label: "ExchangeRate-API (open)",
    priority: 2,
    refreshIntervalMs: 60 * 60 * 1000,
    healthCheckUrl: "https://open.er-api.com/v6/latest/USD",
  },
  {
    key: "exchangeratesapi-io",
    label: "exchangeratesapi.io",
    priority: 3,
    refreshIntervalMs: 60 * 60 * 1000,
    healthCheckUrl: "http://api.exchangeratesapi.io/v1/latest",
    requiresEnv: "EXCHANGERATESAPI_IO_KEY",
  },
  {
    key: "fixer-io",
    label: "Fixer.io",
    priority: 4,
    refreshIntervalMs: 60 * 60 * 1000,
    healthCheckUrl: "http://data.fixer.io/api/latest",
    requiresEnv: "FIXER_IO_KEY",
  },
  {
    key: "openexchangerates",
    label: "Open Exchange Rates",
    priority: 5,
    refreshIntervalMs: Number(process.env.RATES_REFRESH_INTERVAL_MS) || 6 * 60 * 60 * 1000,
    healthCheckUrl: "https://openexchangerates.org/api/usage.json",
    requiresEnv: "OPENEXCHANGE_APP_ID",
  },
];

// ---------- AI providers (smart load balancer) ----------
// Calls run through the OpenRouter gateway; we vary the underlying model to
// achieve provider diversity. The agent NEVER asks the user to pick — selection
// is fully transparent.
// Currently using OpenRouter ":free" models (no credit charge, but rate-limited
// to ~50 req/day per account until $10+ credits are purchased, then ~1000/day,
// and prompts may be logged for training). To upgrade to paid models, swap these
// slugs for e.g. google/gemini-2.5-flash, openai/gpt-5-mini, or
// anthropic/claude-haiku-4-5 (verify against https://openrouter.ai/models).
export const AI_PROVIDERS: AiProviderConfig[] = [
  {
    key: "gpt-oss-120b",
    label: "GPT-OSS 120B (primary, free)",
    model: "openai/gpt-oss-120b:free",
    priority: 1,
    // Kept short on purpose: with 3 providers in the failover chain, a long
    // per-provider timeout compounds into a worst case that can exceed the
    // serverless function's own execution limit, which then kills the
    // request with a hard platform crash instead of our graceful fallback
    // message. 8s x 3 = 24s worst case, safely inside typical limits.
    timeoutMs: 8_000,
  },
  {
    key: "nemotron-super-120b",
    label: "Nemotron 3 Super 120B (fallback, free)",
    model: "nvidia/nemotron-3-super-120b-a12b:free",
    priority: 2,
    timeoutMs: 8_000,
  },
  {
    key: "gpt-oss-20b",
    label: "GPT-OSS 20B (last resort, free)",
    model: "openai/gpt-oss-20b:free",
    priority: 3,
    timeoutMs: 8_000,
  },
];

/**
 * Client-facing env var placeholders. Real values live in `.env` / Cloud
 * secrets. None of these are required for the default build — they exist so
 * additional providers can be wired in without code changes.
 *
 *   VITE_FX_API_KEY_1            – optional override for primary FX provider
 *   VITE_FX_API_KEY_2            – optional override for secondary FX provider
 *   VITE_AI_API_KEY_PRIMARY      – optional override for primary AI provider
 *   VITE_AI_API_KEY_SECONDARY    – optional override for secondary AI provider
 *
 * Server-only:
 *   OPENEXCHANGE_APP_ID, OPENROUTER_API_KEY, RATES_REFRESH_INTERVAL_MS
 */
export const ENV_PLACEHOLDERS = [
  "VITE_FX_API_KEY_1",
  "VITE_FX_API_KEY_2",
  "VITE_AI_API_KEY_PRIMARY",
  "VITE_AI_API_KEY_SECONDARY",
] as const;
