import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { z } from "zod";

export type Lang =
  | "en"
  | "es"
  | "pt"
  | "ru"
  | "tr"
  | "bn"
  | "ur"
  | "zh"
  | "pl"
  | "hi"
  | "tl"
  | "vi"
  | "ar"
  | "de"
  | "fr"
  | "it"
  | "ja"
  | "ko"
  | "id"
  | "th";

export const SUPPORTED_LANGS: Lang[] = [
  "en",
  "es",
  "pt",
  "ru",
  "tr",
  "bn",
  "ur",
  "zh",
  "pl",
  "hi",
  "tl",
  "vi",
  "ar",
  "de",
  "fr",
  "it",
  "ja",
  "ko",
  "id",
  "th",
];

export const RTL_LANGS: Lang[] = ["ar"];

// Kept for backwards compatibility — no longer used as a gating mechanism.
// The whole site now exposes all 20 supported languages.
export const CORPORATE_LANGS = SUPPORTED_LANGS;
export type CorporateLang = Lang;

// ============================================================================
// LANGUAGE_METADATA — single source of truth for the language selector UI.
// Refactor any LangSwitcher / language picker to consume this map.
// ============================================================================
export interface LangMetadata {
  code: Lang;
  label: string; // 2-letter uppercase code (for compact display)
  flag: string; // unicode flag emoji
  native: string; // native language name (for menu rows)
  english: string; // English name (for searching / a11y)
}

export const LANGUAGE_METADATA: Record<Lang, LangMetadata> = {
  en: { code: "en", label: "EN", flag: "🇬🇧", native: "English", english: "English" },
  es: { code: "es", label: "ES", flag: "🇪🇸", native: "Español", english: "Spanish" },
  pt: { code: "pt", label: "PT", flag: "🇧🇷", native: "Português", english: "Portuguese" },
  ru: { code: "ru", label: "RU", flag: "🇷🇺", native: "Русский", english: "Russian" },
  tr: { code: "tr", label: "TR", flag: "🇹🇷", native: "Türkçe", english: "Turkish" },
  bn: { code: "bn", label: "BN", flag: "🇧🇩", native: "বাংলা", english: "Bengali" },
  ur: { code: "ur", label: "UR", flag: "🇵🇰", native: "اردو", english: "Urdu" },
  zh: { code: "zh", label: "ZH", flag: "🇨🇳", native: "中文", english: "Chinese" },
  pl: { code: "pl", label: "PL", flag: "🇵🇱", native: "Polski", english: "Polish" },
  hi: { code: "hi", label: "HI", flag: "🇮🇳", native: "हिन्दी", english: "Hindi" },
  tl: { code: "tl", label: "TL", flag: "🇵🇭", native: "Tagalog", english: "Tagalog" },
  vi: { code: "vi", label: "VI", flag: "🇻🇳", native: "Tiếng Việt", english: "Vietnamese" },
  ar: { code: "ar", label: "AR", flag: "🇸🇦", native: "العربية", english: "Arabic" },
  de: { code: "de", label: "DE", flag: "🇩🇪", native: "Deutsch", english: "German" },
  fr: { code: "fr", label: "FR", flag: "🇫🇷", native: "Français", english: "French" },
  it: { code: "it", label: "IT", flag: "🇮🇹", native: "Italiano", english: "Italian" },
  ja: { code: "ja", label: "JA", flag: "🇯🇵", native: "日本語", english: "Japanese" },
  ko: { code: "ko", label: "KO", flag: "🇰🇷", native: "한국어", english: "Korean" },
  id: { code: "id", label: "ID", flag: "🇮🇩", native: "Indonesia", english: "Indonesian" },
  th: { code: "th", label: "TH", flag: "🇹🇭", native: "ไทย", english: "Thai" },
};

// Strict sanitization schema for any language code touching the backend.
export const langCodeSchema = z.string().trim().max(10);

// Country (ISO-3166 alpha-2) → preferred language code for geo-IP detection.
export const COUNTRY_TO_LANG: Record<string, Lang> = {
  // English
  US: "en",
  GB: "en",
  IE: "en",
  AU: "en",
  NZ: "en",
  CA: "en",
  ZA: "en",
  SG: "en",
  NG: "en",
  KE: "en",
  // Spanish
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  UY: "es",
  VE: "es",
  EC: "es",
  BO: "es",
  PY: "es",
  CR: "es",
  PA: "es",
  DO: "es",
  GT: "es",
  HN: "es",
  SV: "es",
  NI: "es",
  CU: "es",
  PR: "es",
  // Portuguese
  PT: "pt",
  BR: "pt",
  AO: "pt",
  MZ: "pt",
  CV: "pt",
  // Italian
  IT: "it",
  SM: "it",
  VA: "it",
  // French
  FR: "fr",
  BE: "fr",
  LU: "fr",
  MC: "fr",
  SN: "fr",
  CI: "fr",
  CM: "fr",
  MA: "fr",
  DZ: "fr",
  TN: "fr",
  // German
  DE: "de",
  AT: "de",
  CH: "de",
  LI: "de",
  // Polish
  PL: "pl",
  // Russian
  RU: "ru",
  BY: "ru",
  KZ: "ru",
  // Turkish
  TR: "tr",
  // Bengali
  BD: "bn",
  // Urdu
  PK: "ur",
  // Hindi
  IN: "hi",
  // Chinese
  CN: "zh",
  HK: "zh",
  TW: "zh",
  // Indonesian
  ID: "id",
  // Tagalog
  PH: "tl",
  // Thai
  TH: "th",
  // Arabic
  SA: "ar",
  AE: "ar",
  EG: "ar",
  QA: "ar",
  KW: "ar",
  BH: "ar",
  OM: "ar",
  JO: "ar",
  LB: "ar",
  IQ: "ar",
  YE: "ar",
  LY: "ar",
  SY: "ar",
  PS: "ar",
  // Vietnamese
  VN: "vi",
  // Japanese
  JP: "ja",
  // Korean
  KR: "ko",
};

type Dict = Record<string, string>;

export const DICTS: Record<Lang, Dict> = {
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
    "nav.legal": "Legal",
    "nav.terms": "Terms",
    "nav.risk": "Risk",
    "institutional.cta": "Talk to the Institutional Desk",
    "brand.decisionEngine": "Decision Engine",
    "brand.partnerships": "Partnerships",
    "brand.rfqDesk": "RFQ Desk",
    "brand.blog": "blog",
    "legal.section": "Section",
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
      "mangomundi is independent. Some links are affiliate links — we may earn a commission at no extra cost to you. Rates and fees are estimates; verify on the provider's site before sending.",
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
    "retail.cta": "Apply mangomundi Preferred Channel Rate",
    "retail.modalTitle": "Activate the preferred rate channel",
    "retail.modalDesc":
      "Freeze the optimised institutional spread routed via our authorised affiliates.",
    "retail.disclaimer":
      "The public rates shown are estimates for informational purposes. By activating the mangomundi preferred channel you are requesting an optimised institutional spread routed through our authorised affiliate identifiers.",
    "retail.emailPlaceholder": "your.email@domain.com",
    "retail.consent":
      "I confirm I am 18 or older and accept the mangomundi Terms of Service and Privacy Policy.",
    "retail.submit": "Freeze preferred rate",
    "retail.success": "Preferred rate frozen. Opening your secure provider link…",
    // RFQ (Business)
    "rfq.title": "Compliance Notice — Direct Quotation Desk (RFQ)",
    "rfq.notice":
      "Due to wholesale interbank volatility, volumes equal to or above 10,000 USD (or equivalent) require a non-public Direct Quotation Request (RFQ). Initiating private bidding protocol with the authorised money desks in",
    "rfq.email": "Corporate email",
    "rfq.consent":
      "I accept the Corporate Terms of Service, Privacy Policy and confirm legal capacity to represent the commercial entity.",
    "rfq.submit": "Initiate RFQ protocol",
    "rfq.success":
      "RFQ protocol successfully initiated. Binding quotes will be sent to your corporate email within 2 hours.",
    "rfq.fieldFrom": "Source currency",
    "rfq.fieldTo": "Destination currency",
    "rfq.fieldAmount": "Notional amount",
    "rfq.fieldOrigin": "Sending country",
    "rfq.fieldDest": "Receiving country",
    "common.cancel": "Cancel",
    "common.email": "Email",
    "common.required": "Required",
    "chat.welcome":
      "Hi 👋 I'm the **mangomundi Agent**. Try a quote (`500 GBP to ARS`) or describe your corporate case.",
    "chat.placeholder": "e.g. 500 GBP to ARS · or describe your corporate case",
    "chat.error": "I couldn't process that right now. Please try again.",
    "fx.emptyState": "Enter the details to calculate the best rates.",
    "fx.validation": "Please fill in sending country, receiving country and amount.",
    "fx.ratesSource": "Values fetched directly from the wholesale interbank market. Last update:",
    "fx.at": "at",
    "fx.trademarks":
      "All third-party trademarks, logos, and provider names (including Wise, Airwallex, OFX, Convera, and Currencies Direct) are the property of their respective owners. Their appearance on this platform is strictly for informational, comparative, and market reference purposes, and does not imply any affiliation, sponsorship, or commercial endorsement by said owners with mangomundi.",
    "biz.rfqCta": "Open the RFQ desk",
    "biz.rfqRoute": "Get routed to the right desk for your corridor",
    // About
    "about.badge": "ABOUT mangomundi",
    "about.heroTitle1": "Built for a",
    "about.heroTitleAccent": "Borderless",
    "about.heroTitle2": "World",
    "about.heroSubtitle":
      "A neutral decision engine: we connect retail and corporate flows to the best available cross-border route or local currency exchange operator, without bias or hidden margins.",
    "about.missionTitle": "Our Mission",
    "about.missionBody":
      "Democratise access to the best foreign exchange decisions through neutral, AI-powered intelligence — eliminating information asymmetry and hidden costs from global payments.",
    "about.visionTitle": "Our Vision",
    "about.visionBody":
      "A world where every cross-border payment — from a family remittance to a multinational treasury operation — runs through a transparent, auditable, and equitable decision layer.",
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
    "about.v1.body":
      "Break down traditional money borders so companies and individuals can operate globally without artificial friction.",
    "about.v2.title": "Inclusion & Free Access",
    "about.v2.body":
      "Democratize wholesale interbank rates and optimized spreads, pulverizing the information asymmetries of traditional banking.",
    "about.v3.title": "Human + AI Impartiality",
    "about.v3.body":
      "Our human team is always available to guide users through operational complexity, yet absolute algorithmic impartiality is what processes, distributes, and delivers the best optimized spreads to every party, equitably and without favoritism.",
    // Home
    "home.hero.title":
      "International and Local Payments, Intelligently Routed. Agentic AI for Global FX.\u00a0",
    "home.hero.subtitle":
      "A transparent AI agent for global and local payments, comparing exchange rates, fees, routes, and delivery speeds in real time to find the best option for every transfer.",
    "home.hero.b1": "A transparent AI agent for global and local payments.",
    "home.hero.b2": "Comparing exchange rates, fees, routes, and delivery speeds in real time.",
    "home.hero.b3": "Finding the best option for every transfer.",
    "home.search.compareLabel": "COMPARE",
    "home.flows.title": "Built for every institutional cross-border flow",
    "home.flows.payroll.title": "Global payroll & contractor payouts",
    "home.flows.payroll.body":
      "Pay international teams and contractors in their local currency with optimised FX routing and full audit trail.",
    "home.flows.suppliers.title": "Supplier & invoice payments",
    "home.flows.suppliers.body":
      "Settle cross-border invoices on the best available route — reducing spread cost and reconciliation overhead.",
    "home.flows.treasury.title": "Treasury & FX hedging",
    "home.flows.treasury.body":
      "Manage currency exposure, execute large-ticket conversions and structure hedges through our RFQ desk.",
    "home.infra.title": "Institutional Infrastructure",
    "home.infra.routing.title": "Secure Routing Control",
    "home.infra.routing.body":
      "Advanced data reporting on FX exposure, realized cost savings, and routing performance — fully exportable.",
    "home.infra.desks.title": "Authorised Money Desks",
    "home.infra.desks.body":
      "Direct connection to major regulated treasury desks ensuring absolute market liquidity.",
    "home.infra.advisory.title": "Dedicated Advisory",
    "home.infra.advisory.body":
      "Tailored support with direct lines to our specialists to manage large-ticket compliance and execution.",
    "home.finalCta.title": "Optimise your corporate treasury layout today.",
    "home.finalCta.subtitle":
      "Access transparent, market-backed FX routing and custom asynchronous RFQ bidding protocols for your enterprise corridors.",
    "home.finalCta.rfq": "Access RFQ Terminal",
    "home.hero.ctaCompare": "Try FX Comparator",
    "home.hero.titlePre": "Compare",
    "home.hero.titleAccent": "exchange rates, fees",
    "home.hero.titlePost": "and transfer routes",
    "home.dual.title": "Built for every cross-border flow — retail and corporate.",
    "home.dual.retail.title": "Retail Remittances & Private Wealth",
    "home.dual.retail.body":
      "Send money internationally, pay for global travel, or manage personal cross-border transfers. Access wholesale interbank rates with zero hidden markups, absolute transparency, and automated tracking.",
    "home.dual.corporate.title": "Corporate Treasury & Operations",
    "home.dual.corporate.body":
      "Manage multi-currency corporate exposure, execute bulk payments, and hedge currency risk utilizing our interactive RFQ Terminal and transparent data reporting.",
    "compare.calculating": "Calculating optimal paths…",
    // Home — How it works
    "home.how.eyebrow": "How it works",
    "home.how.title": "Four steps to a better exchange rate.",
    "home.how.s1.title": "Select",
    "home.how.s1.desc":
      "Tell us who you are (individual or business) and where you are sending money.",
    "home.how.s2.title": "Compare",
    "home.how.s2.desc":
      "Choose your currency and see all available routes and rates. Find your best match.",
    "home.how.s3.title": "Adjust",
    "home.how.s3.desc": "Chat with our AI agent to fine-tune the solution for your specific needs.",
    "home.how.s4.title": "Go",
    "home.how.s4.desc": "Complete your transfer directly with your chosen provider.",
    "home.feat.liveRates": "Live Rates",
    "home.feat.zeroFees": "Zero Fees",
    "home.feat.noSignup": "No Sign-up",
    // Home — About / Manifesto
    "home.about.eyebrow": "About",
    "home.about.title": "Financial intelligence for every currency decision.",
    "home.about.subtitle":
      "A neutral decision engine: we connect retail and corporate flows to the best available cross-border route or local currency exchange operator, without bias or hidden margins.",
    "home.about.mission.label": "Mission",
    "home.about.mission.body":
      "Facilitate access to the best foreign exchange decisions through neutral, AI-powered intelligence, eliminating information asymmetry and hidden costs from global payments.",
    "home.about.vision.label": "Vision",
    "home.about.vision.body":
      "A world where every local FX or cross-border payment, from a family remittance to a multinational treasury operation, runs through a transparent and equitable decision layer.",
    "home.about.problem.label": "Problem",
    "home.about.problem.body":
      "A two-sided inefficiency. On one side, retail clients and businesses face a frustrating maze regarding best rates. On the other, financial institutions struggle with high acquisition costs and fragmented channels.",
    // Home — Stats / Market coverage
    "home.stats.eyebrow": "Market coverage",
    "home.stats.title": "One view across the global FX market.",
    "home.stats.subtitle":
      "Our decision engine evaluates more than 50 global providers in real time, normalizing rates, fees, delivery speed and corridor availability into a clear comparison.",
    "home.stats.founded": "Founded",
    "home.stats.countries": "Countries Covered",
    "home.stats.currencies": "Currencies Supported",
    "home.stats.providers": "Global providers evaluated in real time",
    // Home — Contact
    "home.contact.eyebrow": "Contact",
    "home.contact.title": "Institutional & Partnership Inquiries.",
    "home.contact.treasury.title": "For Treasury Operations",
    "home.contact.treasury.body":
      "We can develop custom, on-premise AI agents as a service, tailored to your corporate treasury team's workflow to optimize trade finance and liquidity operations.",
    "home.contact.partners.title": "For FX & Payment Partnerships",
    "home.contact.partners.body":
      "We are looking to align with cross-border payment operators and currency exchange providers; let's explore synergies through integrated sponsored placements and affiliate programs designed to maximize efficiency and reduce your Customer Acquisition Cost (CAC).",
    // Home — Blog
    "home.blog.eyebrow": "Blog",
    "home.blog.title": "Insights on global FX, coming soon.",
    "home.blog.body":
      "We're preparing in-depth analysis on cross-border payments, corridor economics, and FX intelligence. Check back soon.",
    "home.blog.readMore": "Read more",
    "home.hero.tagline":
      "Exchange rates, fees, routes and delivery speeds — compared in real time with AI. Live rates, zero fees, no sign-up.",
    "home.contact.simple.title": "Get in touch.",
    "home.contact.simple.body":
      "Questions, feedback or press — write to us and we'll get back to you.",
    "home.widget.eyebrow": "Widget",
    "home.widget.title": "mangomundi on your website.",
    "home.widget.body":
      "Embed the FX comparator on any website or app with a single script tag — live rates, your branding, powered by mangomundi.",
    "home.widget.badge": "Free to embed",
    "home.widget.cta": "Request early access",
    "home.widget.tab.script": "Script",
    "home.widget.tab.iframe": "iframe",
    "home.widget.copy": "Copy",
    "home.widget.copied": "Copied!",
    "home.widget.hint":
      "Paste it anywhere in your HTML. The widget is free and runs in an isolated iframe — no code conflicts, no tracking added to your site.",
    // Footer
    "footer.tagline": "Intelligent currency exchange decisions.",
    "footer.nav.title": "Navigate",
    "footer.legal.title": "Legal & Compliance",
    "footer.nav.home": "Home",
    "footer.nav.about": "About",
    "footer.nav.how": "How it works",
    "footer.nav.contact": "Contact",
    "footer.nav.blog": "Blog",
    "footer.legal.terms": "Terms of Service",
    "footer.legal.risk": "Risk Disclosure",
    "footer.legal.privacy": "Privacy Policy",
    "footer.rights": "All rights reserved.",
    // Legal page
    "legal.pageTitle": "Legal & Compliance",
    "legal.pageSubtitle": "Terms of Service, Risk Disclosure and Privacy Policy.",
    "legal.terms.title": "Terms of Service",
    "legal.terms.intro":
      "These Terms govern your access to and use of Mangomundi. By using the service you accept these Terms.",
    "legal.terms.h1": "01 — Service",
    "legal.terms.p1":
      "Mangomundi is a neutral decision engine that compares foreign exchange providers and corridors. We do not execute transactions or hold customer funds.",
    "legal.terms.h2": "02 — Information accuracy",
    "legal.terms.p2":
      "Quotes and provider data are sourced in real time from third parties. Final terms are governed by each provider at execution.",
    "legal.terms.h3": "03 — Acceptable use",
    "legal.terms.p3":
      "You agree to use the service only for lawful purposes and to not misuse the platform, attempt to interfere with its operation, or scrape data without permission.",
    "legal.terms.h4": "04 — Liability",
    "legal.terms.p4":
      'The service is provided on an "as is" basis. To the maximum extent permitted by law, Mangomundi is not liable for indirect or consequential losses arising from use of the service.',
    "legal.terms.h5": "05 — Contact",
    "legal.terms.p5": "Questions about these Terms can be sent to hello@mangomundi.com.",
    "legal.risk.title": "Risk Disclosure",
    "legal.risk.intro":
      "Foreign exchange markets are volatile. Quoted rates, fees and delivery times can change between comparison and execution.",
    "legal.risk.h1": "01 — Market risk",
    "legal.risk.p1":
      "Exchange rates fluctuate continuously. Comparisons shown are indicative at the moment of query and may differ from the rate offered by a provider at the moment of execution.",
    "legal.risk.h2": "02 — Counterparty risk",
    "legal.risk.p2":
      "Transactions are executed by the provider you select. Mangomundi does not guarantee the performance, solvency or regulatory status of any third-party provider.",
    "legal.risk.h3": "03 — Regulatory variation",
    "legal.risk.p3":
      "Availability of corridors and providers varies by jurisdiction. You are responsible for ensuring use of a provider complies with local laws.",
    "legal.risk.h4": "04 — No financial advice",
    "legal.risk.p4":
      "Information presented is for comparison purposes only and does not constitute financial, tax, or legal advice.",
    "legal.privacy.title": "Privacy Policy",
    "legal.privacy.intro":
      "We collect only what we need to operate the comparison engine and improve the product. We do not sell personal data.",
    "legal.privacy.h1": "01 — Data we collect",
    "legal.privacy.p1":
      "Query parameters (corridor, amount, segment), basic device and geolocation signals, and any information you voluntarily provide via inquiry forms.",
    "legal.privacy.h2": "02 — How we use it",
    "legal.privacy.p2":
      "To return relevant comparisons, improve accuracy of the decision engine, and respond to partnership or institutional inquiries.",
    "legal.privacy.h3": "03 — Sharing",
    "legal.privacy.p3":
      "We share data with sub-processors strictly necessary to operate the service (e.g. hosting, analytics). We never sell personal data.",
    "legal.privacy.h4": "04 — Your rights",
    "legal.privacy.p4":
      "You can request access, correction, or deletion of your personal data by writing to hello@mangomundi.com.",
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
      "mangomundi es independiente. Algunos enlaces son de afiliados — podemos cobrar una comisión sin costo extra para vos. Las tasas y comisiones son estimadas; verificá en el sitio del proveedor antes de enviar.",
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
    "retail.cta": "Aplicar Tarifa Preferencial Canal mangomundi",
    "retail.modalTitle": "Activá el canal de tarifa preferencial",
    "retail.modalDesc":
      "Congelá el spread institucional optimizado a través de nuestros afiliados autorizados.",
    "retail.disclaimer":
      "Las tarifas públicas mostradas son estimadas y de carácter informativo. Al activar el canal preferencial de mangomundi, solicitás la aplicación de un spread optimizado institucional mediante nuestros identificadores de afiliación autorizados.",
    "retail.emailPlaceholder": "tu.email@dominio.com",
    "retail.consent":
      "Declaro que soy mayor de 18 años y acepto los Términos de Servicio y la Política de Privacidad de mangomundi.",
    "retail.submit": "Congelar tarifa preferencial",
    "retail.success": "Tarifa preferencial congelada. Abriendo tu enlace seguro al proveedor…",
    // RFQ (Business)
    "rfq.title": "Aviso de Cumplimiento — Mesa de Cotización Directa (RFQ)",
    "rfq.notice":
      "Debido a la volatilidad del mercado mayorista interbancario, los volúmenes iguales o superiores a 10,000 USD (o equivalente) requieren de una Solicitud de Cotización Directa (RFQ) no pública. Iniciando protocolo de licitación privada con las mesas de dinero autorizadas en",
    "rfq.email": "Email institucional",
    "rfq.consent":
      "Acepto los Términos de Servicio Corporativos, Política de Privacidad y confirmo la capacidad legal para representar a la entidad comercial.",
    "rfq.submit": "Iniciar protocolo RFQ",
    "rfq.success":
      "Protocolo RFQ iniciado con éxito. Las cotizaciones vinculantes serán enviadas a tu correo institucional en menos de 2 horas.",
    "rfq.fieldFrom": "Moneda origen",
    "rfq.fieldTo": "Moneda destino",
    "rfq.fieldAmount": "Monto nocional",
    "rfq.fieldOrigin": "País de origen",
    "rfq.fieldDest": "País de destino",
    "common.cancel": "Cancelar",
    "common.email": "Email",
    "common.required": "Requerido",
    "chat.welcome":
      "Hola 👋 Soy el **Agente mangomundi**. Probá una cotización (`500 GBP to ARS`) o contame el caso de tu empresa.",
    "chat.placeholder": "Ej: 500 GBP to ARS · o describí tu caso corporativo",
    "chat.error": "No pude procesar eso ahora. Probá de nuevo.",
    "fx.emptyState": "Introducí los datos para calcular las mejores tasas.",
    "fx.validation": "Por favor, completá país de origen, país de destino y monto.",
    "fx.ratesSource":
      "Valores obtenidos directamente del mercado interbancario mayorista. Última actualización:",
    "fx.at": "a las",
    "fx.trademarks":
      "Todas las marcas comerciales, logotipos y nombres de proveedores de terceros (incluidos Wise, Airwallex, OFX, Convera y Currencies Direct) son propiedad de sus respectivos titulares. Su aparición en esta plataforma se realiza exclusivamente con fines informativos, comparativos y de referencia de mercado, y no implica afiliación, patrocinio o endoso comercial alguno por parte de dichos titulares con mangomundi.",
    "biz.rfqCta": "Abrir mesa RFQ",
    "biz.rfqRoute": "Acceder a la mesa adecuada para tu corredor",
    // About
    "about.badge": "Sobre mangomundi",
    "about.heroTitle1": "Construido para un mundo",
    "about.heroTitleAccent": "sin fronteras",
    "about.heroTitle2": "",
    "about.heroSubtitle":
      "mangomundi es un motor de decisión neutral: conectamos flujos retail y corporativos con la mejor ruta transfronteriza disponible, sin sesgos de proveedor ni márgenes ocultos.",
    "about.missionTitle": "Nuestra Misión",
    "about.missionBody":
      "Democratizar el acceso a las mejores decisiones de cambio de divisas mediante inteligencia neutral basada en IA, eliminando la asimetría de información y los costos ocultos de los pagos globales.",
    "about.visionTitle": "Nuestra Visión",
    "about.visionBody":
      "Un mundo donde cada pago transfronterizo —desde una remesa familiar hasta una operación de tesorería multinacional— pase por una capa de decisión transparente, auditable y equitativa.",
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
    "about.v1.body":
      "Derribar las fronteras tradicionales del dinero para que empresas e individuos operen globalmente sin fricciones artificiales.",
    "about.v2.title": "Inclusión y Acceso Libre",
    "about.v2.body":
      "Democratizar las tasas mayoristas interbancarias y los spreads optimizados, pulverizando las asimetrías de información de la banca tradicional.",
    "about.v3.title": "Imparcialidad Humana + IA",
    "about.v3.body":
      "Nuestro equipo humano está siempre disponible para acompañar a los usuarios en la complejidad operativa, pero la imparcialidad algorítmica absoluta es la que procesa, distribuye y entrega los mejores spreads optimizados a cada parte, de forma equitativa y sin favoritismos.",
    // Home
    "home.hero.title": "Pagos internacionales, ruteados con inteligencia.",
    "home.hero.subtitle":
      "Un agente de IA transparente para pagos globales y locales, que compara tipos de cambio, comisiones, rutas y velocidades de entrega en tiempo real para encontrar la mejor opción en cada transferencia.",
    "home.flows.title": "Diseñado para cada flujo institucional transfronterizo",
    "home.flows.payroll.title": "Nómina global y pagos a contratistas",
    "home.flows.payroll.body":
      "Pagá a equipos internacionales y contratistas en su moneda local con ruteo FX optimizado y trazabilidad completa.",
    "home.flows.suppliers.title": "Pagos a proveedores y facturas",
    "home.flows.suppliers.body":
      "Liquidá facturas transfronterizas por la mejor ruta disponible — reduciendo spread y carga de conciliación.",
    "home.flows.treasury.title": "Tesorería y cobertura FX",
    "home.flows.treasury.body":
      "Gestioná la exposición cambiaria, ejecutá conversiones de alto ticket y estructurá coberturas vía nuestra mesa RFQ.",
    "home.infra.title": "Infraestructura Institucional",
    "home.infra.routing.title": "Control de Ruteo Seguro",
    "home.infra.routing.body":
      "Reportes avanzados sobre exposición FX, ahorros realizados y desempeño de ruteo — totalmente exportables.",
    "home.infra.desks.title": "Mesas de Dinero Autorizadas",
    "home.infra.desks.body":
      "Conexión directa con las principales mesas de tesorería reguladas, garantizando liquidez de mercado absoluta.",
    "home.infra.advisory.title": "Asesoría Dedicada",
    "home.infra.advisory.body":
      "Soporte a medida con líneas directas a nuestros especialistas para gestionar cumplimiento y ejecución de gran ticket.",
    "home.finalCta.title": "Optimizá hoy la arquitectura de tu tesorería corporativa.",
    "home.finalCta.subtitle":
      "Accedé a un ruteo FX transparente respaldado por el mercado y a protocolos personalizados de licitación RFQ asincrónica para tus corredores empresariales.",
    "home.finalCta.rfq": "Acceder a la Terminal RFQ",
    "home.hero.ctaCompare": "Probar Comparador FX",
    "home.dual.title": "Construido para cada flujo transfronterizo — retail y corporativo.",
    "home.dual.retail.title": "Remesas Retail y Patrimonio Privado",
    "home.dual.retail.body":
      "Enviá dinero internacionalmente, pagá viajes globales o gestioná transferencias personales. Accedé a tasas mayoristas interbancarias sin recargos ocultos, con transparencia absoluta y seguimiento automatizado.",
    "home.dual.corporate.title": "Tesorería Corporativa y Operaciones",
    "home.dual.corporate.body":
      "Gestioná exposición corporativa multidivisa, ejecutá pagos masivos y cubrí el riesgo cambiario con nuestra Terminal RFQ interactiva y reportes de datos transparentes.",
    "compare.calculating": "Calculando rutas óptimas…",
    // Home — Cómo funciona
    "home.how.eyebrow": "Cómo funciona",
    "home.how.title": "Cuatro pasos hacia un mejor tipo de cambio.",
    "home.how.s1.title": "Elegí",
    "home.how.s1.desc":
      "Contanos quién sos (particular o empresa) y a dónde estás enviando dinero.",
    "home.how.s2.title": "Compará",
    "home.how.s2.desc":
      "Elegí tu divisa y mirá todas las rutas y tasas disponibles. Encontrá tu mejor opción.",
    "home.how.s3.title": "Ajustá",
    "home.how.s3.desc":
      "Chateá con nuestro agente IA para afinar la solución según tus necesidades.",
    "home.how.s4.title": "Listo",
    "home.how.s4.desc": "Completá tu transferencia directamente con el proveedor elegido.",
    "home.feat.liveRates": "Tasas en vivo",
    "home.feat.zeroFees": "Sin comisiones",
    "home.feat.noSignup": "Sin registro",
    // Home — About / Manifiesto
    "home.about.eyebrow": "Nosotros",
    "home.about.title": "Inteligencia financiera para cada decisión de divisas.",
    "home.about.subtitle":
      "Un motor de decisión neutral: conectamos flujos retail y corporativos con la mejor ruta transfronteriza o el mejor operador local de cambio, sin sesgos ni márgenes ocultos.",
    "home.about.mission.label": "Misión",
    "home.about.mission.body":
      "Facilitar el acceso a las mejores decisiones de cambio mediante inteligencia neutral impulsada por IA, eliminando la asimetría de información y los costos ocultos de los pagos globales.",
    "home.about.vision.label": "Visión",
    "home.about.vision.body":
      "Un mundo donde cada pago local o transfronterizo, desde una remesa familiar hasta una operación de tesorería multinacional, transite por una capa de decisión transparente y equitativa.",
    "home.about.problem.label": "Problema",
    "home.about.problem.body":
      "Una ineficiencia de doble cara. Por un lado, clientes retail y empresas enfrentan un laberinto frustrante para encontrar las mejores tasas. Por el otro, las instituciones financieras enfrentan altos costos de adquisición y canales fragmentados.",
    // Home — Cobertura de mercado
    "home.stats.eyebrow": "Cobertura de mercado",
    "home.stats.title": "Una vista completa del mercado global de divisas.",
    "home.stats.subtitle":
      "Nuestro motor de decisión evalúa más de 50 proveedores globales en tiempo real, normalizando tasas, comisiones, velocidad de entrega y disponibilidad por corredor en una comparación clara.",
    "home.stats.founded": "Fundada en",
    "home.stats.countries": "Países cubiertos",
    "home.stats.currencies": "Divisas soportadas",
    "home.stats.providers": "Proveedores globales evaluados en tiempo real",
    // Home — Contacto
    "home.contact.eyebrow": "Contacto",
    "home.contact.title": "Consultas institucionales y de partnerships.",
    "home.contact.treasury.title": "Para operaciones de tesorería",
    "home.contact.treasury.body":
      "Desarrollamos agentes de IA personalizados, on-premise, adaptados al flujo de trabajo de tu equipo de tesorería corporativa para optimizar operaciones de financiamiento comercial y liquidez.",
    "home.contact.partners.title": "Para partnerships de FX y pagos",
    "home.contact.partners.body":
      "Buscamos alinearnos con operadores de pagos transfronterizos y proveedores de cambio de divisas; exploremos sinergias mediante colocaciones patrocinadas integradas y programas de afiliados diseñados para maximizar eficiencia y reducir tu Costo de Adquisición de Clientes (CAC).",
    // Home — Blog
    "home.blog.eyebrow": "Blog",
    "home.blog.title": "Análisis sobre FX global, muy pronto.",
    "home.blog.body":
      "Estamos preparando análisis en profundidad sobre pagos transfronterizos, economía de corredores e inteligencia FX. Volvé pronto.",
    "home.blog.readMore": "Leer más",
    "home.hero.tagline":
      "Tipos de cambio, fees, rutas y tiempos de entrega — comparados en tiempo real con IA. Tasas en vivo, cero comisiones, sin registro.",
    "home.contact.simple.title": "Escribinos.",
    "home.contact.simple.body":
      "Consultas, feedback o prensa — escribinos y te respondemos a la brevedad.",
    "home.widget.eyebrow": "Widget",
    "home.widget.title": "mangomundi en tu sitio web.",
    "home.widget.body":
      "Embebé el comparador FX en cualquier sitio o app con un solo script — tasas en vivo, tu marca, powered by mangomundi.",
    "home.widget.badge": "Gratis para integrar",
    "home.widget.cta": "Pedir acceso anticipado",
    "home.widget.tab.script": "Script",
    "home.widget.tab.iframe": "iframe",
    "home.widget.copy": "Copiar",
    "home.widget.copied": "¡Copiado!",
    "home.widget.hint":
      "Pegalo en cualquier parte de tu HTML. El widget es gratis y corre en un iframe aislado — sin conflictos de código ni tracking agregado a tu sitio.",
    // Footer
    "footer.tagline": "Decisiones inteligentes de cambio de divisas.",
    "footer.nav.title": "Navegación",
    "footer.legal.title": "Legal y Cumplimiento",
    "footer.nav.home": "Inicio",
    "footer.nav.about": "Nosotros",
    "footer.nav.how": "Cómo funciona",
    "footer.nav.contact": "Contacto",
    "footer.nav.blog": "Blog",
    "footer.legal.terms": "Términos del Servicio",
    "footer.legal.risk": "Aviso de Riesgo",
    "footer.legal.privacy": "Política de Privacidad",
    "footer.rights": "Todos los derechos reservados.",
    // Página Legal
    "legal.pageTitle": "Legal y Cumplimiento",
    "legal.pageSubtitle": "Términos del Servicio, Aviso de Riesgo y Política de Privacidad.",
    "legal.terms.title": "Términos del Servicio",
    "legal.terms.intro":
      "Estos Términos rigen tu acceso y uso de Mangomundi. Al utilizar el servicio aceptás estos Términos.",
    "legal.terms.h1": "01 — Servicio",
    "legal.terms.p1":
      "Mangomundi es un motor de decisión neutral que compara proveedores y corredores de cambio. No ejecutamos transacciones ni custodiamos fondos de clientes.",
    "legal.terms.h2": "02 — Exactitud de la información",
    "legal.terms.p2":
      "Las cotizaciones y datos de proveedores se obtienen en tiempo real de terceros. Los términos finales se rigen por cada proveedor al momento de la ejecución.",
    "legal.terms.h3": "03 — Uso aceptable",
    "legal.terms.p3":
      "Aceptás utilizar el servicio únicamente para fines lícitos y no hacer uso indebido de la plataforma, interferir con su funcionamiento o extraer datos sin autorización.",
    "legal.terms.h4": "04 — Responsabilidad",
    "legal.terms.p4":
      'El servicio se brinda "tal cual". En la máxima medida permitida por la ley, Mangomundi no es responsable por pérdidas indirectas o consecuentes derivadas del uso del servicio.',
    "legal.terms.h5": "05 — Contacto",
    "legal.terms.p5": "Las consultas sobre estos Términos pueden enviarse a hello@mangomundi.com.",
    "legal.risk.title": "Aviso de Riesgo",
    "legal.risk.intro":
      "Los mercados de cambio son volátiles. Las tasas, comisiones y tiempos de entrega cotizados pueden cambiar entre la comparación y la ejecución.",
    "legal.risk.h1": "01 — Riesgo de mercado",
    "legal.risk.p1":
      "Los tipos de cambio fluctúan continuamente. Las comparaciones mostradas son indicativas al momento de la consulta y pueden diferir de la tasa ofrecida por un proveedor al momento de la ejecución.",
    "legal.risk.h2": "02 — Riesgo de contraparte",
    "legal.risk.p2":
      "Las transacciones las ejecuta el proveedor que elijas. Mangomundi no garantiza el desempeño, solvencia ni estado regulatorio de ningún proveedor externo.",
    "legal.risk.h3": "03 — Variación regulatoria",
    "legal.risk.p3":
      "La disponibilidad de corredores y proveedores varía según la jurisdicción. Sos responsable de asegurar que el uso de un proveedor cumpla con las leyes locales.",
    "legal.risk.h4": "04 — No es asesoramiento financiero",
    "legal.risk.p4":
      "La información presentada es solo a efectos comparativos y no constituye asesoramiento financiero, fiscal ni legal.",
    "legal.privacy.title": "Política de Privacidad",
    "legal.privacy.intro":
      "Recolectamos solo lo necesario para operar el motor de comparación y mejorar el producto. No vendemos datos personales.",
    "legal.privacy.h1": "01 — Datos que recolectamos",
    "legal.privacy.p1":
      "Parámetros de consulta (corredor, monto, segmento), señales básicas de dispositivo y geolocalización, y cualquier información que proporciones voluntariamente en formularios de contacto.",
    "legal.privacy.h2": "02 — Cómo los usamos",
    "legal.privacy.p2":
      "Para devolver comparaciones relevantes, mejorar la precisión del motor de decisión y responder consultas institucionales o de partnerships.",
    "legal.privacy.h3": "03 — Compartición",
    "legal.privacy.p3":
      "Compartimos datos con sub-procesadores estrictamente necesarios para operar el servicio (p. ej. hosting, analítica). Nunca vendemos datos personales.",
    "legal.privacy.h4": "04 — Tus derechos",
    "legal.privacy.p4":
      "Podés solicitar acceso, corrección o eliminación de tus datos personales escribiendo a hello@mangomundi.com.",
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
      "mangomundi é independente. Alguns links são de afiliados — podemos receber comissão sem custo extra para você. Taxas são estimativas; verifique no site do provedor antes de enviar.",
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
    "retail.cta": "Aplicar Tarifa Preferencial Canal mangomundi",
    "retail.modalTitle": "Ative o canal de tarifa preferencial",
    "retail.modalDesc":
      "Congele o spread institucional otimizado roteado pelos nossos afiliados autorizados.",
    "retail.disclaimer":
      "As taxas públicas exibidas são estimativas e de caráter informativo. Ao ativar o canal preferencial mangomundi, você solicita a aplicação de um spread institucional otimizado por meio dos nossos identificadores de afiliação autorizados.",
    "retail.emailPlaceholder": "seu.email@dominio.com",
    "retail.consent":
      "Declaro que sou maior de 18 anos e aceito os Termos de Serviço e a Política de Privacidade da mangomundi.",
    "retail.submit": "Congelar tarifa preferencial",
    "retail.success": "Tarifa preferencial congelada. Abrindo seu link seguro do provedor…",
    // RFQ (Business)
    "rfq.title": "Aviso de Compliance — Mesa de Cotação Direta (RFQ)",
    "rfq.notice":
      "Devido à volatilidade do mercado atacadista interbancário, volumes iguais ou superiores a 10.000 USD (ou equivalente) exigem uma Solicitação de Cotação Direta (RFQ) não pública. Iniciando protocolo de licitação privada com as mesas autorizadas em",
    "rfq.email": "Email institucional",
    "rfq.consent":
      "Aceito os Termos de Serviço Corporativos, Política de Privacidade e confirmo a capacidade legal para representar a entidade comercial.",
    "rfq.submit": "Iniciar protocolo RFQ",
    "rfq.success":
      "Protocolo RFQ iniciado com sucesso. As cotações vinculantes serão enviadas ao seu email institucional em até 2 horas.",
    "rfq.fieldFrom": "Moeda de origem",
    "rfq.fieldTo": "Moeda de destino",
    "rfq.fieldAmount": "Valor nocional",
    "rfq.fieldOrigin": "País de origem",
    "rfq.fieldDest": "País de destino",
    "common.cancel": "Cancelar",
    "common.email": "Email",
    "common.required": "Obrigatório",
    "chat.welcome":
      "Olá 👋 Sou o **Agente mangomundi**. Teste uma cotação (`500 GBP to ARS`) ou descreva o caso da sua empresa.",
    "chat.placeholder": "Ex: 500 GBP to ARS · ou descreva seu caso corporativo",
    "chat.error": "Não consegui processar isso agora. Tente de novo.",
    "fx.emptyState": "Insira os dados para calcular as melhores taxas.",
    "fx.validation": "Por favor, preencha país de origem, país de destino e valor.",
    "fx.ratesSource":
      "Valores obtidos diretamente do mercado interbancário atacadista. Última atualização:",
    "fx.at": "às",
    "fx.trademarks":
      "Todas as marcas comerciais, logotipos e nomes de provedores terceiros (incluindo Wise, Airwallex, OFX, Convera e Currencies Direct) são de propriedade de seus respectivos titulares. Sua exibição nesta plataforma é feita exclusivamente para fins informativos, comparativos e de referência de mercado, não implicando qualquer afiliação, patrocínio ou endosso comercial por parte de tais titulares com a mangomundi.",
    "biz.rfqCta": "Abrir mesa RFQ",
    "biz.rfqRoute": "Acessar a mesa adequada para o seu corredor",
    // About
    "about.badge": "Sobre a mangomundi",
    "about.heroTitle1": "Construído para um mundo",
    "about.heroTitleAccent": "sem fronteiras",
    "about.heroTitle2": "",
    "about.heroSubtitle":
      "A mangomundi é um motor de decisão neutro: conectamos fluxos retail e corporativos à melhor rota transfronteiriça disponível, sem viés de provedor nem margens ocultas.",
    "about.missionTitle": "Nossa Missão",
    "about.missionBody":
      "Democratizar o acesso às melhores decisões de câmbio através de inteligência neutra baseada em IA, eliminando a assimetria de informação e os custos ocultos dos pagamentos globais.",
    "about.visionTitle": "Nossa Visão",
    "about.visionBody":
      "Um mundo onde cada pagamento transfronteiriço — de uma remessa familiar a uma operação de tesouraria multinacional — passe por uma camada de decisão transparente, auditável e equitativa.",
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
    "about.v1.body":
      "Derrubar as fronteiras tradicionais do dinheiro para que empresas e indivíduos operem globalmente sem fricções artificiais.",
    "about.v2.title": "Inclusão e Acesso Livre",
    "about.v2.body":
      "Democratizar as taxas atacadistas interbancárias e os spreads otimizados, pulverizando as assimetrias de informação da banca tradicional.",
    "about.v3.title": "Imparcialidade Humana + IA",
    "about.v3.body":
      "Nossa equipe humana está sempre disponível para acompanhar os usuários na complexidade operativa, mas a imparcialidade algorítmica absoluta é o que processa, distribui e entrega os melhores spreads otimizados a cada parte, de forma equitativa e sem favoritismos.",
    // Home
    "home.hero.title": "Pagamentos internacionais, roteados com inteligência.",
    "home.hero.subtitle":
      "Reduza o custo de FX em folha, fornecedores e tesouraria. Use nosso motor de decisão inteligente e dashboard interativo para transferências de alto valor com suporte especializado dedicado.",
    "home.flows.title": "Construído para cada fluxo institucional transfronteiriço",
    "home.flows.payroll.title": "Folha global e pagamentos a prestadores",
    "home.flows.payroll.body":
      "Pague equipes internacionais e prestadores na moeda local com roteamento FX otimizado e trilha de auditoria completa.",
    "home.flows.suppliers.title": "Pagamentos a fornecedores e faturas",
    "home.flows.suppliers.body":
      "Liquide faturas transfronteiriças pela melhor rota disponível — reduzindo spread e esforço de conciliação.",
    "home.flows.treasury.title": "Tesouraria e hedge de FX",
    "home.flows.treasury.body":
      "Gerencie exposição cambial, execute conversões de alto valor e estruture hedges através de nossa mesa RFQ.",
    "home.infra.title": "Infraestrutura Institucional",
    "home.infra.routing.title": "Controle de Roteamento Seguro",
    "home.infra.routing.body":
      "Relatórios avançados sobre exposição FX, economia realizada e desempenho de roteamento — totalmente exportáveis.",
    "home.infra.desks.title": "Mesas de Câmbio Autorizadas",
    "home.infra.desks.body":
      "Conexão direta com as principais mesas de tesouraria reguladas, garantindo liquidez de mercado absoluta.",
    "home.infra.advisory.title": "Consultoria Dedicada",
    "home.infra.advisory.body":
      "Suporte sob medida com linhas diretas com nossos especialistas para gerenciar compliance e execução de grande porte.",
    "home.finalCta.title": "Otimize hoje a arquitetura da sua tesouraria corporativa.",
    "home.finalCta.subtitle":
      "Acesse roteamento FX transparente, respaldado pelo mercado, e protocolos personalizados de licitação RFQ assíncrona para seus corredores corporativos.",
    "home.finalCta.rfq": "Acessar Terminal RFQ",
    "home.hero.ctaCompare": "Testar Comparador FX",
    "home.dual.title": "Construído para cada fluxo transfronteiriço — retail e corporativo.",
    "home.dual.retail.title": "Remessas Retail e Patrimônio Privado",
    "home.dual.retail.body":
      "Envie dinheiro internacionalmente, pague viagens globais ou gerencie transferências pessoais. Acesse taxas atacadistas interbancárias sem markups ocultos, com transparência absoluta e rastreamento automatizado.",
    "home.dual.corporate.title": "Tesouraria Corporativa e Operações",
    "home.dual.corporate.body":
      "Gerencie exposição corporativa multimoeda, execute pagamentos em massa e proteja o risco cambial com nosso Terminal RFQ interativo e relatórios de dados transparentes.",
    "compare.calculating": "Calculando rotas ótimas…",
  },
  // Scaffolded locales — core navigation translated; remaining keys fall back to English until full translation phase.
  it: {
    "nav.home": "Home",
    "nav.compare": "Confronta",
    "nav.business": "Aziende",
    "nav.blog": "Blog",
    "nav.about": "Chi siamo",
    "nav.contact": "Contatti",
    "cta.talkSales": "Parla con le vendite",
    "home.hero.ctaCompare": "Prova il comparatore FX",
    "compare.calculating": "Calcolo dei percorsi ottimali…",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.compare": "Comparer",
    "nav.business": "Entreprises",
    "nav.blog": "Blog",
    "nav.about": "À propos",
    "nav.contact": "Contact",
    "cta.talkSales": "Parler aux ventes",
    "home.hero.ctaCompare": "Essayer le comparateur FX",
    "compare.calculating": "Calcul des routes optimales…",
  },
  de: {
    "nav.home": "Startseite",
    "nav.compare": "Vergleichen",
    "nav.business": "Unternehmen",
    "nav.blog": "Blog",
    "nav.about": "Über uns",
    "nav.contact": "Kontakt",
    "cta.talkSales": "Vertrieb kontaktieren",
    "home.hero.ctaCompare": "FX-Vergleich testen",
    "compare.calculating": "Optimale Routen werden berechnet…",
  },
  pl: {
    "nav.home": "Główna",
    "nav.compare": "Porównaj",
    "nav.business": "Firmy",
    "nav.blog": "Blog",
    "nav.about": "O nas",
    "nav.contact": "Kontakt",
    "cta.talkSales": "Skontaktuj się ze sprzedażą",
    "home.hero.ctaCompare": "Wypróbuj porównywarkę FX",
    "compare.calculating": "Obliczanie optymalnych tras…",
  },
  ru: {
    "nav.home": "Главная",
    "nav.compare": "Сравнить",
    "nav.business": "Бизнес",
    "nav.blog": "Блог",
    "nav.about": "О нас",
    "nav.contact": "Контакты",
    "cta.talkSales": "Связаться с отделом продаж",
    "home.hero.ctaCompare": "Попробовать FX-компаратор",
    "compare.calculating": "Расчёт оптимальных маршрутов…",
  },
  tr: {
    "nav.home": "Ana Sayfa",
    "nav.compare": "Karşılaştır",
    "nav.business": "İşletme",
    "nav.blog": "Blog",
    "nav.about": "Hakkımızda",
    "nav.contact": "İletişim",
    "cta.talkSales": "Satış ile görüşün",
    "home.hero.ctaCompare": "FX Karşılaştırıcıyı dene",
    "compare.calculating": "Optimum rotalar hesaplanıyor…",
  },
  bn: {
    "nav.home": "হোম",
    "nav.compare": "তুলনা",
    "nav.business": "ব্যবসা",
    "nav.blog": "ব্লগ",
    "nav.about": "আমাদের সম্পর্কে",
    "nav.contact": "যোগাযোগ",
    "cta.talkSales": "বিক্রয়ের সাথে কথা বলুন",
    "home.hero.ctaCompare": "FX তুলনাকারী চেষ্টা করুন",
    "compare.calculating": "সেরা রুট হিসাব করা হচ্ছে…",
  },
  ur: {
    "nav.home": "ہوم",
    "nav.compare": "موازنہ",
    "nav.business": "کاروبار",
    "nav.blog": "بلاگ",
    "nav.about": "ہمارے بارے میں",
    "nav.contact": "رابطہ",
    "cta.talkSales": "سیلز سے بات کریں",
    "home.hero.ctaCompare": "FX کمپیریٹر آزمائیں",
    "compare.calculating": "بہترین راستے کا حساب…",
  },
  th: {
    "nav.home": "หน้าแรก",
    "nav.compare": "เปรียบเทียบ",
    "nav.business": "ธุรกิจ",
    "nav.blog": "บล็อก",
    "nav.about": "เกี่ยวกับเรา",
    "nav.contact": "ติดต่อ",
    "cta.talkSales": "ติดต่อฝ่ายขาย",
    "home.hero.ctaCompare": "ลองเครื่องเปรียบเทียบ FX",
    "compare.calculating": "กำลังคำนวณเส้นทางที่ดีที่สุด…",
  },
  hi: {
    "nav.home": "होम",
    "nav.compare": "तुलना करें",
    "nav.business": "व्यवसाय",
    "nav.blog": "ब्लॉग",
    "nav.about": "हमारे बारे में",
    "nav.contact": "संपर्क",
    "cta.talkSales": "बिक्री से बात करें",
    "home.hero.ctaCompare": "FX तुलनित्र आज़माएँ",
    "compare.calculating": "इष्टतम मार्ग गणना…",
  },
  zh: {
    "nav.home": "首页",
    "nav.compare": "比较",
    "nav.business": "企业",
    "nav.blog": "博客",
    "nav.about": "关于我们",
    "nav.contact": "联系我们",
    "cta.talkSales": "联系销售",
    "home.hero.ctaCompare": "试用外汇比较器",
    "compare.calculating": "正在计算最佳路径…",
  },
  id: {
    "nav.home": "Beranda",
    "nav.compare": "Bandingkan",
    "nav.business": "Bisnis",
    "nav.blog": "Blog",
    "nav.about": "Tentang",
    "nav.contact": "Kontak",
    "cta.talkSales": "Hubungi Sales",
    "home.hero.ctaCompare": "Coba Komparator FX",
    "compare.calculating": "Menghitung jalur optimal…",
  },
  tl: {
    "nav.home": "Tahanan",
    "nav.compare": "Ihambing",
    "nav.business": "Negosyo",
    "nav.blog": "Blog",
    "nav.about": "Tungkol",
    "nav.contact": "Kontak",
    "cta.talkSales": "Makipag-usap sa Sales",
    "home.hero.ctaCompare": "Subukan ang FX Comparator",
    "compare.calculating": "Kinakalkula ang pinakamainam na ruta…",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.compare": "قارن",
    "nav.business": "الشركات",
    "nav.blog": "المدونة",
    "nav.about": "من نحن",
    "nav.contact": "اتصل بنا",
    "cta.talkSales": "تحدث مع المبيعات",
    "home.hero.ctaCompare": "جرّب مقارن العملات",
    "compare.calculating": "حساب أفضل المسارات…",
  },
  vi: {
    "nav.home": "Trang chủ",
    "nav.compare": "So sánh",
    "nav.business": "Doanh nghiệp",
    "nav.blog": "Blog",
    "nav.about": "Giới thiệu",
    "nav.contact": "Liên hệ",
    "cta.talkSales": "Liên hệ kinh doanh",
    "home.hero.ctaCompare": "Thử công cụ so sánh FX",
    "compare.calculating": "Đang tính toán lộ trình tối ưu…",
  },
  ja: {
    "nav.home": "ホーム",
    "nav.compare": "比較",
    "nav.business": "法人",
    "nav.blog": "ブログ",
    "nav.about": "会社情報",
    "nav.contact": "お問い合わせ",
    "cta.talkSales": "営業担当に相談",
    "home.hero.ctaCompare": "FX コンパレーターを試す",
    "compare.calculating": "最適なルートを計算中…",
  },
  ko: {
    "nav.home": "홈",
    "nav.compare": "비교",
    "nav.business": "기업",
    "nav.blog": "블로그",
    "nav.about": "회사 소개",
    "nav.contact": "문의",
    "cta.talkSales": "영업팀 문의",
    "home.hero.ctaCompare": "FX 비교기 사용해보기",
    "compare.calculating": "최적 경로 계산 중…",
  },
};

// === Footer / Legal & Compliance localized keys (EN/ES/PT/IT/FR) ===
const COMPLIANCE_KEYS: Partial<Record<Lang, Dict>> = {
  en: {
    "footer.compliance": "Legal & Compliance",
    "footer.disclaimer":
      "mangomundi is a neutral information and decision-engine platform. Our AI tooling does not constitute financial, tax, or investment advice. We do not custody client funds; all transfers settle directly with the regulated provider chosen by the user. Foreign-exchange rates fluctuate continuously and users bear the full FX, settlement, and counterparty risk of any transaction.",
    "legal.terms.title": "Terms of Service",
    "legal.terms.intro":
      "Mangomundi operates as a neutral information and decision-engine platform that aggregates publicly available FX rates and provider data. We do not hold client funds, do not execute transfers, and do not act as a money transmitter.",
    "legal.risk.title": "Risk Disclosure",
    "legal.risk.intro":
      "Foreign-exchange rates fluctuate continuously. The mid-market reference rate shown is indicative and may change between the time a comparison is generated and the time a provider executes the transfer. Users bear the full FX, settlement, and counterparty risk of any transaction.",
  },
  es: {
    "footer.compliance": "Legal & Cumplimiento",
    "footer.disclaimer":
      "mangomundi es una plataforma neutral de información y motor de decisión. Nuestras herramientas de IA no constituyen asesoramiento financiero, fiscal ni de inversión. No custodiamos fondos de clientes; todas las transferencias se liquidan directamente con el proveedor regulado elegido por el usuario. Los tipos de cambio fluctúan continuamente y el usuario asume el riesgo cambiario, de liquidación y de contraparte.",
    "legal.terms.title": "Términos del Servicio",
    "legal.terms.intro":
      "mangomundi opera como una plataforma neutral de información y motor de decisión que agrega tasas FX y datos de proveedores disponibles públicamente. No custodiamos fondos de clientes, no ejecutamos transferencias y no actuamos como transmisor de dinero.",
    "legal.risk.title": "Divulgación de Riesgos",
    "legal.risk.intro":
      "Los tipos de cambio fluctúan continuamente. La tasa mid-market mostrada es indicativa y puede variar entre el momento de la comparación y la ejecución por parte del proveedor. El usuario asume íntegramente el riesgo cambiario, de liquidación y de contraparte.",
  },
  pt: {
    "footer.compliance": "Legal & Compliance",
    "footer.disclaimer":
      "mangomundi é uma plataforma neutra de informação e motor de decisão. Nossas ferramentas de IA não constituem aconselhamento financeiro, fiscal ou de investimento. Não custodiamos fundos de clientes; todas as transferências são liquidadas diretamente com o provedor regulado escolhido pelo usuário. As taxas de câmbio flutuam continuamente e o usuário assume o risco cambial, de liquidação e de contraparte.",
    "legal.terms.title": "Termos de Serviço",
    "legal.terms.intro":
      "mangomundi opera como uma plataforma neutra de informação e motor de decisão que agrega taxas FX e dados de provedores publicamente disponíveis. Não custodiamos fundos, não executamos transferências e não atuamos como transmissor de dinheiro.",
    "legal.risk.title": "Divulgação de Risco",
    "legal.risk.intro":
      "As taxas de câmbio flutuam continuamente. A taxa mid-market exibida é indicativa e pode variar entre o momento da comparação e a execução pelo provedor. O usuário assume integralmente o risco cambial, de liquidação e de contraparte.",
  },
  it: {
    "footer.compliance": "Legal & Compliance",
    "footer.disclaimer":
      "mangomundi è una piattaforma neutrale di informazione e motore decisionale. I nostri strumenti di IA non costituiscono consulenza finanziaria, fiscale o di investimento. Non deteniamo fondi dei clienti; tutti i trasferimenti vengono regolati direttamente con il fornitore regolamentato scelto dall'utente. I tassi di cambio fluttuano costantemente e l'utente assume integralmente il rischio cambio, di regolamento e di controparte.",
    "legal.terms.title": "Termini di Servizio",
    "legal.terms.intro":
      "mangomundi opera come piattaforma neutrale di informazione e motore decisionale che aggrega tassi FX e dati di fornitori pubblicamente disponibili. Non deteniamo fondi, non eseguiamo trasferimenti e non agiamo come trasmettitore di denaro.",
    "legal.risk.title": "Informativa sul Rischio",
    "legal.risk.intro":
      "I tassi di cambio fluttuano costantemente. Il tasso mid-market mostrato è indicativo e può variare tra il momento della comparazione e l'esecuzione da parte del fornitore. L'utente assume integralmente il rischio cambio, di regolamento e di controparte.",
  },
  fr: {
    "footer.compliance": "Légal & Conformité",
    "footer.disclaimer":
      "mangomundi est une plateforme neutre d'information et un moteur de décision. Nos outils d'IA ne constituent pas un conseil financier, fiscal ou en investissement. Nous ne détenons pas de fonds clients ; tous les transferts sont réglés directement avec le prestataire régulé choisi par l'utilisateur. Les taux de change fluctuent continuellement et l'utilisateur assume intégralement le risque de change, de règlement et de contrepartie.",
    "legal.terms.title": "Conditions d'utilisation",
    "legal.terms.intro":
      "mangomundi opère comme une plateforme neutre d'information et un moteur de décision agrégeant les taux FX et données de prestataires publiquement disponibles. Nous ne détenons pas de fonds, n'exécutons pas de transferts et n'agissons pas comme transmetteur d'argent.",
    "legal.risk.title": "Information sur les Risques",
    "legal.risk.intro":
      "Les taux de change fluctuent continuellement. Le taux mid-market affiché est indicatif et peut varier entre la comparaison et l'exécution par le prestataire. L'utilisateur assume intégralement le risque de change, de règlement et de contrepartie.",
  },
};

// === Manifesto / Company story localized keys (EN/ES/PT/IT/FR) ===
const MANIFESTO_KEYS: Partial<Record<Lang, Dict>> = {
  en: {
    "about.manifesto.headline":
      "Intelligent currency exchange decisions. AI Agent for global and local payments. Best rates for individuals and businesses.",
    "about.manifesto.kicker": "// company manifesto",
    "about.manifesto.missionTitle": "$ Our Mission",
    "about.manifesto.missionText":
      "Democratise access to the best foreign exchange decisions through neutral, AI-powered intelligence — eliminating information asymmetry and hidden costs from global payments.",
    "about.manifesto.visionTitle": "$ Our Vision",
    "about.manifesto.visionText":
      "A world where every local FX or cross-border payment — from a family remittance to a multinational treasury operation — runs through a transparent, auditable, and equitable decision layer.",
    "about.manifesto.problemTitle": "$ The Problem",
    "about.manifesto.problemText":
      "While analysing the global FX market, our team uncovered a two-sided inefficiency. On one side, retail clients sending remittances and businesses managing cross-border flows face a frustrating maze: they never know with certainty if they are getting the best rate, trapped by hidden costs and opaque structures they cannot control or understand. On the other side, competitive financial institutions are eager to acquire these volume-generating clients, yet high acquisition costs and fragmented channels prevent them from reaching them effectively. mangomundi ends this mismatch by building an infrastructure where AI agents scan the market impartially and enable regulated institutions to submit real-time counter-offers to improve the price at that exact moment.",
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
      "Al analizar el mercado global de FX, nuestro equipo descubrió una ineficiencia de doble capa. Por un lado, los clientes retail que envían remesas y las empresas que gestionan flujos transfronterizos enfrentan un laberinto frustrante: nunca saben con certeza si obtienen la mejor tasa, atrapados por costos ocultos y estructuras opacas que no pueden controlar ni comprender. Por otro lado, las instituciones financieras competitivas están deseosas de adquirir estos clientes que generan volumen, pero los altos costos de adquisición y los canales fragmentados les impiden llegar a ellos eficazmente. mangomundi pone fin a este desajuste creando una infraestructura donde agentes de IA escrutan el mercado de forma imparcial y permiten a las instituciones reguladas ofrecer contraofertas en tiempo real para mejorar el precio en ese instante exacto.",
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
      "Ao analisar o mercado global de FX, nossa equipe descobriu uma ineficiência de dupla camada. De um lado, os clientes retail que enviam remessas e as empresas que gerenciam fluxos transfronteiriços enfrentam um labirinto frustrante: nunca sabem com certeza se obtêm a melhor taxa, presos por custos ocultos e estruturas opacas que não conseguem controlar nem compreender. Do outro lado, as instituições financeiras competitivas estão ansiosas para adquirir esses clientes geradores de volume, mas os altos custos de aquisição e os canais fragmentados as impedem de alcançá-los eficazmente. A mangomundi põe fim a esse desajuste construindo uma infraestrutura onde agentes de IA examinam o mercado de forma imparcial e permitem às instituições reguladas apresentar contrapropostas em tempo real para melhorar o preço naquele exato momento.",
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
      "Analizzando il mercato globale FX, il nostro team ha scoperto un'inefficienza a doppio strato. Da un lato, i clienti retail che inviano rimesse e le aziende che gestiscono flussi transfrontalieri affrontano un labirinto frustrante: non sanno mai con certezza se ottengono il miglior tasso, intrappolati da costi nascosti e strutture opache che non possono controllare né comprendere. Dall'altro lato, le istituzioni finanziarie competitive desiderano acquisire questi clienti generatori di volume, ma gli alti costi di acquisizione e i canali frammentati impediscono loro di raggiungerli efficacemente. mangomundi pone fine a questo disallineamento costruendo un'infrastruttura in cui agenti di IA scrutinano il mercato in modo imparziale e permettono alle istituzioni regolamentate di presentare controfferte in tempo reale per migliorare il prezzo in quell'esatto istante.",
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
      "En analysant le marché global du FX, notre équipe a identifié une inefficience à double couche. D'un côté, les clients retail envoyant des remises et les entreprises gérant des flux transfrontaliers affrontent un labyrinthe frustrant : ils ne savent jamais avec certitude s'ils obtiennent le meilleur taux, piégés par des coûts cachés et des structures opaques qu'ils ne peuvent ni contrôler ni comprendre. De l'autre côté, les institutions financières compétitives souhaitent acquérir ces clients générateurs de volume, mais des coûts d'acquisition élevés et des canaux fragmentés les empêchent de les atteindre efficacement. mangomundi met fin à ce désalignement en construisant une infrastructure où des agents IA scrutent le marché de manière impartiale et permettent aux institutions régulées de soumettre des contre-offres en temps réel pour améliorer le prix à cet instant précis.",
    "about.manifesto.chapterMission": "01 · Mission",
    "about.manifesto.chapterVision": "02 · Vision",
    "about.manifesto.chapterProblem": "03 · Inefficience du Marché",
  },
};

// === Legal pages + Business / Strategy Validation Lab localized keys ===
// Translations provided for EN/ES/PT/IT/FR/DE/ZH/JA/KO/AR/HI.
// Languages without an entry fall back to EN automatically via t().
const LEGAL_BUSINESS_KEYS: Partial<Record<Lang, Dict>> = {
  en: {
    "legal.lastUpdated": "Last updated: 07/06/2026",
    "legal.terms.s1.title": "Nature of the Platform",
    "legal.terms.s1.body":
      "mangomundi operates as a neutral information and decision-engine platform. We do not custody client funds, transmit money, or act as a money-services business. All comparisons, routing suggestions, and analytics are generated algorithmically for informational purposes only. Execution and settlement occur directly between the user and the regulated third-party provider selected by the user.",
    "legal.terms.s2.title": "Disclaimer",
    "legal.terms.s2.body":
      "The AI-powered tools, market analytics, and routing recommendations provided on this platform do not constitute financial, tax, legal, or investment advice. Users are solely responsible for conducting their own due diligence and for verifying the regulatory status, pricing, and terms of any provider before initiating a transfer. mangomundi makes no representation or warranty regarding the accuracy, completeness, or timeliness of any data shown.",
    "legal.terms.s3.title": "Compensation Disclosure",
    "legal.terms.s3.body":
      "mangomundi may receive commissions or referral fees from regulated providers for transactions facilitated through the platform. This compensation is received at no additional cost to the user and does not influence the neutrality of the comparison algorithm. Providers are ranked exclusively on objective cost, speed, and reliability metrics derived from real-time market data.",
    "legal.terms.s4.title": "Limitation of Liability",
    "legal.terms.s4.body":
      "To the maximum extent permitted by applicable law, mangomundi and its affiliates, officers, employees, and agents shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or relating to the use of the platform. This includes, without limitation, losses resulting from foreign-exchange rate fluctuations, transfer delays, provider insolvency, technical failures, or errors in algorithmic recommendations.",
    "legal.terms.s5.title": "Contact",
    "legal.terms.s5.body":
      "For questions, clarifications, or regulatory inquiries regarding these Terms of Service, please contact",
    "legal.risk.s1.title": "FX Market Risk",
    "legal.risk.s1.body":
      "Foreign-exchange rates fluctuate continuously and unpredictably. The mid-market reference rates displayed on this platform are indicative estimates sourced from wholesale interbank data and may deviate from the actual execution rate offered by the provider. Users bear the full foreign-exchange risk of any transaction, including the risk that the rate may move adversely between the time a comparison is generated and the time the provider executes the transfer.",
    "legal.risk.s2.title": "Provider, Settlement, and Counterparty Risk",
    "legal.risk.s2.body":
      "mangomundi does not custody funds. All transfers settle directly with the regulated provider selected by the user. Users are exposed to the solvency, operational reliability, and regulatory status of that provider. It is the user's responsibility to verify licensing, regulatory standing, and financial health in the relevant jurisdictions before sending funds. mangomundi assumes no liability for provider failure, settlement delays, or loss of funds.",
    "legal.risk.s3.title": "AI-Assisted Routing Risk",
    "legal.risk.s3.body":
      "AI-assisted routing recommendations are decision-support tools based on indexed liquidity paths, retail remittance channels, flat-fee optimisation models, and real-time interbank rates. Actual delivery times, intermediary bank fees, correspondent banking charges, and beneficiary receipt amounts may vary materially from the estimates presented. Users should confirm all final terms directly with the chosen provider before execution.",
    "legal.risk.s4.title": "Sanctions and Regulatory Compliance",
    "legal.risk.s4.body":
      "Users are solely responsible for ensuring that any cross-border transfer complies with applicable sanctions regimes, anti-money laundering (AML) laws, know-your-customer (KYC) requirements, and cross-border reporting obligations in their jurisdiction. mangomundi does not facilitate transactions to embargoed jurisdictions or sanctioned counterparties. Violations may result in frozen funds, regulatory penalties, or criminal liability.",
    "business.badge": "For institutions & corporate treasury",
    "business.hero.title.1": "Institutional Routing &",
    "business.hero.title.2": "Strategy Validation.",
    "business.hero.subtitle":
      "Architected for high-volume cross-border analysis and neutral flow optimization. Eliminate hidden variance and validate institutional routing mechanics before execution.",
    "business.pillar.lab.title": "Strategy Validation Lab",
    "business.pillar.lab.body":
      "Validate multi-currency routing models and analyze performance metrics via simulated equity curves and detailed AI justification logs under strict neutrality.",
    "business.pillar.flow.title": "Flow Optimization Engine",
    "business.pillar.flow.body":
      "Cross-reference execution corridors to ensure capital reaches destination accounts via the mathematical optimum, minimizing friction and variable markups.",
    "business.pillar.rfq.title": "Corporate Discretion (RFQ)",
    "business.pillar.rfq.body":
      "High-value operations are managed through a private, non-custodial RFQ protocol designed to protect institutional order flow from front-running.",
    "business.rfqNote":
      "We do not charge subscription fees. Our model focuses exclusively on absolute routing transparency. The institutional desk is open below.",
  },
  es: {
    "legal.lastUpdated": "Última actualización: 07/06/2026",
    "legal.terms.s1.title": "Naturaleza de la Plataforma",
    "legal.terms.s1.body":
      "mangomundi opera como una plataforma neutral de información y motor de decisión. No custodiamos fondos de clientes, no transmitimos dinero ni actuamos como entidad de servicios monetarios. Todas las comparaciones, sugerencias de enrutamiento y analíticas se generan algorítmicamente con fines exclusivamente informativos. La ejecución y liquidación ocurren directamente entre el usuario y el proveedor regulado seleccionado.",
    "legal.terms.s2.title": "Aviso Legal",
    "legal.terms.s2.body":
      "Las herramientas de IA, analíticas de mercado y recomendaciones de enrutamiento no constituyen asesoramiento financiero, fiscal, legal ni de inversión. El usuario es el único responsable de realizar su propia diligencia debida y verificar el estatus regulatorio, precios y términos de cualquier proveedor antes de iniciar una transferencia. mangomundi no garantiza la exactitud, integridad ni vigencia de los datos mostrados.",
    "legal.terms.s3.title": "Divulgación de Compensación",
    "legal.terms.s3.body":
      "mangomundi puede recibir comisiones o tarifas de referencia de proveedores regulados por transacciones facilitadas a través de la plataforma. Esta compensación se recibe sin costo adicional para el usuario y no influye en la neutralidad del algoritmo de comparación. Los proveedores se clasifican exclusivamente por métricas objetivas de coste, velocidad y fiabilidad derivadas de datos de mercado en tiempo real.",
    "legal.terms.s4.title": "Limitación de Responsabilidad",
    "legal.terms.s4.body":
      "En la máxima medida permitida por la ley aplicable, mangomundi y sus filiales, directivos, empleados y agentes no serán responsables por daños directos, indirectos, incidentales, especiales, consecuentes o punitivos derivados o relacionados con el uso de la plataforma. Esto incluye, sin limitación, pérdidas resultantes de fluctuaciones cambiarias, retrasos en transferencias, insolvencia de proveedores, fallos técnicos o errores en recomendaciones algorítmicas.",
    "legal.terms.s5.title": "Contacto",
    "legal.terms.s5.body":
      "Para consultas, aclaraciones o requerimientos regulatorios sobre estos Términos del Servicio, contactar a",
    "legal.risk.s1.title": "Riesgo de Mercado FX",
    "legal.risk.s1.body":
      "Los tipos de cambio fluctúan de forma continua e impredecible. Las tasas mid-market mostradas en esta plataforma son estimaciones indicativas basadas en datos interbancarios mayoristas y pueden diferir de la tasa de ejecución real ofrecida por el proveedor. El usuario asume íntegramente el riesgo cambiario de cualquier transacción, incluido el riesgo de movimientos adversos entre la comparación y la ejecución.",
    "legal.risk.s2.title": "Riesgo de Proveedor, Liquidación y Contraparte",
    "legal.risk.s2.body":
      "mangomundi no custodia fondos. Todas las transferencias se liquidan directamente con el proveedor regulado seleccionado por el usuario. El usuario queda expuesto a la solvencia, fiabilidad operativa y estatus regulatorio de dicho proveedor. Es responsabilidad del usuario verificar licencias, situación regulatoria y salud financiera en las jurisdicciones relevantes antes de enviar fondos. mangomundi no asume responsabilidad por fallos del proveedor, retrasos en la liquidación o pérdida de fondos.",
    "legal.risk.s3.title": "Riesgo de Enrutamiento Asistido por IA",
    "legal.risk.s3.body":
      "Las recomendaciones de enrutamiento asistido por IA son herramientas de apoyo a la decisión basadas en rutas de liquidez indexadas, canales de remesas retail, modelos de optimización por comisión plana y tasas interbancarias en tiempo real. Los tiempos de entrega reales, comisiones de bancos intermediarios, cargos de banca corresponsal e importes recibidos por el beneficiario pueden variar materialmente respecto a las estimaciones presentadas. El usuario debe confirmar las condiciones finales directamente con el proveedor antes de ejecutar.",
    "legal.risk.s4.title": "Sanciones y Cumplimiento Regulatorio",
    "legal.risk.s4.body":
      "El usuario es el único responsable de garantizar que cualquier transferencia transfronteriza cumple con los regímenes de sanciones aplicables, leyes de prevención de blanqueo (AML), requisitos KYC y obligaciones de reporte transfronterizo en su jurisdicción. mangomundi no facilita transacciones hacia jurisdicciones embargadas ni contrapartes sancionadas. Las infracciones pueden derivar en congelamiento de fondos, sanciones regulatorias o responsabilidad penal.",
    "business.badge": "Para instituciones y tesorería corporativa",
    "business.hero.title.1": "Enrutamiento Institucional y",
    "business.hero.title.2": "Validación de Estrategia.",
    "business.hero.subtitle":
      "Diseñado para análisis transfronterizo de alto volumen y optimización neutral de flujos. Elimina la varianza oculta y valida la mecánica de enrutamiento institucional antes de ejecutar.",
    "business.pillar.lab.title": "Laboratorio de Validación de Estrategia",
    "business.pillar.lab.body":
      "Valida modelos de enrutamiento multidivisa y analiza métricas de desempeño mediante curvas de equity simuladas y registros detallados de justificación de la IA bajo estricta neutralidad.",
    "business.pillar.flow.title": "Motor de Optimización de Flujo",
    "business.pillar.flow.body":
      "Cruza corredores de ejecución para garantizar que el capital llegue a las cuentas destino por la ruta matemáticamente óptima, minimizando fricción y márgenes variables.",
    "business.pillar.rfq.title": "Discreción Corporativa (RFQ)",
    "business.pillar.rfq.body":
      "Las operaciones de alto valor se gestionan mediante un protocolo RFQ privado y no custodial, diseñado para proteger el flujo institucional del front-running.",
    "business.rfqNote":
      "No cobramos cuotas de suscripción. Nuestro modelo se centra exclusivamente en transparencia absoluta de enrutamiento. La mesa institucional está abierta a continuación.",
  },
  pt: {
    "legal.lastUpdated": "Última atualização: 07/06/2026",
    "legal.terms.s1.title": "Natureza da Plataforma",
    "legal.terms.s1.body":
      "mangomundi opera como uma plataforma neutra de informação e motor de decisão. Não custodiamos fundos, não transmitimos dinheiro e não atuamos como prestador de serviços monetários. Todas as comparações, sugestões de roteamento e analíticas são geradas algoritmicamente apenas para fins informativos. A execução e liquidação ocorrem diretamente entre o usuário e o provedor regulado selecionado.",
    "legal.terms.s2.title": "Aviso Legal",
    "legal.terms.s2.body":
      "As ferramentas de IA, analíticas de mercado e recomendações de roteamento não constituem aconselhamento financeiro, fiscal, jurídico ou de investimento. O usuário é o único responsável por sua própria diligência e por verificar o status regulatório, preços e termos de qualquer provedor antes de iniciar uma transferência. mangomundi não garante a exatidão, integridade ou atualidade dos dados exibidos.",
    "legal.terms.s3.title": "Divulgação de Remuneração",
    "legal.terms.s3.body":
      "mangomundi pode receber comissões ou taxas de indicação de provedores regulados por transações facilitadas através da plataforma. Esta remuneração é recebida sem custo adicional para o usuário e não influencia a neutralidade do algoritmo de comparação. Os provedores são classificados exclusivamente por métricas objetivas de custo, velocidade e confiabilidade derivadas de dados de mercado em tempo real.",
    "legal.terms.s4.title": "Limitação de Responsabilidade",
    "legal.terms.s4.body":
      "Na máxima extensão permitida pela lei aplicável, mangomundi e suas afiliadas, diretores, funcionários e agentes não serão responsáveis por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes ou relacionados ao uso da plataforma. Isto inclui, sem limitação, perdas resultantes de flutuações cambiais, atrasos em transferências, insolvência de provedores, falhas técnicas ou erros em recomendações algorítmicas.",
    "legal.terms.s5.title": "Contato",
    "legal.terms.s5.body":
      "Para perguntas, esclarecimentos ou consultas regulatórias sobre estes Termos de Serviço, entre em contato com",
    "legal.risk.s1.title": "Risco de Mercado FX",
    "legal.risk.s1.body":
      "As taxas de câmbio flutuam de forma contínua e imprevisível. As taxas mid-market exibidas nesta plataforma são estimativas indicativas baseadas em dados interbancários atacadistas e podem divergir da taxa real oferecida pelo provedor. O usuário assume integralmente o risco cambial de qualquer transação, incluindo o risco de movimentos adversos entre a comparação e a execução.",
    "legal.risk.s2.title": "Risco de Provedor, Liquidação e Contraparte",
    "legal.risk.s2.body":
      "mangomundi não custodia fundos. Todas as transferências são liquidadas diretamente com o provedor regulado selecionado. O usuário fica exposto à solvência, confiabilidade operacional e status regulatório desse provedor. É responsabilidade do usuário verificar licenciamento, situação regulatória e saúde financeira nas jurisdições relevantes antes de enviar fundos. mangomundi não assume responsabilidade por falha do provedor, atrasos na liquidação ou perda de fundos.",
    "legal.risk.s3.title": "Risco de Roteamento Assistido por IA",
    "legal.risk.s3.body":
      "As recomendações de roteamento assistido por IA são ferramentas de apoio à decisão baseadas em rotas de liquidez indexadas, canais de remessa de varejo, modelos de otimização por tarifa fixa e taxas interbancárias em tempo real. Os prazos reais, tarifas de bancos intermediários, encargos de banco correspondente e valores recebidos podem variar materialmente em relação às estimativas. O usuário deve confirmar os termos finais diretamente com o provedor antes da execução.",
    "legal.risk.s4.title": "Sanções e Conformidade Regulatória",
    "legal.risk.s4.body":
      "O usuário é o único responsável por garantir que qualquer transferência transfronteiriça cumpra os regimes de sanções aplicáveis, leis antilavagem (AML), requisitos KYC e obrigações de reporte em sua jurisdição. mangomundi não facilita transações para jurisdições embargadas ou contrapartes sancionadas. Violações podem resultar em congelamento de fundos, sanções regulatórias ou responsabilidade criminal.",
    "business.badge": "Para instituições e tesouraria corporativa",
    "business.hero.title.1": "Roteamento Institucional e",
    "business.hero.title.2": "Validação de Estratégia.",
    "business.hero.subtitle":
      "Projetado para análise transfronteiriça de alto volume e otimização neutra de fluxos. Elimine a variância oculta e valide a mecânica de roteamento institucional antes da execução.",
    "business.pillar.lab.title": "Laboratório de Validação de Estratégia",
    "business.pillar.lab.body":
      "Valide modelos de roteamento multimoeda e analise métricas de desempenho via curvas de equity simuladas e registros detalhados de justificação da IA sob estrita neutralidade.",
    "business.pillar.flow.title": "Motor de Otimização de Fluxo",
    "business.pillar.flow.body":
      "Cruze corredores de execução para garantir que o capital chegue às contas de destino pela rota matematicamente ótima, minimizando atrito e margens variáveis.",
    "business.pillar.rfq.title": "Discrição Corporativa (RFQ)",
    "business.pillar.rfq.body":
      "Operações de alto valor são geridas por um protocolo RFQ privado e não-custodial, projetado para proteger o fluxo institucional contra front-running.",
    "business.rfqNote":
      "Não cobramos taxas de assinatura. Nosso modelo foca exclusivamente em transparência absoluta de roteamento. A mesa institucional está aberta abaixo.",
  },
  it: {
    "legal.lastUpdated": "Ultimo aggiornamento: 07/06/2026",
    "legal.terms.s1.title": "Natura della Piattaforma",
    "legal.terms.s1.body":
      "mangomundi opera come piattaforma neutrale di informazione e motore decisionale. Non deteniamo fondi dei clienti, non trasmettiamo denaro e non agiamo come prestatore di servizi monetari. Tutti i confronti, suggerimenti di routing e analisi sono generati algoritmicamente a soli fini informativi. Esecuzione e regolamento avvengono direttamente tra utente e fornitore regolamentato selezionato.",
    "legal.terms.s2.title": "Avvertenza",
    "legal.terms.s2.body":
      "Gli strumenti di IA, le analisi di mercato e le raccomandazioni di routing non costituiscono consulenza finanziaria, fiscale, legale o di investimento. L'utente è l'unico responsabile della propria due diligence e della verifica dello status regolamentare, dei prezzi e dei termini di qualsiasi fornitore prima di avviare un trasferimento. mangomundi non garantisce l'accuratezza, completezza o tempestività dei dati mostrati.",
    "legal.terms.s3.title": "Informativa sui Compensi",
    "legal.terms.s3.body":
      "mangomundi può ricevere commissioni o fee di referral da fornitori regolamentati per transazioni facilitate tramite la piattaforma. Tale compenso non comporta costi aggiuntivi per l'utente e non influenza la neutralità dell'algoritmo di confronto. I fornitori sono classificati esclusivamente in base a metriche oggettive di costo, velocità e affidabilità derivate da dati di mercato in tempo reale.",
    "legal.terms.s4.title": "Limitazione di Responsabilità",
    "legal.terms.s4.body":
      "Nella massima misura consentita dalla legge applicabile, mangomundi e le sue affiliate, dirigenti, dipendenti e agenti non saranno responsabili per danni diretti, indiretti, incidentali, speciali, consequenziali o punitivi derivanti dall'uso della piattaforma. Sono incluse, senza limitazione, perdite dovute a fluttuazioni cambiarie, ritardi, insolvenza dei fornitori, guasti tecnici o errori nelle raccomandazioni algoritmiche.",
    "legal.terms.s5.title": "Contatti",
    "legal.terms.s5.body":
      "Per domande, chiarimenti o richieste regolamentari relative a questi Termini di Servizio, contattare",
    "legal.risk.s1.title": "Rischio di Mercato FX",
    "legal.risk.s1.body":
      "I tassi di cambio fluttuano in modo continuo e imprevedibile. I tassi mid-market mostrati su questa piattaforma sono stime indicative basate su dati interbancari all'ingrosso e possono differire dal tasso effettivo offerto dal fornitore. L'utente si assume integralmente il rischio di cambio di qualsiasi transazione, incluso il rischio di movimenti sfavorevoli tra il confronto e l'esecuzione.",
    "legal.risk.s2.title": "Rischio Fornitore, Regolamento e Controparte",
    "legal.risk.s2.body":
      "mangomundi non detiene fondi. Tutti i trasferimenti vengono regolati direttamente con il fornitore regolamentato selezionato. L'utente è esposto alla solvibilità, affidabilità operativa e status regolamentare del fornitore. È responsabilità dell'utente verificare licenze, situazione regolamentare e salute finanziaria nelle giurisdizioni rilevanti prima dell'invio. mangomundi non si assume responsabilità per guasti del fornitore, ritardi o perdita di fondi.",
    "legal.risk.s3.title": "Rischio del Routing Assistito da IA",
    "legal.risk.s3.body":
      "Le raccomandazioni di routing assistito da IA sono strumenti di supporto decisionale basati su percorsi di liquidità indicizzati, canali di rimesse retail, modelli di ottimizzazione a commissione fissa e tassi interbancari in tempo reale. Tempi effettivi, commissioni intermediarie, oneri di banca corrispondente e importi ricevuti possono variare in modo sostanziale rispetto alle stime. L'utente deve confermare le condizioni finali direttamente con il fornitore prima dell'esecuzione.",
    "legal.risk.s4.title": "Sanzioni e Conformità Regolamentare",
    "legal.risk.s4.body":
      "L'utente è l'unico responsabile di garantire che qualsiasi trasferimento transfrontaliero rispetti i regimi sanzionatori applicabili, le leggi antiriciclaggio (AML), i requisiti KYC e gli obblighi di segnalazione transfrontaliera nella propria giurisdizione. mangomundi non facilita transazioni verso giurisdizioni soggette a embargo o controparti sanzionate. Le violazioni possono comportare congelamento fondi, sanzioni regolamentari o responsabilità penale.",
    "business.badge": "Per istituzioni e tesoreria aziendale",
    "business.hero.title.1": "Routing Istituzionale e",
    "business.hero.title.2": "Validazione della Strategia.",
    "business.hero.subtitle":
      "Progettato per analisi transfrontaliera ad alto volume e ottimizzazione neutrale dei flussi. Elimina la varianza nascosta e valida la meccanica di routing istituzionale prima dell'esecuzione.",
    "business.pillar.lab.title": "Laboratorio di Validazione della Strategia",
    "business.pillar.lab.body":
      "Valida modelli di routing multivaluta e analizza metriche di performance tramite curve di equity simulate e log dettagliati di giustificazione dell'IA, in stretta neutralità.",
    "business.pillar.flow.title": "Motore di Ottimizzazione del Flusso",
    "business.pillar.flow.body":
      "Incrocia i corridoi di esecuzione per garantire che il capitale raggiunga i conti destinatari attraverso l'ottimo matematico, minimizzando attriti e markup variabili.",
    "business.pillar.rfq.title": "Discrezione Aziendale (RFQ)",
    "business.pillar.rfq.body":
      "Le operazioni ad alto valore sono gestite tramite un protocollo RFQ privato e non-custodial, progettato per proteggere il flusso istituzionale dal front-running.",
    "business.rfqNote":
      "Non addebitiamo canoni di abbonamento. Il nostro modello si concentra esclusivamente sulla trasparenza assoluta del routing. Il desk istituzionale è aperto qui sotto.",
  },
  fr: {
    "legal.lastUpdated": "Dernière mise à jour : 07/06/2026",
    "legal.terms.s1.title": "Nature de la Plateforme",
    "legal.terms.s1.body":
      "mangomundi opère comme une plateforme neutre d'information et un moteur de décision. Nous ne détenons pas les fonds des clients, ne transmettons pas d'argent et n'agissons pas comme prestataire de services monétaires. Toutes les comparaisons, suggestions de routage et analyses sont générées algorithmiquement à des fins purement informatives. L'exécution et le règlement s'effectuent directement entre l'utilisateur et le prestataire régulé sélectionné.",
    "legal.terms.s2.title": "Avertissement",
    "legal.terms.s2.body":
      "Les outils d'IA, analyses de marché et recommandations de routage ne constituent pas un conseil financier, fiscal, juridique ou en investissement. L'utilisateur est seul responsable de sa diligence raisonnable et de la vérification du statut réglementaire, des prix et des conditions de tout prestataire avant d'initier un transfert. mangomundi ne garantit ni l'exactitude, ni l'exhaustivité, ni l'actualité des données affichées.",
    "legal.terms.s3.title": "Divulgation de Rémunération",
    "legal.terms.s3.body":
      "mangomundi peut percevoir des commissions ou frais d'apporteur d'affaires de prestataires régulés pour les transactions facilitées via la plateforme. Cette rémunération est perçue sans coût additionnel pour l'utilisateur et n'influence pas la neutralité de l'algorithme de comparaison. Les prestataires sont classés exclusivement selon des métriques objectives de coût, vitesse et fiabilité issues de données de marché en temps réel.",
    "legal.terms.s4.title": "Limitation de Responsabilité",
    "legal.terms.s4.body":
      "Dans la mesure maximale autorisée par la loi applicable, mangomundi et ses affiliés, dirigeants, employés et agents ne seront pas responsables des dommages directs, indirects, accessoires, spéciaux, consécutifs ou punitifs liés à l'usage de la plateforme. Cela inclut, sans limitation, les pertes résultant de fluctuations de change, retards, insolvabilité du prestataire, défaillances techniques ou erreurs des recommandations algorithmiques.",
    "legal.terms.s5.title": "Contact",
    "legal.terms.s5.body":
      "Pour toute question, clarification ou demande réglementaire concernant ces Conditions d'utilisation, veuillez contacter",
    "legal.risk.s1.title": "Risque de Marché FX",
    "legal.risk.s1.body":
      "Les taux de change fluctuent en continu et de façon imprévisible. Les taux mid-market affichés sur cette plateforme sont des estimations indicatives basées sur des données interbancaires de gros et peuvent différer du taux réel proposé par le prestataire. L'utilisateur assume intégralement le risque de change de toute transaction, y compris le risque de mouvements défavorables entre la comparaison et l'exécution.",
    "legal.risk.s2.title": "Risque Prestataire, Règlement et Contrepartie",
    "legal.risk.s2.body":
      "mangomundi ne détient pas de fonds. Tous les transferts sont réglés directement avec le prestataire régulé sélectionné. L'utilisateur est exposé à la solvabilité, la fiabilité opérationnelle et le statut réglementaire de ce prestataire. Il appartient à l'utilisateur de vérifier les licences, la situation réglementaire et la santé financière dans les juridictions concernées avant d'envoyer des fonds. mangomundi n'assume aucune responsabilité en cas de défaillance du prestataire, de retards ou de perte de fonds.",
    "legal.risk.s3.title": "Risque du Routage Assisté par IA",
    "legal.risk.s3.body":
      "Les recommandations de routage assisté par IA sont des outils d'aide à la décision basés sur des chemins de liquidité indexés, des canaux de remises retail, des modèles d'optimisation à commission forfaitaire et des taux interbancaires en temps réel. Les délais réels, frais des banques intermédiaires, charges de banque correspondante et montants reçus peuvent différer matériellement des estimations. L'utilisateur doit confirmer les conditions finales directement avec le prestataire avant l'exécution.",
    "legal.risk.s4.title": "Sanctions et Conformité Réglementaire",
    "legal.risk.s4.body":
      "L'utilisateur est seul responsable de garantir que tout transfert transfrontalier respecte les régimes de sanctions applicables, les lois anti-blanchiment (AML), les exigences KYC et les obligations de déclaration transfrontalière dans sa juridiction. mangomundi ne facilite pas les transactions vers des juridictions sous embargo ni vers des contreparties sanctionnées. Les infractions peuvent entraîner le gel des fonds, des sanctions réglementaires ou une responsabilité pénale.",
    "business.badge": "Pour les institutions et la trésorerie d'entreprise",
    "business.hero.title.1": "Routage Institutionnel &",
    "business.hero.title.2": "Validation de Stratégie.",
    "business.hero.subtitle":
      "Conçu pour l'analyse transfrontalière à fort volume et l'optimisation neutre des flux. Éliminez la variance cachée et validez la mécanique de routage institutionnel avant l'exécution.",
    "business.pillar.lab.title": "Laboratoire de Validation de Stratégie",
    "business.pillar.lab.body":
      "Validez des modèles de routage multidevises et analysez des métriques de performance via des courbes d'equity simulées et des journaux détaillés de justification de l'IA, en toute neutralité.",
    "business.pillar.flow.title": "Moteur d'Optimisation des Flux",
    "business.pillar.flow.body":
      "Croisez les corridors d'exécution pour garantir que le capital atteint les comptes de destination par l'optimum mathématique, en minimisant friction et marges variables.",
    "business.pillar.rfq.title": "Discrétion Corporative (RFQ)",
    "business.pillar.rfq.body":
      "Les opérations à haute valeur sont gérées via un protocole RFQ privé et non-custodial, conçu pour protéger le flux institutionnel contre le front-running.",
    "business.rfqNote":
      "Nous ne facturons pas d'abonnement. Notre modèle se concentre exclusivement sur la transparence absolue du routage. Le desk institutionnel est ouvert ci-dessous.",
  },
  de: {
    "legal.lastUpdated": "Zuletzt aktualisiert: 07.06.2026",
    "legal.terms.s1.title": "Art der Plattform",
    "legal.terms.s1.body":
      "mangomundi ist eine neutrale Informations- und Entscheidungsplattform. Wir verwahren keine Kundengelder, transferieren kein Geld und treten nicht als Zahlungsdienstleister auf. Alle Vergleiche, Routing-Vorschläge und Analysen werden ausschließlich zu Informationszwecken algorithmisch erzeugt. Ausführung und Abwicklung erfolgen direkt zwischen Nutzer und dem ausgewählten regulierten Anbieter.",
    "legal.terms.s2.title": "Haftungsausschluss",
    "legal.terms.s2.body":
      "Die KI-Tools, Marktanalysen und Routing-Empfehlungen stellen keine Finanz-, Steuer-, Rechts- oder Anlageberatung dar. Der Nutzer ist allein verantwortlich für seine eigene Sorgfaltsprüfung und die Verifizierung des regulatorischen Status, der Preise und Bedingungen jedes Anbieters vor einem Transfer. mangomundi gibt keine Zusicherung hinsichtlich Richtigkeit, Vollständigkeit oder Aktualität der angezeigten Daten.",
    "legal.terms.s3.title": "Vergütungsoffenlegung",
    "legal.terms.s3.body":
      "mangomundi kann Provisionen oder Vermittlungsgebühren von regulierten Anbietern für über die Plattform vermittelte Transaktionen erhalten. Diese Vergütung entsteht ohne Mehrkosten für den Nutzer und beeinflusst die Neutralität des Vergleichsalgorithmus nicht. Anbieter werden ausschließlich nach objektiven Kosten-, Geschwindigkeits- und Zuverlässigkeitsmetriken bewertet.",
    "legal.terms.s4.title": "Haftungsbeschränkung",
    "legal.terms.s4.body":
      "Im maximal gesetzlich zulässigen Umfang haften mangomundi sowie verbundene Unternehmen, Geschäftsführer, Mitarbeiter und Agenten nicht für direkte, indirekte, Neben-, Sonder-, Folge- oder Strafschäden, die sich aus der Nutzung der Plattform ergeben. Dies umfasst ohne Einschränkung Verluste aus Wechselkursschwankungen, Verzögerungen, Anbieterinsolvenz, technischen Ausfällen oder Fehlern algorithmischer Empfehlungen.",
    "legal.terms.s5.title": "Kontakt",
    "legal.terms.s5.body":
      "Für Fragen, Klarstellungen oder regulatorische Anfragen zu diesen Nutzungsbedingungen wenden Sie sich bitte an",
    "legal.risk.s1.title": "FX-Marktrisiko",
    "legal.risk.s1.body":
      "Wechselkurse schwanken kontinuierlich und unvorhersehbar. Die angezeigten Mid-Market-Referenzkurse sind indikative Schätzungen aus Großhandels-Interbankendaten und können vom tatsächlichen Ausführungskurs des Anbieters abweichen. Der Nutzer trägt das vollständige Wechselkursrisiko, einschließlich des Risikos ungünstiger Kursbewegungen zwischen Vergleich und Ausführung.",
    "legal.risk.s2.title": "Anbieter-, Settlement- und Kontrahentenrisiko",
    "legal.risk.s2.body":
      "mangomundi verwahrt keine Mittel. Alle Transfers werden direkt mit dem ausgewählten regulierten Anbieter abgewickelt. Der Nutzer ist der Solvenz, operativen Zuverlässigkeit und dem regulatorischen Status dieses Anbieters ausgesetzt. Es liegt in der Verantwortung des Nutzers, Lizenzierung und finanzielle Gesundheit in den relevanten Jurisdiktionen vor dem Versand zu prüfen. mangomundi übernimmt keine Haftung für Anbieterausfall, Settlement-Verzögerungen oder Mittelverluste.",
    "legal.risk.s3.title": "Risiko KI-gestützten Routings",
    "legal.risk.s3.body":
      "KI-gestützte Routing-Empfehlungen sind Entscheidungshilfen, basierend auf indexierten Liquiditätspfaden, Retail-Remittance-Kanälen, Flat-Fee-Optimierungsmodellen und Echtzeit-Interbankenkursen. Tatsächliche Laufzeiten, Gebühren von Korrespondenzbanken und beim Empfänger ankommende Beträge können erheblich abweichen. Der Nutzer sollte Endkonditionen direkt mit dem Anbieter bestätigen.",
    "legal.risk.s4.title": "Sanktionen und Regulatorische Compliance",
    "legal.risk.s4.body":
      "Der Nutzer ist allein dafür verantwortlich, dass jeder grenzüberschreitende Transfer mit anwendbaren Sanktionsregimen, Geldwäschegesetzen (AML), KYC-Anforderungen und grenzüberschreitenden Meldepflichten seiner Jurisdiktion übereinstimmt. mangomundi ermöglicht keine Transaktionen in embargobelegte Jurisdiktionen oder zu sanktionierten Kontrahenten. Verstöße können zu Mittelsperren, regulatorischen Sanktionen oder strafrechtlicher Haftung führen.",
    "business.badge": "Für Institutionen und Corporate Treasury",
    "business.hero.title.1": "Institutionelles Routing &",
    "business.hero.title.2": "Strategie-Validierung.",
    "business.hero.subtitle":
      "Konzipiert für grenzüberschreitende Analysen mit hohem Volumen und neutrale Flussoptimierung. Eliminieren Sie verborgene Varianz und validieren Sie die institutionelle Routing-Mechanik vor der Ausführung.",
    "business.pillar.lab.title": "Strategie-Validierungslabor",
    "business.pillar.lab.body":
      "Validieren Sie Multi-Currency-Routing-Modelle und analysieren Sie Leistungsmetriken über simulierte Equity-Kurven und detaillierte KI-Begründungsprotokolle unter strikter Neutralität.",
    "business.pillar.flow.title": "Fluss-Optimierungs-Engine",
    "business.pillar.flow.body":
      "Cross-Referenzieren Sie Ausführungskorridore, damit Kapital die Zielkonten über das mathematische Optimum erreicht und Reibung sowie variable Aufschläge minimiert werden.",
    "business.pillar.rfq.title": "Unternehmerische Diskretion (RFQ)",
    "business.pillar.rfq.body":
      "Hochwertige Operationen werden über ein privates, nicht-verwahrendes RFQ-Protokoll abgewickelt, das den institutionellen Orderfluss vor Front-Running schützt.",
    "business.rfqNote":
      "Wir erheben keine Abonnementgebühren. Unser Modell fokussiert ausschließlich auf absolute Routing-Transparenz. Der institutionelle Desk ist unten geöffnet.",
  },
  zh: {
    "legal.lastUpdated": "最后更新:07/06/2026",
    "legal.terms.s1.title": "平台性质",
    "legal.terms.s1.body":
      "mangomundi 作为中立的信息与决策引擎平台运营。我们不托管客户资金、不汇款,也不作为货币服务机构。所有比较、路由建议和分析均由算法生成,仅供参考。执行与结算直接发生在用户与其选择的受监管第三方提供商之间。",
    "legal.terms.s2.title": "免责声明",
    "legal.terms.s2.body":
      "本平台提供的 AI 工具、市场分析及路由建议不构成财务、税务、法律或投资建议。在发起转账前,用户须自行进行尽职调查,核实任何提供商的监管状态、价格与条款。mangomundi 不对所示数据的准确性、完整性或时效性作出任何保证。",
    "legal.terms.s3.title": "报酬披露",
    "legal.terms.s3.body":
      "mangomundi 可能就通过本平台促成的交易向受监管的提供商收取佣金或推荐费。该报酬不会向用户收取任何额外费用,亦不会影响比较算法的中立性。提供商的排名完全基于源自实时市场数据的成本、速度与可靠性等客观指标。",
    "legal.terms.s4.title": "责任限制",
    "legal.terms.s4.body":
      "在适用法律允许的最大范围内,mangomundi 及其关联方、董事、雇员与代理人不对因使用本平台而产生或与之相关的任何直接、间接、附带、特殊、后果性或惩罚性损害承担责任。包括但不限于因汇率波动、转账延迟、提供商破产、技术故障或算法建议错误造成的损失。",
    "legal.terms.s5.title": "联系方式",
    "legal.terms.s5.body": "如对本服务条款有任何疑问、说明或监管查询,请联系",
    "legal.risk.s1.title": "外汇市场风险",
    "legal.risk.s1.body":
      "外汇汇率持续且不可预测地波动。本平台显示的中间价为基于批发银行间数据的指示性估算,可能与提供商实际执行汇率不同。用户须自行承担任何交易的全部外汇风险,包括比较生成与提供商执行之间汇率不利变动的风险。",
    "legal.risk.s2.title": "提供商、结算与对手方风险",
    "legal.risk.s2.body":
      "mangomundi 不托管资金。所有转账直接与用户选定的受监管提供商结算。用户暴露于该提供商的偿付能力、运营可靠性及监管状况。用户有责任在发款前核实相关司法管辖区内的牌照、监管地位及财务状况。mangomundi 不对提供商失败、结算延迟或资金损失承担任何责任。",
    "legal.risk.s3.title": "AI 辅助路由风险",
    "legal.risk.s3.body":
      "AI 辅助路由建议是基于索引化流动性路径、零售汇款渠道、平价优化模型及实时银行间汇率的决策支持工具。实际到账时间、中间银行费用、代理行收费与收款金额可能与所示估算存在重大差异。用户应在执行前直接与所选提供商确认最终条款。",
    "legal.risk.s4.title": "制裁与监管合规",
    "legal.risk.s4.body":
      "用户全权负责确保任何跨境转账遵守其所在司法管辖区适用的制裁制度、反洗钱(AML)法律、KYC 要求及跨境申报义务。mangomundi 不为受禁运司法管辖区或被制裁对手方提供交易便利。违规可能导致资金冻结、监管处罚或刑事责任。",
    "business.badge": "面向机构与企业财务",
    "business.hero.title.1": "机构路由与",
    "business.hero.title.2": "策略验证。",
    "business.hero.subtitle":
      "专为高交易量跨境分析与中立流量优化而构建。在执行前消除隐藏方差并验证机构路由机制。",
    "business.pillar.lab.title": "策略验证实验室",
    "business.pillar.lab.body":
      "在严格中立的前提下,通过模拟权益曲线与详尽的 AI 论证日志,验证多币种路由模型并分析绩效指标。",
    "business.pillar.flow.title": "流量优化引擎",
    "business.pillar.flow.body":
      "交叉比对执行通道,确保资金通过数学最优路径到达目标账户,降低摩擦与可变加价。",
    "business.pillar.rfq.title": "企业级保密 (RFQ)",
    "business.pillar.rfq.body":
      "高额交易通过私有、非托管的 RFQ 协议进行,旨在保护机构订单流免受抢跑。",
    "business.rfqNote":
      "我们不收取订阅费。我们的模式专注于绝对的路由透明度。机构交易台已在下方开启。",
  },
  ja: {
    "legal.lastUpdated": "最終更新: 2026/06/07",
    "legal.terms.s1.title": "プラットフォームの性質",
    "legal.terms.s1.body":
      "mangomundi は中立的な情報および意思決定エンジンのプラットフォームとして運営しています。顧客資金の保管、送金、資金移動業の提供は行いません。比較、ルーティング提案、分析はすべて情報提供のみを目的としてアルゴリズムで生成されます。執行と決済は、ユーザーが選択した規制対象プロバイダーとの間で直接行われます。",
    "legal.terms.s2.title": "免責事項",
    "legal.terms.s2.body":
      "本プラットフォームで提供される AI ツール、市場分析、ルーティング推奨は、財務、税務、法律、または投資のアドバイスを構成するものではありません。ユーザーは、送金を開始する前に、自らデューデリジェンスを行い、各プロバイダーの規制状況、価格および条件を確認する責任を負います。mangomundi は、表示されるデータの正確性、完全性、または適時性について一切保証しません。",
    "legal.terms.s3.title": "報酬の開示",
    "legal.terms.s3.body":
      "mangomundi は、プラットフォーム経由で成立した取引について、規制対象プロバイダーから手数料または紹介料を受け取る場合があります。当該報酬はユーザーに追加コストを生じさせず、比較アルゴリズムの中立性に影響しません。プロバイダーはリアルタイム市場データから導かれるコスト、速度、信頼性の客観的指標のみで評価されます。",
    "legal.terms.s4.title": "責任の制限",
    "legal.terms.s4.body":
      "適用法で認められる最大限の範囲において、mangomundi およびその関係会社、役員、従業員、代理人は、プラットフォームの利用に起因する直接的、間接的、付随的、特別、結果的、または懲罰的損害について一切の責任を負いません。これには為替変動、送金遅延、プロバイダーの破綻、技術的障害、アルゴリズム推奨の誤りに起因する損失を含みますが、これらに限定されません。",
    "legal.terms.s5.title": "お問い合わせ",
    "legal.terms.s5.body":
      "本利用規約に関するご質問、説明、または規制上のお問い合わせは次のメールへ連絡してください",
    "legal.risk.s1.title": "為替市場リスク",
    "legal.risk.s1.body":
      "為替レートは継続的かつ予測不能に変動します。本プラットフォームで表示される mid-market 参考レートは、ホールセール銀行間データに基づく指示的見積りであり、プロバイダーが提供する実際の執行レートと異なる場合があります。ユーザーは、比較生成からプロバイダーによる執行までの間にレートが不利に動くリスクを含め、すべての為替リスクを負います。",
    "legal.risk.s2.title": "プロバイダー、決済、カウンターパーティ・リスク",
    "legal.risk.s2.body":
      "mangomundi は資金を保管しません。すべての送金はユーザーが選択した規制対象プロバイダーと直接決済されます。ユーザーは当該プロバイダーの支払能力、運営の信頼性、規制状況にさらされます。資金を送る前に、関連する法域でのライセンス、規制状況、財務健全性を確認することはユーザーの責任です。mangomundi はプロバイダーの障害、決済遅延、資金損失について一切責任を負いません。",
    "legal.risk.s3.title": "AI 支援ルーティングのリスク",
    "legal.risk.s3.body":
      "AI 支援によるルーティング推奨は、インデックス化された流動性経路、リテール送金チャネル、定額手数料最適化モデル、リアルタイム銀行間レートに基づく意思決定支援ツールです。実際の所要時間、中継銀行手数料、コルレス手数料、受取金額は提示した見積りと大きく異なる可能性があります。執行前にプロバイダーと最終条件を直接確認してください。",
    "legal.risk.s4.title": "制裁および規制遵守",
    "legal.risk.s4.body":
      "ユーザーは、クロスボーダー送金が自国の法域で適用される制裁体制、マネーロンダリング防止 (AML) 法、KYC 要件、報告義務に準拠することを単独で保証する責任を負います。mangomundi は禁輸対象法域や制裁対象先への取引を促進しません。違反は資金凍結、規制制裁、刑事責任につながる可能性があります。",
    "business.badge": "機関投資家・コーポレートトレジャリー向け",
    "business.hero.title.1": "機関向けルーティングと",
    "business.hero.title.2": "戦略検証。",
    "business.hero.subtitle":
      "大口クロスボーダー分析と中立的なフロー最適化のために設計。執行前に隠れたバリアンスを排除し、機関向けルーティングの仕組みを検証します。",
    "business.pillar.lab.title": "戦略検証ラボ",
    "business.pillar.lab.body":
      "厳格な中立性のもと、シミュレートされたエクイティカーブと AI による詳細な根拠ログを通じて、マルチ通貨ルーティングモデルを検証しパフォーマンス指標を分析します。",
    "business.pillar.flow.title": "フロー最適化エンジン",
    "business.pillar.flow.body":
      "執行コリドーを相互参照し、資金が数学的に最適な経路で受取口座に到達するようにし、摩擦と可変マークアップを最小化します。",
    "business.pillar.rfq.title": "コーポレート・ディスクリーション (RFQ)",
    "business.pillar.rfq.body":
      "高額取引はプライベートかつ非カストディの RFQ プロトコルで管理され、機関の注文フローをフロントランニングから保護します。",
    "business.rfqNote":
      "サブスクリプション料金はいただきません。私たちのモデルは、ルーティングにおける絶対的な透明性のみに注力しています。下に機関向けデスクが常時開いています。",
  },
  ko: {
    "legal.lastUpdated": "최종 업데이트: 2026/06/07",
    "legal.terms.s1.title": "플랫폼의 성격",
    "legal.terms.s1.body":
      "mangomundi 은 중립적인 정보 및 의사결정 엔진 플랫폼으로 운영됩니다. 당사는 고객 자금을 보관하지 않고, 송금을 수행하지 않으며, 자금서비스업체로 활동하지 않습니다. 모든 비교, 라우팅 제안 및 분석은 정보 제공 목적으로만 알고리즘으로 생성됩니다. 실행 및 결제는 사용자와 사용자가 선택한 규제 대상 제3자 제공업체 간에 직접 이루어집니다.",
    "legal.terms.s2.title": "면책 조항",
    "legal.terms.s2.body":
      "본 플랫폼에서 제공되는 AI 도구, 시장 분석 및 라우팅 권장사항은 재무, 세무, 법률 또는 투자 자문을 구성하지 않습니다. 사용자는 송금을 개시하기 전 자신의 실사를 수행하고 각 제공업체의 규제 상태, 가격 및 조건을 확인할 단독 책임이 있습니다. mangomundi 은 표시된 데이터의 정확성, 완전성 또는 시의성에 대해 어떠한 보증도 하지 않습니다.",
    "legal.terms.s3.title": "보수 공시",
    "legal.terms.s3.body":
      "mangomundi 은 플랫폼을 통해 성사된 거래에 대해 규제 대상 제공업체로부터 수수료나 추천 수수료를 받을 수 있습니다. 이 보수는 사용자에게 추가 비용을 발생시키지 않으며 비교 알고리즘의 중립성에 영향을 미치지 않습니다. 제공업체는 실시간 시장 데이터에서 도출된 비용, 속도 및 신뢰성의 객관적 지표에 의해서만 순위가 매겨집니다.",
    "legal.terms.s4.title": "책임의 제한",
    "legal.terms.s4.body":
      "적용 법률이 허용하는 최대 범위 내에서, mangomundi 및 그 계열사, 임원, 직원, 대리인은 플랫폼 사용으로 발생하거나 이와 관련된 직접적, 간접적, 부수적, 특별, 결과적 또는 징벌적 손해에 대해 책임지지 않습니다. 여기에는 환율 변동, 송금 지연, 제공업체 도산, 기술적 장애 또는 알고리즘 권장 오류로 인한 손실이 포함되며 이에 국한되지 않습니다.",
    "legal.terms.s5.title": "문의",
    "legal.terms.s5.body": "본 서비스 약관에 관한 질문, 설명 또는 규제 문의는 다음으로 연락주세요",
    "legal.risk.s1.title": "FX 시장 위험",
    "legal.risk.s1.body":
      "환율은 지속적이고 예측 불가하게 변동합니다. 본 플랫폼에 표시되는 mid-market 참고 환율은 도매 은행 간 데이터에서 산출된 지표적 추정치로, 제공업체가 제시하는 실제 실행 환율과 다를 수 있습니다. 사용자는 비교 생성 시점과 제공업체의 송금 실행 시점 사이에 환율이 불리하게 변동할 위험을 포함한 모든 외환 위험을 부담합니다.",
    "legal.risk.s2.title": "제공업체, 결제 및 거래상대방 위험",
    "legal.risk.s2.body":
      "mangomundi 은 자금을 보관하지 않습니다. 모든 송금은 사용자가 선택한 규제 대상 제공업체와 직접 결제됩니다. 사용자는 해당 제공업체의 지급능력, 운영 신뢰성 및 규제 상태에 노출됩니다. 자금 송금 전 관련 관할권에서 라이선스, 규제 지위 및 재무 건전성을 확인하는 것은 사용자의 책임입니다. mangomundi 은 제공업체 장애, 결제 지연 또는 자금 손실에 대해 일체 책임을 지지 않습니다.",
    "legal.risk.s3.title": "AI 지원 라우팅 위험",
    "legal.risk.s3.body":
      "AI 지원 라우팅 권장사항은 인덱싱된 유동성 경로, 리테일 송금 채널, 정액 수수료 최적화 모델 및 실시간 은행 간 환율을 기반으로 한 의사결정 지원 도구입니다. 실제 도착 시간, 중개은행 수수료, 코르레스폰던트 은행 비용 및 수취 금액은 제시된 추정치와 크게 다를 수 있습니다. 사용자는 실행 전에 선택한 제공업체와 최종 조건을 직접 확인해야 합니다.",
    "legal.risk.s4.title": "제재 및 규제 준수",
    "legal.risk.s4.body":
      "사용자는 모든 국경 간 송금이 자신의 관할권에서 적용되는 제재 체제, 자금세탁방지(AML) 법규, KYC 요건 및 국경 간 보고 의무를 준수하도록 보장할 단독 책임이 있습니다. mangomundi 은 금수 관할권 또는 제재 대상 거래상대방으로의 거래를 촉진하지 않습니다. 위반 시 자금 동결, 규제 제재 또는 형사 책임이 발생할 수 있습니다.",
    "business.badge": "기관 및 기업 재무를 위한 솔루션",
    "business.hero.title.1": "기관 라우팅 &",
    "business.hero.title.2": "전략 검증.",
    "business.hero.subtitle":
      "대용량 국경 간 분석과 중립적인 흐름 최적화를 위해 설계되었습니다. 실행 전에 숨겨진 분산을 제거하고 기관 라우팅 메커니즘을 검증하세요.",
    "business.pillar.lab.title": "전략 검증 랩",
    "business.pillar.lab.body":
      "엄격한 중립성 하에 시뮬레이션된 자본 곡선과 상세한 AI 정당화 로그를 통해 다중 통화 라우팅 모델을 검증하고 성과 지표를 분석합니다.",
    "business.pillar.flow.title": "흐름 최적화 엔진",
    "business.pillar.flow.body":
      "실행 경로를 교차 검증하여 자본이 수학적 최적 경로로 목적지 계좌에 도달하도록 하고, 마찰과 가변 마크업을 최소화합니다.",
    "business.pillar.rfq.title": "기업 디스크레션 (RFQ)",
    "business.pillar.rfq.body":
      "고액 거래는 비공개, 비수탁 RFQ 프로토콜로 관리되며, 기관 주문 흐름을 프런트 러닝으로부터 보호합니다.",
    "business.rfqNote":
      "구독료를 청구하지 않습니다. 우리의 모델은 라우팅의 절대적 투명성에만 집중합니다. 기관 데스크는 아래에서 항상 열려 있습니다.",
  },
  ar: {
    "legal.lastUpdated": "آخر تحديث: 07/06/2026",
    "legal.terms.s1.title": "طبيعة المنصة",
    "legal.terms.s1.body":
      "تعمل mangomundi كمنصة محايدة للمعلومات ومحرك قرار. نحن لا نحتفظ بأموال العملاء ولا نقوم بتحويل الأموال ولا نعمل كمؤسسة خدمات نقدية. تُولَّد جميع المقارنات واقتراحات التوجيه والتحليلات خوارزميًا لأغراض المعلومات فقط. يحدث التنفيذ والتسوية مباشرة بين المستخدم والمزود المرخص المختار.",
    "legal.terms.s2.title": "إخلاء المسؤولية",
    "legal.terms.s2.body":
      "لا تشكل أدوات الذكاء الاصطناعي وتحليلات السوق وتوصيات التوجيه المقدمة على هذه المنصة استشارة مالية أو ضريبية أو قانونية أو استثمارية. يتحمل المستخدم وحده مسؤولية إجراء العناية الواجبة والتحقق من الحالة التنظيمية والأسعار وشروط أي مزود قبل بدء التحويل. لا تقدم mangomundi أي ضمان بشأن دقة أو اكتمال أو حداثة البيانات المعروضة.",
    "legal.terms.s3.title": "الإفصاح عن التعويض",
    "legal.terms.s3.body":
      "قد تتلقى mangomundi عمولات أو رسوم إحالة من المزودين المرخصين عن المعاملات التي تتم عبر المنصة. يُتلقى هذا التعويض دون أي تكلفة إضافية على المستخدم ولا يؤثر على حياد خوارزمية المقارنة. يتم تصنيف المزودين حصريًا بناءً على مقاييس موضوعية للتكلفة والسرعة والموثوقية مستخلصة من بيانات السوق الفورية.",
    "legal.terms.s4.title": "تحديد المسؤولية",
    "legal.terms.s4.body":
      "إلى أقصى حد يسمح به القانون المعمول به، لن تكون mangomundi والشركات التابعة لها ومسؤوليها وموظفيها ووكلائها مسؤولين عن أي أضرار مباشرة أو غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية تنشأ عن استخدام المنصة. يشمل ذلك دون حصر الخسائر الناتجة عن تقلبات أسعار الصرف أو تأخر التحويلات أو إفلاس المزود أو الأعطال التقنية أو أخطاء التوصيات الخوارزمية.",
    "legal.terms.s5.title": "التواصل",
    "legal.terms.s5.body":
      "للاستفسارات أو التوضيحات أو الاستفسارات التنظيمية بشأن شروط الخدمة هذه، يرجى التواصل مع",
    "legal.risk.s1.title": "مخاطر سوق الصرف الأجنبي",
    "legal.risk.s1.body":
      "تتقلب أسعار الصرف باستمرار وبشكل غير متوقع. تعد أسعار mid-market المرجعية المعروضة على هذه المنصة تقديرات استرشادية مستمدة من بيانات البنوك بالجملة وقد تختلف عن سعر التنفيذ الفعلي للمزود. يتحمل المستخدم كامل مخاطر الصرف الأجنبي، بما في ذلك مخاطر التحرك السلبي للسعر بين توليد المقارنة وتنفيذ التحويل من قبل المزود.",
    "legal.risk.s2.title": "مخاطر المزود والتسوية والطرف المقابل",
    "legal.risk.s2.body":
      "لا تحتفظ mangomundi بالأموال. تتم تسوية جميع التحويلات مباشرة مع المزود المرخص الذي يختاره المستخدم. يتعرض المستخدم لملاءة المزود وموثوقيته التشغيلية ووضعه التنظيمي. تقع على المستخدم مسؤولية التحقق من الترخيص والوضع التنظيمي والصحة المالية في الولايات القضائية ذات الصلة قبل إرسال الأموال. لا تتحمل mangomundi أي مسؤولية عن فشل المزود أو تأخر التسوية أو فقدان الأموال.",
    "legal.risk.s3.title": "مخاطر التوجيه المعزز بالذكاء الاصطناعي",
    "legal.risk.s3.body":
      "توصيات التوجيه بمساعدة الذكاء الاصطناعي هي أدوات دعم قرار تستند إلى مسارات السيولة المُفهرسة وقنوات تحويل الأفراد ونماذج تحسين الرسوم الثابتة وأسعار البنوك الفورية. قد تختلف أوقات الوصول الفعلية ورسوم البنوك الوسيطة ورسوم البنوك المراسلة والمبالغ المستلمة اختلافًا جوهريًا عن التقديرات. ينبغي على المستخدم تأكيد جميع الشروط النهائية مع المزود قبل التنفيذ.",
    "legal.risk.s4.title": "العقوبات والامتثال التنظيمي",
    "legal.risk.s4.body":
      "يتحمل المستخدم وحده مسؤولية ضمان امتثال أي تحويل عبر الحدود لأنظمة العقوبات السارية وقوانين مكافحة غسل الأموال (AML) ومتطلبات اعرف عميلك (KYC) والتزامات الإبلاغ في ولايته القضائية. لا تيسر mangomundi المعاملات إلى الولايات القضائية المحظورة أو الأطراف المعاقَب عليها. قد تؤدي المخالفات إلى تجميد الأموال أو عقوبات تنظيمية أو مسؤولية جنائية.",
    "business.badge": "للمؤسسات والخزائن المؤسسية",
    "business.hero.title.1": "التوجيه المؤسسي و",
    "business.hero.title.2": "التحقق من الاستراتيجية.",
    "business.hero.subtitle":
      "مصمَّم للتحليل عبر الحدود بأحجام كبيرة وتحسين تدفق محايد. تخلص من التباين الخفي وتحقق من آليات التوجيه المؤسسي قبل التنفيذ.",
    "business.pillar.lab.title": "مختبر التحقق من الاستراتيجية",
    "business.pillar.lab.body":
      "تحقق من نماذج التوجيه متعدد العملات وحلل مقاييس الأداء عبر منحنيات حقوق ملكية محاكاة وسجلات تبرير ذكاء اصطناعي مفصلة بحياد صارم.",
    "business.pillar.flow.title": "محرك تحسين التدفق",
    "business.pillar.flow.body":
      "اقطع مرجعيات ممرات التنفيذ لضمان وصول رأس المال إلى الحسابات الوجهة عبر الأمثل الرياضي، مع تقليل الاحتكاك والهوامش المتغيرة.",
    "business.pillar.rfq.title": "الكتمان المؤسسي (RFQ)",
    "business.pillar.rfq.body":
      "تُدار العمليات عالية القيمة عبر بروتوكول RFQ خاص وغير حافظ، مصمَّم لحماية تدفق الأوامر المؤسسية من الجري الأمامي.",
    "business.rfqNote":
      "نحن لا نتقاضى رسوم اشتراك. يركز نموذجنا حصريًا على الشفافية المطلقة في التوجيه. مكتب المؤسسات مفتوح أدناه.",
  },
  hi: {
    "legal.lastUpdated": "अंतिम अपडेट: 07/06/2026",
    "legal.terms.s1.title": "प्लेटफ़ॉर्म की प्रकृति",
    "legal.terms.s1.body":
      "mangomundi एक तटस्थ सूचना और निर्णय-इंजन प्लेटफ़ॉर्म के रूप में संचालित होता है। हम ग्राहक धन की हिरासत नहीं रखते, धन हस्तांतरण नहीं करते, और मनी-सर्विसेज़ व्यवसाय के रूप में कार्य नहीं करते। सभी तुलनाएँ, राउटिंग सुझाव और एनालिटिक्स केवल जानकारी हेतु एल्गोरिथमिक रूप से उत्पन्न होते हैं। निष्पादन और निपटान सीधे उपयोगकर्ता और चुने गए विनियमित प्रदाता के बीच होते हैं।",
    "legal.terms.s2.title": "अस्वीकरण",
    "legal.terms.s2.body":
      "इस प्लेटफ़ॉर्म पर प्रदान किए गए AI टूल, बाज़ार विश्लेषण और राउटिंग सिफारिशें वित्तीय, कर, कानूनी या निवेश सलाह का गठन नहीं करतीं। उपयोगकर्ता हस्तांतरण आरंभ करने से पहले अपनी स्वयं की उचित जाँच करने और किसी भी प्रदाता की नियामक स्थिति, मूल्य और शर्तों को सत्यापित करने के लिए पूरी तरह से ज़िम्मेदार है। mangomundi दिखाए गए डेटा की सटीकता, पूर्णता या समयबद्धता की कोई गारंटी नहीं देता।",
    "legal.terms.s3.title": "क्षतिपूर्ति प्रकटीकरण",
    "legal.terms.s3.body":
      "mangomundi प्लेटफ़ॉर्म के माध्यम से संपन्न लेनदेन के लिए विनियमित प्रदाताओं से कमीशन या रेफ़रल शुल्क प्राप्त कर सकता है। यह क्षतिपूर्ति उपयोगकर्ता के लिए बिना किसी अतिरिक्त लागत के प्राप्त होती है और तुलना एल्गोरिथ्म की तटस्थता को प्रभावित नहीं करती। प्रदाताओं को विशेष रूप से लागत, गति और विश्वसनीयता के वस्तुनिष्ठ मेट्रिक्स के आधार पर रैंक किया जाता है।",
    "legal.terms.s4.title": "दायित्व की सीमा",
    "legal.terms.s4.body":
      "लागू कानून द्वारा अनुमत अधिकतम सीमा तक, mangomundi और इसकी सहयोगी कंपनियाँ, अधिकारी, कर्मचारी और एजेंट प्लेटफ़ॉर्म के उपयोग से उत्पन्न प्रत्यक्ष, अप्रत्यक्ष, आकस्मिक, विशेष, परिणामी या दंडात्मक क्षति के लिए उत्तरदायी नहीं होंगे। इसमें विदेशी मुद्रा उतार-चढ़ाव, हस्तांतरण विलंब, प्रदाता दिवालियापन, तकनीकी विफलताओं या एल्गोरिथमिक सिफारिशों में त्रुटियों से होने वाली हानि शामिल है।",
    "legal.terms.s5.title": "संपर्क",
    "legal.terms.s5.body":
      "इन सेवा शर्तों से संबंधित प्रश्नों, स्पष्टीकरणों या नियामक पूछताछ के लिए कृपया संपर्क करें",
    "legal.risk.s1.title": "FX बाज़ार जोखिम",
    "legal.risk.s1.body":
      "विदेशी मुद्रा दरें निरंतर और अप्रत्याशित रूप से उतार-चढ़ाव करती हैं। इस प्लेटफ़ॉर्म पर दिखाई गई mid-market संदर्भ दरें थोक इंटरबैंक डेटा से प्राप्त सांकेतिक अनुमान हैं और प्रदाता द्वारा दी गई वास्तविक निष्पादन दर से भिन्न हो सकती हैं। उपयोगकर्ता किसी भी लेनदेन के लिए पूर्ण विदेशी मुद्रा जोखिम वहन करता है।",
    "legal.risk.s2.title": "प्रदाता, निपटान और काउंटरपार्टी जोखिम",
    "legal.risk.s2.body":
      "mangomundi धन की हिरासत नहीं रखता। सभी हस्तांतरण सीधे चयनित विनियमित प्रदाता के साथ निपटाए जाते हैं। उपयोगकर्ता उस प्रदाता की शोधनक्षमता, परिचालन विश्वसनीयता और नियामक स्थिति के संपर्क में आता है। धन भेजने से पहले प्रासंगिक क्षेत्राधिकारों में लाइसेंस, नियामक स्थिति और वित्तीय स्वास्थ्य सत्यापित करना उपयोगकर्ता की ज़िम्मेदारी है।",
    "legal.risk.s3.title": "AI-सहायित राउटिंग जोखिम",
    "legal.risk.s3.body":
      "AI-सहायित राउटिंग सिफारिशें इंडेक्स्ड लिक्विडिटी पथ, रिटेल रेमिटेंस चैनलों, फ्लैट-फ़ी ऑप्टिमाइज़ेशन मॉडल और रीयल-टाइम इंटरबैंक दरों पर आधारित निर्णय-सहायक उपकरण हैं। वास्तविक डिलीवरी समय, मध्यवर्ती बैंक शुल्क, कॉरेस्पॉन्डेंट बैंकिंग शुल्क और लाभार्थी प्राप्तियाँ प्रस्तुत अनुमानों से सारवाहर भिन्न हो सकती हैं।",
    "legal.risk.s4.title": "प्रतिबंध और नियामक अनुपालन",
    "legal.risk.s4.body":
      "उपयोगकर्ता यह सुनिश्चित करने के लिए पूरी तरह से ज़िम्मेदार है कि कोई भी सीमा-पार हस्तांतरण लागू प्रतिबंध व्यवस्थाओं, मनी लॉन्डरिंग विरोधी (AML) कानूनों, KYC आवश्यकताओं और क्षेत्राधिकार की सीमा-पार रिपोर्टिंग दायित्वों का अनुपालन करता है। mangomundi प्रतिबंधित क्षेत्राधिकारों या प्रतिबंधित काउंटरपार्टी के साथ लेनदेन की सुविधा नहीं देता।",
    "business.badge": "संस्थानों और कॉर्पोरेट ट्रेज़री के लिए",
    "business.hero.title.1": "संस्थागत राउटिंग और",
    "business.hero.title.2": "रणनीति सत्यापन।",
    "business.hero.subtitle":
      "उच्च-वॉल्यूम सीमा-पार विश्लेषण और तटस्थ प्रवाह अनुकूलन के लिए डिज़ाइन किया गया। निष्पादन से पहले छिपी भिन्नता को समाप्त करें और संस्थागत राउटिंग यांत्रिकी को सत्यापित करें।",
    "business.pillar.lab.title": "रणनीति सत्यापन प्रयोगशाला",
    "business.pillar.lab.body":
      "सख्त तटस्थता के तहत सिम्युलेटेड इक्विटी कर्व्स और विस्तृत AI औचित्य लॉग के माध्यम से मल्टी-करेंसी राउटिंग मॉडल को सत्यापित करें और प्रदर्शन मेट्रिक्स का विश्लेषण करें।",
    "business.pillar.flow.title": "प्रवाह अनुकूलन इंजन",
    "business.pillar.flow.body":
      "निष्पादन गलियारों को क्रॉस-रेफ़रेंस करें ताकि पूँजी गणितीय इष्टतम पथ के माध्यम से गंतव्य खातों तक पहुँचे, घर्षण और परिवर्तनीय मार्कअप को न्यूनतम करें।",
    "business.pillar.rfq.title": "कॉर्पोरेट गोपनीयता (RFQ)",
    "business.pillar.rfq.body":
      "उच्च-मूल्य लेनदेन एक निजी, गैर-कस्टोडियल RFQ प्रोटोकॉल के माध्यम से प्रबंधित किए जाते हैं, जो संस्थागत ऑर्डर फ्लो को फ़्रंट-रनिंग से बचाने के लिए डिज़ाइन किया गया है।",
    "business.rfqNote":
      "हम सब्सक्रिप्शन शुल्क नहीं लेते। हमारा मॉडल विशेष रूप से पूर्ण राउटिंग पारदर्शिता पर केंद्रित है। संस्थागत डेस्क नीचे खुली है।",
  },
};

// === UI shell keys (Header, Footer, ChatWidget, InlineChat, RfqTerminal) ===
// EN is authoritative — t() falls back to EN for any missing language key.
const UI_KEYS: Partial<Record<Lang, Dict>> = {
  en: {
    "footer.navigate": "Navigate",
    "footer.tagline": "Intelligent currency exchange decisions.",
    "footer.copyright": "All rights reserved.",
    "footer.disclaimerLabel": "disclaimer",
    "common.close": "Close",
    "common.toggleMenu": "Toggle menu",
    "chat.copilotAria": "FX Copilot",
    "chat.sessionActive": "// session active",
    "chat.send": "Send",
    "inline.badge": "Talk to the FX Agent",
    "inline.headline": "Just ask for a quote. No forms.",
    "rfq.errorGeneric": "RFQ request failed. Please try again.",
    "rfq.requestId": "request_id",
  },
  es: {
    "footer.navigate": "Navegación",
    "footer.tagline": "Decisiones inteligentes de cambio de divisas.",
    "footer.copyright": "Todos los derechos reservados.",
    "footer.brandLine": "FX Global, Hecho Inteligente",
    "footer.disclaimerLabel": "aviso",
    "common.close": "Cerrar",
    "common.toggleMenu": "Abrir menú",
    "chat.copilotAria": "Copiloto FX",
    "chat.sessionActive": "// sesión activa",
    "chat.send": "Enviar",
    "inline.badge": "Habla con el Agente FX",
    "inline.headline": "Pedí una cotización. Sin formularios.",
    "rfq.errorGeneric": "La solicitud RFQ falló. Por favor intentá de nuevo.",
    "rfq.requestId": "id_solicitud",
  },
  pt: {
    "footer.navigate": "Navegação",
    "footer.tagline":
      "O motor global de decisão cambial. IA neutra para pagamentos transfronteiriços mais inteligentes.",
    "footer.copyright": "Todos os direitos reservados.",
    "footer.brandLine": "FX Global, Feito Inteligente",
    "footer.disclaimerLabel": "aviso",
    "common.close": "Fechar",
    "common.toggleMenu": "Alternar menu",
    "chat.copilotAria": "Copiloto FX",
    "chat.sessionActive": "// sessão ativa",
    "chat.send": "Enviar",
    "inline.badge": "Fale com o Agente FX",
    "inline.headline": "Peça uma cotação. Sem formulários.",
    "rfq.errorGeneric": "A solicitação RFQ falhou. Tente novamente.",
    "rfq.requestId": "id_solicitação",
  },
  it: {
    "footer.navigate": "Naviga",
    "footer.tagline":
      "Il motore globale di decisione FX. IA neutrale per pagamenti transfrontalieri più intelligenti.",
    "footer.copyright": "Tutti i diritti riservati.",
    "footer.brandLine": "FX Globale, Reso Intelligente",
    "footer.disclaimerLabel": "avviso",
    "common.close": "Chiudi",
    "common.toggleMenu": "Apri menu",
    "chat.copilotAria": "Copilota FX",
    "chat.sessionActive": "// sessione attiva",
    "chat.send": "Invia",
    "inline.badge": "Parla con l'Agente FX",
    "inline.headline": "Chiedi una quotazione. Niente moduli.",
    "rfq.errorGeneric": "La richiesta RFQ è fallita. Riprova.",
    "rfq.requestId": "id_richiesta",
  },
  fr: {
    "footer.navigate": "Navigation",
    "footer.tagline":
      "Le moteur mondial de décision FX. IA neutre pour des paiements transfrontaliers plus intelligents.",
    "footer.copyright": "Tous droits réservés.",
    "footer.brandLine": "FX Mondial, Rendu Intelligent",
    "footer.disclaimerLabel": "avis",
    "common.close": "Fermer",
    "common.toggleMenu": "Ouvrir le menu",
    "chat.copilotAria": "Copilote FX",
    "chat.sessionActive": "// session active",
    "chat.send": "Envoyer",
    "inline.badge": "Parlez à l'agent FX",
    "inline.headline": "Demandez un devis. Sans formulaire.",
    "rfq.errorGeneric": "La demande RFQ a échoué. Veuillez réessayer.",
    "rfq.requestId": "id_demande",
  },
  de: {
    "footer.navigate": "Navigation",
    "footer.tagline":
      "Die globale FX-Entscheidungs-Engine. Neutrale KI für intelligentere grenzüberschreitende Zahlungen.",
    "footer.copyright": "Alle Rechte vorbehalten.",
    "footer.brandLine": "Globales FX, Intelligent Gemacht",
    "footer.disclaimerLabel": "hinweis",
    "common.close": "Schließen",
    "common.toggleMenu": "Menü umschalten",
    "chat.copilotAria": "FX-Copilot",
    "chat.sessionActive": "// Sitzung aktiv",
    "chat.send": "Senden",
    "inline.badge": "Sprechen Sie mit dem FX-Agenten",
    "inline.headline": "Fragen Sie einfach nach einem Kurs. Keine Formulare.",
    "rfq.errorGeneric": "RFQ-Anfrage fehlgeschlagen. Bitte erneut versuchen.",
    "rfq.requestId": "anfrage_id",
  },
  zh: {
    "footer.navigate": "导航",
    "footer.tagline": "全球外汇决策引擎。中立 AI 助力更智能的跨境支付。",
    "footer.copyright": "保留所有权利。",
    "footer.brandLine": "智能化的全球外汇",
    "footer.disclaimerLabel": "免责声明",
    "common.close": "关闭",
    "common.toggleMenu": "切换菜单",
    "chat.copilotAria": "外汇副驾",
    "chat.sessionActive": "// 会话进行中",
    "chat.send": "发送",
    "inline.badge": "与外汇 AI 代理对话",
    "inline.headline": "直接询价,无需表单。",
    "rfq.errorGeneric": "RFQ 请求失败,请重试。",
    "rfq.requestId": "请求编号",
  },
  ja: {
    "footer.navigate": "ナビゲーション",
    "footer.tagline":
      "グローバル FX 意思決定エンジン。よりスマートなクロスボーダー決済のための中立的 AI。",
    "footer.copyright": "無断複写・転載を禁じます。",
    "footer.brandLine": "インテリジェントなグローバル FX",
    "footer.disclaimerLabel": "免責事項",
    "common.close": "閉じる",
    "common.toggleMenu": "メニュー切替",
    "chat.copilotAria": "FX コパイロット",
    "chat.sessionActive": "// セッション中",
    "chat.send": "送信",
    "inline.badge": "FX エージェントと話す",
    "inline.headline": "見積りを聞くだけ。フォーム不要。",
    "rfq.errorGeneric": "RFQ リクエストに失敗しました。再試行してください。",
    "rfq.requestId": "リクエスト ID",
  },
  ko: {
    "footer.navigate": "탐색",
    "footer.tagline": "글로벌 FX 의사결정 엔진. 더 스마트한 국경 간 결제를 위한 중립 AI.",
    "footer.copyright": "모든 권리 보유.",
    "footer.brandLine": "지능형 글로벌 FX",
    "footer.disclaimerLabel": "고지사항",
    "common.close": "닫기",
    "common.toggleMenu": "메뉴 전환",
    "chat.copilotAria": "FX 코파일럿",
    "chat.sessionActive": "// 세션 활성",
    "chat.send": "전송",
    "inline.badge": "FX 에이전트와 대화",
    "inline.headline": "양식 없이 견적만 요청하세요.",
    "rfq.errorGeneric": "RFQ 요청에 실패했습니다. 다시 시도해주세요.",
    "rfq.requestId": "요청_ID",
  },
  ar: {
    "footer.navigate": "تصفح",
    "footer.tagline":
      "محرك القرار العالمي للصرف الأجنبي. ذكاء اصطناعي محايد لمدفوعات عابرة للحدود أكثر ذكاءً.",
    "footer.copyright": "جميع الحقوق محفوظة.",
    "footer.brandLine": "صرف عالمي ذكي",
    "footer.disclaimerLabel": "إخلاء مسؤولية",
    "common.close": "إغلاق",
    "common.toggleMenu": "تبديل القائمة",
    "chat.copilotAria": "مساعد الصرف الأجنبي",
    "chat.sessionActive": "// الجلسة نشطة",
    "chat.send": "إرسال",
    "inline.badge": "تحدث مع وكيل الصرف الأجنبي",
    "inline.headline": "اطلب عرض سعر فقط. بدون نماذج.",
    "rfq.errorGeneric": "فشل طلب RFQ. يرجى المحاولة مرة أخرى.",
    "rfq.requestId": "معرف_الطلب",
  },
  hi: {
    "footer.navigate": "नेविगेट",
    "footer.tagline": "वैश्विक FX निर्णय इंजन। बेहतर सीमा-पार भुगतान के लिए तटस्थ AI।",
    "footer.copyright": "सर्वाधिकार सुरक्षित।",
    "footer.brandLine": "वैश्विक FX, बुद्धिमत्ता के साथ",
    "footer.disclaimerLabel": "अस्वीकरण",
    "common.close": "बंद करें",
    "common.toggleMenu": "मेनू टॉगल",
    "chat.copilotAria": "FX कोपायलट",
    "chat.sessionActive": "// सत्र सक्रिय",
    "chat.send": "भेजें",
    "inline.badge": "FX एजेंट से बात करें",
    "inline.headline": "बस कोट मांगें। कोई फ़ॉर्म नहीं।",
    "rfq.errorGeneric": "RFQ अनुरोध विफल। कृपया पुनः प्रयास करें।",
    "rfq.requestId": "अनुरोध_आईडी",
  },
};

const HOME_SECTIONS_KEYS: Partial<Record<Lang, Dict>> = {
  en: {
    "home.cta.badge": "Institutional Desk",
    "home.cta.title": "Treasury operations at institutional scale.",
    "home.cta.subtitle":
      "Direct access to our multi-currency infrastructure, private RFQ protocols and dedicated coverage for corporate FX programmes and high-volume cross-border flows.",
    "home.cta.button": "Access Institutional Desk",
    "home.how.title": "Four steps to a better exchange rate.",
    "home.how.subtitle": "Four simple steps to smarter cross-border payments",
    "home.how.s1.title": "Select",
    "home.how.s1.desc":
      "Tell us who you are (individual or business) and where you are sending money.",
    "home.how.s2.title": "Compare",
    "home.how.s2.desc":
      "Choose your currency and see all available routes and rates. Find your best match.",
    "home.how.s3.title": "Adjust",
    "home.how.s3.desc": "Chat with our AI agent to fine-tune the solution for your specific needs.",
    "home.how.s4.title": "Go",
    "home.how.s4.desc": "Complete your transfer directly with your chosen provider.",
    "home.platform.text": "FX is the first vertical.",
    "home.platform.brand": "mangomundi Platform",
    "home.platform.tail":
      "is the AI decision engine behind it — insurance, brokers, SaaS, and more are next.",
    "home.platform.learn": "Learn more",
    "home.stats.founded": "Founded",
    "home.stats.countries": "Countries",
    "home.stats.currencies": "Currencies",
    "home.test.badge": "Auditable Neutrality",
    "home.test.title": "How the Decision Engine Works",
    "home.test.subtitle":
      "Our human team is always available to support and guide users through operational complexity — yet absolute algorithmic impartiality is what processes, distributes and delivers the best optimised spreads to every party, equitably and without favouritism.",
    "home.test.c1.title": "Algorithmic Impartiality",
    "home.test.c1.desc":
      "Every route is ranked by the engine on objective parameters — wholesale interbank rate, total fee, settlement speed and regulatory coverage — never by sponsorship or commercial preference. The same logic applies to retail remittances and corporate treasury flows.",
    "home.test.c2.title": "System Integrity",
    "home.test.c2.desc":
      "Absolute algorithmic impartiality is what processes, distributes and delivers the best optimised spreads to every party, equitably and without favouritism.",
  },
  es: {
    "home.cta.badge": "Mesa Institucional",
    "home.cta.title": "Operaciones de tesorería a escala institucional.",
    "home.cta.subtitle":
      "Acceso directo a nuestra infraestructura multidivisa, protocolos privados de RFQ y cobertura dedicada para programas corporativos de FX y flujos transfronterizos de alto volumen.",
    "home.cta.button": "Acceder a Mesa Institucional",
    "home.how.title": "Cómo Funciona",
    "home.how.subtitle": "Tres pasos simples para pagos transfronterizos más inteligentes",
    "home.how.s1.title": "Comparar",
    "home.how.s1.desc": "Escaneo en tiempo real de liquidez y tarifas.",
    "home.how.s2.title": "Optimizar",
    "home.how.s2.desc": "IA neutral evalúa velocidad, coste y fiabilidad — sin sesgos.",
    "home.how.s3.title": "Ejecutar",
    "home.how.s3.desc": "Liquida con el proveedor elegido o por nuestro RFQ.",
    "home.platform.text": "FX es la primera vertical.",
    "home.platform.brand": "mangomundi Platform",
    "home.platform.tail":
      "es el motor de decisión IA detrás — seguros, brokers, SaaS y más vienen después.",
    "home.platform.learn": "Saber más",
    "home.stats.founded": "Fundada",
    "home.stats.countries": "Países",
    "home.stats.currencies": "Divisas",
    "home.test.badge": "Neutralidad Auditable",
    "home.test.title": "Cómo Funciona el Motor de Decisión",
    "home.test.subtitle":
      "Nuestro equipo humano siempre está disponible para apoyar y guiar a los usuarios — pero es la imparcialidad algorítmica absoluta la que procesa, distribuye y entrega los mejores spreads optimizados a cada parte, de forma equitativa y sin favoritismos.",
    "home.test.c1.title": "Imparcialidad Algorítmica",
    "home.test.c1.desc":
      "Cada ruta es clasificada por el motor según parámetros objetivos — tipo interbancario mayorista, comisión total, velocidad de liquidación y cobertura regulatoria — nunca por patrocinio o preferencia comercial. La misma lógica aplica a remesas retail y flujos de tesorería corporativa.",
    "home.test.c2.title": "Integridad del Sistema",
    "home.test.c2.desc":
      "La imparcialidad algorítmica absoluta es la que procesa, distribuye y entrega los mejores spreads optimizados a cada parte, de forma equitativa y sin favoritismos.",
  },
};

const PAGE_KEYS: Partial<Record<Lang, Dict>> = {
  en: {
    // Errors / 404
    "errors.notFound.title": "Page not found",
    "errors.notFound.body": "The page you're looking for doesn't exist or has been moved.",
    "errors.notFound.cta": "Go home",
    "errors.post.title": "Post not found",
    "errors.post.body": "This article doesn't exist or was unpublished.",
    "errors.post.back": "Back to the blog",
    "errors.post.load": "Couldn't load this post:",

    // Blog
    "blog.empty": "No posts yet. Check back soon.",
    "blog.backShort": "Back to blog",
    "blog.cta.prompt": "Ready to compare your transfer?",
    "blog.cta.button": "Open the comparator",
    "blog.audience.business": "Business",
    "blog.audience.retail": "Retail",
    "blog.audience.both": "Both",

    // Pricing page
    "pricing.eyebrow": "Free for retail. Paid for businesses that need automation.",
    "pricing.title.a": "How we make",
    "pricing.title.b": "money",
    "pricing.title.c": "— and how you save it",
    "pricing.subtitle":
      "Retail use is free, funded by affiliate commissions from providers. Businesses pay for automation, API access, and the optimisation engine that runs in the background.",
    "pricing.popular": "Most Popular",
    "pricing.free.name": "Free",
    "pricing.free.price": "$0",
    "pricing.free.cadence": "forever",
    "pricing.free.desc":
      "The full comparator + AI chat for individuals and one-off transfers. We earn from affiliate commissions when you use a provider — you pay nothing extra.",
    "pricing.free.f1": "30+ providers, 100+ currencies",
    "pricing.free.f2": "Live mid-market rates",
    "pricing.free.f3": "Mango AI recommendation + chat",
    "pricing.free.f4": "Affiliate-funded, no signup needed",
    "pricing.free.f5": "Public web access",
    "pricing.free.cta": "Use the FX Tool",
    "pricing.pro.name": "Pro",
    "pricing.pro.price": "$49",
    "pricing.pro.cadence": "/ month",
    "pricing.pro.desc":
      "For frequent senders, freelancers, and SMBs. Automated best-route alerts, multi-corridor monitoring, and saved beneficiaries.",
    "pricing.pro.badge": "For SMBs & freelancers",
    "pricing.pro.f1": "Everything in Free",
    "pricing.pro.f2": "Rate alerts on your corridors",
    "pricing.pro.f3": "Saved beneficiaries & history",
    "pricing.pro.f4": "CSV export & monthly report",
    "pricing.pro.f5": "Priority AI (advanced reasoning)",
    "pricing.pro.f6": "Email support",
    "pricing.pro.cta": "Start Pro",
    "pricing.ent.name": "Enterprise",
    "pricing.ent.price": "Custom",
    "pricing.ent.desc":
      "Treasury teams and fintechs. API access to the decision engine, custom provider mix, SSO, audit logs, and SLA.",
    "pricing.ent.f1": "Everything in Pro",
    "pricing.ent.f2": "REST API to the decision engine",
    "pricing.ent.f3": "Custom provider mix & rules",
    "pricing.ent.f4": "Webhook events & batch routing",
    "pricing.ent.f5": "Dedicated account manager",
    "pricing.ent.f6": "SSO, audit logs, SLA",
    "pricing.ent.cta": "Talk to Sales",
    "pricing.faq.title": "How does this work with affiliate commissions?",
    "pricing.faq.body":
      "When you use the free comparator and choose a provider, we may earn a commission from that provider — at no extra cost to you. The recommendation is neutral and ordered by actual amount received. Pro and Enterprise plans exist for businesses that need more than a one-off comparison: continuous optimisation across corridors, an API to plug into payment flows, and rules-based routing. The subscription pays for the engine and automation — not for the comparison itself, which stays free.",

    // Platform page
    "platform.eyebrow": "The platform behind mangomundi",
    "platform.title.a": "AI infrastructure for",
    "platform.title.b": "complex decisions",
    "platform.subtitle":
      "We're not building another comparison site. We're building the decision, sourcing and execution layer for fragmented markets — starting with cross-border FX, extending to every category where pricing is opaque and choices are hard.",
    "platform.core.title": "One core engine",
    "platform.core.sub":
      "Shared infrastructure across every vertical. Add a new market, not a new product.",
    "platform.core.l1.t": "AI recommendation engine",
    "platform.core.l1.d": "User profiling, context extraction, multi-criteria ranking.",
    "platform.core.l2.t": "Provider graph",
    "platform.core.l2.d":
      "Unified schema for every vertical: pricing, trust, coverage, performance.",
    "platform.core.l3.t": "RFQ & matching engine",
    "platform.core.l3.d": "Generate quote requests, route to eligible providers, normalize offers.",
    "platform.core.l4.t": "Trust & transparency",
    "platform.core.l4.d": "Regulator data, review aggregation, organic-vs-sponsored separation.",
    "platform.vert.title": "Many verticals",
    "platform.vert.sub": "Every category that's fragmented, opaque and high-stakes is a candidate.",
    "platform.vert.v1": "FX & cross-border payments",
    "platform.vert.v2": "Brokers & investing (TradeHunter)",
    "platform.vert.v3": "Insurance carriers & brokers",
    "platform.vert.v4": "SaaS procurement",
    "platform.vert.v5": "Cloud & infrastructure",
    "platform.vert.v6": "Payments infrastructure (APIs)",
    "platform.vert.v7": "Lending & treasury",
    "platform.vert.v8": "Freight & trade finance",
    "platform.status.live": "Live",
    "platform.status.building": "Building",
    "platform.status.planned": "Planned",
    "platform.road.title": "Roadmap",
    "platform.road.sub": "From comparison to a universal decision layer.",
    "platform.road.s1.t": "Comparison platform",
    "platform.road.s1.s": "Live for FX",
    "platform.road.s2.t": "AI recommendation engine",
    "platform.road.s2.s": "Live for FX",
    "platform.road.s3.t": "Lead routing marketplace",
    "platform.road.s3.s": "Q1 2026",
    "platform.road.s4.t": "RFQ + negotiation automation",
    "platform.road.s4.s": "2026",
    "platform.road.s5.t": "AI procurement infrastructure",
    "platform.road.s5.s": "2026–2027",
    "platform.road.s6.t": "Universal decision layer",
    "platform.road.s6.s": "Vision",
    "platform.ent.title": "Enterprise & private deployments",
    "platform.ent.body":
      "Banks, treasury teams and large enterprises don't want a public marketplace for sensitive decisions. We offer hosted SaaS, private SaaS, and API-only deployments of the same decision engine — with your own provider network and compliance controls.",
    "platform.ent.cta1": "Talk to us",
    "platform.ent.cta2": "Business solutions",

    // Insurance page
    "ins.badge": "Vertical #2 · Coming soon",
    "ins.title.a": "Insurance, decided",
    "ins.title.b": "intelligently",
    "ins.subtitle":
      "The same neutral AI engine that powers mangomundi's FX comparison is being extended to insurance. Compare policies across providers with transparent pricing, coverage scoring, and a recommendation tuned to your situation.",
    "ins.c1.t": "Coverage scoring",
    "ins.c1.b": "Normalised coverage matrix across providers — no fine-print surprises.",
    "ins.c2.t": "Neutral AI advice",
    "ins.c2.b": "Same multi-model engine. Recommends what fits you, not what pays us most.",
    "ins.c3.t": "One decision flow",
    "ins.c3.b": "Quote, compare, and bind in one place — across health, travel, auto and home.",
    "ins.why.t": "Why this matters",
    "ins.why.b1":
      "mangomundi is built as a multi-vertical decision platform. FX is the first live vertical. Insurance is next, then SaaS, lending, and brokers — all on the same provider schema, sponsored-vs-organic ranking, and AI recommendation layer. See the",
    "ins.why.link": "platform vision",
    "ins.why.b2": "for the full roadmap.",
    "ins.cta1": "Be a launch partner · Enterprise Beta",
    "ins.cta2": "Try the FX engine",

    // Features page
    "feat.title.a": "Everything You Need for",
    "feat.title.b": "Global Payments",
    "feat.subtitle":
      "A complete platform for comparing, optimising, and executing cross-border payments at any scale.",
    "feat.f1.t": "Real-Time Rate Comparison",
    "feat.f1.d":
      "Access live exchange rates from 150+ providers. Our engine updates every 30 seconds to ensure you always see the most current market data.",
    "feat.f2.t": "AI-Powered Smart Routing",
    "feat.f2.d":
      "Our neutral AI analyses speed, cost, reliability, and compliance to build the optimal payment path for every transaction.",
    "feat.f3.t": "Multi-Currency Wallets",
    "feat.f3.d":
      "Hold balances in 150+ currencies. Convert between currencies at market-leading rates with a single click.",
    "feat.f4.t": "Enterprise API",
    "feat.f4.d":
      "RESTful APIs with comprehensive documentation, webhooks, and SDKs for Python, Node.js, Java, and Go.",
    "feat.f5.t": "Compliance Automation",
    "feat.f5.d":
      "Automated KYC, AML screening, and regulatory reporting across all supported jurisdictions.",
    "feat.f6.t": "24/7 Global Support",
    "feat.f6.d":
      "Expert support teams across London, Singapore, New York, and Lagos. Available via chat, email, and phone.",
    "feat.f7.t": "Scheduled Payments",
    "feat.f7.d": "Set up recurring transfers, forward contracts, and automated hedging strategies.",
    "feat.f8.t": "Advanced Reporting",
    "feat.f8.d":
      "Detailed analytics on FX exposure, cost savings, and payment performance. Export to Excel, PDF, or via API.",

    // Comparator misc
    "cmp.provider": "Provider",

    // shadcn/ui sr-only labels
    "common.previous": "Previous",
    "common.next": "Next",
    "common.morePages": "More pages",
    "common.prevSlide": "Previous slide",
    "common.nextSlide": "Next slide",
    "common.toggleSidebar": "Toggle Sidebar",
    "common.sidebar": "Sidebar",
    "common.sidebarDesc": "Displays the mobile sidebar.",
    "common.prevPage": "Go to previous page",
    "common.nextPage": "Go to next page",
    "common.pagination": "pagination",
  },
  es: {
    "errors.notFound.title": "Página no encontrada",
    "errors.notFound.body": "La página que buscas no existe o ha sido movida.",
    "errors.notFound.cta": "Ir al inicio",
    "errors.post.title": "Artículo no encontrado",
    "errors.post.body": "Este artículo no existe o fue despublicado.",
    "errors.post.back": "Volver al blog",
    "errors.post.load": "No se pudo cargar este artículo:",

    "blog.empty": "Aún no hay publicaciones. Vuelve pronto.",
    "blog.backShort": "Volver al blog",
    "blog.cta.prompt": "¿Listo para comparar tu transferencia?",
    "blog.cta.button": "Abrir el comparador",
    "blog.audience.business": "Empresas",
    "blog.audience.retail": "Retail",
    "blog.audience.both": "Ambos",

    "pricing.eyebrow": "Gratis para retail. De pago para empresas que necesitan automatización.",
    "pricing.title.a": "Cómo ganamos",
    "pricing.title.b": "dinero",
    "pricing.title.c": "— y cómo ahorras tú",
    "pricing.subtitle":
      "El uso retail es gratuito, financiado por comisiones de afiliación de los proveedores. Las empresas pagan por la automatización, el acceso a la API y el motor de optimización que funciona en segundo plano.",
    "pricing.popular": "Más popular",
    "pricing.free.name": "Free",
    "pricing.free.price": "$0",
    "pricing.free.cadence": "para siempre",
    "pricing.free.desc":
      "El comparador completo + chat de IA para particulares y transferencias puntuales. Ganamos con comisiones de afiliación cuando usas un proveedor — tú no pagas extra.",
    "pricing.free.f1": "30+ proveedores, 100+ divisas",
    "pricing.free.f2": "Tipos mid-market en vivo",
    "pricing.free.f3": "Recomendación + chat de Mango AI",
    "pricing.free.f4": "Financiado por afiliación, sin registro",
    "pricing.free.f5": "Acceso público vía web",
    "pricing.free.cta": "Usar la herramienta FX",
    "pricing.pro.name": "Pro",
    "pricing.pro.price": "$49",
    "pricing.pro.cadence": "/ mes",
    "pricing.pro.desc":
      "Para remitentes frecuentes, freelancers y pymes. Alertas automatizadas de mejor ruta, monitorización multi-corredor y beneficiarios guardados.",
    "pricing.pro.badge": "Para pymes y freelancers",
    "pricing.pro.f1": "Todo lo de Free",
    "pricing.pro.f2": "Alertas de tipo en tus corredores",
    "pricing.pro.f3": "Beneficiarios e historial guardados",
    "pricing.pro.f4": "Exportación CSV e informe mensual",
    "pricing.pro.f5": "IA prioritaria (razonamiento avanzado)",
    "pricing.pro.f6": "Soporte por email",
    "pricing.pro.cta": "Empezar Pro",
    "pricing.ent.name": "Enterprise",
    "pricing.ent.price": "A medida",
    "pricing.ent.desc":
      "Equipos de tesorería y fintechs. Acceso API al motor de decisión, mix de proveedores personalizado, SSO, logs de auditoría y SLA.",
    "pricing.ent.f1": "Todo lo de Pro",
    "pricing.ent.f2": "API REST al motor de decisión",
    "pricing.ent.f3": "Mix de proveedores y reglas a medida",
    "pricing.ent.f4": "Webhooks y enrutamiento por lotes",
    "pricing.ent.f5": "Gestor de cuenta dedicado",
    "pricing.ent.f6": "SSO, logs de auditoría, SLA",
    "pricing.ent.cta": "Hablar con ventas",
    "pricing.faq.title": "¿Cómo funciona esto con las comisiones de afiliación?",
    "pricing.faq.body":
      "Cuando usas el comparador gratuito y eliges un proveedor, podemos cobrar una comisión de ese proveedor — sin coste extra para ti. La recomendación es neutral y se ordena por importe realmente recibido. Los planes Pro y Enterprise existen para empresas que necesitan más que una comparación puntual: optimización continua entre corredores, una API para integrar en flujos de pago y enrutamiento por reglas. La suscripción paga el motor y la automatización — no la comparación, que sigue siendo gratuita.",

    "platform.eyebrow": "La plataforma detrás de mangomundi",
    "platform.title.a": "Infraestructura de IA para",
    "platform.title.b": "decisiones complejas",
    "platform.subtitle":
      "No estamos construyendo otro sitio de comparación. Estamos construyendo la capa de decisión, abastecimiento y ejecución para mercados fragmentados — empezando por FX transfronterizo, extendiéndose a toda categoría con precios opacos y opciones difíciles.",
    "platform.core.title": "Un motor central",
    "platform.core.sub":
      "Infraestructura compartida en cada vertical. Añade un mercado nuevo, no un producto nuevo.",
    "platform.core.l1.t": "Motor de recomendación IA",
    "platform.core.l1.d": "Perfilado de usuario, extracción de contexto, ranking multicriterio.",
    "platform.core.l2.t": "Grafo de proveedores",
    "platform.core.l2.d":
      "Esquema unificado para cada vertical: precio, confianza, cobertura, desempeño.",
    "platform.core.l3.t": "Motor RFQ y matching",
    "platform.core.l3.d":
      "Genera solicitudes de cotización, enruta a proveedores elegibles, normaliza ofertas.",
    "platform.core.l4.t": "Confianza y transparencia",
    "platform.core.l4.d":
      "Datos de reguladores, agregación de reseñas, separación orgánico vs patrocinado.",
    "platform.vert.title": "Múltiples verticales",
    "platform.vert.sub": "Toda categoría fragmentada, opaca y de alto riesgo es candidata.",
    "platform.vert.v1": "FX y pagos transfronterizos",
    "platform.vert.v2": "Brókers e inversión (TradeHunter)",
    "platform.vert.v3": "Aseguradoras y corredores de seguros",
    "platform.vert.v4": "Compras de SaaS",
    "platform.vert.v5": "Cloud e infraestructura",
    "platform.vert.v6": "Infraestructura de pagos (APIs)",
    "platform.vert.v7": "Préstamos y tesorería",
    "platform.vert.v8": "Carga y financiación comercial",
    "platform.status.live": "Activo",
    "platform.status.building": "En desarrollo",
    "platform.status.planned": "Planeado",
    "platform.road.title": "Hoja de ruta",
    "platform.road.sub": "De la comparación a una capa universal de decisión.",
    "platform.road.s1.t": "Plataforma de comparación",
    "platform.road.s1.s": "Activo para FX",
    "platform.road.s2.t": "Motor de recomendación IA",
    "platform.road.s2.s": "Activo para FX",
    "platform.road.s3.t": "Marketplace de routing de leads",
    "platform.road.s3.s": "Q1 2026",
    "platform.road.s4.t": "RFQ + automatización de negociación",
    "platform.road.s4.s": "2026",
    "platform.road.s5.t": "Infraestructura de compras con IA",
    "platform.road.s5.s": "2026–2027",
    "platform.road.s6.t": "Capa universal de decisión",
    "platform.road.s6.s": "Visión",
    "platform.ent.title": "Despliegues empresariales y privados",
    "platform.ent.body":
      "Bancos, equipos de tesorería y grandes empresas no quieren un marketplace público para decisiones sensibles. Ofrecemos SaaS gestionado, SaaS privado y despliegues solo-API del mismo motor de decisión — con tu red de proveedores y controles de cumplimiento.",
    "platform.ent.cta1": "Hablar con nosotros",
    "platform.ent.cta2": "Soluciones para empresas",

    "ins.badge": "Vertical #2 · Próximamente",
    "ins.title.a": "Seguros, decididos",
    "ins.title.b": "inteligentemente",
    "ins.subtitle":
      "El mismo motor de IA neutral que potencia la comparación FX de mangomundi se extiende a seguros. Compara pólizas entre proveedores con precios transparentes, puntuación de cobertura y una recomendación ajustada a tu situación.",
    "ins.c1.t": "Puntuación de cobertura",
    "ins.c1.b":
      "Matriz de cobertura normalizada entre proveedores — sin sorpresas en la letra pequeña.",
    "ins.c2.t": "Consejo de IA neutral",
    "ins.c2.b": "El mismo motor multi-modelo. Recomienda lo que te encaja, no lo que más nos paga.",
    "ins.c3.t": "Un solo flujo de decisión",
    "ins.c3.b": "Cotiza, compara y contrata en un mismo lugar — salud, viaje, auto y hogar.",
    "ins.why.t": "Por qué importa",
    "ins.why.b1":
      "mangomundi está construido como una plataforma de decisión multi-vertical. FX es el primer vertical activo. Seguros es el siguiente, luego SaaS, préstamos y brókers — todos sobre el mismo esquema de proveedores, ranking patrocinado vs orgánico y capa de recomendación de IA. Mira la",
    "ins.why.link": "visión de plataforma",
    "ins.why.b2": "para la hoja de ruta completa.",
    "ins.cta1": "Sé un socio de lanzamiento · Beta Enterprise",
    "ins.cta2": "Prueba el motor FX",

    "feat.title.a": "Todo lo que necesitas para",
    "feat.title.b": "Pagos Globales",
    "feat.subtitle":
      "Una plataforma completa para comparar, optimizar y ejecutar pagos transfronterizos a cualquier escala.",
    "feat.f1.t": "Comparación de tipos en tiempo real",
    "feat.f1.d":
      "Accede a tipos de cambio en vivo de más de 150 proveedores. Nuestro motor se actualiza cada 30 segundos para que siempre veas datos de mercado actuales.",
    "feat.f2.t": "Enrutamiento inteligente con IA",
    "feat.f2.d":
      "Nuestra IA neutral analiza velocidad, coste, fiabilidad y cumplimiento para construir la ruta de pago óptima para cada transacción.",
    "feat.f3.t": "Carteras multi-divisa",
    "feat.f3.d":
      "Mantén saldos en más de 150 divisas. Convierte entre divisas a tipos líderes del mercado con un clic.",
    "feat.f4.t": "API empresarial",
    "feat.f4.d":
      "APIs REST con documentación completa, webhooks y SDKs para Python, Node.js, Java y Go.",
    "feat.f5.t": "Automatización de cumplimiento",
    "feat.f5.d":
      "KYC, screening AML y reporte regulatorio automatizados en todas las jurisdicciones soportadas.",
    "feat.f6.t": "Soporte global 24/7",
    "feat.f6.d":
      "Equipos expertos en Londres, Singapur, Nueva York y Lagos. Disponibles por chat, email y teléfono.",
    "feat.f7.t": "Pagos programados",
    "feat.f7.d":
      "Configura transferencias recurrentes, contratos forward y estrategias automatizadas de hedging.",
    "feat.f8.t": "Reportes avanzados",
    "feat.f8.d":
      "Analítica detallada sobre exposición FX, ahorro y desempeño de pagos. Exporta a Excel, PDF o vía API.",

    "cmp.provider": "Proveedor",

    "common.previous": "Anterior",
    "common.next": "Siguiente",
    "common.morePages": "Más páginas",
    "common.prevSlide": "Diapositiva anterior",
    "common.nextSlide": "Siguiente diapositiva",
    "common.toggleSidebar": "Alternar barra lateral",
    "common.sidebar": "Barra lateral",
    "common.sidebarDesc": "Muestra la barra lateral móvil.",
    "common.prevPage": "Ir a la página anterior",
    "common.nextPage": "Ir a la página siguiente",
    "common.pagination": "paginación",
  },
};

// Unified hero/comparator/blog/contact keys (EN canonical + ES; other langs fall back to EN).
const EXTRA_KEYS: Partial<Record<Lang, Dict>> = {
  en: {
    "hero.headline": "Intelligent currency exchange decisions",
    "hero.subheadline":
      "AI Agent for corporate treasury and individuals. Optimization and transparency in your currency exchange and international payment operations.",
    "comparator.subheadline": "Live rates · Neutral AI · 30+ providers",
    "blog.emptyState": "\nUnder construction — we're crafting new insights. Check back soon.",
    "contact.heading": "Institutional & Partnership Inquiries",
    "contact.intro":
      "For treasury operations, liquidity partnerships, regulatory diligence and institutional onboarding.",
    "contact.fullName": "Full name",
    "contact.fullNamePlaceholder": "Jane Doe",
    "contact.workEmail": "Work email",
    "contact.workEmailPlaceholder": "jane@institution.com",
    "contact.institution": "Institution",
    "contact.institutionPlaceholder": "Institution / Company",
    "contact.scope": "Scope",
    "contact.scopePlaceholder": "Briefly describe your flow, corridor or partnership scope.",
    "contact.submit": "Open secure channel",
    "contact.submitHint": "submit → hello@mangomundi.com",
    "contact.orWrite": "Or write directly to",
    "comparator.buildQuery": "build query",
    "comparator.execStrategy": "Execution Strategy",
    "comparator.execStrategy.note": "Notional amount and timing of the operation.",
    "comparator.marketContext": "Market Context",
    "comparator.marketContext.note": "Geographic origin and destination of the flow.",
    "comparator.currencyPair": "Currency Pair",
    "comparator.currencyPair.note": "Base and quote currencies for the operation.",
    "comparator.field.sourceCurrency": "Source Currency",
    "comparator.field.targetCurrency": "Target Currency",
    "comparator.segment.retail": "Individual",
    "comparator.segment.business": "Business",
    "hero.subheadline.short":
      "AI agent for global and local payments. Best rates for individuals and businesses.",
    "seo.home.title": "Mangomundi | Intelligent currency exchange decisions",
    "seo.home.description":
      "A transparent AI agent for global and local payments, comparing exchange rates, fees, routes, and delivery speeds in real time to find the best option for every transfer.",
    "comparator.title": "Find the optimal route",
    "comparator.subtitle": "Geography, amount, currencies, urgency — one decision engine.",
    "comparator.cta.compare": "Compare Providers",
    "comparator.field.sourceCountry": "Source country",
    "comparator.field.targetCountry": "Target country",
    "comparator.field.amount": "You send",
    "comparator.field.youReceive": "You receive",
    "comparator.field.urgency": "Urgency",
    "comparator.combobox.search": "Search…",
    "comparator.combobox.empty": "No results.",
    "comparator.combobox.placeholder": "Select…",
    "comparator.copilot.title": "FX Copilot",
    "comparator.copilot.agent": "AI Agent",
    "comparator.copilot.placeholder": "Ask a follow-up about this route…",
    "comparator.copilot.empty": "Run a comparison to enable the copilot.",
    "comparator.copilot.send": "Send",
    "comparator.copilot.analyzing": "Analyzing results…",
    "comparator.copilot.proceed": "Continue with {provider}",
    "comparator.copilot.proactive.rate":
      "I noticed **{provider}** offers the best rate right now for this amount. Want me to help you proceed?",
    "comparator.copilot.proactive.fee":
      "Heads up: **{provider}** has the lowest total fees for this amount. Ready to continue?",
    "comparator.copilot.proactive.speed":
      "**{provider}** is the fastest option for this corridor right now. Want to proceed?",
    "comparator.copilot.filterReact":
      "I see you filtered by **{filter}** — here are the best brokers for that selection:",
    "comparator.copilot.filter.received": "Best rate",
    "comparator.copilot.filter.fee": "Cheapest fees",
    "comparator.copilot.filter.speed": "Fastest",
    "comparator.copilot.redirecting":
      "Redirecting to **{provider}**. Complete the process here to secure your exclusive mangomundi discount.",
    "comparator.copilot.b2bUpsell":
      "Are you a company? Get better rates with our B2B program — our corporate desk negotiates custom spreads for volumes above 10,000.",
    "comparator.tooltip.preferred_rate": "Apply mangomundi Preferred rate",
    "comparator.tooltip.discount_warning": "Leaving mangomundi may void your exclusive discount",
    "comparator.reasoning.title": "Optimal route found",
    "comparator.reasoning.context": "Context",
    "comparator.lastUpdate": "Last update",
    "comparator.savings.label": "Your estimated saving",
    "comparator.savings.baseline": "vs 3.5% market average for this corridor",
    "comparator.disclaimer.neutrality":
      "mangomundi may earn affiliate commissions; this does not alter the neutrality of the ranking.",
    "search.eyebrow": "Financial intelligence terminal",
    "search.origin": "Origin country",
    "search.destination": "Recipient country",
    "search.segment": "Profile",
    "search.segment.retail": "Individual",
    "search.segment.business": "Business",
    "search.selectCountry": "Select country…",
    "search.cta": "Continue",
    "search.startTransfer": "Start a transfer",
    "search.liveRates": "Live rates",
    "search.destinationPrompt": "SELECT THE RECIPIENT COUNTRY",
    "search.guide":
      "Select your destination country and choose between individual or business profile. For local currency exchange, select your current country. Our AI Agent will immediately compare providers and real-time market rates to help you decide.",
    "search.promise": "Intelligent market comparison. No account required. No hidden fees.",
    "search.hint": "Independent market comparison. No account required.",
    "search.verified": "Market verified",
    "search.noHiddenFees": "No hidden fees",
    "search.new": "New search",
    "search.sameCountry":
      "Same-country route: choose two different currencies to compare conversion options.",
    "comparator.copilot.business.intro":
      "As a business, your treasury needs are unique. Please tell me your estimated monthly volume and sector (for example: `50000, software`).",
    "comparator.copilot.business.volumeError":
      "Please include both an estimated monthly volume and your sector.",
    "comparator.copilot.business.email":
      "Thank you. For this volume, the best institutional rates are currently **{providers}**. Please confirm your corporate email to continue.",
    "comparator.copilot.business.emailError": "Please provide a valid corporate email address.",
    "comparator.copilot.business.consent":
      "GDPR consent: by confirming, you agree that mangomundi may store these details and share this quote request with selected providers. Is that correct?",
    "comparator.copilot.business.yes": "Yes, I agree",
    "comparator.copilot.business.review": "Review email",
    "comparator.copilot.business.no":
      "No problem. Please enter the corporate email you want to use.",
    "comparator.copilot.business.success":
      "I've registered your request. Our specialists will review your case and send the market summary to your email.",
    "comparator.copilot.business.saveError":
      "I couldn't register the request right now. Your details were not submitted; please try again.",
    "comparator.transferDetails": "Transfer Details",
    "comparator.transferDetails.subtitle":
      "Adjust the amount and currencies before running the market comparison.",
    "comparator.advancedSearch": "Advanced Search",
    "comparator.advancedOptions": "Advanced options",
    "comparator.results": "Your results",
    "comparator.sortBy": "Sort by",
    "comparator.sort.received": "Best rate",
    "comparator.sort.fee": "Cheapest fees",
    "comparator.sort.speed": "Fastest",
    "comparator.reference": "Reference",
    "comparator.cached": "Cached",
    "comparator.cachedNote": "Rates are last known/cached, not live.",
    "comparator.empty": "No providers available for this corridor yet.",
    "comparator.b2b.title": "Sending over {amount} {cur}? Talk to our business desk.",
    "comparator.b2b.body":
      "For high-volume transfers, dedicated providers offer custom rates, treasury tooling and an account manager. →",
    "wizard.compare": "Compare",
    "wizard.howToCompare":
      "Read the table left to right: **rate** is how much of the destination currency you get per unit sent before fees, **fee** is the total charged by that provider, and **received** is the net amount that actually arrives. Use the column headers to sort by best amount received, lowest fee, or fastest delivery time.",
    "wizard.limits":
      "The comparator table doesn't track per-provider transfer limits yet — that field isn't part of the current dataset, so I won't guess. Please check the provider's own site for minimum/maximum amounts before sending.",
    "wizard.fees.header": "Fee breakdown from the current table:",
    "wizard.fees.noCharges": "no declared fixed/percent charges",
    "wizard.fees.fixed": "fixed",
    "wizard.fees.fee": "fee",
    "wizard.fees.spread": "spread",
    "wizard.fees.total": "total",
    "wizard.action.how": "How to compare",
    "wizard.action.limits": "Check transfer limits",
    "wizard.action.fees": "Break down the fees",
    "wizard.action.report": "Report a missing route",
    "wizard.quickActions": "Wizard — quick actions",
    "wizard.quickActionsAria": "AI Wizard quick actions",
    "wizard.reportNote":
      "I have noted your interest in the {from}-{to} route. It has been added to the discovery log; we will prioritize it as demand grows.",
    "wizard.runFirst":
      "Run a comparison first — I answer using the table data, not external sources.",
    "corridor.missing.title": "We don't currently price {from} → {to}.",
    "corridor.missing.body":
      "This corridor isn't covered by any connected provider yet. You can request it and we'll prioritize coverage when it has enough demand.",
    "corridor.missing.request": "Request to add this route",
    "corridor.missing.requested": "✓ Route requested",
    "agent.minimize": "Minimize AI Agent",
    "agent.unread": "{n} unread messages",
    "comparator.field.amountMode": "Calculation",
    "comparator.amountMode.send": "Send",
    "comparator.amountMode.receive": "Receive",
    "comparator.field.amountSent": "Amount sent",
    "comparator.field.amountReceived": "Amount received",
    "comparator.cta.compareRates": "Search",
    "comparator.table.amountSent": "Amount Sent",
    "comparator.table.bestRate": "Best Rate",
    "about.title": "Financial intelligence for every currency decision",
    "about.metric4.label": "Global providers evaluated in real time",
    "about.coverage.eyebrow": "Market Coverage",
    "about.coverage.title": "One view across the global FX market.",
    "about.coverage.body":
      "Our decision engine evaluates more than 50 global providers in real time, normalizing rates, fees, delivery speed and corridor availability into a clear comparison.",
    "contact.success":
      "Thank you. Your message has been received and our team will respond shortly.",
    "contact.error": "We couldn't send your message. Please try again.",
  },
  es: {
    "hero.headline": "Decisiones inteligentes de cambio de divisas",
    "hero.subheadline.short":
      "Agente de IA para pagos globales y locales. Las mejores tasas para particulares y empresas.",
    "seo.home.title": "Mangomundi | Intelligent currency exchange decisions",
    "seo.home.description":
      "A transparent AI agent for global and local payments, comparing exchange rates, fees, routes, and delivery speeds in real time to find the best option for every transfer.",
    "hero.subheadline":
      "Agente de IA para tesorería corporativa e individuos. Optimización y transparencia en tus operaciones de cambio de divisas y pagos internacionales.",
    "comparator.subheadline": "Tasas en vivo · IA neutral · +30 proveedores",
    "blog.emptyState": "\nEn construcción — estamos preparando nuevos contenidos. Vuelve pronto.",
    "contact.heading": "Consultas Institucionales y de Partnership",
    "contact.intro":
      "Para operaciones de tesorería, alianzas de liquidez, due diligence regulatorio y onboarding institucional.",
    "contact.fullName": "Nombre completo",
    "contact.fullNamePlaceholder": "Juana Pérez",
    "contact.workEmail": "Email corporativo",
    "contact.workEmailPlaceholder": "jane@institucion.com",
    "contact.institution": "Institución",
    "contact.institutionPlaceholder": "Institución / Empresa",
    "contact.scope": "Alcance",
    "contact.scopePlaceholder": "Describí brevemente tu flujo, corredor o alcance del partnership.",
    "contact.submit": "Abrir canal seguro",
    "contact.submitHint": "enviar → hello@mangomundi.com",
    "contact.orWrite": "O escribinos directamente a",
    "comparator.buildQuery": "construir consulta",
    "comparator.execStrategy": "Estrategia de Ejecución",
    "comparator.execStrategy.note": "Monto nocional y urgencia de la operación.",
    "comparator.marketContext": "Contexto de Mercado",
    "comparator.marketContext.note": "Origen y destino geográfico del flujo.",
    "comparator.currencyPair": "Par de Divisas",
    "comparator.currencyPair.note": "Divisas base y cotizada de la operación.",
    "comparator.field.sourceCurrency": "Divisa de Origen",
    "comparator.field.targetCurrency": "Divisa de Destino",
    "comparator.segment.retail": "Individual",
    "comparator.segment.business": "Empresas",
    "search.eyebrow": "Terminal de inteligencia financiera",
    "search.origin": "País de origen",
    "search.destination": "País de destino",
    "search.segment": "Perfil",
    "search.segment.retail": "Individual",
    "search.segment.business": "Empresa",
    "search.selectCountry": "Seleccionar país…",
    "search.cta": "Consultar opciones",
    "search.hint": "Comparación independiente de mercado. Sin registro.",
    "search.verified": "Mercado verificado",
    "search.noHiddenFees": "Sin comisiones ocultas",
    "search.new": "Nueva búsqueda",
    "search.sameCountry":
      "Ruta dentro del mismo país: elige dos divisas distintas para comparar opciones de conversión.",
    "comparator.copilot.business.intro":
      "Como empresa, tus necesidades de tesorería son únicas. Indícame tu volumen mensual estimado y sector (por ejemplo: `50000, software`).",
    "comparator.copilot.business.volumeError": "Incluye el volumen mensual estimado y el sector.",
    "comparator.copilot.business.email":
      "Gracias. Con este volumen, las mejores tarifas institucionales son **{providers}**. Confirma tu email corporativo para continuar.",
    "comparator.copilot.business.emailError": "Introduce un email corporativo válido.",
    "comparator.copilot.business.consent":
      "Consentimiento GDPR: al confirmar, aceptas que mangomundi guarde estos datos y comparta la solicitud con los proveedores seleccionados. ¿Es correcto?",
    "comparator.copilot.business.yes": "Sí, acepto",
    "comparator.copilot.business.review": "Revisar email",
    "comparator.copilot.business.no":
      "Sin problema. Introduce el email corporativo que quieras utilizar.",
    "comparator.copilot.business.success":
      "He registrado tu solicitud. Nuestros especialistas revisarán tu caso y enviarán el resumen de mercado a tu email.",
    "comparator.copilot.business.saveError":
      "No he podido registrar la solicitud. Tus datos no se enviaron; inténtalo de nuevo.",
    "comparator.transferDetails": "Detalles de la transferencia",
    "comparator.transferDetails.subtitle":
      "Ajusta el importe y las monedas antes de ejecutar la comparación de mercado.",
    "comparator.advancedSearch": "Búsqueda avanzada",
    "comparator.advancedOptions": "Opciones avanzadas",
    "comparator.results": "Tus resultados",
    "comparator.sortBy": "Ordenar por",
    "comparator.sort.received": "Mejor tasa",
    "comparator.sort.fee": "Menores fees",
    "comparator.sort.speed": "Más rápido",
    "comparator.reference": "Referencia",
    "comparator.cached": "Cacheado",
    "comparator.cachedNote": "Tasas últimas conocidas/cacheadas, no en vivo.",
    "comparator.empty": "Todavía no hay proveedores disponibles para este corredor.",
    "comparator.b2b.title": "¿Enviás más de {amount} {cur}? Hablá con nuestra mesa corporativa.",
    "comparator.b2b.body":
      "Para transferencias de alto volumen, hay proveedores dedicados con tasas a medida, herramientas de tesorería y un account manager. →",
    "wizard.compare": "Comparar",
    "wizard.howToCompare":
      "Leé la tabla de izquierda a derecha: **tasa** es cuánto recibís de la moneda destino por unidad enviada antes de fees, **fee** es el cargo total de ese proveedor, y **recibido** es el neto que realmente llega. Usá los encabezados de columna para ordenar por mejor monto recibido, menor fee, o entrega más rápida.",
    "wizard.limits":
      "La tabla del comparador todavía no registra límites de transferencia por proveedor — ese dato no forma parte del dataset actual, así que no lo voy a inventar. Verificá en el sitio del proveedor los montos mínimo/máximo antes de enviar.",
    "wizard.fees.header": "Desglose de fees según la tabla actual:",
    "wizard.fees.noCharges": "sin cargos fijos/porcentuales declarados",
    "wizard.fees.fixed": "fijo",
    "wizard.fees.fee": "fee",
    "wizard.fees.spread": "spread",
    "wizard.fees.total": "total",
    "wizard.action.how": "Cómo comparar",
    "wizard.action.limits": "Ver límites de transferencia",
    "wizard.action.fees": "Desglosar los fees",
    "wizard.action.report": "Reportar una ruta faltante",
    "wizard.quickActions": "Wizard — acciones rápidas",
    "wizard.quickActionsAria": "Acciones rápidas del Wizard IA",
    "wizard.reportNote":
      "Tomé nota de tu interés en la ruta {from}-{to}. Quedó registrada en el log de descubrimiento; la priorizaremos a medida que crezca la demanda.",
    "wizard.runFirst":
      "Primero corré una comparación — respondo con los datos de la tabla, no con fuentes externas.",
    "corridor.missing.title": "Todavía no cotizamos {from} → {to}.",
    "corridor.missing.body":
      "Este corredor aún no está cubierto por ningún proveedor conectado. Podés solicitarlo y priorizaremos la cobertura cuando tenga suficiente demanda.",
    "corridor.missing.request": "Solicitar esta ruta",
    "corridor.missing.requested": "✓ Ruta solicitada",
    "agent.minimize": "Minimizar Agente IA",
    "agent.unread": "{n} mensajes sin leer",
    "comparator.field.amountMode": "Cálculo",
    "comparator.amountMode.send": "Enviar",
    "comparator.amountMode.receive": "Recibir",
    "comparator.field.amountSent": "Importe enviado",
    "comparator.field.amountReceived": "Importe recibido",
    "comparator.cta.compareRates": "Buscar",
    "comparator.table.amountSent": "Importe enviado",
    "comparator.table.bestRate": "Mejor tasa",
    "about.title": "Inteligencia financiera para cada decisión de divisas.",
    "about.metric4.label": "Proveedores globales evaluados en tiempo real",
    "about.coverage.eyebrow": "Cobertura de mercado",
    "about.coverage.title": "Una visión unificada del mercado global de divisas.",
    "about.coverage.body":
      "Nuestro motor de decisión evalúa más de 50 proveedores globales en tiempo real y normaliza tasas, comisiones, velocidad y disponibilidad por corredor.",
    "contact.success": "Gracias. Hemos recibido tu mensaje y nuestro equipo responderá pronto.",
    "contact.error": "No hemos podido enviar tu mensaje. Inténtalo de nuevo.",
  },
};

// Merge compliance + manifesto + legal/business + UI + home + page + extra keys into the main dictionaries.
for (const code of SUPPORTED_LANGS) {
  // Defensive: ensure target exists so Object.assign never receives null/undefined
  // even if SUPPORTED_LANGS drifts ahead of DICTS during refactors.
  if (!DICTS[code]) DICTS[code] = {};
  Object.assign(
    DICTS[code],
    COMPLIANCE_KEYS[code] ?? {},
    MANIFESTO_KEYS[code] ?? {},
    LEGAL_BUSINESS_KEYS[code] ?? {},
    UI_KEYS[code] ?? {},
    HOME_SECTIONS_KEYS[code] ?? {},
    PAGE_KEYS[code] ?? {},
    EXTRA_KEYS[code] ?? {},
  );
}

// ============================================================================
// Load auto-generated translations (scripts/translations/<lang>.json) and
// merge them OVER the in-source defaults so they take precedence for any key
// present in the JSON. The in-source EN strings remain the source of truth;
// any key missing from a JSON file falls through to the EN fallback in t().
// ============================================================================
try {
  // Vite resolves this glob at build time; in bun script contexts it returns {}.
  const translationModules = import.meta.glob("../../scripts/translations/*.json", {
    eager: true,
    import: "default",
  }) as Record<string, Record<string, string> | undefined>;
  for (const [path, dict] of Object.entries(translationModules)) {
    const match = path.match(/\/([a-z]{2})\.json$/);
    if (!match) continue;
    const code = match[1] as Lang;
    if (!SUPPORTED_LANGS.includes(code)) continue;
    if (!dict || typeof dict !== "object") continue;
    if (!DICTS[code]) DICTS[code] = {};
    Object.assign(DICTS[code], dict);
  }
} catch {
  // Glob not available (non-Vite runtime) — translations stay un-merged.
}

// ============================================================================
// validateDictionaries — compare DICTS.en (source of truth) against every
// other supported language. Returns a report of missing/broken keys per lang.
// Use this in CI or via `bun run scripts/i18n-validate.ts` to produce
// `i18n-errors.log` and feed it back into the translation pipeline.
// ============================================================================
export interface I18nValidationReport {
  ok: boolean;
  enKeyCount: number;
  perLang: Record<Lang, { missing: string[]; empty: string[]; coverage: number }>;
  brokenLangs: Lang[]; // languages whose dict is missing/null/not an object
}

export function validateDictionaries(): I18nValidationReport {
  const enDict = DICTS.en ?? {};
  const enKeys = Object.keys(enDict);
  const perLang = {} as I18nValidationReport["perLang"];
  const brokenLangs: Lang[] = [];

  for (const code of SUPPORTED_LANGS) {
    const dict = DICTS[code];
    if (!dict || typeof dict !== "object") {
      brokenLangs.push(code);
      perLang[code] = { missing: enKeys.slice(), empty: [], coverage: 0 };
      continue;
    }
    const missing: string[] = [];
    const empty: string[] = [];
    for (const key of enKeys) {
      const v = dict[key];
      if (v === undefined) missing.push(key);
      else if (typeof v !== "string" || v.trim() === "") empty.push(key);
    }
    const filled = enKeys.length - missing.length - empty.length;
    perLang[code] = {
      missing,
      empty,
      coverage: enKeys.length ? +(filled / enKeys.length).toFixed(4) : 1,
    };
  }

  const ok =
    brokenLangs.length === 0 &&
    Object.values(perLang).every((r) => r.missing.length === 0 && r.empty.length === 0);

  return { ok, enKeyCount: enKeys.length, perLang, brokenLangs };
}

// Auto-run validation in DEV to surface drift early (warn-only, never throws).
if (import.meta.env?.DEV) {
  try {
    const report = validateDictionaries();
    if (!report.ok) {
      const summary = SUPPORTED_LANGS.filter((c) => c !== "en")
        .map((c) => {
          const r = report.perLang[c];
          return `${c}: ${Math.round(r.coverage * 100)}% (missing ${r.missing.length}, empty ${r.empty.length})`;
        })
        .join(" · ");
      // eslint-disable-next-line no-console
      console.warn(`[i18n] dictionary drift detected — ${summary}`);
      if (report.brokenLangs.length) {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] BROKEN dictionaries (missing/non-object):`, report.brokenLangs);
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[i18n] validateDictionaries failed:", e);
  }
}

// === Per-language SEO meta (Home / sitewide default) ===
export interface SeoMeta {
  title: string;
  description: string;
}
const SEO_META_TRANSLATED: Record<Lang, SeoMeta> = {
  en: {
    title: "Intelligent Currency Exchange — mangomundi",
    description:
      "AI agent for global and local payments. Best rates for individuals and businesses.",
  },
  es: {
    title: "mangomundi | Decisiones inteligentes de cambio de divisas y pagos globales",
    description:
      "Agente de IA para individuos y tesorería corporativa. Optimización y transparencia en tus operaciones de cambio y pagos internacionales.",
  },
  pt: {
    title: "mangomundi | Decisões inteligentes de câmbio e pagamentos globais",
    description:
      "Agente de IA para indivíduos e tesouraria corporativa. Otimização e transparência em suas operações de câmbio e pagamentos internacionais.",
  },
  it: {
    title: "mangomundi | Decisioni intelligenti sui cambi e pagamenti globali",
    description:
      "Agente IA per privati e tesoreria aziendale. Ottimizzazione e trasparenza nelle operazioni di cambio e pagamenti internazionali.",
  },
  fr: {
    title: "mangomundi | Décisions intelligentes de change et de paiements mondiaux",
    description:
      "Agent IA pour les particuliers et la trésorerie d'entreprise. Optimisation et transparence de vos opérations de change et paiements internationaux.",
  },
  de: {
    title: "mangomundi | Intelligente Entscheidungen für Devisen und globale Zahlungen",
    description:
      "KI-Agent für Privatpersonen und Unternehmensschatzämter. Optimierung und Transparenz bei Ihren Devisen- und internationalen Zahlungsgeschäften.",
  },
  pl: {
    title: "mangomundi | Inteligentne decyzje w zakresie wymiany walut i płatności globalnych",
    description:
      "Agent AI dla klientów indywidualnych i skarbców korporacyjnych. Optymalizacja i przejrzystość w operacjach wymiany walut i płatnościach międzynarodowych.",
  },
  ru: {
    title: "mangomundi | Умные решения по обмену валют и глобальным платежам",
    description:
      "AI-агент для частных лиц и корпоративных казначейств. Оптимизация и прозрачность ваших операций по обмену валют и международным платежам.",
  },
  tr: {
    title: "mangomundi | Döviz ve küresel ödemeler için akıllı kararlar",
    description:
      "Bireyler ve kurumsal hazineler için AI Ajanı. Döviz ve uluslararası ödeme işlemlerinizde optimizasyon ve şeffaflık.",
  },
  bn: {
    title: "mangomundi | মুদ্রা বিনিময় ও বৈশ্বিক পেমেন্টের জন্য স্মার্ট সিদ্ধান্ত",
    description:
      "ব্যক্তি ও কর্পোরেট ট্রেজারির জন্য AI এজেন্ট। আপনার মুদ্রা বিনিময় ও আন্তর্জাতিক পেমেন্ট পরিচালনায় অপ্টিমাইজেশন ও স্বচ্ছতা।",
  },
  ur: {
    title: "mangomundi | کرنسی کے تبادلے اور عالمی ادائیگیوں کے لیے ذہین فیصلے",
    description:
      "افراد اور کارپوریٹ ٹریژری کے لیے AI ایجنٹ۔ آپ کی کرنسی ایکسچینج اور بین الاقوامی ادائیگی کے کاموں میں اصلاح اور شفافیت۔",
  },
  th: {
    title: "mangomundi | การตัดสินใจอัจฉริยะด้านการแลกเปลี่ยนเงินตราและการชำระเงินทั่วโลก",
    description:
      "AI Agent สำหรับบุคคลและคลังของบริษัท การเพิ่มประสิทธิภาพและความโปร่งใสในการแลกเปลี่ยนสกุลเงินและการชำระเงินระหว่างประเทศ",
  },
  hi: {
    title: "mangomundi | मुद्रा विनिमय और वैश्विक भुगतान के लिए स्मार्ट निर्णय",
    description:
      "व्यक्तियों और कॉर्पोरेट खजाने के लिए AI एजेंट। आपके मुद्रा विनिमय और अंतर्राष्ट्रीय भुगतान कार्यों में अनुकूलन और पारदर्शिता।",
  },
  zh: {
    title: "mangomundi | 智能外汇与全球支付决策",
    description: "面向个人与企业财务的 AI 代理。为您提供优化且透明的外汇与国际支付操作方案。",
  },
  id: {
    title: "mangomundi | Keputusan cerdas terkait valas dan pembayaran global",
    description:
      "Agen AI untuk individu dan perbendaharaan perusahaan. Optimalisasi dan transparansi dalam operasional valas dan pembayaran internasional Anda.",
  },
  tl: {
    title: "mangomundi | Matalinong desisyon sa foreign exchange at global payments",
    description:
      "AI Agent para sa mga indibidwal at corporate treasury. Optimization at transparency sa iyong currency exchange at international payment operations.",
  },
  ar: {
    title: "mangomundi | قرارات ذكية بشأن العملات الأجنبية والمدفوعات العالمية",
    description:
      "وكيل ذكاء اصطناعي للأفراد وخزائن الشركات. التحسين والشفافية في عمليات صرف العملات والمدفوعات الدولية الخاصة بك.",
  },
  vi: {
    title: "mangomundi | Quyết định thông minh về ngoại hối và thanh toán toàn cầu",
    description:
      "AI Agent dành cho cá nhân và kho bạc doanh nghiệp. Tối ưu hóa và tính minh bạch trong hoạt động trao đổi tiền tệ và thanh toán quốc tế của bạn.",
  },
  ja: {
    title: "mangomundi | 為替とグローバル決済に関するインテリジェントな意思決定",
    description:
      "個人および企業財務向けの AI エージェント。外貨両替および国際決済業務における最適化と透明性を提供します。",
  },
  ko: {
    title: "mangomundi | 환율 및 글로벌 결제에 대한 지능형 의사결정",
    description:
      "개인 및 기업 재무를 위한 AI 에이전트. 외환 거래 및 국제 결제 운영의 최적화와 투명성을 제공합니다.",
  },
};

const UNIFIED_OG_TITLE = "Mangomundi | Intelligent currency exchange decisions";
const UNIFIED_OG_DESCRIPTION =
  "A transparent AI agent for global and local payments, comparing exchange rates, fees, routes, and delivery speeds in real time to find the best option for every transfer.";

export const SEO_META: Record<Lang, SeoMeta> = Object.fromEntries(
  SUPPORTED_LANGS.map((code) => [
    code,
    {
      title: UNIFIED_OG_TITLE,
      description: UNIFIED_OG_DESCRIPTION,
    },
  ]),
) as Record<Lang, SeoMeta>;

// === Per-route SEO (title + description) per language ===
// Keys are route paths matching TanStack Router pathnames.
// Other 14 languages fall back to EN; unknown routes fall back to SEO_META.
type RouteSeoMap = Record<string, SeoMeta>;

const ROUTE_SEO_EN: RouteSeoMap = {
  "/": SEO_META.en,
  "/pricing": {
    title: "Pricing — mangomundi",
    description:
      "Free for retail users — paid for businesses that need optimised routing, API access, and white-label tools. Transparent, no hidden fees.",
  },
  "/platform": {
    title: "AI Decision Engine — mangomundi Platform",
    description:
      "AI-powered decision and sourcing infrastructure for complex markets. FX first; insurance, brokers, SaaS and lending follow.",
  },
  "/features": {
    title: "Features — mangomundi",
    description:
      "Explore mangomundi's platform features for intelligent cross-border payments: live rates, smart routing, multi-currency wallets and an enterprise API.",
  },
  "/insurance": {
    title: "Insurance Comparison (Coming Soon) — mangomundi",
    description:
      "mangomundi is bringing its neutral AI decision engine to insurance: compare policies across providers with transparent pricing and coverage.",
  },
  "/blog": {
    title: "Blog — mangomundi",
    description:
      "Guides, deep-dives, and analyses on cross-border payments, FX transparency, and how to send money smarter — for individuals and businesses.",
  },
  "/about": {
    title: "About — mangomundi",
    description:
      "mangomundi is building the neutral AI decision and sourcing layer for fragmented markets, starting with cross-border FX.",
  },
  "/contact": {
    title: "Contact — mangomundi",
    description:
      "Talk to mangomundi: launch partners, enterprise deployments, press and general enquiries.",
  },
  "/fx-tool": {
    title: "FX Tool — mangomundi",
    description:
      "The mangomundi FX comparator: live rates, AI recommendation and transparent fees for every cross-border transfer.",
  },
  "/legal/terms": {
    title: "Terms — mangomundi",
    description: "Terms of service for mangomundi.",
  },
  "/legal/risk": {
    title: "Risk disclosures — mangomundi",
    description: "Risk disclosures for mangomundi.",
  },
};

const ROUTE_SEO_ES: RouteSeoMap = {
  "/": SEO_META.es,
  "/pricing": {
    title: "Precios — mangomundi",
    description:
      "Gratis para usuarios retail — de pago para empresas que necesitan enrutamiento optimizado, acceso API y herramientas white-label. Transparente, sin tarifas ocultas.",
  },
  "/platform": {
    title: "Motor de Decisión IA — Plataforma mangomundi",
    description:
      "mangomundi es una infraestructura de decisión y abastecimiento impulsada por IA para mercados complejos. FX es el primer vertical — seguros, brókers, SaaS y préstamos siguen.",
  },
  "/features": {
    title: "Funcionalidades — mangomundi",
    description:
      "Explora las funcionalidades de la plataforma mangomundi para pagos transfronterizos inteligentes: tipos en vivo, enrutamiento inteligente, carteras multi-divisa y API empresarial.",
  },
  "/insurance": {
    title: "Comparador de Seguros (Próximamente) — mangomundi",
    description:
      "mangomundi lleva su motor de decisión IA neutral a los seguros: compara pólizas entre proveedores con precios y coberturas transparentes.",
  },
  "/blog": {
    title: "Blog — mangomundi",
    description:
      "Guías, análisis y artículos sobre pagos transfronterizos, transparencia FX y cómo enviar dinero de forma más inteligente — para particulares y empresas.",
  },
  "/about": {
    title: "Nosotros — mangomundi",
    description:
      "mangomundi construye la capa neutral de decisión y abastecimiento con IA para mercados fragmentados, empezando por FX transfronterizo.",
  },
  "/contact": {
    title: "Contacto — mangomundi",
    description:
      "Habla con mangomundi: socios de lanzamiento, despliegues empresariales, prensa y consultas generales.",
  },
  "/fx-tool": {
    title: "Herramienta FX — mangomundi",
    description:
      "El comparador FX de mangomundi: tipos en vivo, recomendación IA y comisiones transparentes para cada transferencia transfronteriza.",
  },
  "/legal/terms": {
    title: "Términos — mangomundi",
    description: "Términos del servicio de mangomundi.",
  },
  "/legal/risk": {
    title: "Aviso de riesgo — mangomundi",
    description: "Aviso de riesgo de mangomundi.",
  },
};

export const SEO_PER_ROUTE: Partial<Record<Lang, RouteSeoMap>> = {
  en: ROUTE_SEO_EN,
  es: ROUTE_SEO_ES,
};

function normalizePath(path: string): string {
  if (!path) return "/";
  // Strip trailing slash except for root
  const trimmed = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  // Strip query/hash
  return trimmed.split("?")[0].split("#")[0];
}

export function getRouteSeo(lang: Lang, path: string): SeoMeta {
  const p = normalizePath(path);
  const perLang = SEO_PER_ROUTE[lang]?.[p];
  if (perLang) return perLang;
  const en = SEO_PER_ROUTE.en?.[p];
  if (en && lang === "en") return en;
  // Try sitewide localized meta as fallback
  if (SEO_META[lang]) return SEO_META[lang];
  return en ?? SEO_META.en;
}

export type TKey = string;

/**
 * Language resolver. All 16 supported languages are valid on every route;
 * unknown codes fall back to English.
 */
export function getScopedLanguage(_path: string, requested: Lang): Lang {
  return requested in DICTS ? requested : "en";
}

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

const I18nContext = createContext<I18nCtx | null>(null);

const LS_KEY = "mg.lang";

/**
 * Defensive language coercion: anything that isn't a recognised, non-broken
 * supported language collapses to "en". Never throws — safe for SSR.
 */
function coerceLang(candidate: unknown): Lang {
  if (typeof candidate !== "string") return "en";
  const lower = candidate.toLowerCase() as Lang;
  if (!SUPPORTED_LANGS.includes(lower)) return "en";
  const dict = DICTS[lower];
  if (!dict || typeof dict !== "object") {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[i18n] dictionary for "${lower}" missing or corrupt — forcing EN fallback`);
    }
    return "en";
  }
  return lower;
}

export function I18nProvider({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(() => coerceLang(initialLang));
  // Subscribe to router state so SEO meta react to navigation as well as lang.
  // useRouterState throws if no <RouterProvider> ancestor exists (tests/storybook/SSR probes),
  // so we guard it and fall back to "/" — never propagate the error.
  let pathname = "/";
  try {
    pathname = useRouterState({ select: (s) => s.location.pathname }) ?? "/";
  } catch {
    pathname = "/";
  }

  // Hydration: prefer the user's previously chosen language (localStorage),
  // then the server-detected geo-IP language passed via props, then navigator,
  // then English.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // 1) Highest priority: explicit ?lang= query param (used by share URLs + E2E).
    try {
      const qp = new URLSearchParams(window.location.search).get("lang");
      if (qp) {
        const coerced = coerceLang(qp);
        setLangState(coerced);
        try {
          window.localStorage.setItem(LS_KEY, coerced);
        } catch {
          /* ignore */
        }
        return;
      }
    } catch {
      // URL parsing unavailable — fall through
    }
    try {
      const stored = window.localStorage.getItem(LS_KEY);
      if (stored) {
        const coerced = coerceLang(stored);
        if (coerced !== "en" || stored.toLowerCase() === "en") {
          setLangState(coerced);
          return;
        }
      }
    } catch {
      // localStorage unavailable — fall through
    }
    const coercedInitial = coerceLang(initialLang);
    if (coercedInitial !== "en") {
      setLangState(coercedInitial);
      return;
    }
    try {
      const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
      setLangState(coerceLang(nav));
    } catch {
      setLangState("en");
    }
  }, [initialLang]);

  // Keep <html lang> and direction in sync, plus update <title>/<meta>
  // live whenever the language OR the current route changes.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
    const seo = getRouteSeo(lang, pathname);
    if (seo) {
      document.title = seo.title;
      const setMeta = (selector: string, content: string) => {
        const el = document.head.querySelector<HTMLMetaElement>(selector);
        if (el) el.setAttribute("content", content);
      };
      setMeta('meta[name="description"]', seo.description);
      setMeta('meta[property="og:title"]', seo.title);
      setMeta('meta[property="og:description"]', seo.description);
      setMeta('meta[name="twitter:title"]', seo.title);
      setMeta('meta[name="twitter:description"]', seo.description);
    }
  }, [lang, pathname]);

  const setLang = (l: Lang) => {
    const parsed = langCodeSchema.safeParse(l);
    const safe = parsed.success ? parsed.data : "en";
    const final = coerceLang(safe);
    setLangState(final);
    try {
      window.localStorage.setItem(LS_KEY, final);
    } catch {
      // ignore
    }
  };

  const value = useMemo<I18nCtx>(
    () => ({
      lang,
      setLang,
      t: (key) => {
        // Hardened: any failure path falls through to EN, then to the raw key.
        try {
          const active = DICTS[lang] && typeof DICTS[lang] === "object" ? DICTS[lang] : undefined;
          const hit = active?.[key];
          if (typeof hit === "string" && hit.length > 0) return hit;
          const fallback = DICTS.en?.[key];
          if (import.meta.env?.DEV) {
            // eslint-disable-next-line no-console
            console.warn(
              `[i18n] missing key "${key}" for lang "${lang}" — using ${fallback !== undefined ? "EN fallback" : "raw key"}`,
            );
          }
          return typeof fallback === "string" ? fallback : key;
        } catch (err) {
          if (import.meta.env?.DEV) {
            // eslint-disable-next-line no-console
            console.warn(`[i18n] t() threw for key "${key}":`, err);
          }
          return key;
        }
      },
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
