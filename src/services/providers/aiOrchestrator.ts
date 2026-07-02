import { AI_PROVIDERS, type AiProviderConfig } from "@/config/providers.config";

export interface AiCallResult {
  text: string;
  error: boolean;
  provider?: string;
}

interface CallOpts {
  apiKey: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}

type ProviderOutcome =
  | { ok: true; text: string }
  | { ok: false; reason: string; fatal?: boolean };

async function callProvider(provider: AiProviderConfig, opts: CallOpts): Promise<ProviderOutcome> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "mangomundi",
    },
    body: JSON.stringify({ model: provider.model, messages: opts.messages }),
  });

  if (!res.ok) {
    // 402 means credits are gone for the WHOLE gateway — stop and surface.
    if (res.status === 402) return { ok: false, reason: "credits exhausted", fatal: true };
    return { ok: false, reason: `HTTP ${res.status}` };
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) return { ok: false, reason: "empty response" };
  return { ok: true, text };
}

/**
 * Smart Load Balancer for AI providers.
 *
 * Tries providers in priority order. On any failure (4xx/5xx/timeout/network)
 * silently falls back to the next provider — the user never sees a model
 * picker and never knows which model answered. Only when every provider is
 * exhausted do we surface an error.
 *
 * Timeouts are implemented as a Promise.race against a plain timer rather
 * than an AbortController tied to the fetch's signal. Aborting a fetch
 * mid-flight can, on some Node/undici versions, produce a low-level socket
 * rejection that slips past a normal try/catch — racing instead just moves
 * on and lets the slow request finish (or die) quietly in the background,
 * which is safe here since the free-tier calls have no cost either way.
 */
export async function callAiWithFailover(opts: CallOpts): Promise<AiCallResult> {
  const providers: AiProviderConfig[] = [...AI_PROVIDERS].sort((a, b) => a.priority - b.priority);
  let lastError = "exhausted";

  for (const provider of providers) {
    try {
      const outcome = await Promise.race([
        callProvider(provider, opts),
        new Promise<ProviderOutcome>((resolve) =>
          setTimeout(() => resolve({ ok: false, reason: "timeout" }), provider.timeoutMs),
        ),
      ]);

      if (outcome.ok) {
        return { text: outcome.text, error: false, provider: provider.key };
      }
      if (outcome.fatal) {
        return { text: "AI credits exhausted.", error: true, provider: provider.key };
      }
      lastError = `${provider.key} ${outcome.reason}`;
      console.warn("[ai-orchestrator] provider failed", lastError);
    } catch (err) {
      lastError = `${provider.key} ${err instanceof Error ? err.message : String(err)}`;
      console.warn("[ai-orchestrator] provider error", lastError);
    }
  }

  console.error("[ai-orchestrator] all providers failed:", lastError);
  return { text: "AI unavailable right now. Please try again shortly.", error: true };
}
