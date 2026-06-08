import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { chatTurn, getChatHistory } from "@/lib/agent.functions";
import { RfqTerminal } from "@/components/RfqTerminal";
import { useI18n } from "@/lib/i18n";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "mg.chat.session";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

const QUICK_PROMPTS: Partial<Record<string, string[]>> = {
  en: ["500 GBP to ARS", "1000 USD to MXN", "Treasury for company 50,000 EUR", "How do I pick the best provider?"],
  es: ["500 GBP to ARS", "1000 USD to MXN", "Treasury para empresa 50,000 EUR", "¿Cómo elijo el mejor proveedor?"],
  pt: ["500 GBP to ARS", "1000 USD to MXN", "Tesouraria empresa 50.000 EUR", "Como escolho o melhor provedor?"],
  it: ["500 GBP to ARS", "1000 USD to MXN", "Tesoreria azienda 50.000 EUR", "Come scelgo il miglior fornitore?"],
  fr: ["500 GBP to ARS", "1000 USD to MXN", "Trésorerie entreprise 50 000 EUR", "Comment choisir le meilleur prestataire ?"],
  de: ["500 GBP to ARS", "1000 USD to MXN", "Treasury Firma 50.000 EUR", "Wie wähle ich den besten Anbieter?"],
};

export function InlineChat() {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [rfqOpen, setRfqOpen] = useState(false);
  const [rfqCtx, setRfqCtx] = useState<{
    amount?: number;
    fromCurrency?: string;
    toCurrency?: string;
  }>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const send = useServerFn(chatTurn);
  const history = useServerFn(getChatHistory);

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    if (!sessionId || messages.length > 0) return;
    history({ data: { sessionId } })
      .then((r) => {
        if (r.messages.length === 0) {
          setMessages([{ role: "assistant", content: t("chat.welcome") }]);
        } else {
          setMessages(r.messages as Msg[]);
        }
      })
      .catch(() => {
        setMessages([{ role: "assistant", content: t("chat.welcome") }]);
      });
  }, [sessionId, history, messages.length, t]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submitText = async (text: string) => {
    if (!text || sending || !sessionId) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    try {
      const { reply, segment, context } = await send({
        data: { sessionId, message: text, locale: lang },
      });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      if (segment === "rfq") {
        setRfqCtx(context ?? {});
        setTimeout(() => setRfqOpen(true), 700);
      }
    } catch (err) {
      console.error("inline chat error", err);
      setMessages((m) => [...m, { role: "assistant", content: t("chat.error") }]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitText(input.trim());
  };

  return (
    <section className="relative pb-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium tracking-widest text-muted-foreground uppercase shadow-sm">
            <Sparkles className="h-3 w-3 text-amber-500" />
            {t("inline.badge")}
          </div>
          <h2 className="mt-4 font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t("inline.headline")}
          </h2>
        </div>

        <div className="terminal-card overflow-hidden rounded-2xl shadow-2xl shadow-slate-950/20">
          <div className="flex items-center justify-between border-b terminal-divider px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold terminal-text-bright">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              {t("chat.copilotAria")}
              <span className="ml-1 text-[10px] font-medium uppercase tracking-widest terminal-text-comment">
                <span className="font-black lowercase">mango</span>
                <span className="font-extralight lowercase">global</span> · {lang.toUpperCase()}
              </span>
            </div>
            <span className="terminal-text-comment text-[10px] font-mono">{t("chat.sessionActive")}</span>
          </div>

          <div
            ref={scrollRef}
            className="h-[380px] overflow-y-auto px-4 py-4 space-y-3"
            style={{ backgroundColor: "oklch(0.16 0.012 264)" }}
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-amber-500/15 text-amber-50 border border-amber-500/30"
                      : "border terminal-divider terminal-text-bright"
                  }`}
                  style={m.role === "assistant" ? { backgroundColor: "oklch(0.22 0.012 264)" } : undefined}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-invert prose-p:my-1 prose-ol:my-1 prose-ul:my-1 prose-strong:text-amber-300">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap font-mono text-[13px]">{m.content}</span>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div
                  className="rounded-lg border terminal-divider px-3 py-2 terminal-text-comment"
                  style={{ backgroundColor: "oklch(0.22 0.012 264)" }}
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 border-t terminal-divider px-4 py-2.5">
            {(QUICK_PROMPTS[lang as "en" | "es" | "pt"] ?? QUICK_PROMPTS.en).map((p: string) => (
              <button
                key={p}
                type="button"
                disabled={sending}
                onClick={() => submitText(p)}
                className="terminal-chip rounded-full px-2.5 py-1 text-[11px] font-medium disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="group flex items-center gap-2 border-t terminal-divider px-3 py-3"
          >
            <span className="terminal-text-comment font-mono text-sm select-none">{"$"}</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chat.placeholder")}
              className="terminal-input flex-1 rounded-md px-3 py-2.5 text-sm font-mono"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="terminal-btn-primary inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-semibold disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">
                {lang === "es" ? "Enviar" : lang === "pt" ? "Enviar" : "Send"}
              </span>
            </button>
          </form>
        </div>
      </div>

      <RfqTerminal open={rfqOpen} onOpenChange={setRfqOpen} defaults={rfqCtx} />
    </section>
  );
}

