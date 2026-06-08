import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
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

export function ChatWidget() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
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
    if (!open || !sessionId || messages.length > 0) return;
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
  }, [open, sessionId, history, messages.length, t]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
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
      console.error("chat error", err);
      setMessages((m) => [...m, { role: "assistant", content: t("chat.error") }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("chat.copilotAria")}
        className="fixed bottom-5 right-5 z-[90] flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg shadow-slate-900/20 transition-transform hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-[90] flex h-[560px] max-h-[80vh] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                FX Copilot
              </div>
              <p className="text-[11px] text-slate-400">
                <span className="font-black lowercase">mango</span>
                <span className="font-extralight lowercase">global</span> · agentic AI · {lang.toUpperCase()}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-slate-950 text-white"
                      : "bg-slate-50 text-slate-800 border border-slate-100"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ol:my-1 prose-ul:my-1 prose-strong:text-slate-950">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chat.placeholder")}
              className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <RfqTerminal open={rfqOpen} onOpenChange={setRfqOpen} defaults={rfqCtx} />
    </>
  );
}
