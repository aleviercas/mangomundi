import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Terminal } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { initiateRfq } from "@/lib/rfq.functions";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaults?: {
    amount?: number;
    fromCurrency?: string;
    toCurrency?: string;
    sendingCountry?: string;
    receivingCountry?: string;
  };
}

export function RfqTerminal({ open, onOpenChange, defaults }: Props) {
  const { t, lang } = useI18n();
  const submit = useServerFn(initiateRfq);

  const [amount, setAmount] = useState<string>(defaults?.amount?.toString() ?? "");
  const [from, setFrom] = useState(defaults?.fromCurrency ?? "USD");
  const [to, setTo] = useState(defaults?.toCurrency ?? "EUR");
  const [origin, setOrigin] = useState(defaults?.sendingCountry ?? "");
  const [dest, setDest] = useState(defaults?.receivingCountry ?? "");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<{ requestId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDone(null);
    setError(null);
    setEmail("");
    setConsent(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const numAmount = Number(amount);
  const canSubmit =
    consent && email && origin && dest && from && to && Number.isFinite(numAmount) && numAmount > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await submit({
        data: {
          email,
          amount: numAmount,
          fromCurrency: from.toUpperCase(),
          toCurrency: to.toUpperCase(),
          sendingCountry: origin,
          receivingCountry: dest,
          locale: lang,
          consent: true,
        },
      });
      setDone({ requestId: res.requestId });
    } catch (err) {
      setError((err as Error).message || t("rfq.errorGeneric"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono p-0 overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
          <Terminal className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] uppercase tracking-widest text-slate-400">
            mangomundi · rfq_desk.exec
          </span>
          <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {done ? (
          <div className="p-6 text-center space-y-4">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
            <p className="text-sm text-slate-200 leading-relaxed">{t("rfq.success")}</p>
            <p className="text-[11px] text-slate-500">
              {t("rfq.requestId")}: <span className="text-emerald-400">{done.requestId}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="p-5 space-y-4">
            <div>
              <div className="text-amber-400 text-[11px] mb-1">// {t("rfq.title")}</div>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                {t("rfq.notice")} <span className="text-slate-200">[{origin || "—"}]</span>.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Input label={t("rfq.fieldFrom")} value={from} onChange={setFrom} maxLength={3} upper />
              <Input label={t("rfq.fieldTo")} value={to} onChange={setTo} maxLength={3} upper />
              <Input
                label={t("rfq.fieldAmount")}
                value={amount}
                onChange={setAmount}
                type="number"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input label={t("rfq.fieldOrigin")} value={origin} onChange={setOrigin} />
              <Input label={t("rfq.fieldDest")} value={dest} onChange={setDest} />
            </div>
            <Input
              label={t("rfq.email")}
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="treasury@company.com"
            />

            <label className="flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 accent-emerald-500"
              />
              <span>{t("rfq.consent")}</span>
            </label>

            {error && (
              <div className="text-[11px] text-red-400 border border-red-900/50 bg-red-950/30 rounded px-2 py-1.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || pending}
              className="w-full inline-flex items-center justify-center gap-2 rounded bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-widest py-2.5 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "▶"}{" "}
              {t("rfq.submit")}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Always-open, inline RFQ desk variant — same submission logic as the dialog,
 * rendered persistently inside the page using the unified .terminal-card style.
 */
export function RfqInlinePanel({ defaults }: { defaults?: Props["defaults"] }) {
  const { t, lang } = useI18n();
  const submit = useServerFn(initiateRfq);

  const [amount, setAmount] = useState<string>(defaults?.amount?.toString() ?? "");
  const [from, setFrom] = useState(defaults?.fromCurrency ?? "USD");
  const [to, setTo] = useState(defaults?.toCurrency ?? "EUR");
  const [origin, setOrigin] = useState(defaults?.sendingCountry ?? "");
  const [dest, setDest] = useState(defaults?.receivingCountry ?? "");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<{ requestId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const numAmount = Number(amount);
  const canSubmit =
    consent && email && origin && dest && from && to && Number.isFinite(numAmount) && numAmount > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await submit({
        data: {
          email,
          amount: numAmount,
          fromCurrency: from.toUpperCase(),
          toCurrency: to.toUpperCase(),
          sendingCountry: origin,
          receivingCountry: dest,
          locale: lang,
          consent: true,
        },
      });
      setDone({ requestId: res.requestId });
    } catch (err) {
      setError((err as Error).message || t("rfq.errorGeneric"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="surface-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Terminal className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <span className="font-black lowercase">mango</span><span className="font-extralight lowercase">global</span> · {t("brand.rfqDesk")}
        </span>
        <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {done ? (
        <div className="p-6 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
          <p className="text-sm leading-relaxed text-foreground">{t("rfq.success")}</p>
          <p className="text-xs text-muted-foreground">
            {t("rfq.requestId")}: <span className="font-semibold text-foreground">{done.requestId}</span>
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-5">
          <div>
            <div className="font-heading text-base font-semibold text-foreground">{t("rfq.title")}</div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {t("rfq.notice")}{" "}
              <span className="font-semibold text-foreground">[{origin || "—"}]</span>.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <LightField label={t("rfq.fieldFrom")} value={from} onChange={setFrom} maxLength={3} upper />
            <LightField label={t("rfq.fieldTo")} value={to} onChange={setTo} maxLength={3} upper />
            <LightField
              label={t("rfq.fieldAmount")}
              value={amount}
              onChange={setAmount}
              type="number"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LightField label={t("rfq.fieldOrigin")} value={origin} onChange={setOrigin} />
            <LightField label={t("rfq.fieldDest")} value={dest} onChange={setDest} />
          </div>
          <LightField
            label={t("rfq.email")}
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="treasury@company.com"
          />

          <label className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-primary"
            />
            <span>{t("rfq.consent")}</span>
          </label>

          {error && (
            <div className="text-xs text-destructive border border-destructive/30 bg-destructive/10 rounded px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || pending}
            className="btn-cta inline-flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {t("rfq.submit")}
          </button>
        </form>
      )}
    </div>
  );
}

function LightField({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
  upper = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
  upper?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(upper ? e.target.value.toUpperCase() : e.target.value)}
        className="flex h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
  upper = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
  upper?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
        {label}
      </span>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(upper ? e.target.value.toUpperCase() : e.target.value)}
        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none font-mono"
      />
    </label>
  );
}
