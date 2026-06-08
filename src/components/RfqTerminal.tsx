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
            mangoglobal · rfq_desk.exec
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
    <div className="terminal-card rounded-2xl overflow-hidden font-mono">
      {/* Header */}
      <div className="flex items-center gap-2 border-b terminal-divider px-4 py-2.5">
        <Terminal className="h-3.5 w-3.5 terminal-text-exec" />
        <span className="text-[11px] uppercase tracking-widest terminal-text-comment">
          mangoglobal · rfq_desk.exec
        </span>
        <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {done ? (
        <div className="p-6 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
          <p className="text-sm terminal-text-bright leading-relaxed">{t("rfq.success")}</p>
          <p className="text-[11px] terminal-text-comment">
            request_id: <span className="terminal-text-exec">{done.requestId}</span>
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-5">
          <div>
            <div className="terminal-text-exec text-sm font-semibold">$ {t("rfq.title")}</div>
            <p className="mt-2 text-[12px] terminal-text-comment leading-relaxed">
              {t("rfq.notice")}{" "}
              <span className="terminal-text-bright">[{origin || "—"}]</span>.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <TerminalField label={t("rfq.fieldFrom")} value={from} onChange={setFrom} maxLength={3} upper />
            <TerminalField label={t("rfq.fieldTo")} value={to} onChange={setTo} maxLength={3} upper />
            <TerminalField
              label={t("rfq.fieldAmount")}
              value={amount}
              onChange={setAmount}
              type="number"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TerminalField label={t("rfq.fieldOrigin")} value={origin} onChange={setOrigin} />
            <TerminalField label={t("rfq.fieldDest")} value={dest} onChange={setDest} />
          </div>
          <TerminalField
            label={t("rfq.email")}
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="treasury@company.com"
          />

          <label className="flex items-start gap-2 text-[11px] terminal-text-comment leading-relaxed cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-amber-500"
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
            className="terminal-btn-primary inline-flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-xs font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "▶"} {t("rfq.submit")}
          </button>
        </form>
      )}
    </div>
  );
}

function TerminalField({
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
      <span className="block text-[10px] uppercase tracking-widest terminal-text-comment mb-1">
        // {label}
      </span>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(upper ? e.target.value.toUpperCase() : e.target.value)}
        className="terminal-input w-full rounded-md px-2.5 py-2 text-sm font-mono"
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
