/**
 * Pictures for the whole site. Every service, tab, tool and banner is drawn
 * from Microsoft's Fluent 3D emoji (MIT licence, bundled in src/assets/emoji)
 * and picked by the words in its name, so a tap shows a tap and a facial
 * shows a facial.
 */

const FILES = import.meta.glob("../assets/emoji/*.webp", { eager: true, query: "?url", import: "default" });
const BY_KEY = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [path.split("/").pop().replace(".webp", ""), url])
);

const codepoints = (e) => [...e].map((c) => c.codePointAt(0).toString(16)).join("-");

/** URL of the 3D rendering of an emoji, or null when it isn't bundled. */
export function emojiUrl(emoji) {
  if (!emoji) return null;
  const key = codepoints(emoji);
  return BY_KEY[key] || BY_KEY[key.replace(/-fe0f/g, "")] || BY_KEY[`${key}-fe0f`] || null;
}

// ------------------------------------------------------------ families

// Each service family has a background tone, the professional who shows up,
// and the kit that floats around them in the larger scenes.
export const FAMILIES = {
  cleaning: { tone: "#e3f5ec", pro: "🧹", kit: ["🧽", "🫧", "🧴", "🪣"], ba: ["Deep clean finish", "Corners & fittings"] },
  pest: { tone: "#fdf3d8", pro: "🧑‍🔬", kit: ["🦠", "🧪", "🛡️"], ba: ["Treated corners", "Kitchen & drains"] },
  salonW: { tone: "#fde7f1", pro: "💇‍♀️", kit: ["💄", "💅", "🧴", "🪞"], ba: ["Fresh finish", "Fine detailing"] },
  spaW: { tone: "#efe9fd", pro: "💆‍♀️", kit: ["🕯️", "🌿", "🧴"], ba: ["Relaxed muscles", "Glowing skin"] },
  salonM: { tone: "#e3e8fd", pro: "💇‍♂️", kit: ["🪒", "🧴", "✂️"], ba: ["Sharp finish", "Clean lines"], male: true },
  spaM: { tone: "#e8e6fb", pro: "💆‍♂️", kit: ["🕯️", "🌿", "🧴"], ba: ["Relaxed muscles", "Recovered legs"], male: true },
  appliance: { tone: "#e1f1fc", pro: "🧑‍🔧", kit: ["🔧", "🪛", "⚙️", "🔌"], ba: ["Serviced & tested", "Parts & fittings"] },
  electric: { tone: "#fdf6d3", pro: "🧑‍🔧", kit: ["⚡", "💡", "🔌", "🪛"], ba: ["Safe wiring", "Neat fittings"] },
  plumbing: { tone: "#dfeafd", pro: "🧑‍🔧", kit: ["🪠", "🔧", "💧"], ba: ["Leak fixed", "Fittings sealed"] },
  carpentry: { tone: "#f6ebdd", pro: "👷", kit: ["🔨", "🪚", "🪵", "🪛"], ba: ["Solid finish", "Aligned fittings"] },
  install: { tone: "#eef1f5", pro: "👷", kit: ["🪛", "🔨", "📏"], ba: ["Clean install", "Neat edges"] },
  painting: { tone: "#f7e8fb", pro: "🧑‍🎨", kit: ["🖌️", "🎨", "🪣", "🪜"], ba: ["Fresh coat", "Smooth edges"] },
  help: { tone: "#fdeede", pro: "🙋‍♀️", kit: ["🧺", "🍽️", "🧹"], ba: ["Chores done", "Tidy home"] },
};

const FAMILY_OF = {
  "bathroom-cleaning": "cleaning", "kitchen-cleaning": "cleaning", "living-bedroom-cleaning": "cleaning",
  "full-home-cleaning": "cleaning",
  "cockroach-control": "pest", "termite-control": "pest", "ants-bedbugs-control": "pest",
  "salon-women": "salonW", "hair-studio-women": "salonW", "makeup-styling": "salonW", "spa-women": "spaW",
  "salon-men": "salonM", "salon-royale": "salonM", "salon-prime": "salonM", "massage-men": "spaM",
  "ac": "appliance", "washing-machine": "appliance", "refrigerator": "appliance", "television": "appliance",
  "chimney": "appliance", "microwave": "appliance", "stove": "appliance", "laptop": "appliance",
  "water-purifier": "appliance", "geyser": "appliance",
  "electrician": "electric", "festive-lights": "electric",
  "plumber": "plumbing",
  "carpenter": "carpentry", "furniture-assembly": "carpentry", "flatpack-assembly": "carpentry",
  "tile-grouting": "install", "wall-panels": "install",
  "painting": "painting",
  "insta-help": "help",
};

export const familyOf = (slug) => FAMILIES[FAMILY_OF[slug]] || FAMILIES.install;

// ------------------------------------------------------------ keyword rules

// First match wins, so the specific subjects sit above the generic ones.
// A pair is [women's, men's] for the salon pictures.
const RULES = [
  // pests
  [/cockroach|\bpest\b/, "🪳"], [/termite/, "🪵"], [/bed ?bugs?/, "🐛"], [/\bants?\b/, "🐜"], [/mosquito/, "🦟"],
  [/disinfect|saniti[sz](e|ing)\b/, "🦠"],

  // kit and tools (areas & equipment)
  [/clean-up after|site clean|cleaned after/, "🧹"],
  [/scrub pad|scrubbing|scrubber|floor cleaning machine|vacuum/, "🧽"], [/drying|clothes/, "🧺"],
  [/microfib|cloths?\b|duster|\bmop/, "🧽"], [/dusting|tidy|sweep/, "🧹"],
  [/solution|chemical|degreaser|\bgel\b|spray bottle|sprayer|adhesive|glue|sealant|crack|crevice/, "🧪"],
  [/steam jet|steamer/, "💨"], [/torch|flashlight/, "🔦"], [/glove|apron/, "🧤"],
  [/disposable|dust sheet|masking sheet|shoe cover/, "🧻"], [/clipper|trimmer|scissor/, "✂️"], [/blade|razor/, "🪒"],
  [/\boils?\b/, "🧴"], [/ladder|platform/, "🪜"], [/laser|level|measur|tape/, "📏"], [/\bsaw\b/, "🪚"],
  [/wrench|spanner/, "🔧"], [/bucket/, "🪣"], [/spare|parts\b/, "⚙️"], [/floor protection/, "🧻"],
  [/roller/, "🖌️"], [/tester|meter\b/, "⚡"], [/verified|technician|professional\b|expert|beautician|stylist/, null],

  // salon & spa
  [/haircut|hair cut|hair care/, ["💇‍♀️", "💇‍♂️"]],
  [/wax/, "🍯"], [/thread|eyebrow|upper lip/, "🧵"], [/bleach|de-?tan/, "🧴"],
  [/manicure|nail/, "💅"], [/pedicure|foot|feet|reflexology/, "👣"],
  [/saree|drap|pleat/, "🥻"], [/bridal|bride/, "👰"], [/engagement/, "💍"], [/makeup|make-up/, "💄"],
  [/beard|shave|shaving/, "🪒"],
  [/hair ?colou?r|highlight|root touch|global colou?r/, "🎨"],
  [/hot stone/, "🪨"], [/scrub|body polish/, "🧴"],
  [/massage|swedish|balinese|aromatherapy|deep tissue|stress relief|pain relief|post-workout|recovery/, ["💆‍♀️", "💆‍♂️"]],
  [/hair spa|dandruff|keratin|smoothen|hair treatment/, "🧴"],
  [/blow-?dry|styling|\bbun\b|updo|curls?\b|hairstyl|hair trim/, ["💇‍♀️", "💇‍♂️"]],
  [/facial|clean-?up|face care|skin|glow/, ["🧖‍♀️", "🧖‍♂️"]],
  [/product/, "🧴"], [/\bkit\b|\btools?\b/, "🧰"],

  // appliances
  [/sofa|couch|seater/, "🛋️"], [/mattress/, "🛏️"], [/carpet|rug/, "🧶"],
  [/chimney/, "💨"], [/fridge|refrigerator/, "🧊"], [/microwave|oven|otg/, "🍲"],
  [/sandwich|fryer|toaster/, "🍳"],
  [/washing machine|washer|dryer|laundry/, "🧺"],
  [/\bacs?\b|air ?condition|split|gas (re)?fill|cooling/, "❄️"],
  [/stove|\bhob\b|burner|\bgas\b/, "🔥"], [/geyser|water heater|shower/, "🚿"],
  [/purifier|\bro\b|filter|cartridge|membrane/, "🚰"],
  [/laptop|computer|\bpc\b/, "💻"], [/\btv\b|television/, "📺"], [/speaker|home theat|sound/, "🔊"],

  // electrical
  [/\bfans?\b|exhaust/, "🌀"], [/doorbell|\bbell\b/, "🔔"], [/smart lock|door lock|digital lock/, "🔐"],
  [/cctv|camera|security|video door|door phone/, "📹"], [/\bev\b|charger|charging/, "🚗"],
  [/festive|diwali|diya/, "🪔"], [/string|starry|\brope\b|fairy/, "✨"],
  [/light|bulb|lamp|tube|chandelier|led\b/, "💡"],
  [/mcb|fuse|inverter|stabili[sz]|battery|distribution/, "🔋"],
  [/switch|socket|plug|\bboard/, "🔌"], [/wiring|wire|cable|earthing/, "⚡"],

  // plumbing & bathroom
  [/mirror/, "🪞"],
  [/toilet|commode|flush|jet spray|health faucet|bathroom/, "🚽"],
  [/drain|block|clog|choke|overflow/, "🪠"],
  [/bath accessor|soap|towel|holder|hanger/, "🧼"], [/bath fitting/, "🚿"], [/bathtub|\bbath\b/, "🛁"],
  [/\btaps?\b|faucet|mixer|basin|sink|spout/, "🚰"], [/tank|motor|pump/, "💧"],
  [/waterproof|seepage|damp|terrace|roof/, "☔"],
  [/pipe|leak|water|connection|inlet|valve/, "💧"],

  // carpentry & installation
  [/curtain|blind|window|\brod\b/, "🪟"], [/door|stopper/, "🚪"], [/lock|latch|hinge|handle|knob|channel/, "🔒"],
  [/cupboard|drawer|wardrobe|cabinet|almirah/, "🗄️"], [/shel(f|ves)|\brack\b|bookcase/, "📚"],
  [/d[ée]cor|wall art|frame|picture/, "🖼️"], [/hook|fastener/, "🪝"],
  [/\bbed|\bcot\b/, "🛏️"], [/chair|table|furniture|assembl|flat-?pack|stool|dining/, "🪑"],
  [/balcony|plant|garden|pigeon|\bnet\b/, "🪴"], [/kitchen/, "🍳"],
  [/tile|grout|brick|marble/, "🧱"], [/panel|fluted|louvre|wood/, "🪵"],
  [/paint|putty|primer|texture|touch-?up|colou?r|walls?\b|ceiling/, "🖌️"],
  [/drill|hang|mount/, "🪛"],

  // cleaning & help
  [/full home|home (deep )?clean|apartment|bungalow|move-?in|move-?out|\brooms?\b|living/, "🏠"], [/clean/, "🧽"],
  [/dish|utensil/, "🍽️"], [/cook|meal/, "🧑‍🍳"], [/hourly|helper|help|task|errand/, "🙋‍♀️"],
  [/consult|inspection|visit|quote|book a|diagnos/, "📋"],
  [/repair|fix|service|install|replace/, "🔧"],
];

/** Emoji that best matches `text`, or `fallback` when nothing does. */
export function iconFor(text, fallback = "🧰", male = false) {
  const t = String(text).toLowerCase();
  for (const [re, emoji] of RULES) {
    if (!re.test(t)) continue;
    if (emoji === null) return fallback;
    return Array.isArray(emoji) ? emoji[male ? 1 : 0] : emoji;
  }
  return fallback;
}

// ------------------------------------------------------------ builders

/** One icon on a tone. Stored on data as `image`. */
export const pic = (emoji, tone = "#f4f4f5") => ({ emoji, src: emojiUrl(emoji), tone });

/** A larger picture: a main icon with smaller ones floating around it. */
export const scene = (main, accents = [], tone = "#f4f4f5") => ({
  tone,
  main: pic(main, tone),
  accents: accents.filter((a) => a && a !== main).slice(0, 3).map((a) => pic(a, tone)),
});
