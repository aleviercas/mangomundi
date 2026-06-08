import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { z } from "zod";

export type Lang =
  | "en" | "es" | "pt" | "it" | "fr" | "de" | "pl" | "uk"
  | "kk" | "hi" | "zh" | "id" | "tl" | "ar" | "vi" | "ja" | "ko";

export const SUPPORTED_LANGS: Lang[] = [
  "en", "es", "pt", "it", "fr", "de", "pl", "uk",
  "kk", "hi", "zh", "id", "tl", "ar", "vi", "ja", "ko",
];

export const RTL_LANGS: Lang[] = ["ar"];

// Kept for backwards compatibility — no longer used as a gating mechanism.
// The whole site now exposes all 16 supported languages.
export const CORPORATE_LANGS = SUPPORTED_LANGS;
export type CorporateLang = Lang;

// Strict sanitization schema for any language code touching the backend.
export const langCodeSchema = z.string().trim().max(10);

// Country (ISO-3166 alpha-2) → preferred language code for geo-IP detection.
export const COUNTRY_TO_LANG: Record<string, Lang> = {
  // English
  US: "en", GB: "en", IE: "en", AU: "en", NZ: "en", CA: "en", ZA: "en", SG: "en", NG: "en", KE: "en",
  // Spanish
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", UY: "es", VE: "es", EC: "es", BO: "es",
  PY: "es", CR: "es", PA: "es", DO: "es", GT: "es", HN: "es", SV: "es", NI: "es", CU: "es", PR: "es",
  // Portuguese
  PT: "pt", BR: "pt", AO: "pt", MZ: "pt", CV: "pt",
  // Italian
  IT: "it", SM: "it", VA: "it",
  // French
  FR: "fr", BE: "fr", LU: "fr", MC: "fr", SN: "fr", CI: "fr", CM: "fr", MA: "fr", DZ: "fr", TN: "fr",
  // German
  DE: "de", AT: "de", CH: "de", LI: "de",
  // Polish
  PL: "pl",
  // Ukrainian
  UA: "uk",
  // Kazakh
  KZ: "kk",
  // Hindi
  IN: "hi",
  // Chinese
  CN: "zh", HK: "zh", TW: "zh",
  // Indonesian
  ID: "id",
  // Tagalog
  PH: "tl",
  // Arabic
  SA: "ar", AE: "ar", EG: "ar", QA: "ar", KW: "ar", BH: "ar", OM: "ar", JO: "ar", LB: "ar", IQ: "ar",
  YE: "ar", LY: "ar", SY: "ar", PS: "ar",
  // Vietnamese
  VN: "vi",
  // Japanese
  JP: "ja",
  // Korean
  KR: "ko",
};

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
    // About
    "about.badge": "About mangoglobal",
    "about.heroTitle1": "Built for a",
    "about.heroTitleAccent": "Borderless",
    "about.heroTitle2": "World",
    "about.heroSubtitle": "mangoglobal is a neutral decision engine: we connect retail and corporate flows to the best available cross-border route, without provider bias or hidden margins.",
    "about.missionTitle": "Our Mission",
    "about.missionBody": "Democratise access to the best foreign exchange decisions through neutral, AI-powered intelligence — eliminating information asymmetry and hidden costs from global payments.",
    "about.visionTitle": "Our Vision",
    "about.visionBody": "A world where every cross-border payment — from a family remittance to a multinational treasury operation — runs through a transparent, auditable, and equitable decision layer.",
    "about.metric1.value": "2026",
    "about.metric1.label": "Founded",
    "about.metric2.value": "150+",
    "about.metric2.label": "Countries Covered",
    "about.metric2.note": "Geographic reach for corridor optimization",
    "about.metric3.value": "100+",
    "about.metric3.label": "Currencies Supported",
    "about.metric3.note": "Currencies integrated into the decision engine",
    "about.valuesTitle": "Our Principles",
    "about.v1.title": "Financial Freedom",
    "about.v1.body": "Break down traditional money borders so companies and individuals can operate globally without artificial friction.",
    "about.v2.title": "Inclusion & Free Access",
    "about.v2.body": "Democratize wholesale interbank rates and optimized spreads, pulverizing the information asymmetries of traditional banking.",
    "about.v3.title": "Human + AI Impartiality",
    "about.v3.body": "Our human team is always available to guide users through operational complexity, yet absolute algorithmic impartiality is what processes, distributes, and delivers the best optimized spreads to every party, equitably and without favoritism.",
    // Home
    "home.hero.title": "International Payments, Intelligently Routed.",
    "home.hero.subtitle": "Utilize our neutral decision engine to analyze cross-border flow variance, validate execution strategies, and optimize multi-currency routing.",
    "home.flows.title": "Built for every institutional cross-border flow",
    "home.flows.payroll.title": "Global payroll & contractor payouts",
    "home.flows.payroll.body": "Pay international teams and contractors in their local currency with optimised FX routing and full audit trail.",
    "home.flows.suppliers.title": "Supplier & invoice payments",
    "home.flows.suppliers.body": "Settle cross-border invoices on the best available route — reducing spread cost and reconciliation overhead.",
    "home.flows.treasury.title": "Treasury & FX hedging",
    "home.flows.treasury.body": "Manage currency exposure, execute large-ticket conversions and structure hedges through our RFQ desk.",
    "home.infra.title": "Institutional Infrastructure",
    "home.infra.routing.title": "Secure Routing Control",
    "home.infra.routing.body": "Advanced data reporting on FX exposure, realized cost savings, and routing performance — fully exportable.",
    "home.infra.desks.title": "Authorised Money Desks",
    "home.infra.desks.body": "Direct connection to major regulated treasury desks ensuring absolute market liquidity.",
    "home.infra.advisory.title": "Dedicated Advisory",
    "home.infra.advisory.body": "Tailored support with direct lines to our specialists to manage large-ticket compliance and execution.",
    "home.finalCta.title": "Optimise your corporate treasury layout today.",
    "home.finalCta.subtitle": "Access transparent, market-backed FX routing and custom asynchronous RFQ bidding protocols for your enterprise corridors.",
    "home.finalCta.rfq": "Access RFQ Terminal",
    "home.hero.ctaCompare": "Try FX Comparator",
    "home.dual.title": "Built for every cross-border flow — retail and corporate.",
    "home.dual.retail.title": "Retail Remittances & Private Wealth",
    "home.dual.retail.body": "Send money internationally, pay for global travel, or manage personal cross-border transfers. Access wholesale interbank rates with zero hidden markups, absolute transparency, and automated tracking.",
    "home.dual.corporate.title": "Corporate Treasury & Operations",
    "home.dual.corporate.body": "Manage multi-currency corporate exposure, execute bulk payments, and hedge currency risk utilizing our interactive RFQ Terminal and transparent data reporting.",
    "compare.calculating": "Calculating optimal paths…",
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
    // About
    "about.badge": "Sobre mangoglobal",
    "about.heroTitle1": "Construido para un mundo",
    "about.heroTitleAccent": "sin fronteras",
    "about.heroTitle2": "",
    "about.heroSubtitle": "mangoglobal es un motor de decisión neutral: conectamos flujos retail y corporativos con la mejor ruta transfronteriza disponible, sin sesgos de proveedor ni márgenes ocultos.",
    "about.missionTitle": "Nuestra Misión",
    "about.missionBody": "Democratizar el acceso a las mejores decisiones de cambio de divisas mediante inteligencia neutral basada en IA, eliminando la asimetría de información y los costos ocultos de los pagos globales.",
    "about.visionTitle": "Nuestra Visión",
    "about.visionBody": "Un mundo donde cada pago transfronterizo —desde una remesa familiar hasta una operación de tesorería multinacional— pase por una capa de decisión transparente, auditable y equitativa.",
    "about.metric1.value": "2026",
    "about.metric1.label": "Fundación",
    "about.metric2.value": "150+",
    "about.metric2.label": "Países cubiertos",
    "about.metric2.note": "Alcance geográfico para optimización de corredores",
    "about.metric3.value": "100+",
    "about.metric3.label": "Monedas soportadas",
    "about.metric3.note": "Monedas integradas en el motor de decisión",
    "about.valuesTitle": "Nuestros Principios",
    "about.v1.title": "Libertad Financiera",
    "about.v1.body": "Derribar las fronteras tradicionales del dinero para que empresas e individuos operen globalmente sin fricciones artificiales.",
    "about.v2.title": "Inclusión y Acceso Libre",
    "about.v2.body": "Democratizar las tasas mayoristas interbancarias y los spreads optimizados, pulverizando las asimetrías de información de la banca tradicional.",
    "about.v3.title": "Imparcialidad Humana + IA",
    "about.v3.body": "Nuestro equipo humano está siempre disponible para acompañar a los usuarios en la complejidad operativa, pero la imparcialidad algorítmica absoluta es la que procesa, distribuye y entrega los mejores spreads optimizados a cada parte, de forma equitativa y sin favoritismos.",
    // Home
    "home.hero.title": "Pagos internacionales, ruteados con inteligencia.",
    "home.hero.subtitle": "Reducí el costo de FX en nómina, proveedores y tesorería. Aprovechá nuestro motor de decisión inteligente y un dashboard interactivo para transferencias de alto valor con soporte experto dedicado.",
    "home.flows.title": "Diseñado para cada flujo institucional transfronterizo",
    "home.flows.payroll.title": "Nómina global y pagos a contratistas",
    "home.flows.payroll.body": "Pagá a equipos internacionales y contratistas en su moneda local con ruteo FX optimizado y trazabilidad completa.",
    "home.flows.suppliers.title": "Pagos a proveedores y facturas",
    "home.flows.suppliers.body": "Liquidá facturas transfronterizas por la mejor ruta disponible — reduciendo spread y carga de conciliación.",
    "home.flows.treasury.title": "Tesorería y cobertura FX",
    "home.flows.treasury.body": "Gestioná la exposición cambiaria, ejecutá conversiones de alto ticket y estructurá coberturas vía nuestra mesa RFQ.",
    "home.infra.title": "Infraestructura Institucional",
    "home.infra.routing.title": "Control de Ruteo Seguro",
    "home.infra.routing.body": "Reportes avanzados sobre exposición FX, ahorros realizados y desempeño de ruteo — totalmente exportables.",
    "home.infra.desks.title": "Mesas de Dinero Autorizadas",
    "home.infra.desks.body": "Conexión directa con las principales mesas de tesorería reguladas, garantizando liquidez de mercado absoluta.",
    "home.infra.advisory.title": "Asesoría Dedicada",
    "home.infra.advisory.body": "Soporte a medida con líneas directas a nuestros especialistas para gestionar cumplimiento y ejecución de gran ticket.",
    "home.finalCta.title": "Optimizá hoy la arquitectura de tu tesorería corporativa.",
    "home.finalCta.subtitle": "Accedé a un ruteo FX transparente respaldado por el mercado y a protocolos personalizados de licitación RFQ asincrónica para tus corredores empresariales.",
    "home.finalCta.rfq": "Acceder a la Terminal RFQ",
    "home.hero.ctaCompare": "Probar Comparador FX",
    "home.dual.title": "Construido para cada flujo transfronterizo — retail y corporativo.",
    "home.dual.retail.title": "Remesas Retail y Patrimonio Privado",
    "home.dual.retail.body": "Enviá dinero internacionalmente, pagá viajes globales o gestioná transferencias personales. Accedé a tasas mayoristas interbancarias sin recargos ocultos, con transparencia absoluta y seguimiento automatizado.",
    "home.dual.corporate.title": "Tesorería Corporativa y Operaciones",
    "home.dual.corporate.body": "Gestioná exposición corporativa multidivisa, ejecutá pagos masivos y cubrí el riesgo cambiario con nuestra Terminal RFQ interactiva y reportes de datos transparentes.",
    "compare.calculating": "Calculando rutas óptimas…",
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
    "fx.emptyState": "Insira os dados para calcular as melhores taxas.",
    "fx.validation": "Por favor, preencha país de origem, país de destino e valor.",
    "fx.ratesSource": "Valores obtidos diretamente do mercado interbancário atacadista. Última atualização:",
    "fx.at": "às",
    "fx.trademarks": "Todas as marcas comerciais, logotipos e nomes de provedores terceiros (incluindo Wise, Airwallex, OFX, Convera e Currencies Direct) são de propriedade de seus respectivos titulares. Sua exibição nesta plataforma é feita exclusivamente para fins informativos, comparativos e de referência de mercado, não implicando qualquer afiliação, patrocínio ou endosso comercial por parte de tais titulares com a mangoglobal.",
    "biz.rfqCta": "Abrir mesa RFQ",
    "biz.rfqRoute": "Acessar a mesa adequada para o seu corredor",
    // About
    "about.badge": "Sobre a mangoglobal",
    "about.heroTitle1": "Construído para um mundo",
    "about.heroTitleAccent": "sem fronteiras",
    "about.heroTitle2": "",
    "about.heroSubtitle": "A mangoglobal é um motor de decisão neutro: conectamos fluxos retail e corporativos à melhor rota transfronteiriça disponível, sem viés de provedor nem margens ocultas.",
    "about.missionTitle": "Nossa Missão",
    "about.missionBody": "Democratizar o acesso às melhores decisões de câmbio através de inteligência neutra baseada em IA, eliminando a assimetria de informação e os custos ocultos dos pagamentos globais.",
    "about.visionTitle": "Nossa Visão",
    "about.visionBody": "Um mundo onde cada pagamento transfronteiriço — de uma remessa familiar a uma operação de tesouraria multinacional — passe por uma camada de decisão transparente, auditável e equitativa.",
    "about.metric1.value": "2026",
    "about.metric1.label": "Fundação",
    "about.metric2.value": "150+",
    "about.metric2.label": "Países cobertos",
    "about.metric2.note": "Alcance geográfico para otimização de corredores",
    "about.metric3.value": "100+",
    "about.metric3.label": "Moedas suportadas",
    "about.metric3.note": "Moedas integradas ao motor de decisão",
    "about.valuesTitle": "Nossos Princípios",
    "about.v1.title": "Liberdade Financeira",
    "about.v1.body": "Derrubar as fronteiras tradicionais do dinheiro para que empresas e indivíduos operem globalmente sem fricções artificiais.",
    "about.v2.title": "Inclusão e Acesso Livre",
    "about.v2.body": "Democratizar as taxas atacadistas interbancárias e os spreads otimizados, pulverizando as assimetrias de informação da banca tradicional.",
    "about.v3.title": "Imparcialidade Humana + IA",
    "about.v3.body": "Nossa equipe humana está sempre disponível para acompanhar os usuários na complexidade operativa, mas a imparcialidade algorítmica absoluta é o que processa, distribui e entrega os melhores spreads otimizados a cada parte, de forma equitativa e sem favoritismos.",
    // Home
    "home.hero.title": "Pagamentos internacionais, roteados com inteligência.",
    "home.hero.subtitle": "Reduza o custo de FX em folha, fornecedores e tesouraria. Use nosso motor de decisão inteligente e dashboard interativo para transferências de alto valor com suporte especializado dedicado.",
    "home.flows.title": "Construído para cada fluxo institucional transfronteiriço",
    "home.flows.payroll.title": "Folha global e pagamentos a prestadores",
    "home.flows.payroll.body": "Pague equipes internacionais e prestadores na moeda local com roteamento FX otimizado e trilha de auditoria completa.",
    "home.flows.suppliers.title": "Pagamentos a fornecedores e faturas",
    "home.flows.suppliers.body": "Liquide faturas transfronteiriças pela melhor rota disponível — reduzindo spread e esforço de conciliação.",
    "home.flows.treasury.title": "Tesouraria e hedge de FX",
    "home.flows.treasury.body": "Gerencie exposição cambial, execute conversões de alto valor e estruture hedges através de nossa mesa RFQ.",
    "home.infra.title": "Infraestrutura Institucional",
    "home.infra.routing.title": "Controle de Roteamento Seguro",
    "home.infra.routing.body": "Relatórios avançados sobre exposição FX, economia realizada e desempenho de roteamento — totalmente exportáveis.",
    "home.infra.desks.title": "Mesas de Câmbio Autorizadas",
    "home.infra.desks.body": "Conexão direta com as principais mesas de tesouraria reguladas, garantindo liquidez de mercado absoluta.",
    "home.infra.advisory.title": "Consultoria Dedicada",
    "home.infra.advisory.body": "Suporte sob medida com linhas diretas com nossos especialistas para gerenciar compliance e execução de grande porte.",
    "home.finalCta.title": "Otimize hoje a arquitetura da sua tesouraria corporativa.",
    "home.finalCta.subtitle": "Acesse roteamento FX transparente, respaldado pelo mercado, e protocolos personalizados de licitação RFQ assíncrona para seus corredores corporativos.",
    "home.finalCta.rfq": "Acessar Terminal RFQ",
    "home.hero.ctaCompare": "Testar Comparador FX",
    "home.dual.title": "Construído para cada fluxo transfronteiriço — retail e corporativo.",
    "home.dual.retail.title": "Remessas Retail e Patrimônio Privado",
    "home.dual.retail.body": "Envie dinheiro internacionalmente, pague viagens globais ou gerencie transferências pessoais. Acesse taxas atacadistas interbancárias sem markups ocultos, com transparência absoluta e rastreamento automatizado.",
    "home.dual.corporate.title": "Tesouraria Corporativa e Operações",
    "home.dual.corporate.body": "Gerencie exposição corporativa multimoeda, execute pagamentos em massa e proteja o risco cambial com nosso Terminal RFQ interativo e relatórios de dados transparentes.",
    "compare.calculating": "Calculando rotas ótimas…",
  },
  // Scaffolded locales — core navigation translated; remaining keys fall back to English until full translation phase.
  it: {
    "nav.home": "Home", "nav.compare": "Confronta", "nav.business": "Aziende",
    "nav.blog": "Blog", "nav.about": "Chi siamo", "nav.contact": "Contatti",
    "cta.talkSales": "Parla con le vendite", "home.hero.ctaCompare": "Prova il comparatore FX",
    "compare.calculating": "Calcolo dei percorsi ottimali…",
  },
  fr: {
    "nav.home": "Accueil", "nav.compare": "Comparer", "nav.business": "Entreprises",
    "nav.blog": "Blog", "nav.about": "À propos", "nav.contact": "Contact",
    "cta.talkSales": "Parler aux ventes", "home.hero.ctaCompare": "Essayer le comparateur FX",
    "compare.calculating": "Calcul des routes optimales…",
  },
  de: {
    "nav.home": "Startseite", "nav.compare": "Vergleichen", "nav.business": "Unternehmen",
    "nav.blog": "Blog", "nav.about": "Über uns", "nav.contact": "Kontakt",
    "cta.talkSales": "Vertrieb kontaktieren", "home.hero.ctaCompare": "FX-Vergleich testen",
    "compare.calculating": "Optimale Routen werden berechnet…",
  },
  pl: {
    "nav.home": "Główna", "nav.compare": "Porównaj", "nav.business": "Firmy",
    "nav.blog": "Blog", "nav.about": "O nas", "nav.contact": "Kontakt",
    "cta.talkSales": "Skontaktuj się ze sprzedażą", "home.hero.ctaCompare": "Wypróbuj porównywarkę FX",
    "compare.calculating": "Obliczanie optymalnych tras…",
  },
  uk: {
    "nav.home": "Головна", "nav.compare": "Порівняти", "nav.business": "Бізнес",
    "nav.blog": "Блог", "nav.about": "Про нас", "nav.contact": "Контакти",
    "cta.talkSales": "Зв'язатися з відділом продажів", "home.hero.ctaCompare": "Спробувати FX-компаратор",
    "compare.calculating": "Обчислення оптимальних маршрутів…",
  },
  kk: {
    "nav.home": "Басты бет", "nav.compare": "Салыстыру", "nav.business": "Бизнес",
    "nav.blog": "Блог", "nav.about": "Біз туралы", "nav.contact": "Байланыс",
    "cta.talkSales": "Сату бөлімімен сөйлесу", "home.hero.ctaCompare": "FX компараторын сынау",
    "compare.calculating": "Оңтайлы бағыттар есептелуде…",
  },
  hi: {
    "nav.home": "होम", "nav.compare": "तुलना करें", "nav.business": "व्यवसाय",
    "nav.blog": "ब्लॉग", "nav.about": "हमारे बारे में", "nav.contact": "संपर्क",
    "cta.talkSales": "बिक्री से बात करें", "home.hero.ctaCompare": "FX तुलनित्र आज़माएँ",
    "compare.calculating": "इष्टतम मार्ग गणना…",
  },
  zh: {
    "nav.home": "首页", "nav.compare": "比较", "nav.business": "企业",
    "nav.blog": "博客", "nav.about": "关于我们", "nav.contact": "联系我们",
    "cta.talkSales": "联系销售", "home.hero.ctaCompare": "试用外汇比较器",
    "compare.calculating": "正在计算最佳路径…",
  },
  id: {
    "nav.home": "Beranda", "nav.compare": "Bandingkan", "nav.business": "Bisnis",
    "nav.blog": "Blog", "nav.about": "Tentang", "nav.contact": "Kontak",
    "cta.talkSales": "Hubungi Sales", "home.hero.ctaCompare": "Coba Komparator FX",
    "compare.calculating": "Menghitung jalur optimal…",
  },
  tl: {
    "nav.home": "Tahanan", "nav.compare": "Ihambing", "nav.business": "Negosyo",
    "nav.blog": "Blog", "nav.about": "Tungkol", "nav.contact": "Kontak",
    "cta.talkSales": "Makipag-usap sa Sales", "home.hero.ctaCompare": "Subukan ang FX Comparator",
    "compare.calculating": "Kinakalkula ang pinakamainam na ruta…",
  },
  ar: {
    "nav.home": "الرئيسية", "nav.compare": "قارن", "nav.business": "الشركات",
    "nav.blog": "المدونة", "nav.about": "من نحن", "nav.contact": "اتصل بنا",
    "cta.talkSales": "تحدث مع المبيعات", "home.hero.ctaCompare": "جرّب مقارن العملات",
    "compare.calculating": "حساب أفضل المسارات…",
  },
  vi: {
    "nav.home": "Trang chủ", "nav.compare": "So sánh", "nav.business": "Doanh nghiệp",
    "nav.blog": "Blog", "nav.about": "Giới thiệu", "nav.contact": "Liên hệ",
    "cta.talkSales": "Liên hệ kinh doanh", "home.hero.ctaCompare": "Thử công cụ so sánh FX",
    "compare.calculating": "Đang tính toán lộ trình tối ưu…",
  },
};


// === Footer / Legal & Compliance localized keys (EN/ES/PT/IT/FR) ===
const COMPLIANCE_KEYS: Record<CorporateLang, Dict> = {
  en: {
    "footer.compliance": "Legal & Compliance",
    "footer.disclaimer":
      "mangoglobal is a neutral information and decision-engine platform. Our AI tooling does not constitute financial, tax, or investment advice. We do not custody client funds; all transfers settle directly with the regulated provider chosen by the user. Foreign-exchange rates fluctuate continuously and users bear the full FX, settlement, and counterparty risk of any transaction.",
    "legal.terms.title": "Terms of Service",
    "legal.terms.intro":
      "mangoglobal operates as a neutral information and decision-engine platform that aggregates publicly available FX rates and provider data. We do not hold client funds, do not execute transfers, and do not act as a money transmitter.",
    "legal.risk.title": "Risk Disclosure",
    "legal.risk.intro":
      "Foreign-exchange rates fluctuate continuously. The mid-market reference rate shown is indicative and may change between the time a comparison is generated and the time a provider executes the transfer. Users bear the full FX, settlement, and counterparty risk of any transaction.",
  },
  es: {
    "footer.compliance": "Legal & Cumplimiento",
    "footer.disclaimer":
      "mangoglobal es una plataforma neutral de información y motor de decisión. Nuestras herramientas de IA no constituyen asesoramiento financiero, fiscal ni de inversión. No custodiamos fondos de clientes; todas las transferencias se liquidan directamente con el proveedor regulado elegido por el usuario. Los tipos de cambio fluctúan continuamente y el usuario asume el riesgo cambiario, de liquidación y de contraparte.",
    "legal.terms.title": "Términos del Servicio",
    "legal.terms.intro":
      "mangoglobal opera como una plataforma neutral de información y motor de decisión que agrega tasas FX y datos de proveedores disponibles públicamente. No custodiamos fondos de clientes, no ejecutamos transferencias y no actuamos como transmisor de dinero.",
    "legal.risk.title": "Divulgación de Riesgos",
    "legal.risk.intro":
      "Los tipos de cambio fluctúan continuamente. La tasa mid-market mostrada es indicativa y puede variar entre el momento de la comparación y la ejecución por parte del proveedor. El usuario asume íntegramente el riesgo cambiario, de liquidación y de contraparte.",
  },
  pt: {
    "footer.compliance": "Legal & Compliance",
    "footer.disclaimer":
      "mangoglobal é uma plataforma neutra de informação e motor de decisão. Nossas ferramentas de IA não constituem aconselhamento financeiro, fiscal ou de investimento. Não custodiamos fundos de clientes; todas as transferências são liquidadas diretamente com o provedor regulado escolhido pelo usuário. As taxas de câmbio flutuam continuamente e o usuário assume o risco cambial, de liquidação e de contraparte.",
    "legal.terms.title": "Termos de Serviço",
    "legal.terms.intro":
      "mangoglobal opera como uma plataforma neutra de informação e motor de decisão que agrega taxas FX e dados de provedores publicamente disponíveis. Não custodiamos fundos, não executamos transferências e não atuamos como transmissor de dinheiro.",
    "legal.risk.title": "Divulgação de Risco",
    "legal.risk.intro":
      "As taxas de câmbio flutuam continuamente. A taxa mid-market exibida é indicativa e pode variar entre o momento da comparação e a execução pelo provedor. O usuário assume integralmente o risco cambial, de liquidação e de contraparte.",
  },
  it: {
    "footer.compliance": "Legal & Compliance",
    "footer.disclaimer":
      "mangoglobal è una piattaforma neutrale di informazione e motore decisionale. I nostri strumenti di IA non costituiscono consulenza finanziaria, fiscale o di investimento. Non deteniamo fondi dei clienti; tutti i trasferimenti vengono regolati direttamente con il fornitore regolamentato scelto dall'utente. I tassi di cambio fluttuano costantemente e l'utente assume integralmente il rischio cambio, di regolamento e di controparte.",
    "legal.terms.title": "Termini di Servizio",
    "legal.terms.intro":
      "mangoglobal opera come piattaforma neutrale di informazione e motore decisionale che aggrega tassi FX e dati di fornitori pubblicamente disponibili. Non deteniamo fondi, non eseguiamo trasferimenti e non agiamo come trasmettitore di denaro.",
    "legal.risk.title": "Informativa sul Rischio",
    "legal.risk.intro":
      "I tassi di cambio fluttuano costantemente. Il tasso mid-market mostrato è indicativo e può variare tra il momento della comparazione e l'esecuzione da parte del fornitore. L'utente assume integralmente il rischio cambio, di regolamento e di controparte.",
  },
  fr: {
    "footer.compliance": "Légal & Conformité",
    "footer.disclaimer":
      "mangoglobal est une plateforme neutre d'information et un moteur de décision. Nos outils d'IA ne constituent pas un conseil financier, fiscal ou en investissement. Nous ne détenons pas de fonds clients ; tous les transferts sont réglés directement avec le prestataire régulé choisi par l'utilisateur. Les taux de change fluctuent continuellement et l'utilisateur assume intégralement le risque de change, de règlement et de contrepartie.",
    "legal.terms.title": "Conditions d'utilisation",
    "legal.terms.intro":
      "mangoglobal opère comme une plateforme neutre d'information et un moteur de décision agrégeant les taux FX et données de prestataires publiquement disponibles. Nous ne détenons pas de fonds, n'exécutons pas de transferts et n'agissons pas comme transmetteur d'argent.",
    "legal.risk.title": "Information sur les Risques",
    "legal.risk.intro":
      "Les taux de change fluctuent continuellement. Le taux mid-market affiché est indicatif et peut varier entre la comparaison et l'exécution par le prestataire. L'utilisateur assume intégralement le risque de change, de règlement et de contrepartie.",
  },
};

// === Manifesto / Company story localized keys (EN/ES/PT/IT/FR) ===
const MANIFESTO_KEYS: Record<CorporateLang, Dict> = {
  en: {
    "about.manifesto.headline":
      "International Payments, Intelligently Routed. Agentic AI for Global FX. 🌐⚡",
    "about.manifesto.kicker": "// company manifesto",
    "about.manifesto.missionTitle": "$ Our Mission",
    "about.manifesto.missionText":
      "Democratise access to the best foreign exchange decisions through neutral, AI-powered intelligence — eliminating information asymmetry and hidden costs from global payments.",
    "about.manifesto.visionTitle": "$ Our Vision",
    "about.manifesto.visionText":
      "A world where every local FX or cross-border payment — from a family remittance to a multinational treasury operation — runs through a transparent, auditable, and equitable decision layer.",
    "about.manifesto.problemTitle": "$ The Problem",
    "about.manifesto.problemText":
      "While analysing the global FX market, our team uncovered a two-sided inefficiency. On one side, retail clients sending remittances and businesses managing cross-border flows face a frustrating maze: they never know with certainty if they are getting the best rate, trapped by hidden costs and opaque structures they cannot control or understand. On the other side, competitive financial institutions are eager to acquire these volume-generating clients, yet high acquisition costs and fragmented channels prevent them from reaching them effectively. mangoglobal ends this mismatch by building an infrastructure where AI agents scan the market impartially and enable regulated institutions to submit real-time counter-offers to improve the price at that exact moment.",
    "about.manifesto.chapterMission": "01 · Mission",
    "about.manifesto.chapterVision": "02 · Vision",
    "about.manifesto.chapterProblem": "03 · Market Inefficiency",
  },
  es: {
    "about.manifesto.headline":
      "Pagos Internacionales, Enrutados Inteligentemente. IA Agéntica para FX Global. 🌐⚡",
    "about.manifesto.kicker": "// manifiesto corporativo",
    "about.manifesto.missionTitle": "$ Nuestra Misión",
    "about.manifesto.missionText":
      "Democratizar el acceso a las mejores decisiones de cambio de divisas a través de una inteligencia neutral impulsada por IA, eliminando la asimetría de información y los costos ocultos de los pagos globales.",
    "about.manifesto.visionTitle": "$ Nuestra Visión",
    "about.manifesto.visionText":
      "Un mundo donde cada pago local de FX o transfronterizo — desde una remesa familiar hasta la operación de tesorería de una multinacional — se ejecute a través de una capa de decisión transparente, auditable y equitativa.",
    "about.manifesto.problemTitle": "$ El Problema",
    "about.manifesto.problemText":
      "Al analizar el mercado global de FX, nuestro equipo descubrió una ineficiencia de doble capa. Por un lado, los clientes retail que envían remesas y las empresas que gestionan flujos transfronterizos enfrentan un laberinto frustrante: nunca saben con certeza si obtienen la mejor tasa, atrapados por costos ocultos y estructuras opacas que no pueden controlar ni comprender. Por otro lado, las instituciones financieras competitivas están deseosas de adquirir estos clientes que generan volumen, pero los altos costos de adquisición y los canales fragmentados les impiden llegar a ellos eficazmente. mangoglobal pone fin a este desajuste creando una infraestructura donde agentes de IA escrutan el mercado de forma imparcial y permiten a las instituciones reguladas ofrecer contraofertas en tiempo real para mejorar el precio en ese instante exacto.",
    "about.manifesto.chapterMission": "01 · Misión",
    "about.manifesto.chapterVision": "02 · Visión",
    "about.manifesto.chapterProblem": "03 · Ineficiencia del Mercado",
  },
  pt: {
    "about.manifesto.headline":
      "Pagamentos Internacionais, Roteados Inteligentemente. IA Agêntica para FX Global. 🌐⚡",
    "about.manifesto.kicker": "// manifesto corporativo",
    "about.manifesto.missionTitle": "$ Nossa Missão",
    "about.manifesto.missionText":
      "Democratizar o acesso às melhores decisões de câmbio através de uma inteligência neutra impulsionada por IA, eliminando a assimetria de informação e os custos ocultos dos pagamentos globais.",
    "about.manifesto.visionTitle": "$ Nossa Visão",
    "about.manifesto.visionText":
      "Um mundo onde cada pagamento local de FX ou transfronteiriço — de uma remessa familiar a uma operação de tesouraria multinacional — seja executado através de uma camada de decisão transparente, auditável e equitativa.",
    "about.manifesto.problemTitle": "$ O Problema",
    "about.manifesto.problemText":
      "Ao analisar o mercado global de FX, nossa equipe descobriu uma ineficiência de dupla camada. De um lado, os clientes retail que enviam remessas e as empresas que gerenciam fluxos transfronteiriços enfrentam um labirinto frustrante: nunca sabem com certeza se obtêm a melhor taxa, presos por custos ocultos e estruturas opacas que não conseguem controlar nem compreender. Do outro lado, as instituições financeiras competitivas estão ansiosas para adquirir esses clientes geradores de volume, mas os altos custos de aquisição e os canais fragmentados as impedem de alcançá-los eficazmente. A mangoglobal põe fim a esse desajuste construindo uma infraestrutura onde agentes de IA examinam o mercado de forma imparcial e permitem às instituições reguladas apresentar contrapropostas em tempo real para melhorar o preço naquele exato momento.",
    "about.manifesto.chapterMission": "01 · Missão",
    "about.manifesto.chapterVision": "02 · Visão",
    "about.manifesto.chapterProblem": "03 · Ineficiência de Mercado",
  },
  it: {
    "about.manifesto.headline":
      "Pagamenti Internazionali, Instradati Intelligentemente. IA Agentica per il FX Globale. 🌐⚡",
    "about.manifesto.kicker": "// manifesto aziendale",
    "about.manifesto.missionTitle": "$ La Nostra Missione",
    "about.manifesto.missionText":
      "Democratizzare l'accesso alle migliori decisioni di cambio valuta attraverso un'intelligenza neutrale alimentata dall'IA, eliminando l'asimmetria informativa e i costi nascosti dei pagamenti globali.",
    "about.manifesto.visionTitle": "$ La Nostra Visione",
    "about.manifesto.visionText":
      "Un mondo in cui ogni pagamento FX locale o transfrontaliero — da una rimessa familiare a un'operazione di tesoreria multinazionale — venga eseguito attraverso un livello decisionale trasparente, verificabile ed equo.",
    "about.manifesto.problemTitle": "$ Il Problema",
    "about.manifesto.problemText":
      "Analizzando il mercato globale FX, il nostro team ha scoperto un'inefficienza a doppio strato. Da un lato, i clienti retail che inviano rimesse e le aziende che gestiscono flussi transfrontalieri affrontano un labirinto frustrante: non sanno mai con certezza se ottengono il miglior tasso, intrappolati da costi nascosti e strutture opache che non possono controllare né comprendere. Dall'altro lato, le istituzioni finanziarie competitive desiderano acquisire questi clienti generatori di volume, ma gli alti costi di acquisizione e i canali frammentati impediscono loro di raggiungerli efficacemente. mangoglobal pone fine a questo disallineamento costruendo un'infrastruttura in cui agenti di IA scrutinano il mercato in modo imparziale e permettono alle istituzioni regolamentate di presentare controfferte in tempo reale per migliorare il prezzo in quell'esatto istante.",
    "about.manifesto.chapterMission": "01 · Missione",
    "about.manifesto.chapterVision": "02 · Visione",
    "about.manifesto.chapterProblem": "03 · Inefficienza di Mercato",
  },
  fr: {
    "about.manifesto.headline":
      "Paiements Internationaux, Routés Intelligemment. IA Agentique pour le FX Global. 🌐⚡",
    "about.manifesto.kicker": "// manifeste d'entreprise",
    "about.manifesto.missionTitle": "$ Notre Mission",
    "about.manifesto.missionText":
      "Démocratiser l'accès aux meilleures décisions de change grâce à une intelligence neutre propulsée par l'IA, en éliminant l'asymétrie d'information et les coûts cachés des paiements mondiaux.",
    "about.manifesto.visionTitle": "$ Notre Vision",
    "about.manifesto.visionText":
      "Un monde où chaque paiement FX local ou transfrontalier — d'une remise familiale à une opération de trésorerie multinationale — s'exécute à travers une couche de décision transparente, auditable et équitable.",
    "about.manifesto.problemTitle": "$ Le Problème",
    "about.manifesto.problemText":
      "En analysant le marché global du FX, notre équipe a identifié une inefficience à double couche. D'un côté, les clients retail envoyant des remises et les entreprises gérant des flux transfrontaliers affrontent un labyrinthe frustrant : ils ne savent jamais avec certitude s'ils obtiennent le meilleur taux, piégés par des coûts cachés et des structures opaques qu'ils ne peuvent ni contrôler ni comprendre. De l'autre côté, les institutions financières compétitives souhaitent acquérir ces clients générateurs de volume, mais des coûts d'acquisition élevés et des canaux fragmentés les empêchent de les atteindre efficacement. mangoglobal met fin à ce désalignement en construisant une infrastructure où des agents IA scrutent le marché de manière impartiale et permettent aux institutions régulées de soumettre des contre-offres en temps réel pour améliorer le prix à cet instant précis.",
    "about.manifesto.chapterMission": "01 · Mission",
    "about.manifesto.chapterVision": "02 · Vision",
    "about.manifesto.chapterProblem": "03 · Inefficience du Marché",
  },
};

// Merge compliance + manifesto keys into the main dictionaries.
for (const code of Object.keys(COMPLIANCE_KEYS) as CorporateLang[]) {
  Object.assign(DICTS[code], COMPLIANCE_KEYS[code], MANIFESTO_KEYS[code]);
}

// Strict translation-key type — derived from the English dictionary, no `any`.
export type TKey = string;

/**
 * Scoped language resolver — Step 1: Detect Route → Step 2: Validate → Step 3: Inject.
 * Restricted routes (`/business`, `/about`) may only render CORPORATE_LANGS.
 * Anything else is forced to `en`. The global picker is allowed elsewhere.
 */
export function getScopedLanguage(path: string, requested: Lang): Lang {
  const corporate = path.startsWith("/business") || path.startsWith("/about");
  if (corporate) {
    return (CORPORATE_LANGS as readonly Lang[]).includes(requested) ? requested : "en";
  }
  return requested in DICTS ? requested : "en";
}

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

const I18nContext = createContext<I18nCtx | null>(null);

import { useLocation } from "@tanstack/react-router";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  // Router-local scope: every navigation revalidates the language vs the route policy.
  const pathname = useLocation({ select: (s) => s.pathname });

  // Initial pick (browser navigator only — no persistence shared between sections).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase() as Lang;
    if (nav in DICTS) setLangState(nav);
  }, []);

  // Re-validate language on every route change.
  useEffect(() => {
    setLangState((prev) => getScopedLanguage(pathname, prev));
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    // 1) Sanitize input with strict Zod schema.
    const parsed = langCodeSchema.safeParse(l);
    const safe = (parsed.success ? parsed.data : "en") as Lang;
    // 2) Validate against route-scoped policy. 3) Inject into state.
    const final = getScopedLanguage(pathname, (safe in DICTS ? safe : "en") as Lang);
    setLangState(final);
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

