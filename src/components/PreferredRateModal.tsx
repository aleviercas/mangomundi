import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { captureRetailLead } from "@/lib/retail.functions";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  context: {
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    sendingCountry?: string;
    receivingCountry?: string;
    providerSlug?: string;
    affiliateBaseUrl?: string;
  } | null;
}

export function PreferredRateModal({ open, onOpenChange, context }: Props) {
  const { t, lang } = useI18n();
  const submit = useServerFn(captureRetailLead);

  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEmail("");
    setConsent(false);
    setDone(false);
    setError(null);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent || !email || pending || !context) return;
    setPending(true);
    setError(null);
    try {
      const res = await submit({
        data: {
          email,
          amount: context.amount,
          fromCurrency: context.fromCurrency,
          toCurrency: context.toCurrency,
          sendingCountry: context.sendingCountry,
          receivingCountry: context.receivingCountry,
          providerSlug: context.providerSlug,
          affiliateBaseUrl: context.affiliateBaseUrl,
          locale: lang,
          consent: true,
        },
      });
      setDone(true);
      if (res.redirectUrl && typeof window !== "undefined") {
        setTimeout(() => window.open(res.redirectUrl!, "_blank", "noopener,noreferrer"), 1200);
      }
    } catch (err) {
      setError((err as Error).message || t("preferredRateModal.genericError"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border border-border">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Sparkles className="h-5 w-5 text-warning" />
          </div>
          <DialogTitle className="text-center text-foreground font-semibold">
            {t("retail.modalTitle")}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {t("retail.modalDesc")}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="text-sm text-foreground">{t("retail.success")}</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
              {t("retail.disclaimer")}
            </p>
            <label htmlFor="preferred-rate-email" className="sr-only">
              {t("common.email")}
            </label>
            <input
              id="preferred-rate-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("retail.emailPlaceholder")}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <label className="flex items-start gap-2 text-[12px] text-muted-foreground leading-relaxed cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span>{t("retail.consent")}</span>
            </label>
            {error && <div className="text-xs text-destructive">{error}</div>}
            <button
              type="submit"
              disabled={!consent || !email || pending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("retail.submit")}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
