/**
 * Central provider configuration for FX rate sources and AI gateways.
 *
 * Endpoints and health-checks are declared here. Secrets are NEVER stored in
 * this file — they are read from environment variables at request time inside
 * server boundaries (createServerFn handlers / server routes).
 *
 * Client-exposed VITE_ placeholders are documented at the bottom; the actual
 * key material lives in `.env` and Lovable Cloud secrets.
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
  /** Model identifier passed to the Lovable AI gateway. */
  model: string;
  /** Lower number = tried first by the smart load balancer. */
  priority: number;
  /** Per-request timeout in ms. */
  timeoutMs: number;
}

// ---------- FX rate providers (transparent fallback) ----------
// Order matters: highest priority first. The ProviderFactory iterates this list
// and the first healthy provider that returns valid rates wins.
export const FX_PROVIDERS: FxProviderConfig[] = [
  {
    key: "frankfurter",
    label: "Frankfurter (ECB, open-source)",
    priority: 1,
    // Free, no key. Safe to refresh hourly.
    refreshIntervalMs: 60 * 60 * 1000,
    healthCheckUrl: "https://api.frankfurter.dev/v1/latest",
  },
  {
    key: "exchangeratesapi-io",
    label: "exchangeratesapi.io",
    priority: 2,
    refreshIntervalMs: 60 * 60 * 1000,
    healthCheckUrl: "http://api.exchangeratesapi.io/v1/latest",
    requiresEnv: "EXCHANGERATESAPI_IO_KEY",
  },
  {
    key: "fixer-io",
    label: "Fixer.io",
    priority: 3,
    refreshIntervalMs: 60 * 60 * 1000,
    healthCheckUrl: "http://data.fixer.io/api/latest",
    requiresEnv: "FIXER_IO_KEY",
  },
  {
    key: "openexchangerates",
    label: "Open Exchange Rates",
    priority: 4,
    refreshIntervalMs: Number(process.env.RATES_REFRESH_INTERVAL_MS) || 6 * 60 * 60 * 1000,
    healthCheckUrl: "https://openexchangerates.org/api/usage.json",
    requiresEnv: "OPENEXCHANGE_APP_ID",
  },
  {
    key: "exchangerate-api",
    label: "ExchangeRate-API (open)",
    priority: 5,
    refreshIntervalMs: 60 * 60 * 1000,
    healthCheckUrl: "https://open.er-api.com/v6/latest/USD",
  },
];

// ---------- AI providers (smart load balancer) ----------
// Calls run through the OpenRouter gateway; we vary the underlying model to
// achieve provider diversity (Gemini → GPT fallback). The agent NEVER asks the
// user to pick — selection is fully transparent.
// NOTE: model slugs must exist in OpenRouter's catalog (https://openrouter.ai/models).
// Verify each `model` below against the live catalog; adjust if any returns 404.
export const AI_PROVIDERS: AiProviderConfig[] = [
  {
    key: "gemini-3-flash",
    label: "Gemini 3 Flash (primary)",
    model: "google/gemini-3-flash-preview",
    priority: 1,
    timeoutMs: 25_000,
  },
  {
    key: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash (fallback)",
    model: "google/gemini-2.5-flash",
    priority: 2,
    timeoutMs: 25_000,
  },
  {
    key: "gpt-5-mini",
    label: "GPT-5 mini (last resort)",
    model: "openai/gpt-5-mini",
    priority: 3,
    timeoutMs: 30_000,
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
