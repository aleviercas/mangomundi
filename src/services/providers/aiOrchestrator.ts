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

/**
 * Smart Load Balancer for AI providers.
 *
 * Tries providers in priority order. On any failure (4xx/5xx/timeout/network)
 * silently falls back to the next provider — the user never sees a model
 * picker and never knows which model answered. Only when every provider is
 * exhausted do we surface an error.
 */
export async function callAiWithFailover(opts: CallOpts): Promise<AiCallResult> {
  const providers: AiProviderConfig[] = [...AI_PROVIDERS].sort((a, b) => a.priority - b.priority);
  let lastError = "exhausted";

  for (const provider of providers) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), provider.timeoutMs);
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: provider.model, messages: opts.messages }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // 402 means credits are gone for the WHOLE gateway — stop and surface.
        if (res.status === 402) {
          return { text: "AI credits exhausted.", error: true, provider: provider.key };
        }
        lastError = `${provider.key} HTTP ${res.status}`;
        console.warn("[ai-orchestrator] provider failed", lastError);
        continue;
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (!text) {
        lastError = `${provider.key} empty response`;
        continue;
      }
      return { text, error: false, provider: provider.key };
    } catch (err) {
      lastError = `${provider.key} ${err instanceof Error ? err.message : String(err)}`;
      console.warn("[ai-orchestrator] provider error", lastError);
    } finally {
      clearTimeout(timer);
    }
  }

  console.error("[ai-orchestrator] all providers failed:", lastError);
  return { text: "AI unavailable right now. Please try again shortly.", error: true };
}
