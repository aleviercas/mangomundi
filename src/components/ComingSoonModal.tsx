import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { captureEnterpriseLead } from "@/lib/agent.functions";

interface ComingSoonContextValue {
  open: (source: string) => void;
}

const ComingSoonContext = createContext<ComingSoonContextValue | null>(null);

export function useComingSoon() {
  const ctx = useContext(ComingSoonContext);
  if (!ctx) throw new Error("useComingSoon must be used within ComingSoonProvider");
  return ctx;
}

export function ComingSoonProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const capture = useServerFn(captureEnterpriseLead);

  const open = useCallback((src: string) => {
    setSource(src);
    setEmail("");
    setConsent(false);
    setDone(false);
    setIsOpen(true);
  }, []);

  // Global click delegation: any [data-coming-soon] element opens the modal
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest("[data-coming-soon]") as HTMLElement | null;
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      open(el.dataset.comingSoon || "unknown");
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !consent || submitting) return;
    setSubmitting(true);
    try {
      await capture({ data: { email, featureSource: source, consent: true } });
      setDone(true);
    } catch (err) {
      console.error("enterprise lead", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isChatBusiness = source === "chat_copilot_business";
  const title = isChatBusiness
    ? "Copilot B2B — Acceso prioritario"
    : "Enterprise Beta — Acceso prioritario";
  const description = isChatBusiness
    ? "Detectamos que operas con volúmenes corporativos. Deja tu email institucional para habilitar tu Copilot B2B con prioridad."
    : "Esta automatización está en fase beta cerrada. Dejá tu email corporativo y te asignamos un slot.";

  return (
    <ComingSoonContext.Provider value={{ open }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border z-[100]">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Sparkles className="h-5 w-5 text-warning" />
            </div>
            <DialogTitle className="text-center text-foreground font-semibold">{title}</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <p className="text-sm text-foreground">
                Estamos desplegando esta automatización en fase beta cerrada. Te hemos asignado
                acceso prioritario.
              </p>
              <p className="text-xs text-muted-foreground">Módulo: {source}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@empresa.com"
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
              <label className="flex items-start gap-2 text-[11px] text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                />
                <span>
                  Acepto que <span className="font-black lowercase">mango</span>
                  <span className="font-extralight lowercase">global</span> almacene mi email para
                  contactarme sobre este acceso prioritario (GDPR).
                </span>
              </label>
              <button
                type="submit"
                disabled={submitting || !consent}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Solicitar acceso prioritario
              </button>
              <p className="text-[11px] text-center text-muted-foreground">
                Sin spam. Sólo te escribimos cuando se abre tu slot.
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </ComingSoonContext.Provider>
  );
}
