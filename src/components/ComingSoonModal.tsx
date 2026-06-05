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
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const capture = useServerFn(captureEnterpriseLead);

  const open = useCallback((src: string) => {
    setSource(src);
    setEmail("");
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
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await capture({ data: { email, featureSource: source } });
      setDone(true);
    } catch (err) {
      console.error("enterprise lead", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ComingSoonContext.Provider value={{ open }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 z-[100]">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <DialogTitle className="text-center text-slate-950 font-semibold">
              Enterprise Beta — Acceso prioritario
            </DialogTitle>
            <DialogDescription className="text-center text-slate-500">
              Esta automatización está en fase beta cerrada. Dejá tu email corporativo y te asignamos un slot.
            </DialogDescription>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-sm text-slate-700">
                Estamos desplegando esta automatización en fase beta cerrada. Te hemos asignado acceso prioritario.
              </p>
              <p className="text-xs text-slate-400">Módulo: {source}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@empresa.com"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Solicitar acceso prioritario
              </button>
              <p className="text-[11px] text-center text-slate-400">
                Sin spam. Sólo te escribimos cuando se abre tu slot.
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </ComingSoonContext.Provider>
  );
}
