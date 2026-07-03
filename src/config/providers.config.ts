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
  /** Which gateway/API shape to call. */
  kind: "gemini" | "openai-compatible";
  /** Model identifier passed to the gateway. */
  model: string;
  /** Lower number = tried first by the smart load balancer. */
  priority: number;
  /** Per-request timeout in ms. */
  timeoutMs: number;
  /** Env var holding this provider's own API key. Skipped if unset. */
  envVar: string;
  /** Chat-completions endpoint for "openai-compatible" providers. */
  baseUrl?: string;
  /** Extra headers some gateways want (e.g. OpenRouter's X-Title). */
  extraHeaders?: Record<string, string>;
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
// The agent NEVER asks the user to pick a model — selection is fully
// transparent and automatic.
//
// IMPORTANT: these are genuinely INDEPENDENT gateways with separate quota
// buckets, not just different model names behind one account. OpenRouter's
// three ":free" models below all share ONE account-level daily rate limit
// (~50 req/day until $10+ credit is added, then ~1000/day) — so when
// OpenRouter's quota is exhausted, ALL THREE fail together, which is exactly
// what happened in production. Gemini (a separate Google account/project)
// and DeepSeek (a separate account with its own free grant) each have their
// own quota, so they keep working even when OpenRouter is fully rate-limited.
//
// Every provider is skipped automatically if its env var isn't set, so
// adding a new key here never breaks anything for providers not yet
// configured — see envVar below.
//
// Worst case if every provider times out: 5 x 8s = 40s, still safely inside
// the 60s Vercel maxDuration configured in vite.config.ts.
//
//   GEMINI_API_KEY   — free, no card: https://aistudio.google.com/apikey
//   OPENROUTER_API_KEY — existing gateway for the three free OSS models
//   DEEPSEEK_API_KEY — 5M free tokens on signup, then ~$0.14/M tokens:
//                      https://platform.deepseek.com/api_keys
export const AI_PROVIDERS: AiProviderConfig[] = [
  {
    key: "gemini-flash",
    label: "Gemini 2.5 Flash (Google, free tier, independent quota)",
    kind: "gemini",
    model: "gemini-2.5-flash",
    priority: 1,
    timeoutMs: 8_000,
    envVar: "GEMINI_API_KEY",
  },
  {
    key: "gpt-oss-120b",
    label: "GPT-OSS 120B (OpenRouter, free)",
    kind: "openai-compatible",
    model: "openai/gpt-oss-120b:free",
    priority: 2,
    timeoutMs: 8_000,
    envVar: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    extraHeaders: { "X-Title": "mangomundi" },
  },
  {
    key: "nemotron-super-120b",
    label: "Nemotron 3 Super 120B (OpenRouter, free)",
    kind: "openai-compatible",
    model: "nvidia/nemotron-3-super-120b-a12b:free",
    priority: 3,
    timeoutMs: 8_000,
    envVar: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    extraHeaders: { "X-Title": "mangomundi" },
  },
  {
    key: "gpt-oss-20b",
    label: "GPT-OSS 20B (OpenRouter, free)",
    kind: "openai-compatible",
    model: "openai/gpt-oss-20b:free",
    priority: 4,
    timeoutMs: 8_000,
    envVar: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    extraHeaders: { "X-Title": "mangomundi" },
  },
  {
    key: "deepseek-flash",
    label: "DeepSeek V4 Flash (own account, free grant then cheap)",
    kind: "openai-compatible",
    model: "deepseek-v4-flash",
    priority: 5,
    timeoutMs: 8_000,
    envVar: "DEEPSEEK_API_KEY",
    baseUrl: "https://api.deepseek.com/chat/completions",
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
