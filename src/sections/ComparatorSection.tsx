import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowRight,
  Clock,
  Loader2,
  Send,
  Shield,
  Star,
  Building2,
  TrendingUp,
  ArrowDownUp,
  Sparkle,
  Zap,
  Info,
  ArrowLeft,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  compareProviders,
  trackAffiliateClick,
  chatAboutRecommendation,
  type ComparisonResult,
} from "@/lib/fx.functions";
import { useI18n } from "@/lib/i18n";
import { localCurrency, primaryCountryForCurrency, resolveRouteCode } from "@/lib/countries";
import { BrandLogo } from "@/components/BrandLogo";
import { PreferredRateModal } from "@/components/PreferredRateModal";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { CurrencyCombobox } from "@/components/ui/CurrencyCombobox";
import { useAnalytics } from "@/hooks/use-analytics";
import { B2B_UPSELL_MIN_AMOUNT, MARKET_BASELINE_SPREAD } from "@/config/providers";
import { captureBusinessLead } from "@/lib/agent.functions";
import { getMasterRateState, reportMissingCorridor } from "@/lib/master.functions";
import { MasterRateStore, type MasterRateMap, type MissingCorridorEntry } from "@/services/providers/MasterRateStore";
import {
  AiCopilot,
  MissingCorridorCta,
  buildWizardContext,
  resolveWizardLocale,
  localHowToCompare,
  localTransferLimits,
  localFeeBreakdown,
  type WizardAction,
} from "@/components/AiCopilot";
import { Button } from "@/components/ui/button";

type Segment = "retail" | "business";
type AmountMode = "send" | "receive";
type Urgency = "urgent" | "standard" | "flexible";
type SortKey = "received" | "fee" | "speed";
type ChatAction =
  | { kind: "proceed"; slug: string; url: string; label: string }
  | {
      kind: "compare";
      from: string;
      to: string;
      /** Explicit country (ISO-3166) when the user named one, else inferred from currency. */
      fromCountry?: string;
      toCountry?: string;
      label: string;
    };
type ChatMsg = { role: "user" | "assistant"; content: string; actions?: ChatAction[] };
type BusinessStage = "volume" | "email" | "consent" | "done";

interface ComparatorQuery {
  origin: string;
  destination: string;
  segment: Segment;
  from: string;
  to: string;
  amount: number;
  lang?: string;
  /** Run the comparison immediately on mount (set by the home widget's ?run=1). */
  autoRun?: boolean;
}

export function ComparatorSection({ initialQuery }: { initialQuery?: ComparatorQuery }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate({ from: "/compare" });
  const [amount, setAmount] = useState<number>(initialQuery?.amount ?? 1000);
  const [from, setFrom] = useState(initialQuery?.from ?? "GBP");
  const [to, setTo] = useState(initialQuery?.to ?? "USD");
  const [sendingCountry, setSendingCountry] = useState(initialQuery?.origin ?? "GB");
  const [receivingCountry, setReceivingCountry] = useState(initialQuery?.destination ?? "US");
  const [segment, setSegment] = useState<Segment>(initialQuery?.segment ?? "retail");
  const [amountMode, setAmountMode] = useState<AmountMode>("send");
  const [urgency, setUrgency] = useState<Urgency>("standard");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [aiText, setAiText] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<SortKey>("received");
  const requestRef = useRef(0);
  // Set true when a compare just populated results for a NEW corridor, so the
  // debounced URL-sync effect (which fires on from/to/country changes) syncs the
  // URL without wiping the freshly-set results/chat. One-shot.
  const skipNextSyncClearRef = useRef(false);
  const [businessStage, setBusinessStage] = useState<BusinessStage>("volume");
  const [businessData, setBusinessData] = useState<{
    monthlyVolume?: number;
    sector?: string;
    email?: string;
  }>({});
  const [savingBusinessLead, setSavingBusinessLead] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalCtx, setModalCtx] = useState<{
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    sendingCountry?: string;
    receivingCountry?: string;
    providerSlug?: string;
    affiliateBaseUrl?: string;
  } | null>(null);

  const compareFn = useServerFn(compareProviders);
  const trackFn = useServerFn(trackAffiliateClick);
  const chatFn = useServerFn(chatAboutRecommendation);
  const captureBusinessFn = useServerFn(captureBusinessLead);
  const getMasterFn = useServerFn(getMasterRateState);
  const reportMissingFn = useServerFn(reportMissingCorridor);
  const { track } = useAnalytics();

  // Floating agent state: minimized by default on ALL devices. Only expands
  // on explicit user click. Chat transcript + unread badge persist across
  // navigation via localStorage so remounts don't reset or flicker.
  const AGENT_STORAGE_KEY = "mm.agent.v1";
  const [aiCollapsed, setAiCollapsed] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // MasterRateMap / MissingCorridorsLog (client mirror). Hydrated from the
  // server on mount and re-synced after each comparison so the AI Wizard
  // always has up-to-date context.
  const [masterMap, setMasterMap] = useState<MasterRateMap | null>(() => MasterRateStore.getMaster());
  const [missingLog, setMissingLog] = useState<MissingCorridorEntry[]>(() => MasterRateStore.getMissing());
  const [missingCorridor, setMissingCorridor] = useState<{ from: string; to: string } | null>(null);

  // Restore once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(AGENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { chat?: ChatMsg[]; unread?: number };
        if (Array.isArray(parsed.chat) && parsed.chat.length > 0) setChat(parsed.chat);
        if (typeof parsed.unread === "number") setUnreadCount(parsed.unread);
      }
    } catch {
      /* ignore */
    }
    // Subscribe to local master store changes (e.g. acknowledgements).
    const unsub = MasterRateStore.subscribe(() => {
      setMasterMap(MasterRateStore.getMaster());
      setMissingLog(MasterRateStore.getMissing());
    });
    // Hydrate worker-side master state into local cache (additive merge).
    getMasterFn()
      .then((state) => {
        MasterRateStore.hydrate(state.master);
        // Server-side missing log entries seed the local log too.
        for (const m of state.missing) {
          const existing = MasterRateStore.getMissing().find(
            (x) => x.from === m.from && x.to === m.to,
          );
          if (!existing) MasterRateStore.logMissing(m.from, m.to);
        }
      })
      .catch(() => {/* offline / build-time — ignore */});
    return () => {
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const buildReasoning = (): string => {
    const urgencyLabel =
      urgency === "urgent"
        ? "urgent (minutes)"
        : urgency === "flexible"
          ? "flexible (days)"
          : "standard (same-day)";
    return `[LANG:${lang.toUpperCase()}] mangomundi routing justification: for a transfer of ${amount.toLocaleString()} ${from} to ${to} with ${urgencyLabel} urgency, the engine analysed liquidity paths across indexed providers. The optimal route was selected from flat-fee optimisation and real-time interbank rates; spread, fixed fees, settlement window and regulatory coverage of each counterparty were normalised before ranking.`;
  };

  const proactiveMessage = (res: ComparisonResult, key: SortKey): ChatMsg | null => {
    const rows = [...res.rows];
    if (rows.length === 0) return null;
    if (key === "received") rows.sort((a, b) => b.received - a.received);
    else if (key === "fee") rows.sort((a, b) => a.fee_total - b.fee_total);
    else
      rows.sort(
        (a, b) =>
          (a.delivery_minutes ?? a.speed_hours * 60) - (b.delivery_minutes ?? b.speed_hours * 60),
      );
    const top = rows[0];
    const tplKey =
      key === "received"
        ? "comparator.copilot.proactive.rate"
        : key === "fee"
          ? "comparator.copilot.proactive.fee"
          : "comparator.copilot.proactive.speed";
    const content = t(tplKey).replace("{provider}", top.name);
    return {
      role: "assistant",
      content,
      actions: [
        {
          kind: "proceed",
          slug: top.slug,
          url: top.affiliate_url,
          label: t("comparator.copilot.proceed").replace("{provider}", top.name),
        },
      ],
    };
  };

  const compareMut = useMutation({
    mutationFn: async (override?: {
      from: string;
      to: string;
      sendingCountry?: string;
      receivingCountry?: string;
    }) => {
      const useFrom = override?.from ?? from;
      const useTo = override?.to ?? to;
      const useSending = override?.sendingCountry ?? sendingCountry;
      const useReceiving = override?.receivingCountry ?? receivingCountry;
      const requestId = ++requestRef.current;
      const data = await compareFn({
        data: {
          amount,
          from: useFrom,
          to: useTo,
          segment,
          amountMode,
          sendingCountry: useSending,
          receivingCountry: useReceiving,
        },
      });
      return { data, requestId, usedFrom: useFrom, usedTo: useTo, usedSending: useSending, usedReceiving: useReceiving };
    },
    onMutate: () => {
      setAiLoading(true);
      setResult(null);
      setAiText("");
      setChat([]);
      setMissingCorridor(null);
    },
    onSuccess: ({ data, requestId, usedFrom, usedTo, usedSending, usedReceiving }) => {
      if (requestId !== requestRef.current) return;
      if (usedFrom !== from) setFrom(usedFrom);
      if (usedTo !== to) setTo(usedTo);
      // Keep the country selects consistent with the (possibly new) currencies
      // — a suggested compare can change the corridor, not just the currency.
      if (usedSending !== sendingCountry) setSendingCountry(usedSending);
      if (usedReceiving !== receivingCountry) setReceivingCountry(usedReceiving);
      // If the corridor changed, the URL-sync effect will fire from those state
      // changes — tell it to keep the results/chat we're about to set.
      if (
        usedFrom !== from ||
        usedTo !== to ||
        usedSending !== sendingCountry ||
        usedReceiving !== receivingCountry
      ) {
        skipNextSyncClearRef.current = true;
      }
      setResult(data);
      setSortBy("received");
      setAiText(buildReasoning());
      setAiLoading(false);
      setMissingCorridor(null);
      const intro = proactiveMessage(data, "received");
      const initial: ChatMsg[] = [];
      // Results summary as first assistant bubble (per spec: results inside chat)
      const best = [...data.rows].sort((a, b) => b.received - a.received)[0];
      if (best) {
        const referenceTag = data.is_reference ? " _(reference)_" : "";
        const summary =
          `Sending **${amount.toLocaleString()} ${usedFrom}** to **${usedTo}** — ` +
          `best route delivers **${best.received.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${data.quote}** ` +
          `via **${best.name}**.${referenceTag}`;
        initial.push({ role: "assistant", content: summary });
      }
      if (segment === "business") {
        setBusinessStage("volume");
        setBusinessData({});
        initial.push({ role: "assistant", content: t("comparator.copilot.business.intro") });
      } else if (intro) initial.push(intro);
      // B2B upsell: retail user moving large notional → nudge to corporate desk.
      if (segment === "retail" && amount >= B2B_UPSELL_MIN_AMOUNT) {
        initial.push({
          role: "assistant",
          content: t("comparator.copilot.b2bUpsell"),
        });
      }
      setChat(initial);
      // Do NOT auto-expand. The agent stays minimized until the user clicks
      // it; we surface activity via the unread badge instead.
      if (aiCollapsed) setUnreadCount((n) => n + initial.length);

      track("comparator_query", {
        amount,
        from_currency: from,
        to_currency: to,
        segment,
        urgency,
        source: "home_comparator",
      });
    },
    onError: (err) => {
      setAiLoading(false);
      const msg = (err as Error)?.message ?? "";
      const m = /MISSING_CORRIDOR:([A-Z]{3})-([A-Z]{3})/.exec(msg);
      if (m) {
        setMissingCorridor({ from: m[1], to: m[2] });
        MasterRateStore.logMissing(m[1], m[2]);
      }
    },
  });

  // Auto-run one comparison when arriving from the home widget (?run=1) so the
  // user lands directly on results instead of having to click "Compare Rates"
  // again. Fires once per mount (ref guard also survives a StrictMode
  // double-effect). Same validation as the manual CTA, plus the corridor
  // sanity check the URL-sync effect uses.
  const didAutoRunRef = useRef(false);
  useEffect(() => {
    if (!initialQuery?.autoRun || didAutoRunRef.current) return;
    didAutoRunRef.current = true;
    if (!sendingCountry || !receivingCountry || amount <= 0 || from === to) return;
    // The URL-sync effect's 300ms timer clears result/chat unless this one-shot
    // flag is set — covers sub-300ms responses landing before the timer fires.
    skipNextSyncClearRef.current = true;
    compareMut.mutate(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestMissingRoute = async (from: string, to: string) => {
    MasterRateStore.logMissing(from, to);
    try {
      await reportMissingFn({ data: { from, to } });
    } catch {
      /* logged locally regardless */
    }
    MasterRateStore.acknowledgeMissing(from, to);
    track("rfq_interaction", {
      amount,
      from_currency: from,
      to_currency: to,
      segment,
      urgency,
      source: "missing_corridor_request",
    });
  };

  // Runs an actual comparison for a route the user asked about in free-text
  // chat, instead of assuming it's unsupported. If it genuinely isn't
  // supported, compareMut.onError already detects MISSING_CORRIDOR and
  // surfaces the existing request-this-route CTA — so nothing is logged as
  // missing until a real attempt confirms it.
  const runSuggestedCompare = (
    suggestedFrom: string,
    suggestedTo: string,
    suggestedFromCountry?: string,
    suggestedToCountry?: string,
  ) => {
    track("rfq_interaction", {
      amount,
      from_currency: suggestedFrom,
      to_currency: suggestedTo,
      segment,
      urgency,
      source: "chat_suggested_compare",
    });
    // If the user named a specific country, use it directly. Otherwise keep each
    // country consistent with the suggested currency: only change a side's
    // country when its current country doesn't already use that currency (so a
    // route that keeps one currency leaves that country untouched).
    const nextOrigin =
      suggestedFromCountry ??
      (localCurrency(sendingCountry) === suggestedFrom
        ? sendingCountry
        : (primaryCountryForCurrency(suggestedFrom) ?? sendingCountry));
    const nextDest =
      suggestedToCountry ??
      (localCurrency(receivingCountry) === suggestedTo
        ? receivingCountry
        : (primaryCountryForCurrency(suggestedTo) ?? receivingCountry));
    compareMut.mutate({
      from: suggestedFrom,
      to: suggestedTo,
      sendingCountry: nextOrigin,
      receivingCountry: nextDest,
    });
  };

  const handleWizardAction = (action: WizardAction) => {
    if (action.id === "report") {
      const note = `I have noted your interest in the ${from}-${to} route. It has been added to the discovery log; we will prioritize it as demand grows.`;
      MasterRateStore.logMissing(from, to);
      void reportMissingFn({ data: { from, to } }).catch(() => {});
      setChat((c) => [
        ...c,
        { role: "user", content: `Report missing route ${from} → ${to}` },
        { role: "assistant", content: note },
      ]);
      return;
    }
    if (!result) {
      setChat((c) => [
        ...c,
        { role: "user", content: action.label },
        {
          role: "assistant",
          content:
            "Run a comparison first — I answer using the table data, not external sources.",
        },
      ]);
      return;
    }
    // "how" / "limits" / "fees" are answered locally from data already on
    // the client — zero AI tokens spent, restoring the Wizard's original
    // "resolved without AI" design. Only free-typed questions reach the AI.
    if (action.id === "how" || action.id === "limits" || action.id === "fees") {
      const locale = resolveWizardLocale(lang);
      const reply =
        action.id === "how"
          ? localHowToCompare(locale)
          : action.id === "limits"
            ? localTransferLimits(result, locale)
            : localFeeBreakdown(result, locale);
      setChat((c) => [
        ...c,
        { role: "user", content: action.label },
        { role: "assistant", content: reply },
      ]);
      return;
    }
    void chatMut.mutate(action.prompt);
  };

  const chatMut = useMutation({
    mutationFn: async (userMsg: string) => {
      if (!result || !aiText) throw new Error("No recommendation yet");
      const newHistory: ChatMsg[] = [...chat, { role: "user", content: userMsg }];
      setChat(newHistory);
      // Client-side safety net: the server-side failover chain has a 24s
      // worst case (3 providers x 8s), but if the serverless function itself
      // gets killed by the platform's own execution limit before it can
      // return our graceful fallback, the request would otherwise hang
      // indefinitely and the app would crash instead of degrading nicely.
      // Racing against a slightly longer client timeout guarantees we always
      // land in onError with a friendly message.
      const CHAT_TIMEOUT_MS = 26_000;
      const res = await Promise.race([
        chatFn({
          data: {
            amount,
            from,
            to,
            segment,
            urgency,
            lang,
            sortBy,
            recommendation: aiText,
            top: result.rows.slice(0, 8).map((r) => ({
              name: r.name,
              received: r.received,
              fee_total: r.fee_total,
              speed_hours: r.speed_hours,
            })),
            history: newHistory.map((m) => ({ role: m.role, content: m.content })),
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("chat_timeout")), CHAT_TIMEOUT_MS),
        ),
      ]);
      // The AI invites the user to actually run a comparison for a
      // different route they asked about by appending a machine tag as the
      // last line of its reply (see the Neutrality Protocol prompt). Parse
      // it into a real "Compare X → Y" button — clicking it runs the actual
      // comparator, which only logs the route as missing if it genuinely
      // isn't supported (via compareMut.onError, unchanged).
      // Models often backslash-escape square brackets in markdown-rendered
      // output (since "[x]" is link syntax), so normalize "\[" / "\]" back
      // to plain brackets before matching the tag.
      const normalized = res.text.replace(/\\(\[|\])/g, "$1");
      // Each side may be a 2-letter ISO country code (when the user named a
      // specific country) or a 3-letter currency code (currency only). Match the
      // tag ANYWHERE — not just at the very end — since the model doesn't always
      // place it last; otherwise the raw "[[SUGGEST_COMPARE:…]]" text leaks into
      // the chat bubble instead of becoming a button.
      const tagMatch = /\[\[SUGGEST_COMPARE:([A-Z]{2,3})-([A-Z]{2,3})\]\]/.exec(normalized);
      const displayText = tagMatch
        ? normalized.replace(tagMatch[0], "").replace(/\s{2,}/g, " ").replace(/\s+([.!])/g, "$1").trim()
        : res.text;
      const fromSide = tagMatch ? resolveRouteCode(tagMatch[1]) : undefined;
      const toSide = tagMatch ? resolveRouteCode(tagMatch[2]) : undefined;
      const actions: ChatAction[] | undefined =
        fromSide && toSide
          ? [
              {
                kind: "compare",
                from: fromSide.currency,
                to: toSide.currency,
                fromCountry: fromSide.country,
                toCountry: toSide.country,
                // Show the country code when the user named one, else the currency.
                label: `${resolveWizardLocale(lang) === "en" ? "Compare" : "Comparar"} ${
                  fromSide.country ?? fromSide.currency
                } → ${toSide.country ?? toSide.currency}`,
              },
            ]
          : undefined;
      setChat((c) => [...c, { role: "assistant", content: displayText, actions }]);
    },
    onError: () => {
      const locale = resolveWizardLocale(lang);
      const content =
        locale === "es"
          ? "Uy, tardó demasiado en responder. Probá de nuevo en un momento."
          : locale === "pt"
            ? "Ops, demorou demais para responder. Tente novamente em instantes."
            : "Sorry, that took too long to answer. Please try again in a moment.";
      setChat((c) => [...c, { role: "assistant", content }]);
    },
  });

  // React to filter changes in the table: append a short assistant note.
  const lastSortRef = useRef<SortKey>("received");
  useEffect(() => {
    if (!result) return;
    if (lastSortRef.current === sortBy) return;
    lastSortRef.current = sortBy;
    const msg = proactiveMessage(result, sortBy);
    if (!msg) return;
    const label =
      sortBy === "received"
        ? t("comparator.copilot.filter.received")
        : sortBy === "fee"
          ? t("comparator.copilot.filter.fee")
          : t("comparator.copilot.filter.speed");
    const intro = t("comparator.copilot.filterReact").replace("{filter}", label);
    setChat((c) => [...c, { ...msg, content: `${intro}\n\n${msg.content}` }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, result]);

  // Keep form state shareable, but only compare after the explicit CTA.
  // Debounced 300ms so rapid input changes (e.g. typing the amount) don't
  // hammer the router or trigger redundant state resets.
  useEffect(() => {
    setValidationError(null);
    if (amount <= 0 || !sendingCountry || !receivingCountry || from === to) {
      skipNextSyncClearRef.current = false; // don't let a stale skip leak
      return;
    }
    const handle = setTimeout(() => {
      // After a suggested/corridor-changing compare we keep the just-set results
      // and only sync the URL; otherwise a manual input edit clears stale results.
      if (skipNextSyncClearRef.current) {
        skipNextSyncClearRef.current = false;
      } else {
        setResult(null);
        setAiText("");
        setChat([]);
      }
      void navigate({
        search: {
          origin: sendingCountry,
          destination: receivingCountry,
          segment,
          from,
          to,
          amount,
          lang,
        },
        replace: true,
        resetScroll: false,
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, from, to, segment, sendingCountry, receivingCountry]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, chatMut.isPending]);

  // Persist chat + unread to survive remounts/navigation without flicker.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        AGENT_STORAGE_KEY,
        JSON.stringify({ chat, unread: unreadCount }),
      );
    } catch {
      /* ignore quota */
    }
  }, [chat, unreadCount]);

  // Toggle handler: clears unread when the agent is opened.
  const handleAgentToggle = (nextCollapsed: boolean) => {
    setAiCollapsed(nextCollapsed);
    if (!nextCollapsed) setUnreadCount(0);
  };


  const openPreferredRate = (slug: string, url: string, name?: string) => {
    trackFn({
      data: {
        provider_slug: slug,
        amount,
        from_currency: from,
        to_currency: to,
        segment,
        referrer: typeof window !== "undefined" ? window.location.href : undefined,
      },
    }).catch(() => {});
    track("provider_click", {
      provider_slug: slug,
      amount,
      from_currency: from,
      to_currency: to,
      segment,
      urgency,
      source: "home_results",
    });
    void name;
    if (typeof window !== "undefined" && url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const sendChat = async (msg: string) => {
    const trimmed = msg.trim();
    if (!trimmed || chatMut.isPending) return;
    setChatInput("");
    if (segment === "business" && businessStage !== "done") {
      setChat((current) => [...current, { role: "user", content: trimmed }]);
      if (businessStage === "volume") {
        const volumeMatch = trimmed.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
        const monthlyVolume = volumeMatch ? Number(volumeMatch[0]) : 0;
        const sector = trimmed
          .replace(volumeMatch?.[0] ?? "", "")
          .replace(/^[\s,:;-]+|[\s,:;-]+$/g, "");
        if (!monthlyVolume || sector.length < 2) {
          setChat((current) => [
            ...current,
            { role: "assistant", content: t("comparator.copilot.business.volumeError") },
          ]);
          return;
        }
        setBusinessData({ monthlyVolume, sector });
        setBusinessStage("email");
        setChat((current) => [
          ...current,
          {
            role: "assistant",
            content: t("comparator.copilot.business.email").replace(
              "{providers}",
              result?.rows
                .slice(0, 2)
                .map((row) => row.name)
                .join(" y ") ?? "—",
            ),
          },
        ]);
        return;
      }
      if (businessStage === "email") {
        const email = trimmed.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
        if (!email) {
          setChat((current) => [
            ...current,
            { role: "assistant", content: t("comparator.copilot.business.emailError") },
          ]);
          return;
        }
        setBusinessData((current) => ({ ...current, email }));
        setBusinessStage("consent");
        setChat((current) => [
          ...current,
          { role: "assistant", content: t("comparator.copilot.business.consent") },
        ]);
        return;
      }
      return;
    }
    chatMut.mutate(trimmed);
  };

  const confirmBusinessLead = async () => {
    if (
      !businessData.email ||
      !businessData.monthlyVolume ||
      !businessData.sector ||
      savingBusinessLead
    )
      return;
    setSavingBusinessLead(true);
    try {
      await captureBusinessFn({
        data: {
          email: businessData.email,
          monthlyVolume: businessData.monthlyVolume,
          sector: businessData.sector,
          fromCurrency: from,
          toCurrency: to,
          sendingCountry,
          receivingCountry,
          locale: lang,
          consent: true,
          topProviders: result?.rows.slice(0, 2).map((row) => row.name) ?? [],
        },
      });
      setBusinessStage("done");
      setChat((current) => [
        ...current,
        { role: "user", content: t("comparator.copilot.business.yes") },
        { role: "assistant", content: t("comparator.copilot.business.success") },
      ]);
      track("conversion_completed", {
        amount: businessData.monthlyVolume,
        from_currency: from,
        to_currency: to,
        segment,
        source: "business_chat",
      });
    } catch {
      setChat((current) => [
        ...current,
        { role: "assistant", content: t("comparator.copilot.business.saveError") },
      ]);
    } finally {
      setSavingBusinessLead(false);
    }
  };

  return (
    <section id="comparator" key={lang} className="min-h-screen bg-background py-8 pb-32 sm:py-12 sm:pb-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t("search.new")}
        </Link>
        {/* Transfer details step */}
        <div className="mb-6 text-center sm:mb-8">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("comparator.transferDetails")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            {t("comparator.transferDetails.subtitle")}
          </p>
        </div>

        {/* Decision engine — full width. AI Agent is a floating widget (see below). */}
        <div className="min-w-0">
          {/* Decision card */}
          <div className="surface-card overflow-hidden min-w-0">

          {/* Card header: brand + segment toggle */}
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkle className="h-3.5 w-3.5 shrink-0 text-foreground" />
              <span className="truncate">{t("brand.decisionEngine")}</span>
            </div>
            <div
              role="tablist"
              aria-label="Segment"
              className="flex h-8 shrink-0 items-center gap-0.5 rounded-md border border-border bg-muted p-0.5"
            >
              {(["retail", "business"] as Segment[]).map((s) => (
                <button
                  key={s}
                  role="tab"
                  aria-selected={segment === s}
                  onClick={() => setSegment(s)}
                  className={`rounded-sm px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                    segment === s
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(`comparator.segment.${s}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Form body */}
          <div className="space-y-4 p-4 sm:p-6">
            {sendingCountry === receivingCountry && (
              <div className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
                {t("search.sameCountry")}
              </div>
            )}
            {/* Row 1 — Source Country | Target Country | Urgency */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FieldLight label={t("comparator.field.sourceCountry")}>
                <CountrySelect
                  value={sendingCountry}
                  onChange={setSendingCountry}
                  placeholder={t("comparator.combobox.placeholder")}
                  searchPlaceholder={t("comparator.combobox.search")}
                  emptyLabel={t("comparator.combobox.empty")}
                  ariaLabel={t("comparator.field.sourceCountry")}
                />
              </FieldLight>
              <FieldLight label={t("comparator.field.targetCountry")}>
                <CountrySelect
                  value={receivingCountry}
                  onChange={setReceivingCountry}
                  placeholder={t("comparator.combobox.placeholder")}
                  searchPlaceholder={t("comparator.combobox.search")}
                  emptyLabel={t("comparator.combobox.empty")}
                  ariaLabel={t("comparator.field.targetCountry")}
                />
              </FieldLight>
              <FieldLight label={t("comparator.field.urgency")}>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as Urgency)}
                  className="flex h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="urgent">{t("fx.urgency.urgent")}</option>
                  <option value="standard">{t("fx.urgency.standard")}</option>
                  <option value="flexible">{t("fx.urgency.flexible")}</option>
                </select>
              </FieldLight>
            </div>

            {/* Row 2 — Amount mode | Amount | Source Currency | Target Currency */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <FieldLight label={t("comparator.field.amountMode")}>
                <div className="flex h-11 rounded-md border border-input bg-muted p-1">
                  {(["send", "receive"] as AmountMode[]).map((mode) => (
                    <Button
                      key={mode}
                      type="button"
                      size="sm"
                      variant={amountMode === mode ? "default" : "ghost"}
                      onClick={() => setAmountMode(mode)}
                      className="h-8 flex-1"
                    >
                      {t(`comparator.amountMode.${mode}`)}
                    </Button>
                  ))}
                </div>
              </FieldLight>
              <FieldLight
                label={
                  amountMode === "send"
                    ? t("comparator.field.amountSent")
                    : t("comparator.field.amountReceived")
                }
              >
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  value={amount || ""}
                  placeholder="1000"
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="flex h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm tabular-nums text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </FieldLight>
              <FieldLight label={t("comparator.field.sourceCurrency")}>
                <CurrencyCombobox
                  value={from}
                  onChange={setFrom}
                  placeholder={t("comparator.combobox.placeholder")}
                  searchPlaceholder={t("comparator.combobox.search")}
                  emptyLabel={t("comparator.combobox.empty")}
                  ariaLabel={t("comparator.field.sourceCurrency")}
                />
              </FieldLight>
              <FieldLight label={t("comparator.field.targetCurrency")}>
                <CurrencyCombobox
                  value={to}
                  onChange={setTo}
                  placeholder={t("comparator.combobox.placeholder")}
                  searchPlaceholder={t("comparator.combobox.search")}
                  emptyLabel={t("comparator.combobox.empty")}
                  ariaLabel={t("comparator.field.targetCurrency")}
                />
              </FieldLight>
            </div>

            {/* CTA — full width */}
            <div className="pt-1">
              <Button
                onClick={() => {
                  if (!sendingCountry || !receivingCountry || amount <= 0) {
                    setValidationError(t("fx.validation"));
                    return;
                  }
                  setValidationError(null);
                  compareMut.mutate(undefined);
                }}
                disabled={compareMut.isPending}
                className="btn-cta h-11 w-full rounded-md px-6 text-sm font-semibold"
              >
                {compareMut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="truncate">…</span>
                  </>
                ) : (
                  <>
                    <span className="truncate">{t("comparator.cta.compareRates")}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </>
                )}
              </Button>
              {validationError && (
                <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {validationError}
                </div>
              )}
            </div>
          </div>
          </div>

        </div>

        {/* Floating AI Agent — fixed bottom-right, minimized by default.
            Chat state (history, result context) is preserved across collapse/expand
            because we only toggle visibility, not unmount. */}
        <FloatingAgent
          collapsed={aiCollapsed}
          onToggle={handleAgentToggle}
          unreadCount={unreadCount}

          lang={lang}
          t={t}
          aiLoading={aiLoading}
          chat={chat}
          result={result}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendChat={sendChat}
          chatMutPending={chatMut.isPending}
          comparePending={compareMut.isPending}
          onSuggestedCompare={runSuggestedCompare}
          chatBottomRef={chatBottomRef}
          openPreferredRate={openPreferredRate}
          segment={segment}
          businessStage={businessStage}
          savingBusinessLead={savingBusinessLead}
          confirmBusinessLead={confirmBusinessLead}
          setBusinessStage={setBusinessStage}
          setChat={setChat}
          onWizardAction={handleWizardAction}
          wizardContext={buildWizardContext(masterMap, missingLog)}
        />

        {/* Missing corridor — crowdsourced discovery CTA. */}
        {missingCorridor && (
          <div className="mt-6">
            <MissingCorridorCta
              from={missingCorridor.from}
              to={missingCorridor.to}
              acknowledged={Boolean(
                missingLog.find(
                  (m) =>
                    m.from === missingCorridor.from &&
                    m.to === missingCorridor.to &&
                    m.acknowledged,
                ),
              )}
              onRequest={() => void requestMissingRoute(missingCorridor.from, missingCorridor.to)}
            />
          </div>
        )}

        {/* Errors (non-missing-corridor) */}
        {compareMut.isError && !missingCorridor && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {(compareMut.error as Error)?.message ?? "Couldn't load rates."}
          </div>
        )}

        {/* Results table — full width below the decision/AI grid */}
        {result && (
          <div className="mt-6 min-w-0">
            <ResultsBlock
              result={result}
              amount={amount}
              sortBy={sortBy}
              onSortChange={setSortBy}
              handleAffiliateClick={openPreferredRate}
              tDisclaimer={t("fx.disclaimer")}
              tTrademarks={t("fx.trademarks")}
              tRatesSource={t("fx.ratesSource")}
              tAt={t("fx.at")}
              tRecipient={t("fx.recipient")}
              tAmountSent={t("comparator.table.amountSent")}
              tTotalFee={t("fx.totalFee")}
              tSpeed={t("fx.speed")}
              tCta={t("retail.cta")}
              tMidmarket={t("fx.midmarket")}
              tUpdated={t("fx.updated")}
              tProvider={t("cmp.provider")}
              tLastUpdate={t("comparator.lastUpdate")}
              tSavingsLabel={t("comparator.savings.label")}
              tSavingsBaseline={t("comparator.savings.baseline")}
              tNeutrality={t("comparator.disclaimer.neutrality")}
            />
          </div>
        )}
      </div>

      <PreferredRateModal open={modalOpen} onOpenChange={setModalOpen} context={modalCtx} />
    </section>
  );
}

function FieldLight({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </label>
  );
}

// ===== Floating AI Agent (a11y + keyboard) =====
interface FloatingAgentProps {
  collapsed: boolean;
  onToggle: (next: boolean) => void;
  unreadCount: number;
  lang: string;
  t: (k: string) => string;
  aiLoading: boolean;
  chat: ChatMsg[];
  result: ComparisonResult | null;
  chatInput: string;
  setChatInput: (v: string) => void;
  sendChat: (v: string) => void;
  chatMutPending: boolean;
  comparePending: boolean;
  onSuggestedCompare: (from: string, to: string, fromCountry?: string, toCountry?: string) => void;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
  openPreferredRate: (slug: string, url: string, name?: string) => void;
  segment: Segment;
  businessStage: BusinessStage;
  savingBusinessLead: boolean;
  confirmBusinessLead: () => void;
  setBusinessStage: (s: BusinessStage) => void;
  setChat: React.Dispatch<React.SetStateAction<ChatMsg[]>>;
  onWizardAction: (action: WizardAction) => void;
  wizardContext: string;
}

function FloatingAgent(p: FloatingAgentProps) {
  const {
    collapsed,
    onToggle,
    unreadCount,
    lang,
    t,
    aiLoading,
    chat,
    result,
    chatInput,
    setChatInput,
    sendChat,
    chatMutPending,
    comparePending,
    onSuggestedCompare,
    chatBottomRef,
    openPreferredRate,
    segment,
    businessStage,
    savingBusinessLead,
    confirmBusinessLead,
    setBusinessStage,
    setChat,
    onWizardAction,
    wizardContext,
  } = p;
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelLabelId = "ai-agent-title";

  // Escape closes; auto-focus composer on open.
  useEffect(() => {
    if (collapsed) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggle(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed, onToggle]);

  return (
    <div className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6">
      {collapsed ? (
        <button
          ref={toggleBtnRef}
          type="button"
          onClick={() => onToggle(false)}
          aria-label={t("comparator.copilot.agent")}
          aria-expanded={false}
          aria-haspopup="dialog"
          aria-controls="ai-agent-panel"
          className="btn-cta group relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl ring-1 ring-foreground/10 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Sparkle className="h-6 w-6" aria-hidden />
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} unread messages`}
              className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white"
            >
              {unreadCount}
            </span>
          )}
        </button>
      ) : (
        <div
          id="ai-agent-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={panelLabelId}
          className="surface-card flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden shadow-2xl ring-1 ring-foreground/10"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
            <span
              id={panelLabelId}
              className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <Sparkle className="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden />
              <span className="truncate">{t("comparator.copilot.agent")}</span>
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600" aria-label={`Language ${lang.toUpperCase()}`}>
                ● {lang.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => onToggle(true)}
                aria-label="Minimize AI Agent"
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {aiLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {t("fx.analyzing")}
              </div>
            )}

            {chat.length === 0 && !aiLoading && (
              <>
                <div className="rounded-md border border-border bg-card p-3 text-sm leading-relaxed text-foreground">
                  <ReactMarkdown>{t("chat.welcome")}</ReactMarkdown>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Wizard — quick actions
                </div>
                <AiCopilot onAction={onWizardAction} disabled={chatMutPending || aiLoading} />
                {wizardContext && (
                  <div className="rounded-md border border-dashed border-border bg-muted/30 px-2 py-1.5 text-[10px] leading-relaxed text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider text-foreground/70">
                      Context:
                    </span>{" "}
                    {wizardContext}
                  </div>
                )}
              </>
            )}


            {chat.length > 0 && (
              <div className="space-y-2">
                {chat.map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-md px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "ml-6 bg-foreground text-background"
                        : "mr-6 border border-border bg-card text-foreground"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-strong:text-foreground">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.actions.map((a, j) =>
                          a.kind === "proceed" ? (
                            <button
                              key={j}
                              onClick={() => openPreferredRate(a.slug, a.url)}
                              className="btn-cta inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <Zap className="h-3 w-3" aria-hidden /> {a.label}
                            </button>
                          ) : (
                            <button
                              key={j}
                              onClick={() => onSuggestedCompare(a.from, a.to, a.fromCountry, a.toCountry)}
                              disabled={comparePending}
                              className="btn-cta inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                            >
                              <Zap className="h-3 w-3" aria-hidden /> {a.label}
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {chatMutPending && (
                  <div className="mr-6 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />{" "}
                    {t("comparator.copilot.analyzing")}
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendChat(chatInput);
              }}
              className="flex items-center gap-2"
            >
              <label htmlFor="ai-agent-composer" className="sr-only">
                {t("comparator.copilot.placeholder")}
              </label>
              <input
                id="ai-agent-composer"
                ref={inputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t("comparator.copilot.placeholder")}
                aria-label={t("comparator.copilot.placeholder")}
                className="flex h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                disabled={chatMutPending || !result}
              />
              <button
                type="submit"
                disabled={chatMutPending || !chatInput.trim() || !result}
                className="btn-cta inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={t("comparator.copilot.send")}
              >
                <Send className="h-3.5 w-3.5" aria-hidden />
              </button>
            </form>
            {segment === "business" && businessStage === "consent" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={savingBusinessLead}
                  onClick={() => void confirmBusinessLead()}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {savingBusinessLead ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  {t("comparator.copilot.business.yes")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBusinessStage("email");
                    setChat((current) => [
                      ...current,
                      { role: "assistant", content: t("comparator.copilot.business.no") },
                    ]);
                  }}
                >
                  {t("comparator.copilot.business.review")}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Results table (light) =====
function ResultsBlock({
  result,
  amount,
  sortBy,
  onSortChange,
  handleAffiliateClick,
  tDisclaimer,
  tTrademarks,
  tRatesSource,
  tAt,
  tRecipient,
  tAmountSent,
  tTotalFee,
  tSpeed,
  tCta,
  tMidmarket,
  tUpdated,
  tProvider,
  tLastUpdate,
  tSavingsLabel,
  tSavingsBaseline,
  tNeutrality,
}: {
  result: ComparisonResult;
  amount: number;
  sortBy: SortKey;
  onSortChange: (k: SortKey) => void;
  handleAffiliateClick: (slug: string, url: string, name?: string) => void;
  tDisclaimer: string;
  tTrademarks: string;
  tRatesSource: string;
  tAt: string;
  tRecipient: string;
  tAmountSent: string;
  tTotalFee: string;
  tSpeed: string;
  tCta: string;
  tMidmarket: string;
  tUpdated: string;
  tProvider: string;
  tLastUpdate: string;
  tSavingsLabel: string;
  tSavingsBaseline: string;
  tNeutrality: string;
}) {
  const showLargeBanner = amount >= 50000;

  const organic = useMemo(() => {
    const base = [...result.rows];
    if (sortBy === "received") base.sort((a, b) => b.received - a.received);
    if (sortBy === "fee") base.sort((a, b) => a.fee_total - b.fee_total);
    if (sortBy === "speed")
      base.sort(
        (a, b) =>
          (a.delivery_minutes ?? a.speed_hours * 60) - (b.delivery_minutes ?? b.speed_hours * 60),
      );
    return base;
  }, [result.rows, sortBy]);

  // Savings = amount * (baseline_spread - best_provider_spread).
  // baseline_spread is the 3.5% retail/remittance market reference.
  const savings = useMemo(() => {
    if (!result.rows.length || amount <= 0) return null;
    const bestSpreadPct = Math.min(...result.rows.map((r) => Number(r.spread_applied) || 0));
    const bestSpread = bestSpreadPct / 100;
    const delta = MARKET_BASELINE_SPREAD - bestSpread;
    if (delta <= 0) return null;
    return { amountSaved: amount * delta };
  }, [result.rows, amount]);

  // Crisp HH:mm:ss for the trust line.
  const updatedTime = new Date(result.rates_updated_at).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="mt-6">
      {showLargeBanner && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 text-sm">
            <div className="truncate font-semibold text-foreground">
              Sending over {amount.toLocaleString()} {result.base}? Talk to our business desk.
            </div>
            <div className="mt-0.5 text-muted-foreground">
              For high-volume transfers, dedicated providers offer custom rates, treasury tooling
              and an account manager. →
            </div>
          </div>
        </div>
      )}

      {/* Live trust strip: last-update timestamp (HH:mm:ss) always visible.
          Shows a "Reference" badge when any rate came from MasterRateMap cache. */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[11px] text-foreground">
        <div className="inline-flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${result.is_reference ? "bg-amber-500" : "animate-ping bg-emerald-500"}`} />
            <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${result.is_reference ? "bg-amber-500" : "bg-emerald-500"}`} />
          </span>
          <span className={`font-semibold uppercase tracking-wider ${result.is_reference ? "text-amber-700" : "text-emerald-700"}`}>
            {result.is_reference ? "Reference" : tLastUpdate}:
          </span>
          <span className="tabular-nums">{updatedTime}</span>
          {result.is_reference && (
            <span
              className="ml-1 rounded-sm border border-amber-500/40 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800"
              title="One or more rates were served from the MasterRateMap cache (last known value), not a live upstream quote."
            >
              Cached
            </span>
          )}
        </div>
        <span className="truncate text-muted-foreground">
          1 {result.base} = {result.market_rate.toFixed(6)} {result.quote} · {tMidmarket}
        </span>
        {result.is_reference && (
          <p className="w-full text-[10px] leading-snug text-amber-800">
            Rates are last known/cached, not live.
          </p>
        )}
      </div>


      <div className="mb-4 grid gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 sm:grid-cols-3 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              {tSavingsLabel}
            </div>
            <div className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {savings
                ? savings.amountSaved.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : "—"}{" "}
              <span className="text-sm font-normal text-muted-foreground">{result.base}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">{tSavingsBaseline}</div>
          </div>
        </div>
        <div className="min-w-0 sm:border-l sm:border-emerald-500/20 sm:pl-5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {tMidmarket}
          </div>
          <div className="truncate text-sm tabular-nums text-foreground">
            1 {result.base} = {result.market_rate.toFixed(6)} {result.quote}
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            {tUpdated}{" "}
            {new Date(result.rates_updated_at).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </div>
        </div>
        <div className="min-w-0 sm:border-l sm:border-emerald-500/20 sm:pl-5">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <ArrowDownUp className="mr-1 inline h-3 w-3" /> Sort by
          </div>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["received", "Best rate"],
                ["fee", "Cheapest fees"],
                ["speed", "Fastest"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => onSortChange(k)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  sortBy === k
                    ? "bg-foreground text-background"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden grid-cols-[minmax(180px,2.2fr)_minmax(105px,1.15fr)_minmax(120px,1.25fr)_minmax(125px,1.35fr)_minmax(90px,1fr)_64px] gap-4 border-b border-border bg-muted/60 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:grid">
          <div className="min-w-0">{tProvider}</div>
          <div className="min-w-0 text-right">{tAmountSent}</div>
          <div className="min-w-0 text-right">{tTotalFee}</div>
          <div className="min-w-0 text-right">{tRecipient}</div>
          <div className="min-w-0 text-right">{tSpeed}</div>
          <div />
        </div>
        {organic.map((row, i) => (
          <ProviderRow
            key={row.slug}
            row={row}
            quote={result.quote}
            base={result.base}
            isBest={i === 0 && sortBy === "received"}
            onClick={() => handleAffiliateClick(row.slug, row.affiliate_url, row.name)}
            tCta={tCta}
          />
        ))}
        {organic.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No providers available for this corridor yet.
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card/50 px-4 py-3 text-[11px] text-muted-foreground">
        {tRatesSource}{" "}
        <span className="font-semibold text-foreground">
          {new Date(result.rates_updated_at).toLocaleDateString()} {tAt}{" "}
          <span className="tabular-nums">{updatedTime}</span>
        </span>
      </div>
      <p className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">⚖︎ </span>
        {tNeutrality}
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">{tDisclaimer}</p>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/80">{tTrademarks}</p>
    </div>
  );
}

function ProviderRow({
  row,
  quote,
  base,
  isBest,
  onClick,
  tCta,
}: {
  row: ComparisonResult["rows"][number];
  quote: string;
  base: string;
  isBest: boolean;
  onClick: () => void;
  tCta: string;
}) {
  const { t } = useI18n();
  const tooltipPreferred = t("comparator.tooltip.proceed");
  const deliveryLabel =
    row.delivery_minutes != null
      ? row.delivery_minutes < 60
        ? `${row.delivery_minutes}m`
        : row.delivery_minutes < 60 * 24
          ? `${Math.round(row.delivery_minutes / 60)}h`
          : `${Math.round(row.delivery_minutes / 60 / 24)}d`
      : row.speed_hours < 1
        ? "<1h"
        : row.speed_hours <= 24
          ? `${Math.round(row.speed_hours)}h`
          : `${Math.round(row.speed_hours / 24)}d`;

  const ratePct = row.rate_vs_market_pct;
  const ratePctLabel = `${ratePct >= 0 ? "+" : ""}${ratePct.toFixed(2)}% vs mid-market`;
  const ratePctClass =
    ratePct >= -0.25 ? "text-emerald-600" : ratePct >= -1 ? "text-amber-600" : "text-destructive";

  return (
    <div
      className={`grid grid-cols-1 gap-2 border-b border-border px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(180px,2.2fr)_minmax(105px,1.15fr)_minmax(120px,1.25fr)_minmax(125px,1.35fr)_minmax(90px,1fr)_64px] lg:items-center lg:gap-4 ${
        isBest ? "bg-primary/5" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <BrandLogo name={row.name} url={row.website_url ?? row.affiliate_url} size={36} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-semibold text-foreground">{row.name}</span>
            {isBest && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                {t("comparator.table.bestRate")}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
            {row.regulator && (
              <span className="inline-flex items-center gap-0.5">
                <Shield className="h-2.5 w-2.5" /> {row.regulator}
              </span>
            )}
            {row.review_count > 0 && row.trust_score != null && (
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-current" /> {row.trust_score.toFixed(1)} (
                {row.review_count.toLocaleString()})
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="min-w-0 text-sm tabular-nums text-foreground lg:text-right">
        <span className="text-[10px] uppercase text-muted-foreground lg:hidden">
          {t("comparator.table.amountSent")} ·{" "}
        </span>
        {row.amount_sent.toLocaleString(undefined, { maximumFractionDigits: 2 })} {base}
      </div>
      <div className="min-w-0 text-sm tabular-nums text-muted-foreground lg:text-right">
        <span className="text-[10px] uppercase lg:hidden">{t("fx.totalFee")} · </span>
        {row.fee_total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {base}
        <div className="text-[10px]">
          {row.fee_percent_applied > 0 && `${row.fee_percent_applied.toFixed(2)}%`}
          {row.fee_fixed_applied > 0 && ` + ${row.fee_fixed_applied} ${base}`}
          {row.spread_applied > 0 && ` · ${row.spread_applied.toFixed(2)}% spread`}
        </div>
      </div>
      <div className="min-w-0 lg:text-right">
        <div className="text-lg font-bold tabular-nums text-foreground">
          {row.received.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
          <span className="text-xs font-normal text-muted-foreground">{quote}</span>
        </div>
        <div className={`text-[11px] tabular-nums ${ratePctClass}`}>{ratePctLabel}</div>
      </div>
      <div className="min-w-0 text-sm text-muted-foreground lg:text-right">
        <div className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {deliveryLabel}
        </div>
        {row.trust_score != null && (
          <div className="text-[10px]">
            Trust {row.trust_score.toFixed(1)}/10
            {row.transparency_score != null && ` · Transp. ${row.transparency_score.toFixed(1)}`}
          </div>
        )}
      </div>
      <div className="lg:text-right">
        <button
          onClick={onClick}
          aria-label={`${tCta} — ${row.name}`}
          title={`${tCta} — ${row.name}`}
          className="btn-cta inline-flex h-10 w-full items-center justify-center rounded-md px-3 text-xs font-semibold leading-tight lg:h-9 lg:w-10 lg:px-0"
        >
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}
