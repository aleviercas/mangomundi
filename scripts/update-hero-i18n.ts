#!/usr/bin/env bun
import fs from "node:fs";
import path from "node:path";

const T: Record<string, { pre: string; accent: string; subtitle: string; dest: string }> = {
  es: {
    pre: "Decisiones inteligentes de cambio de",
    accent: "divisas",
    subtitle:
      "Un agente de IA transparente para pagos globales y locales, que compara tipos de cambio, comisiones, rutas y tiempos de entrega en tiempo real para encontrar la mejor opción en cada transferencia.",
    dest: "País del destinatario",
  },
  fr: {
    pre: "Décisions intelligentes de change de",
    accent: "devises",
    subtitle:
      "Un agent IA transparent pour les paiements internationaux et locaux, qui compare en temps réel les taux de change, les frais, les itinéraires et les délais de livraison pour trouver la meilleure option à chaque transfert.",
    dest: "Pays du destinataire",
  },
  de: {
    pre: "Intelligente Entscheidungen beim",
    accent: "Devisentausch",
    subtitle:
      "Ein transparenter KI-Agent für globale und lokale Zahlungen, der Wechselkurse, Gebühren, Routen und Lieferzeiten in Echtzeit vergleicht, um die beste Option für jeden Transfer zu finden.",
    dest: "Empfängerland",
  },
  it: {
    pre: "Decisioni intelligenti per il cambio",
    accent: "valute",
    subtitle:
      "Un agente IA trasparente per pagamenti globali e locali, che confronta in tempo reale tassi di cambio, commissioni, percorsi e tempi di consegna per trovare l'opzione migliore per ogni trasferimento.",
    dest: "Paese del destinatario",
  },
  pt: {
    pre: "Decisões inteligentes de câmbio de",
    accent: "moedas",
    subtitle:
      "Um agente de IA transparente para pagamentos globais e locais, que compara taxas de câmbio, comissões, rotas e velocidades de entrega em tempo real para encontrar a melhor opção em cada transferência.",
    dest: "País do destinatário",
  },
  ru: {
    pre: "Умные решения для обмена",
    accent: "валют",
    subtitle:
      "Прозрачный ИИ-агент для глобальных и локальных платежей, сравнивающий курсы обмена, комиссии, маршруты и скорость доставки в реальном времени, чтобы найти лучший вариант для каждого перевода.",
    dest: "Страна получателя",
  },
  zh: {
    pre: "智能货币兑换",
    accent: "决策",
    subtitle:
      "面向全球与本地支付的透明 AI 代理，实时比较汇率、手续费、路径与到账速度，为每笔转账找到最佳方案。",
    dest: "收款人国家",
  },
  ja: {
    pre: "賢い通貨両替の",
    accent: "意思決定",
    subtitle:
      "国際送金と国内決済のための透明なAIエージェント。為替レート、手数料、ルート、着金速度をリアルタイムで比較し、すべての送金に最適な選択肢を見つけます。",
    dest: "受取人の国",
  },
  ko: {
    pre: "현명한 환전",
    accent: "결정",
    subtitle:
      "글로벌 및 로컬 결제를 위한 투명한 AI 에이전트로, 환율·수수료·경로·송금 속도를 실시간으로 비교해 모든 송금에 최적의 옵션을 찾아드립니다.",
    dest: "수취인 국가",
  },
  ar: {
    pre: "قرارات ذكية لصرف",
    accent: "العملات",
    subtitle:
      "وكيل ذكاء اصطناعي شفّاف للمدفوعات العالمية والمحلية، يقارن أسعار الصرف والرسوم والمسارات وسرعات التسليم في الوقت الفعلي لإيجاد الخيار الأفضل لكل تحويل.",
    dest: "بلد المستلم",
  },
  hi: {
    pre: "मुद्रा विनिमय के बुद्धिमान",
    accent: "निर्णय",
    subtitle:
      "वैश्विक और स्थानीय भुगतान के लिए एक पारदर्शी AI एजेंट, जो हर ट्रांसफर के लिए सर्वोत्तम विकल्प खोजने हेतु विनिमय दरों, शुल्क, मार्गों और डिलीवरी गति की वास्तविक समय में तुलना करता है।",
    dest: "प्राप्तकर्ता देश",
  },
  bn: {
    pre: "মুদ্রা বিনিময়ের বুদ্ধিমান",
    accent: "সিদ্ধান্ত",
    subtitle:
      "বৈশ্বিক ও স্থানীয় পেমেন্টের জন্য একটি স্বচ্ছ AI এজেন্ট, যা প্রতিটি স্থানান্তরের জন্য সেরা বিকল্প খুঁজে পেতে রিয়েল-টাইমে এক্সচেঞ্জ রেট, ফি, রুট এবং ডেলিভারির গতি তুলনা করে।",
    dest: "প্রাপকের দেশ",
  },
  tr: {
    pre: "Akıllı döviz",
    accent: "kararları",
    subtitle:
      "Küresel ve yerel ödemeler için şeffaf bir AI ajanı; her transferde en iyi seçeneği bulmak amacıyla döviz kurlarını, ücretleri, rotaları ve teslim hızlarını gerçek zamanlı olarak karşılaştırır.",
    dest: "Alıcı ülkesi",
  },
  vi: {
    pre: "Quyết định thông minh về",
    accent: "ngoại hối",
    subtitle:
      "Một tác nhân AI minh bạch cho thanh toán toàn cầu và nội địa, so sánh tỷ giá, phí, lộ trình và tốc độ chuyển tiền theo thời gian thực để tìm phương án tốt nhất cho mọi giao dịch.",
    dest: "Quốc gia người nhận",
  },
  th: {
    pre: "การตัดสินใจอย่างชาญฉลาดเรื่อง",
    accent: "แลกเปลี่ยนเงินตรา",
    subtitle:
      "เอเจนต์ AI ที่โปร่งใสสำหรับการชำระเงินทั่วโลกและในประเทศ เปรียบเทียบอัตราแลกเปลี่ยน ค่าธรรมเนียม เส้นทาง และความเร็วในการส่งแบบเรียลไทม์ เพื่อค้นหาตัวเลือกที่ดีที่สุดสำหรับทุกการโอน",
    dest: "ประเทศผู้รับ",
  },
  id: {
    pre: "Keputusan cerdas penukaran",
    accent: "mata uang",
    subtitle:
      "Agen AI transparan untuk pembayaran global dan lokal, membandingkan nilai tukar, biaya, rute, dan kecepatan pengiriman secara real-time untuk menemukan opsi terbaik di setiap transfer.",
    dest: "Negara penerima",
  },
  pl: {
    pre: "Inteligentne decyzje",
    accent: "walutowe",
    subtitle:
      "Przejrzysty agent AI do płatności globalnych i lokalnych — porównuje kursy walut, opłaty, trasy i czas dostawy w czasie rzeczywistym, aby znaleźć najlepszą opcję dla każdego przelewu.",
    dest: "Kraj odbiorcy",
  },
  ur: {
    pre: "کرنسی کے تبادلے کے ذہین",
    accent: "فیصلے",
    subtitle:
      "عالمی اور مقامی ادائیگیوں کے لیے ایک شفاف AI ایجنٹ، جو ہر ٹرانسفر کے بہترین انتخاب کے لیے شرحِ تبادلہ، فیس، روٹس اور ترسیل کی رفتار کا حقیقی وقت میں موازنہ کرتا ہے۔",
    dest: "وصول کنندہ کا ملک",
  },
  tl: {
    pre: "Matalinong mga desisyon sa pagpapalit ng",
    accent: "pera",
    subtitle:
      "Isang transparent na AI agent para sa pandaigdig at lokal na pagbabayad, na naghahambing ng exchange rate, bayad, ruta, at bilis ng paghahatid sa real time upang makita ang pinakamagandang opsyon para sa bawat transfer.",
    dest: "Bansa ng tatanggap",
  },
};

const dir = path.join(import.meta.dir, "translations");
for (const [lang, v] of Object.entries(T)) {
  const file = path.join(dir, `${lang}.json`);
  if (!fs.existsSync(file)) {
    console.warn("missing", file);
    continue;
  }
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  json["home.hero.titlePre"] = v.pre;
  json["home.hero.titleAccent"] = v.accent;
  json["home.hero.subtitle"] = v.subtitle;
  json["search.destination"] = v.dest;
  json["search.destinationPrompt"] = v.dest;
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
  console.log("updated", lang);
}
