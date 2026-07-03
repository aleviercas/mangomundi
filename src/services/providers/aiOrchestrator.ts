import { AI_PROVIDERS, type AiProviderConfig } from "@/config/providers.config";

export interface AiCallResult {
  text: string;
  error: boolean;
  provider?: string;
}

interface CallOpts {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}

type ProviderOutcome = { ok: true; text: string } | { ok: false; reason: string };

/** OpenAI-compatible chat completions (OpenRouter, DeepSeek, etc). */
async function callOpenAiCompatible(
  provider: AiProviderConfig,
  apiKey: string,
  opts: CallOpts,
): Promise<ProviderOutcome> {
  const res = await fetch(provider.baseUrl!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(provider.extraHeaders ?? {}),
    },
    body: JSON.stringify({ model: provider.model, messages: opts.messages }),
  });

  if (!res.ok) return { ok: false, reason: `HTTP ${res.status}${await bodySnippet(res)}` };

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) return { ok: false, reason: "empty response" };
  return { ok: true, text };
}

/** Truncated response body for failure diagnostics (never throws). */
async function bodySnippet(res: Response): Promise<string> {
  try {
    const t = (await res.text()).slice(0, 300).replace(/\s+/g, " ").trim();
    return t ? ` — ${t}` : "";
  } catch {
    return "";
  }
}

/**
 * Google Gemini's generateContent API. Different shape from OpenAI-style
 * chat completions: no single "messages" array — the system prompt is its
 * own field, and turns use {role: "user"|"model", parts:[{text}]}.
 */
async function callGemini(
  provider: AiProviderConfig,
  apiKey: string,
  opts: CallOpts,
): Promise<ProviderOutcome> {
  const systemMsg = opts.messages.find((m) => m.role === "system");
  const turns = opts.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: turns,
        ...(systemMsg ? { systemInstruction: { parts: [{ text: systemMsg.content }] } } : {}),
      }),
    },
  );

  if (!res.ok) return { ok: false, reason: `HTTP ${res.status}${await bodySnippet(res)}` };

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    promptFeedback?: { blockReason?: string };
  };
  const text = json.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) {
    // Gemini can return 200 with NO parts when the prompt/response is filtered
    // by its safety system (promptFeedback.blockReason, or a non-STOP
    // finishReason like "SAFETY"/"RECITATION"). Surface that distinctly so it
    // reads clearly in logs and the load balancer fails over to the next
    // provider — rather than a bland "empty response".
    const finish = json.candidates?.[0]?.finishReason;
    const block =
      json.promptFeedback?.blockReason ?? (finish && finish !== "STOP" ? finish : undefined);
    return { ok: false, reason: block ? `blocked (${block})` : "empty response" };
  }
  return { ok: true, text };
}

async function callProvider(
  provider: AiProviderConfig,
  apiKey: string,
  opts: CallOpts,
): Promise<ProviderOutcome> {
  if (provider.kind === "gemini") return callGemini(provider, apiKey, opts);
  return callOpenAiCompatible(provider, apiKey, opts);
}

/**
 * Smart Load Balancer for AI providers.
 *
 * Tries providers in priority order across MULTIPLE INDEPENDENT gateways
 * (Gemini, OpenRouter, DeepSeek), not just different models behind one
 * account — the whole point being that if OpenRouter's account-level daily
 * quota is exhausted, Gemini and DeepSeek have entirely separate quotas and
 * keep working. Any provider whose env var isn't configured is skipped
 * silently. The user never sees a model picker and never knows which
 * provider answered. Only when every configured provider is exhausted do we
 * surface an error.
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
  let triedAny = false;

  for (const provider of providers) {
    const apiKey = process.env[provider.envVar];
    if (!apiKey) continue; // not configured yet — skip silently

    triedAny = true;
    try {
      const outcome = await Promise.race([
        callProvider(provider, apiKey, opts),
        new Promise<ProviderOutcome>((resolve) =>
          setTimeout(() => resolve({ ok: false, reason: "timeout" }), provider.timeoutMs),
        ),
      ]);

      if (outcome.ok) {
        return { text: outcome.text, error: false, provider: provider.key };
      }
      lastError = `${provider.key} ${outcome.reason}`;
      console.warn("[ai-orchestrator] provider failed", lastError);
    } catch (err) {
      lastError = `${provider.key} ${err instanceof Error ? err.message : String(err)}`;
      console.warn("[ai-orchestrator] provider error", lastError);
    }
  }

  if (!triedAny) {
    console.error("[ai-orchestrator] no AI providers configured (no API keys set)");
  } else {
    console.error("[ai-orchestrator] all providers failed:", lastError);
  }
  return { text: "AI unavailable right now. Please try again shortly.", error: true };
}
