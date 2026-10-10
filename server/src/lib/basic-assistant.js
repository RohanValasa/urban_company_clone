// The free assistant: no AI model, just keywords in English, Telugu, Hindi and
// Urdu (including Telugu and Hindi typed in English letters). It can't look at
// photos. Used when no AI key is set, or when the AI is out of quota.
const { httpError } = require("./http");
const { slotAt, todayInIndia } = require("./slots");
const PART_PRICES = require("../data/part-prices.json");

// What a customer might say for each service. `hints` are English words that
// pick the right package within the service (matched against package names).
const SERVICES = [
  { slug: "ac", words: ["ac", "a/c", "air conditioner", "aircon", "not cooling", "cooling", "ఏసీ", "ఎసి", "एसी", "ए.सी", "اے سی"] },
  { slug: "washing-machine", words: ["washing machine", "washer", "spin", "వాషింగ్ మెషిన్", "వాషింగ్", "वॉशिंग मशीन", "वाशिंग मशीन", "واشنگ مشین"] },
  { slug: "refrigerator", words: ["fridge", "refrigerator", "freezer", "ఫ్రిజ్", "फ्रिज", "फ्रीज", "فریج"] },
  { slug: "geyser", words: ["geyser", "water heater", "hot water", "గీజర్", "వేడి నీళ్ళు", "गीजर", "गीज़र", "گیزر"] },
  { slug: "water-purifier", words: ["ro", "purifier", "water filter", "aquaguard", "ప్యూరిఫైయర్", "प्यूरीफायर", "پیوریفائر"] },
  { slug: "television", words: ["tv", "television", "టీవీ", "टीवी", "ٹی وی"] },
  { slug: "chimney", words: ["chimney", "చిమ్నీ", "चिमनी", "چمنی"] },
  { slug: "microwave", words: ["microwave", "oven", "మైక్రోవేవ్", "माइक्रोवेव", "مائیکروویو"] },
  { slug: "stove", words: ["stove", "burner", "hob", "స్టవ్", "स्टोव", "चूल्हा", "چولہا"] },
  { slug: "laptop", words: ["laptop", "computer", "ల్యాప్‌టాప్", "लैपटॉप", "لیپ ٹاپ"] },
  {
    slug: "plumber",
    words: [
      "tap", "leak", "leaking", "pipe", "plumber", "plumbing", "drain", "blocked", "block", "clog", "flush", "toilet",
      "commode", "basin", "sink", "water tank", "overflow", "nalla", "kulai", "కుళాయి", "ట్యాప్", "పైపు", "లీక్", "సింక్",
      "బ్లాక్", "నల్లా", "టాయిలెట్", "नल", "पाइप", "लीक", "टपक", "नाली", "सिंक", "फ्लश", "टॉयलेट", "نل", "پائپ", "لیک", "رساؤ", "سنک", "نالی",
    ],
    hints: { "ట్యాప్": "tap", "కుళాయి": "tap", "నల్లా": "tap", nalla: "tap", kulai: "tap", "नल": "tap", "نل": "tap", "సింక్": "sink", "सिंक": "sink", "سنک": "sink", "టాయిలెట్": "toilet", "टॉयलेट": "toilet", "फ्लश": "flush", block: "blockage", blocked: "blockage", "బ్లాక్": "blockage" },
  },
  {
    slug: "electrician",
    words: [
      "switch", "socket", "spark", "sparking", "wiring", "wire", "short circuit", "mcb", "fuse", "bulb", "tube light", "light",
      "shock", "power", "fan", "ceiling fan", "exhaust fan", "regulator", "inverter", "doorbell", "current", "కరెంట్", "స్విచ్", "వైర్", "షాక్",
      "లైట్", "ఫ్యాన్ తిరగడం", "बिजली", "स्विच", "तार", "शॉर्ट", "करंट", "चिंगारी", "लाइट", "पंखा नहीं", "بجلی", "سوئچ", "تار", "کرنٹ", "لائٹ",
    ],
    hints: { "ఫ్యాన్": "fan", "पंखा": "fan", "پنکھا": "fan", "స్విచ్": "switch", "स्विच": "switch", "سوئچ": "switch", "లైట్": "light", "लाइट": "light", "لائٹ": "light" },
  },
  { slug: "cockroach-control", words: ["cockroach", "cockroaches", "roach", "బొద్దింక", "బొద్దింకలు", "కాక్రోచ్", "कॉकरोच", "तिलचट्टा", "کاکروچ", "لال بیگ"] },
  { slug: "termite-control", words: ["termite", "termites", "white ants", "deemak", "చెదలు", "చెద", "दीमक", "دیمک"] },
  { slug: "ants-bedbugs-control", words: ["ants", "ant", "bed bug", "bedbug", "bed bugs", "chimalu", "చీమలు", "నల్లులు", "चींटी", "चींटियां", "खटमल", "چیونٹی", "کھٹمل"] },
  {
    slug: "painting",
    words: ["paint", "painting", "damp", "dampness", "seepage", "waterproof", "wall crack", "crack in wall", "peeling", "సీపేజ్", "తేమ", "పెయింట్", "పెయింటింగ్", "पेंट", "सीलन", "नमी", "सीपेज", "سیلن", "نمی", "پینٹ"],
  },
  { slug: "carpenter", words: ["door", "hinge", "lock", "cupboard", "wardrobe", "drawer", "bed repair", "wood", "furniture repair", "carpenter", "తలుపు", "అల్మారా", "దర్వాజా", "दरवाजा", "दरवाज़ा", "अलमारी", "ताला", "دروازہ", "الماری", "تالا"] },
  { slug: "furniture-assembly", words: ["assemble", "assembly", "ikea", "fix the bed together"] },
  { slug: "tile-grouting", words: ["grout", "grouting", "tile gap", "tiles gap"] },
  { slug: "festive-lights", words: ["festive lights", "diwali lights", "decoration lights", "serial lights", "lighting for function"] },
  { slug: "salon-women", words: ["facial", "waxing", "wax", "threading", "eyebrow", "manicure", "pedicure", "bleach", "ఫేషియల్", "వ్యాక్సింగ్", "फेशियल", "वैक्स", "थ्रेडिंग", "فیشل", "ویکس"] },
  { slug: "makeup-styling", words: ["makeup", "make-up", "saree draping", "bridal", "మేకప్", "मेकअप", "میک اپ"] },
  { slug: "spa-women", words: ["spa for women", "ladies spa", "body spa"] },
  { slug: "massage-men", words: ["massage", "మసాజ్", "मसाज", "مساج"] },
  { slug: "salon-men", words: ["haircut", "hair cut", "beard", "shave", "trim", "కటింగ్", "గడ్డం", "बाल कटवाना", "हेयरकट", "दाढ़ी", "بال کٹوانا", "داڑھی"] },
  { slug: "hair-studio-women", words: ["hair colour", "hair color", "hair spa", "blow dry", "keratin", "ladies haircut", "women haircut"] },
];

// Cleaning needs a cleaning word, then the room decides which service.
const CLEAN_WORDS = ["clean", "cleaning", "dusty", "dust", "dirty", "stain", "stains", "deep clean", "శుభ్రం", "క్లీన్", "క్లీనింగ్", "దుమ్ము", "సఫాయి", "सफाई", "साफ", "धूल", "صفائی", "صاف", "دھول"];
const CLEAN_ROOMS = [
  { slug: "bathroom-cleaning", words: ["bathroom", "toilet", "washroom", "బాత్రూమ్", "బాత్‌రూమ్", "बाथरूम", "टॉयलेट", "باتھ روم"] },
  { slug: "kitchen-cleaning", words: ["kitchen", "కిచెన్", "వంటగది", "रसोई", "किचन", "کچن", "باورچی خانہ"] },
  { slug: "living-bedroom-cleaning", words: ["fan", "fans", "sofa", "bedroom", "living", "hall", "carpet", "mattress", "ఫ్యాన్", "సోఫా", "హాల్", "पंखा", "पंखे", "सोफा", "پنکھا", "صوفہ"] },
  { slug: "full-home-cleaning", words: ["full home", "whole house", "entire house", "full house", "flat", "house cleaning", "home cleaning", "deep clean", "ఇల్లు మొత్తం", "पूरा घर", "پورا گھر"] },
];

const DANGER = {
  gas: { words: ["gas smell", "gas leak", "smell of gas", "smell gas", "గ్యాస్ వాసన", "గ్యాస్ లీక్", "गैस की बदबू", "गैस लीक", "गैस की गंध", "گیس کی بو", "گیس لیک"] },
  electric: { words: ["spark", "sparking", "short circuit", "burning smell", "smoke", "shock", "fire", "నిప్పు", "మంట", "షాక్", "चिंगारी", "आग", "धुआं", "करंट लग", "آگ", "چنگاری", "دھواں"] },
  water: { words: ["burst", "flooding", "flood", "overflowing", "no water"] },
};

const TEXTS = {
  en: {
    found: (label) => `Looks like you need ${label}. Here's what we suggest.`,
    unclear: "Tell us a little more: what's broken or needs doing, and where in the house?",
    photoOnly: "Please describe the problem in a few words. Photos need the full AI assistant, which isn't on right now.",
    expect: "A verified professional will come at your chosen time, check the problem and fix it.",
    gas: "Don't switch anything on or off. Open the windows, turn off the gas cylinder, go outside and call 112.",
    electric: "Turn off the main switch now and don't touch the board or wires until the electrician arrives.",
  },
  te: {
    found: (label) => `మీకు ${label} సేవ అవసరం అనిపిస్తోంది. మేము సూచించేది ఇది.`,
    unclear: "సమస్య ఏమిటో, ఇంట్లో ఎక్కడ ఉందో కొంచెం వివరంగా చెప్పండి.",
    photoOnly: "సమస్యను కొన్ని మాటల్లో చెప్పండి. ఫోటోలు చూడటానికి పూర్తి AI కావాలి, అది ఇప్పుడు ఆన్‌లో లేదు.",
    expect: "నిపుణులు మీరు ఎంచుకున్న సమయానికి వచ్చి, సమస్యను చూసి సరిచేస్తారు.",
    gas: "ఏ స్విచ్‌నూ ఆన్/ఆఫ్ చేయకండి. కిటికీలు తెరిచి, సిలిండర్ ఆఫ్ చేసి, బయటకు వెళ్ళి 112కి కాల్ చేయండి.",
    electric: "వెంటనే మెయిన్ స్విచ్ ఆఫ్ చేయండి. ఎలక్ట్రీషియన్ వచ్చే వరకు బోర్డు లేదా వైర్లను తాకకండి.",
  },
  hi: {
    found: (label) => `लगता है आपको ${label} सेवा चाहिए। हमारा सुझाव नीचे है।`,
    unclear: "थोड़ा और बताइए: क्या खराब है या क्या काम है, और घर में कहाँ?",
    photoOnly: "कृपया समस्या कुछ शब्दों में लिखें। फोटो समझने के लिए पूरा AI चाहिए, जो अभी चालू नहीं है।",
    expect: "एक सत्यापित प्रोफेशनल आपके चुने समय पर आकर जांच करेंगे और ठीक करेंगे।",
    gas: "कोई भी स्विच ऑन/ऑफ न करें। खिड़कियाँ खोलें, सिलेंडर बंद करें, बाहर जाएँ और 112 पर कॉल करें।",
    electric: "तुरंत मेन स्विच बंद करें। इलेक्ट्रीशियन आने तक बोर्ड या तारों को न छुएँ।",
  },
  ur: {
    found: (label) => `لگتا ہے آپ کو ${label} سروس چاہیے۔ ہمارا مشورہ نیچے ہے۔`,
    unclear: "تھوڑا اور بتائیں: کیا خراب ہے یا کیا کام ہے، اور گھر میں کہاں؟",
    photoOnly: "براہ کرم مسئلہ چند الفاظ میں لکھیں۔ تصویر سمجھنے کے لیے مکمل AI چاہیے، جو ابھی چالو نہیں ہے۔",
    expect: "ایک تصدیق شدہ ماہر آپ کے منتخب وقت پر آکر مسئلہ دیکھے گا اور ٹھیک کرے گا۔",
    gas: "کوئی سوئچ آن یا آف نہ کریں۔ کھڑکیاں کھولیں، سلنڈر بند کریں، باہر جائیں اور 112 پر کال کریں۔",
    electric: "فوراً مین سوئچ بند کریں۔ الیکٹریشن کے آنے تک بورڈ یا تاروں کو ہاتھ نہ لگائیں۔",
  },
};

// When to come. Each list is checked against the lower-cased text.
const DAYS = [
  { add: 2, words: ["day after tomorrow", "ellundi", "ఎల్లుండి", "परसों", "parson", "پرسوں"] },
  { add: 1, words: ["tomorrow", "tmrw", "repu", "రేపు", "कल", "kal ", "کل"] },
  { add: 0, words: ["today", "tonight", "eeroju", "ఈరోజు", "ఈ రోజు", "आज", "aaj", "آج"] },
];
const WEEKDAYS = [
  ["sunday", "ఆదివారం", "रविवार", "اتوار"],
  ["monday", "సోమవారం", "सोमवार", "پیر"],
  ["tuesday", "మంగళవారం", "मंगलवार", "منگل"],
  ["wednesday", "బుధవారం", "बुधवार", "بدھ"],
  ["thursday", "గురువారం", "गुरुवार", "جمعرات"],
  ["friday", "శుక్రవారం", "शुक्रवार", "جمعہ"],
  ["saturday", "శనివారం", "शनिवार", "ہفتہ"],
];
const DAY_PARTS = [
  { time: "09:00", words: ["morning", "udayam", "podduna", "ఉదయం", "పొద్దున", "सुबह", "subah", "صبح"] },
  { time: "14:00", words: ["afternoon", "madhyahnam", "మధ్యాహ్నం", "दोपहर", "dopahar", "دوپہر"] },
  { time: "17:00", words: ["evening", "sayantram", "సాయంత్రం", "शाम", "shaam", "sham ", "شام"] },
  { time: "19:00", words: ["night", "tonight", "rathri", "రాత్రి", "रात", "raat", "رات"] },
];
const NOW_WORDS = ["now", "asap", "as soon as possible", "immediately", "urgent", "ippude", "ఇప్పుడే", "వెంటనే", "अभी", "abhi", "तुरंत", "ابھی", "فوراً"];

const PROBLEM_WORDS = [
  "leak", "leaking", "broken", "not working", "repair", "damaged", "drip", "dripping", "noise", "spark", "sparking", "stopped",
  "avvatledu", "ledu", "nahi", "nahin", "లేదు", "పనిచేయడం లేదు", "పాడైంది", "లీక్", "नहीं", "खराब", "टूट", "लीक", "نہیں", "خراب", "ٹوٹ", "لیک",
];

const TELUGU_LATIN = /\b(naa|maa|avtundi|avuthundi|ledu|undi|kavali|cheyyandi|cheyyali|pampandi|ochi|raavali|repu|ellundi|chesi)\b/;

function languageOf(text) {
  if (/[ఀ-౿]/.test(text)) return "te";
  if (/[؀-ۿ]/.test(text)) return "ur";
  if (/[ऀ-ॿ]/.test(text)) return "hi";
  return TELUGU_LATIN.test(text.toLowerCase()) ? "te-latin" : "en";
}

/** Whether `word` appears in the text: whole words for Latin text, a plain match for other scripts. */
function has(text, word) {
  if (/^[\x20-\x7e]+$/.test(word)) {
    const escaped = word.trim().replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(text);
  }
  return text.includes(word);
}
const any = (text, words) => words.some((w) => has(text, w));
const count = (text, words) => words.filter((w) => has(text, w)).length;

function pickService(text) {
  if (any(text, CLEAN_WORDS)) {
    const room = CLEAN_ROOMS.map((r) => ({ slug: r.slug, score: count(text, r.words) })).sort((a, b) => b.score - a.score)[0];
    return { slug: room.score > 0 ? room.slug : "full-home-cleaning", hints: {} };
  }
  const best = SERVICES.map((s) => ({ s, score: count(text, s.words) })).sort((a, b) => b.score - a.score)[0];
  return best.score > 0 ? { slug: best.s.slug, hints: best.s.hints || {} } : null;
}

/**
 * The package whose name best matches what was said: the thing named (tap,
 * fan, switch) counts most, then the kind of job (repair, service, install).
 * The cheapest wins a tie.
 */
function pickPackage(service, text, hints) {
  const weight = new Map((text.match(/[a-z]{3,}/g) || []).map((w) => [w.replace(/s$/, ""), 3]));
  const add = (word, w) => weight.set(word, Math.max(weight.get(word) || 0, w));
  Object.entries(hints).forEach(([word, hint]) => has(text, word) && add(hint, 3));
  if (any(text, PROBLEM_WORDS)) add("repair", 2);
  if (any(text, ["servicing", "service", "maintenance", "సర్వీసింగ్", "सर्विस", "سروس"])) add("service", 2);
  if (any(text, ["install", "installation", "new", "fitting", "fitted", "put up"])) add("install", 2);
  if (any(text, ["fan", "ఫ్యాన్", "पंखा", "پنکھا"])) add("ceiling", 1);
  const score = (p) =>
    (p.name.toLowerCase().match(/[a-z]{3,}/g) || []).reduce((sum, w) => sum + (weight.get(w.replace(/s$/, "")) || 0), 0);
  return [...service.packages].sort((a, b) => score(b) - score(a) || a.price - b.price)[0];
}

function whenAsked(text, now) {
  let date = null;
  const day = DAYS.find((d) => any(text, d.words));
  if (day) date = todayInIndia(now + day.add * 86400000);
  const weekday = WEEKDAYS.findIndex((names) => any(text, names));
  if (!date && weekday >= 0) {
    for (let n = 1; n <= 7; n++) {
      const d = todayInIndia(now + n * 86400000);
      if (new Date(`${d}T12:00:00+05:30`).getUTCDay() === weekday) date = d;
      if (date) break;
    }
  }
  let time = DAY_PARTS.find((p) => any(text, p.words))?.time || null;
  const clock = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (clock) {
    const h = (Number(clock[1]) % 12) + (clock[3] === "pm" ? 12 : 0);
    time = `${String(h).padStart(2, "0")}:${clock[2] || "00"}`;
  }
  if (any(text, NOW_WORDS)) {
    const soon = new Date(now + 65 * 60000 + 330 * 60000);
    date = soon.toISOString().slice(0, 10);
    time = soon.toISOString().slice(11, 16);
  }
  if (!date && !time) return { asked: false, slot: null };
  return { asked: true, slot: slotAt(date || todayInIndia(now), time || "09:00", now) };
}

/** A number of things ("3 fans"), or 1. */
function quantity(text) {
  const n = Number(text.match(/\b([2-9]|10)\s+(?:[a-z]+\s+)?[a-z]+/)?.[1]);
  return n || 1;
}

function basicAssistant(catalog) {
  const bySlug = new Map(catalog.map((s) => [s.slug, s]));

  async function assist({ text, image, now = Date.now() }) {
    const raw = (text || "").trim();
    const lower = raw.toLowerCase();
    const lang = languageOf(raw);
    const t = TEXTS[lang] || TEXTS.en;

    const gas = any(lower, DANGER.gas.words);
    const electric = any(lower, DANGER.electric.words);
    const safetyTip = gas ? t.gas : electric ? t.electric : "";
    const urgency = gas || electric ? "emergency" : any(lower, DANGER.water.words) ? "urgent" : "routine";
    const base = {
      basic: true,
      language: lang === "te-latin" ? "te" : lang,
      issue: "",
      service: null,
      items: [],
      total: 0,
      urgency,
      safetyTip,
      whatToExpect: "",
      slot: null,
      slotUnavailable: false,
    };

    const found = raw && !gas ? pickService(lower) : null;
    const service = found && bySlug.get(found.slug);
    if (!service) {
      return { ...base, understood: false, reply: !raw && image ? t.photoOnly : gas ? safetyTip : t.unclear };
    }
    const pkg = pickPackage(service, lower, found.hints);
    const qty = quantity(lower);
    const { asked, slot } = whenAsked(lower, now);
    return {
      ...base,
      understood: true,
      reply: t.found(service.label),
      issue: `Customer says: "${raw.slice(0, 250)}"`,
      service: { slug: service.slug, label: service.label },
      items: [{ id: pkg.id, name: pkg.name, price: pkg.price, mrp: pkg.mrp, duration: pkg.duration, qty, category: service.label, sub: service.slug }],
      total: pkg.price * qty,
      whatToExpect: t.expect,
      slot,
      slotUnavailable: asked && !slot,
    };
  }

  /** Looks the part up in a price list by the name the professional typed. */
  async function priceParts({ note }) {
    const said = (note || "").toLowerCase();
    if (!said.trim()) throw httpError(400, "Type the part's name (for example \"6A MCB\" or \"tap spindle\") so we can check the price.");
    const best = PART_PRICES.map((p) => ({ p, score: count(said, p.keywords) }))
      .sort((a, b) => b.score - a.score)[0];
    if (!best || best.score === 0) {
      throw httpError(422, "That part isn't in our price list yet. Try a simpler name, like \"MCB\", \"tap\" or \"capacitor\".");
    }
    const { name, low, high, description } = best.p;
    return {
      name,
      description,
      fairLow: low,
      fairHigh: high,
      confidence: "low",
      source: "list",
      notes: "From Servify's price list of common parts, not from the photo. Prices vary with brand and size.",
    };
  }

  return { assist, priceParts };
}

module.exports = { basicAssistant, languageOf };
