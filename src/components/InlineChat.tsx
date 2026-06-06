import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { chatTurn, getChatHistory } from "@/lib/agent.functions";
import { useComingSoon } from "@/components/ComingSoonModal";

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

const QUICK_PROMPTS = [
  "500 GBP to ARS",
  "1000 USD to MXN",
  "Treasury para empresa 50,000 EUR",
  "¿Cómo elijo el mejor proveedor?",
];

export function InlineChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const send = useServerFn(chatTurn);
  const history = useServerFn(getChatHistory);
  const { open: openEnterpriseModal } = useComingSoon();

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    if (!sessionId || messages.length > 0) return;
    history({ data: { sessionId } })
      .then((r) => {
        if (r.messages.length === 0) {
          setMessages([
            {
              role: "assistant",
              content:
                "Hola 👋 Soy el **copiloto FX** de **mangoglobal**. Probá una cotización (`500 GBP to ARS`) o contame el caso de tu empresa.",
            },
          ]);
        } else {
          setMessages(r.messages as Msg[]);
        }
      })
      .catch(() => {
        setMessages([
          {
            role: "assistant",
            content: "Hola 👋 ¿En qué te ayudo con tu próxima operación FX?",
          },
        ]);
      });
  }, [sessionId, history, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submitText = async (text: string) => {
    if (!text || sending || !sessionId) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    try {
      const { reply, segment } = await send({ data: { sessionId, message: text } });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      if (segment === "business") {
        setTimeout(() => openEnterpriseModal("chat_copilot_business"), 700);
      }
    } catch (err) {
      console.error("inline chat error", err);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "No pude procesar eso ahora. Probá de nuevo." },
      ]);
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
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium tracking-widest text-slate-700 uppercase shadow-sm">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Talk to the FX Agent
          </div>
          <h2 className="mt-4 font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Pedile una cotización. Sin formularios.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            El copiloto compara proveedores en tiempo real y deriva treasury corporativo automáticamente.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Copiloto FX
              <span className="ml-1 text-[10px] font-medium uppercase tracking-widest text-slate-400">
                <span className="font-black lowercase">mango</span>
                <span className="font-light lowercase">global</span> · agentic AI
              </span>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="h-[380px] overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/40"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-slate-950 text-white"
                      : "bg-white text-slate-800 border border-slate-100"
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
                <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-4 py-2.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={sending}
                onClick={() => submitText(p)}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-slate-900 hover:text-slate-950 transition-colors disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-slate-100 px-3 py-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ej: 500 GBP to ARS · o describí tu caso corporativo"
              className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
