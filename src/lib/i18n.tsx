import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "es" | "pt";

type Dict = Record<string, string>;

const DICTS: Record<Lang, Dict> = {
  en: {
    "nav.home": "Home",
    "nav.fx": "FX Tool",
    "nav.compare": "Compare",
    "nav.business": "Business",
    "nav.blog": "Blog",
    "nav.features": "Features",
    "nav.pricing": "Pricing",
    "nav.about": "About",
    "nav.contact": "Contact",
    "cta.getStarted": "Get Started",
    "cta.compare": "Compare providers",
    "cta.tryTool": "Try the FX Tool",
    "cta.talkSales": "Talk to Sales",
    "hero.badge": "Now live in 150+ countries",
    "hero.title.1": "The Global",
    "hero.title.2": "FX Decision",
    "hero.title.3": "Engine",
    "hero.subtitle":
      "Neutral AI that turns fragmented cross-border payments into one intelligent decision — from retail remittances to corporate treasury.",
    "hero.trust.1": "Mid-market rates",
    "hero.trust.2": "Independent comparison",
    "hero.trust.3": "AI-powered routing",
    "fx.title": "Compare every FX route.",
    "fx.titleAccent": "In one click.",
    "fx.subtitle":
      "Real mid-market rates against 30+ providers — retail and business. Mango's AI tells you which one actually wins for your case.",
    "fx.field.send": "You send",
    "fx.field.from": "From",
    "fx.field.to": "To",
    "fx.field.segment": "Segment",
    "fx.field.urgency": "Urgency",
    "fx.urgency.urgent": "Urgent (minutes)",
    "fx.urgency.standard": "Standard (today)",
    "fx.urgency.flexible": "Flexible (days)",
    "fx.recommends": "Mango recommends",
    "fx.analyzing": "Analyzing your case…",
    "fx.midmarket": "Mid-market rate",
    "fx.updated": "Updated",
    "fx.recipient": "Recipient gets",
    "fx.totalFee": "Total fee",
    "fx.speed": "Speed",
    "fx.action": "Action",
    "fx.goto": "Go to",
    "fx.disclaimer":
      "MangoGlobal is independent. Some links are affiliate links — we may earn a commission at no extra cost to you. Rates and fees are estimates; verify on the provider's site before sending.",
    "fx.chat.title": "Ask Mango about this recommendation",
    "fx.chat.placeholder": "Why this provider? What if I'm not in a rush?",
    "fx.chat.send": "Send",
    "fx.chat.thinking": "Thinking…",
    "fx.chat.cta1": "Why this provider?",
    "fx.chat.cta2": "Cheaper alternatives?",
    "fx.chat.cta3": "What about hidden fees?",
    "hero.mini.live": "Live comparison",
    "hero.mini.best": "Best rate",
    "hero.mini.cta": "Run a live comparison",
  },
  es: {
    "nav.home": "Inicio",
    "nav.fx": "Herramienta FX",
    "nav.compare": "Comparar",
    "nav.business": "Empresas",
    "nav.blog": "Blog",
    "nav.features": "Características",
    "nav.pricing": "Precios",
    "nav.about": "Nosotros",
    "nav.contact": "Contacto",
    "cta.getStarted": "Empezar",
    "cta.compare": "Comparar proveedores",
    "cta.tryTool": "Probar la Herramienta FX",
    "cta.talkSales": "Hablar con Ventas",
    "hero.badge": "Disponible en +150 países",
    "hero.title.1": "El Motor",
    "hero.title.2": "Global de Decisión",
    "hero.title.3": "Cambiaria",
    "hero.subtitle":
      "IA neutral que convierte los pagos transfronterizos fragmentados en una sola decisión inteligente — desde remesas retail hasta tesorería corporativa.",
    "hero.trust.1": "Tasas mid-market",
    "hero.trust.2": "Comparación independiente",
    "hero.trust.3": "Ruteo con IA",
    "fx.title": "Compará cada ruta FX.",
    "fx.titleAccent": "En un clic.",
    "fx.subtitle":
      "Tasas mid-market reales contra +30 proveedores — retail y negocios. La IA de Mango te dice cuál realmente conviene para tu caso.",
    "fx.field.send": "Enviás",
    "fx.field.from": "Desde",
    "fx.field.to": "A",
    "fx.field.segment": "Segmento",
    "fx.field.urgency": "Urgencia",
    "fx.urgency.urgent": "Urgente (minutos)",
    "fx.urgency.standard": "Estándar (hoy)",
    "fx.urgency.flexible": "Flexible (días)",
    "fx.recommends": "Mango recomienda",
    "fx.analyzing": "Analizando tu caso…",
    "fx.midmarket": "Tasa mid-market",
    "fx.updated": "Actualizado",
    "fx.recipient": "El destinatario recibe",
    "fx.totalFee": "Comisión total",
    "fx.speed": "Velocidad",
    "fx.action": "Acción",
    "fx.goto": "Ir a",
    "fx.disclaimer":
      "MangoGlobal es independiente. Algunos enlaces son de afiliados — podemos cobrar una comisión sin costo extra para vos. Las tasas y comisiones son estimadas; verificá en el sitio del proveedor antes de enviar.",
    "fx.chat.title": "Preguntale a Mango sobre esta recomendación",
    "fx.chat.placeholder": "¿Por qué este proveedor? ¿Y si no tengo apuro?",
    "fx.chat.send": "Enviar",
    "fx.chat.thinking": "Pensando…",
    "fx.chat.cta1": "¿Por qué este proveedor?",
    "fx.chat.cta2": "¿Alternativas más baratas?",
    "fx.chat.cta3": "¿Hay comisiones ocultas?",
    "hero.mini.live": "Comparación en vivo",
    "hero.mini.best": "Mejor tasa",
    "hero.mini.cta": "Hacer una comparación en vivo",
  },
  pt: {
    "nav.home": "Início",
    "nav.fx": "Ferramenta FX",
    "nav.compare": "Comparar",
    "nav.business": "Empresas",
    "nav.blog": "Blog",
    "nav.features": "Recursos",
    "nav.pricing": "Preços",
    "nav.about": "Sobre",
    "nav.contact": "Contato",
    "cta.getStarted": "Começar",
    "cta.compare": "Comparar provedores",
    "cta.tryTool": "Testar a Ferramenta FX",
    "cta.talkSales": "Falar com Vendas",
    "hero.badge": "Disponível em +150 países",
    "hero.title.1": "O Motor",
    "hero.title.2": "Global de Decisão",
    "hero.title.3": "Cambial",
    "hero.subtitle":
      "IA neutra que transforma pagamentos transfronteiriços fragmentados em uma única decisão inteligente — de remessas retail à tesouraria corporativa.",
    "hero.trust.1": "Taxas mid-market",
    "hero.trust.2": "Comparação independente",
    "hero.trust.3": "Roteamento com IA",
    "fx.title": "Compare cada rota de FX.",
    "fx.titleAccent": "Em um clique.",
    "fx.subtitle":
      "Taxas mid-market reais contra +30 provedores — retail e empresas. A IA da Mango diz qual realmente vale a pena para o seu caso.",
    "fx.field.send": "Você envia",
    "fx.field.from": "De",
    "fx.field.to": "Para",
    "fx.field.segment": "Segmento",
    "fx.field.urgency": "Urgência",
    "fx.urgency.urgent": "Urgente (minutos)",
    "fx.urgency.standard": "Padrão (hoje)",
    "fx.urgency.flexible": "Flexível (dias)",
    "fx.recommends": "Mango recomenda",
    "fx.analyzing": "Analisando seu caso…",
    "fx.midmarket": "Taxa mid-market",
    "fx.updated": "Atualizado",
    "fx.recipient": "O destinatário recebe",
    "fx.totalFee": "Taxa total",
    "fx.speed": "Velocidade",
    "fx.action": "Ação",
    "fx.goto": "Ir para",
    "fx.disclaimer":
      "MangoGlobal é independente. Alguns links são de afiliados — podemos receber comissão sem custo extra para você. Taxas são estimativas; verifique no site do provedor antes de enviar.",
    "fx.chat.title": "Pergunte à Mango sobre esta recomendação",
    "fx.chat.placeholder": "Por que este provedor? E se eu não tiver pressa?",
    "fx.chat.send": "Enviar",
    "fx.chat.thinking": "Pensando…",
    "fx.chat.cta1": "Por que este provedor?",
    "fx.chat.cta2": "Alternativas mais baratas?",
    "fx.chat.cta3": "Há taxas ocultas?",
  },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("mango-lang") as Lang | null;
    if (saved && DICTS[saved]) {
      setLangState(saved);
    } else {
      const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
      if (nav === "es" || nav === "pt") setLangState(nav as Lang);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("mango-lang", l);
  };

  const value = useMemo<I18nCtx>(
    () => ({
      lang,
      setLang,
      t: (key) => DICTS[lang][key] ?? DICTS.en[key] ?? key,
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
