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
      "mangoglobal is independent. Some links are affiliate links — we may earn a commission at no extra cost to you. Rates and fees are estimates; verify on the provider's site before sending.",
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
    "hero.alerts.title": "Smart rate alerts",
    "hero.alerts.success": "Alert active. We'll email you when the rate moves in your favour.",
    "hero.alerts.placeholder": "Your email (GBP → ARS)",
    "hero.alerts.button": "Alert me",
    "hero.alerts.saving": "Saving…",
    // Preferred Rate (Retail)
    "retail.cta": "Apply mangoglobal Preferred Channel Rate",
    "retail.modalTitle": "Activate the preferred rate channel",
    "retail.modalDesc": "Freeze the optimised institutional spread routed via our authorised affiliates.",
    "retail.disclaimer": "The public rates shown are estimates for informational purposes. By activating the mangoglobal preferred channel you are requesting an optimised institutional spread routed through our authorised affiliate identifiers.",
    "retail.emailPlaceholder": "your.email@domain.com",
    "retail.consent": "I confirm I am 18 or older and accept the mangoglobal Terms of Service and Privacy Policy.",
    "retail.submit": "Freeze preferred rate",
    "retail.success": "Preferred rate frozen. Opening your secure provider link…",
    // RFQ (Business)
    "rfq.title": "Compliance Notice — Direct Quotation Desk (RFQ)",
    "rfq.notice": "Due to wholesale interbank volatility, volumes equal to or above 10,000 USD (or equivalent) require a non-public Direct Quotation Request (RFQ). Initiating private bidding protocol with the authorised money desks in",
    "rfq.email": "Corporate email",
    "rfq.consent": "I accept the Corporate Terms of Service, Privacy Policy and confirm legal capacity to represent the commercial entity.",
    "rfq.submit": "Initiate RFQ protocol",
    "rfq.success": "RFQ protocol successfully initiated. Binding quotes will be sent to your corporate email within 2 hours.",
    "rfq.fieldFrom": "Source currency",
    "rfq.fieldTo": "Destination currency",
    "rfq.fieldAmount": "Notional amount",
    "rfq.fieldOrigin": "Sending country",
    "rfq.fieldDest": "Receiving country",
    "common.cancel": "Cancel",
    "common.email": "Email",
    "common.required": "Required",
    "chat.welcome": "Hi 👋 I'm the **mangoglobal** FX copilot. Try a quote (`500 GBP to ARS`) or describe your corporate case.",
    "chat.placeholder": "e.g. 500 GBP to ARS · or describe your corporate case",
    "chat.error": "I couldn't process that right now. Please try again.",
    "fx.emptyState": "Enter the details to calculate the best rates.",
    "fx.validation": "Please fill in sending country, receiving country and amount.",
    "fx.ratesSource": "Values fetched directly from the wholesale interbank market. Last update:",
    "fx.at": "at",
    "fx.trademarks": "All third-party trademarks, logos, and provider names (including Wise, Airwallex, OFX, Convera, and Currencies Direct) are the property of their respective owners. Their appearance on this platform is strictly for informational, comparative, and market reference purposes, and does not imply any affiliation, sponsorship, or commercial endorsement by said owners with mangoglobal.",
    "biz.rfqCta": "Open the RFQ desk",
    "biz.rfqRoute": "Get routed to the right desk for your corridor",
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
      "mangoglobal es independiente. Algunos enlaces son de afiliados — podemos cobrar una comisión sin costo extra para vos. Las tasas y comisiones son estimadas; verificá en el sitio del proveedor antes de enviar.",
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
    "hero.alerts.title": "Alertas inteligentes de tasa",
    "hero.alerts.success": "¡Alerta activada! Te avisaremos cuando suba el tipo de cambio.",
    "hero.alerts.placeholder": "Tu email (GBP → ARS)",
    "hero.alerts.button": "Alertarme",
    "hero.alerts.saving": "Guardando…",
    // Preferred Rate (Retail)
    "retail.cta": "Aplicar Tarifa Preferencial Canal mangoglobal",
    "retail.modalTitle": "Activá el canal de tarifa preferencial",
    "retail.modalDesc": "Congelá el spread institucional optimizado a través de nuestros afiliados autorizados.",
    "retail.disclaimer": "Las tarifas públicas mostradas son estimadas y de carácter informativo. Al activar el canal preferencial de mangoglobal, solicitás la aplicación de un spread optimizado institucional mediante nuestros identificadores de afiliación autorizados.",
    "retail.emailPlaceholder": "tu.email@dominio.com",
    "retail.consent": "Declaro que soy mayor de 18 años y acepto los Términos de Servicio y la Política de Privacidad de mangoglobal.",
    "retail.submit": "Congelar tarifa preferencial",
    "retail.success": "Tarifa preferencial congelada. Abriendo tu enlace seguro al proveedor…",
    // RFQ (Business)
    "rfq.title": "Aviso de Cumplimiento — Mesa de Cotización Directa (RFQ)",
    "rfq.notice": "Debido a la volatilidad del mercado mayorista interbancario, los volúmenes iguales o superiores a 10,000 USD (o equivalente) requieren de una Solicitud de Cotización Directa (RFQ) no pública. Iniciando protocolo de licitación privada con las mesas de dinero autorizadas en",
    "rfq.email": "Email institucional",
    "rfq.consent": "Acepto los Términos de Servicio Corporativos, Política de Privacidad y confirmo la capacidad legal para representar a la entidad comercial.",
    "rfq.submit": "Iniciar protocolo RFQ",
    "rfq.success": "Protocolo RFQ iniciado con éxito. Las cotizaciones vinculantes serán enviadas a tu correo institucional en menos de 2 horas.",
    "rfq.fieldFrom": "Moneda origen",
    "rfq.fieldTo": "Moneda destino",
    "rfq.fieldAmount": "Monto nocional",
    "rfq.fieldOrigin": "País de origen",
    "rfq.fieldDest": "País de destino",
    "common.cancel": "Cancelar",
    "common.email": "Email",
    "common.required": "Requerido",
    "chat.welcome": "Hola 👋 Soy el copiloto FX de **mangoglobal**. Probá una cotización (`500 GBP to ARS`) o contame el caso de tu empresa.",
    "chat.placeholder": "Ej: 500 GBP to ARS · o describí tu caso corporativo",
    "chat.error": "No pude procesar eso ahora. Probá de nuevo.",
    "fx.emptyState": "Introducí los datos para calcular las mejores tasas.",
    "fx.validation": "Por favor, completá país de origen, país de destino y monto.",
    "fx.ratesSource": "Valores obtenidos directamente del mercado interbancario mayorista. Última actualización:",
    "fx.at": "a las",
    "fx.trademarks": "Todas las marcas comerciales, logotipos y nombres de proveedores de terceros (incluidos Wise, Airwallex, OFX, Convera y Currencies Direct) son propiedad de sus respectivos titulares. Su aparición en esta plataforma se realiza exclusivamente con fines informativos, comparativos y de referencia de mercado, y no implica afiliación, patrocinio o endoso comercial alguno por parte de dichos titulares con mangoglobal.",
    "biz.rfqCta": "Abrir mesa RFQ",
    "biz.rfqRoute": "Acceder a la mesa adecuada para tu corredor",
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
      "mangoglobal é independente. Alguns links são de afiliados — podemos receber comissão sem custo extra para você. Taxas são estimativas; verifique no site do provedor antes de enviar.",
    "fx.chat.title": "Pergunte à Mango sobre esta recomendação",
    "fx.chat.placeholder": "Por que este provedor? E se eu não tiver pressa?",
    "fx.chat.send": "Enviar",
    "fx.chat.thinking": "Pensando…",
    "fx.chat.cta1": "Por que este provedor?",
    "fx.chat.cta2": "Alternativas mais baratas?",
    "fx.chat.cta3": "Há taxas ocultas?",
    "hero.mini.live": "Comparação ao vivo",
    "hero.mini.best": "Melhor taxa",
    "hero.mini.cta": "Fazer uma comparação ao vivo",
    "hero.alerts.title": "Alertas inteligentes de taxa",
    "hero.alerts.success": "Alerta ativado! Avisaremos quando a taxa subir.",
    "hero.alerts.placeholder": "Seu email (GBP → ARS)",
    "hero.alerts.button": "Avisar-me",
    "hero.alerts.saving": "Salvando…",
    // Preferred Rate (Retail)
    "retail.cta": "Aplicar Tarifa Preferencial Canal mangoglobal",
    "retail.modalTitle": "Ative o canal de tarifa preferencial",
    "retail.modalDesc": "Congele o spread institucional otimizado roteado pelos nossos afiliados autorizados.",
    "retail.disclaimer": "As taxas públicas exibidas são estimativas e de caráter informativo. Ao ativar o canal preferencial mangoglobal, você solicita a aplicação de um spread institucional otimizado por meio dos nossos identificadores de afiliação autorizados.",
    "retail.emailPlaceholder": "seu.email@dominio.com",
    "retail.consent": "Declaro que sou maior de 18 anos e aceito os Termos de Serviço e a Política de Privacidade da mangoglobal.",
    "retail.submit": "Congelar tarifa preferencial",
    "retail.success": "Tarifa preferencial congelada. Abrindo seu link seguro do provedor…",
    // RFQ (Business)
    "rfq.title": "Aviso de Compliance — Mesa de Cotação Direta (RFQ)",
    "rfq.notice": "Devido à volatilidade do mercado atacadista interbancário, volumes iguais ou superiores a 10.000 USD (ou equivalente) exigem uma Solicitação de Cotação Direta (RFQ) não pública. Iniciando protocolo de licitação privada com as mesas autorizadas em",
    "rfq.email": "Email institucional",
    "rfq.consent": "Aceito os Termos de Serviço Corporativos, Política de Privacidade e confirmo a capacidade legal para representar a entidade comercial.",
    "rfq.submit": "Iniciar protocolo RFQ",
    "rfq.success": "Protocolo RFQ iniciado com sucesso. As cotações vinculantes serão enviadas ao seu email institucional em até 2 horas.",
    "rfq.fieldFrom": "Moeda de origem",
    "rfq.fieldTo": "Moeda de destino",
    "rfq.fieldAmount": "Valor nocional",
    "rfq.fieldOrigin": "País de origem",
    "rfq.fieldDest": "País de destino",
    "common.cancel": "Cancelar",
    "common.email": "Email",
    "common.required": "Obrigatório",
    "chat.welcome": "Olá 👋 Sou o copiloto FX da **mangoglobal**. Teste uma cotação (`500 GBP to ARS`) ou descreva o caso da sua empresa.",
    "chat.placeholder": "Ex: 500 GBP to ARS · ou descreva seu caso corporativo",
    "chat.error": "Não consegui processar isso agora. Tente de novo.",
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
