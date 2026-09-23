// Sub-category catalogue: what the category pop-up lists, what each service
// page shows, and everything the package detail sheet renders.

const img = (seed, w = 800, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

// Drop an mp4 in client/public and set `video: "/my-clip.mp4"` on a sub-category
// (or on a package spec) to play a real file instead of the ken-burns sequence.

const REVIEW_NAMES = [
  "Parvathi", "Biswanath Paul", "Priyanka Sharma", "Pratilipi Mandal",
  "Rahul Menon", "Sneha Iyer", "Imran Qureshi", "Divya Nair",
];
const REVIEW_TEXTS = [
  "Very good",
  "Good behaviour. Work quality is also good. Recommended.",
  "Excellent",
  "On time, polite and left the place spotless.",
  "Professional did a thorough job. Worth the price.",
  "Booking was smooth and the pro carried all equipment.",
  "Neat work, explained everything before starting.",
  "Great experience overall, will book again.",
];

const makeReviews = (seed, service) =>
  REVIEW_NAMES.map((name, i) => ({
    name,
    date: `Sep ${21 - i}, 2026`,
    service,
    rating: i % 7 === 3 ? 4 : 5,
    text: REVIEW_TEXTS[(i + seed) % REVIEW_TEXTS.length],
  }));

const breakdown = (total) => [
  { stars: 5, label: "6.7 M", pct: 92 },
  { stars: 4, label: "252K", pct: 4 },
  { stars: 3, label: "114K", pct: 2 },
  { stars: 2, label: "65K", pct: 1 },
  { stars: 1, label: "124K", pct: 1.5 },
].map((row) => ({ ...row, total }));

/**
 * Expands a compact package spec into everything the detail sheet needs.
 * Anything passed in `extra` wins over the generated defaults.
 */
function pkg(sub, spec) {
  const {
    id, name, tab = "value", price, mrp, rating = 4.81, reviews = "7.3M",
    duration, unitNote, badge, bullets = [], seed, ...extra
  } = spec;

  return {
    id,
    subSlug: sub.slug,
    name,
    tab,
    price,
    mrp,
    rating,
    reviews,
    duration,
    unitNote,
    badge,
    bullets,
    image: img(`${seed}-card`, 600, 600),
    gallery: [img(`${seed}-g1`), img(`${seed}-g2`), img(`${seed}-g3`)],
    areas: sub.areas,
    covered: sub.covered,
    notCovered: sub.notCovered,
    beforeAfter: [
      { label: "Deep clean finish", before: img(`${seed}-b1`, 700, 520), after: img(`${seed}-a1`, 700, 520) },
      { label: "Corners & fittings", before: img(`${seed}-b2`, 700, 520), after: img(`${seed}-a2`, 700, 520) },
    ],
    equipment: sub.equipment,
    faqs: sub.faqs,
    rated: { avg: rating, total: reviews, rows: breakdown(reviews) },
    reviewList: makeReviews(id.length, name),
    ...extra,
  };
}

function sub(spec) {
  const base = {
    tabs: [
      { id: "value", label: "Value deals", tag: "COMBO DEALS" },
      { id: "deep", label: "One time deep clean", icon: "🧴" },
      { id: "mini", label: "Mini services", icon: "⚡" },
    ],
    rating: 4.83,
    bookings: "8.5 M bookings",
    earliest: "Wed, 8:00 AM",
    areas: [
      { label: "Floor cleaning machine", seed: "area-floor" },
      { label: "Toilet seat inside & out", seed: "area-seat" },
      { label: "Washbasin", seed: "area-basin" },
      { label: "Tiles & glass partition", seed: "area-tiles" },
    ],
    covered: [
      "Hard water stains",
      "Toilet seat from outside & inside",
      "Sink, tiles, taps & other fixtures",
      "Mirrors, windows & glass partition",
      "Exhaust fan & other hard to reach areas",
    ],
    notCovered: [
      "Cements & rust stains",
      "Cabinet interiors, buckets, mugs & stools",
      "Dismantling & cleaning of any appliance",
    ],
    equipment: [
      { label: "Scrubbing machine", seed: "eq-scrub" },
      { label: "Hospital-grade solution", seed: "eq-solution" },
      { label: "Steam jet", seed: "eq-steam" },
      { label: "Microfibre kit", seed: "eq-cloth" },
    ],
    faqs: [
      {
        q: "How long does the service take?",
        a: "Most jobs are done in 1–4 hours depending on the size you pick. The professional will share an estimate before starting.",
      },
      {
        q: "Do I need to provide anything?",
        a: "No. The professional arrives with all machines, solutions and protective gear. You only need a water point and a power socket.",
      },
    ],
    ...spec,
  };

  base.areas = base.areas.map((a) => ({ ...a, image: img(a.seed, 400, 300) }));
  base.equipment = base.equipment.map((e) => ({ ...e, image: img(e.seed, 400, 300) }));
  base.packages = base.packageSpecs.map((p) => pkg(base, p));
  delete base.packageSpecs;
  return base;
}

export const SUBCATEGORIES = {
  "bathroom-cleaning": sub({
    slug: "bathroom-cleaning",
    label: "Bathroom Cleaning",
    icon: "🚽",
    tone: "#e0f2fe",
    hero: "bath-hero",
    caption: "We got yoooom?",
    rating: 4.83,
    bookings: "8.5 M bookings",
    packageSpecs: [
      { id: "bath-combo2", name: "Intense bathroom & ceiling fan cleaning (pack of 2)", price: 1299, mrp: 1598, duration: "2.5 hrs", unitNote: "₹649 per bathroom", badge: "PACK OF 2", seed: "bathcombo", bullets: ["Bathroom deep clean plus ceiling fan dusting", "Scrub machine on floor and tiles"] },
      { id: "bath-intense", name: "Intense bathroom cleaning", tab: "deep", price: 549, mrp: 649, duration: "1.5 hrs", seed: "bathintense", bullets: ["Hard water stain and scale removal"] },
      { id: "bath-movein", name: "Move-in bathroom cleaning", tab: "deep", price: 899, duration: "2 hrs", seed: "bathmovein", bullets: ["Extra descaling for a long-shut bathroom"] },
      { id: "bath-exhaust", name: "Bathroom exhaust fan cleaning", tab: "mini", price: 199, duration: "30 min", seed: "bathexhaust", bullets: ["Blades, cover and duct mouth"] },
      { id: "bath-basin", name: "Washbasin cleaning", tab: "mini", price: 149, duration: "20 min", seed: "bathbasin", bullets: ["Basin, tap and drain"] },
      { id: "bath-door", name: "Door cleaning (additional)", tab: "mini", price: 99, duration: "15 min", seed: "bathdoor", bullets: ["Add on to any bathroom service"] },
      { id: "bath-mirror", name: "Mirror cleaning (additional)", tab: "mini", price: 79, duration: "10 min", seed: "bathmirror", bullets: ["Streak-free finish"] },
    ],
  }),

  "kitchen-cleaning": sub({
    slug: "kitchen-cleaning",
    label: "Kitchen Cleaning",
    icon: "🍳",
    tone: "#fef3c7",
    hero: "kitchen-hero",
    caption: "Grease, gone.",
    rating: 4.79,
    bookings: "3.1 M bookings",
    tabs: [
      { id: "packs", label: "Value packs", tag: "COMBO DEALS" },
      { id: "chimney", label: "Chimney cleaning", icon: "💨" },
      { id: "complete", label: "Complete kitchen cleaning", icon: "🍽️" },
      { id: "appliance", label: "Appliance cleaning", icon: "🔌" },
      { id: "cabinets", label: "Cabinets & tiles", icon: "🚪" },
      { id: "mini", label: "Mini services", icon: "⚡" },
    ],
    areas: [
      { label: "Chimney filters & hood", seed: "area-chimney" },
      { label: "Stove & backsplash", seed: "area-stove" },
      { label: "Cabinet shutters", seed: "area-cabinet" },
      { label: "Sink & countertop", seed: "area-sink" },
    ],
    covered: ["Grease on tiles and chimney hood", "Countertops, sink and taps", "Cabinet shutters from outside", "Stove top and backsplash", "Floor scrubbing"],
    notCovered: ["Inside of cabinets with contents", "Dismantling of the chimney motor", "Utensil washing"],
    equipment: [
      { label: "Degreaser solution", seed: "eq-degrease" },
      { label: "Steam jet", seed: "eq-steam" },
      { label: "Scrub pads", seed: "eq-pads" },
      { label: "Microfibre kit", seed: "eq-cloth" },
    ],
    packageSpecs: [
      { id: "kit-pack-chimney", name: "Regular chimney & stove cleaning", tab: "packs", price: 899, mrp: 1098, duration: "1.5 hrs", badge: "SAVE ₹199", seed: "kitpack1", bullets: ["Chimney filters plus stove degreasing"] },
      { id: "kit-pack-fanwindow", name: "Kitchen fan & window cleaning", tab: "packs", price: 549, mrp: 648, duration: "1 hr", seed: "kitpack2", bullets: ["Exhaust fan, window glass and grill"] },
      { id: "kit-pack-cabinets", name: "Cabinets, tiles & sink cleaning", tab: "packs", price: 1199, mrp: 1398, duration: "2 hrs", seed: "kitpack3", bullets: ["Shutters, wall tiles and sink area"] },
      { id: "kit-chimney-reg", name: "Regular chimney cleaning", tab: "chimney", price: 599, duration: "1 hr", seed: "kitchim1", bullets: ["Filters, hood and outer body"] },
      { id: "kit-chimney-stove", name: "Regular chimney & stove cleaning", tab: "chimney", price: 899, mrp: 1098, duration: "1.5 hrs", seed: "kitchim2", bullets: ["Chimney plus burner and drip tray"] },
      { id: "kit-complete", name: "Complete kitchen cleaning", tab: "complete", price: 1599, mrp: 1899, duration: "3 hrs", seed: "kitcomplete", bullets: ["Degreasing of tiles, shutters and stove", "Floor scrubbing included"] },
      { id: "kit-fridge", name: "Fridge cleaning", tab: "appliance", price: 399, duration: "45 min", seed: "kitfridge", bullets: ["Shelves, trays and door gasket"] },
      { id: "kit-microwave", name: "Microwave cleaning", tab: "appliance", price: 299, duration: "30 min", seed: "kitmicro", bullets: ["Cavity, turntable and door"] },
      { id: "kit-stove", name: "Gas stove cleaning", tab: "appliance", price: 249, duration: "30 min", seed: "kitstove", bullets: ["Burners, grates and drip tray"] },
      { id: "kit-appliance-pack", name: "Appliance cleaning package", tab: "appliance", price: 899, mrp: 1247, duration: "2 hrs", badge: "COMBO", seed: "kitapppack", bullets: ["Fridge, microwave and gas stove together"] },
      { id: "kit-airfryer", name: "Air fryer cleaning", tab: "appliance", price: 249, duration: "30 min", seed: "kitfryer", bullets: ["Basket, tray and heating element cover"] },
      { id: "kit-grill", name: "Sandwich grill cleaning", tab: "appliance", price: 199, duration: "20 min", seed: "kitgrill", bullets: ["Plates and hinge area"] },
      { id: "kit-tiles", name: "Tiles & slabs cleaning", tab: "cabinets", price: 699, duration: "1 hr", seed: "kittiles", bullets: ["Wall tiles, grout lines and slabs"] },
      { id: "kit-cabinets", name: "Cabinets / trollys cleaning", tab: "cabinets", price: 849, duration: "1.5 hrs", seed: "kitcab", bullets: ["Shutters outside, handles and trolleys"] },
      { id: "kit-ceilingfan", name: "Ceiling fan cleaning", tab: "mini", price: 149, duration: "20 min", seed: "kitfan", bullets: ["Blades and mount"] },
      { id: "kit-exhaust", name: "Exhaust fan cleaning", tab: "mini", price: 199, duration: "30 min", seed: "kitexh", bullets: ["Blades, mesh and cover"] },
      { id: "kit-sink", name: "Sink & under sink cleaning", tab: "mini", price: 249, duration: "30 min", seed: "kitsink", bullets: ["Sink, drain and under-sink shelf"] },
      { id: "kit-sanitation", name: "Kitchen sanitation", tab: "mini", price: 399, duration: "45 min", seed: "kitsanit", bullets: ["Food-safe disinfectant on all surfaces"] },
    ],
  }),

  "living-bedroom-cleaning": sub({
    slug: "living-bedroom-cleaning",
    label: "Living & Bedroom Cleaning",
    icon: "🛋️",
    tone: "#fce7f3",
    hero: "living-hero",
    caption: "Dust-free, top to toe.",
    rating: 4.77,
    bookings: "1.9 M bookings",
    tabs: [
      { id: "saver", label: "Super saver deals", tag: "SUPER SAVER" },
      { id: "protect", label: "Cleaning & stain protection", icon: "🛡️" },
      { id: "sofa", label: "Sofa & carpet", icon: "🛋️" },
      { id: "curtain", label: "Curtains", icon: "🪟" },
      { id: "living", label: "Living room care", icon: "🏡" },
      { id: "bedroom", label: "Bedroom care", icon: "🛏️" },
      { id: "mattress", label: "Mattress & bed", icon: "🧺" },
      { id: "dining", label: "Dining table & chairs", icon: "🍽️" },
      { id: "furniture", label: "Other furniture", icon: "🪑" },
      { id: "windows", label: "Windows & fan", icon: "🌬️" },
    ],
    areas: [
      { label: "Upholstery shampoo", seed: "area-shampoo" },
      { label: "Wet vacuum", seed: "area-vacuum" },
      { label: "Crevice & seams", seed: "area-seams" },
      { label: "Cushions & covers", seed: "area-cushion" },
    ],
    covered: ["Dusting of all reachable surfaces", "Fan, light and switchboard wipe", "Sofa and mattress vacuuming", "Window glass from inside", "Floor mopping"],
    notCovered: ["Wall painting or patch work", "Moving heavy furniture alone", "Curtain washing at a laundry"],
    equipment: [
      { label: "Wet vacuum", seed: "eq-wetvac" },
      { label: "Upholstery shampoo", seed: "eq-shampoo" },
      { label: "Brush heads", seed: "eq-brush" },
      { label: "Microfibre kit", seed: "eq-cloth" },
    ],
    packageSpecs: [
      { id: "liv-saver-sofa2", name: "Fabric sofa cleaning (2 visits)", tab: "saver", price: 1499, mrp: 1798, duration: "2 visits", badge: "2 VISITS", seed: "livsaver", bullets: ["Second visit any time within 6 months"] },
      { id: "liv-protect", name: "Sofa cleaning & stain protection coating", tab: "protect", price: 1899, mrp: 2199, duration: "2.5 hrs", seed: "livprotect", bullets: ["Shampoo wash plus a water-repellent coat"] },
      { id: "liv-sofa-fabric", name: "Fabric sofa cleaning", tab: "sofa", price: 849, mrp: 999, duration: "2 hrs", unitNote: "₹283 per seat", seed: "livsofa1", bullets: ["Shampoo and wet vacuum, 3 seater"] },
      { id: "liv-sofa-leather", name: "Leather sofa cleaning & polishing", tab: "sofa", price: 1099, duration: "2 hrs", seed: "livsofa2", bullets: ["pH-safe cleaner and conditioner"] },
      { id: "liv-sofa-bed", name: "Sofa cum bed cleaning", tab: "sofa", price: 949, duration: "2 hrs", seed: "livsofa3", bullets: ["Opened out and cleaned on both sides"] },
      { id: "liv-carpet", name: "Carpet cleaning", tab: "sofa", price: 699, duration: "1.5 hrs", seed: "livcarpet", bullets: ["Up to 40 sq ft, dried on site"] },
      { id: "liv-curtain", name: "Curtain refresh", tab: "curtain", price: 599, duration: "1 hr", seed: "livcurtain", bullets: ["Vacuumed and steamed in place"] },
      { id: "liv-living", name: "Sofa, windows & cobweb cleaning", tab: "living", price: 1299, mrp: 1548, duration: "3 hrs", badge: "COMBO", seed: "livliving", bullets: ["The full living room in one visit"] },
      { id: "liv-bedroom", name: "Bedroom essential cleaning", tab: "bedroom", price: 999, duration: "2 hrs", seed: "livbedroom", bullets: ["Dusting, mattress vacuum and mopping"] },
      { id: "liv-mattress", name: "Mattress cleaning", tab: "mattress", price: 649, duration: "1 hr", seed: "livmattress", bullets: ["Both sides, UV and vacuum"] },
      { id: "liv-bed", name: "Bed cleaning", tab: "mattress", price: 549, duration: "1 hr", seed: "livbed", bullets: ["Frame, headboard and storage box"] },
      { id: "liv-dining", name: "Dining table & chairs cleaning", tab: "dining", price: 749, duration: "1.5 hrs", seed: "livdining", bullets: ["Table top, legs and up to 6 chairs"] },
      { id: "liv-cabinet", name: "Cabinet cleaning", tab: "furniture", price: 499, duration: "1 hr", seed: "livcabinet", bullets: ["Outside surfaces and handles"] },
      { id: "liv-centertable", name: "Sofa center table cleaning", tab: "furniture", price: 349, duration: "45 min", seed: "livcenter", bullets: ["Glass or wood top polished"] },
      { id: "liv-study", name: "Study table cleaning", tab: "furniture", price: 399, duration: "45 min", seed: "livstudy", bullets: ["Desk, drawers outside and chair"] },
      { id: "liv-win-grill", name: "Windows with grills + glass doors cleaning", tab: "windows", price: 699, duration: "1.5 hrs", seed: "livwin1", bullets: ["Grill, glass, track and sill"] },
      { id: "liv-win-plain", name: "Windows without grills + glass doors cleaning", tab: "windows", price: 549, duration: "1 hr", seed: "livwin2", bullets: ["Glass, track and sill"] },
      { id: "liv-mirror", name: "Mirror cleaning", tab: "windows", price: 149, duration: "20 min", seed: "livmirror", bullets: ["Streak-free finish"] },
      { id: "liv-fan", name: "Fan cleaning", tab: "windows", price: 149, duration: "20 min", seed: "livfan", bullets: ["Blades and mount, no drip"] },
    ],
  }),

  "full-home-cleaning": sub({
    slug: "full-home-cleaning",
    label: "Full Home / By Room Cleaning",
    icon: "🏠",
    tone: "#dcfce7",
    hero: "fullhome-hero",
    caption: "A whole-home reset.",
    rating: 4.79,
    bookings: "1.2 M bookings",
    tabs: [
      { id: "apartment", label: "Full apartment", tag: "MOST BOOKED" },
      { id: "bungalow", label: "Full bungalow / duplex", icon: "🏡" },
      { id: "partial", label: "Partial home cleaning", icon: "🧩" },
    ],
    covered: ["Every room, kitchen and bathrooms", "Fans, lights and switchboards", "Windows from inside", "Floor scrubbing with a machine", "Furniture dusting and vacuuming"],
    notCovered: ["Wall painting or patch work", "Terrace and outside areas", "Shifting of heavy almirahs"],
    packageSpecs: [
      { id: "home-apt-unfurn", name: "Unfurnished apartment home deep cleaning", tab: "apartment", price: 4999, mrp: 5999, duration: "6 hrs", badge: "UNFURNISHED", unitNote: "Team of 2 professionals", seed: "homeapt1", bullets: ["Best before you move in"] },
      { id: "home-apt-furn", name: "Furnished apartment home deep cleaning", tab: "apartment", price: 6499, mrp: 7499, duration: "7 hrs", badge: "FURNISHED", unitNote: "Team of 3 professionals", seed: "homeapt2", bullets: ["Furniture moved, cleaned and replaced"] },
      { id: "home-bung-unfurn", name: "Unfurnished bungalow home deep cleaning", tab: "bungalow", price: 7999, mrp: 8999, duration: "8 hrs", badge: "UNFURNISHED", seed: "homebung1", bullets: ["All floors of an empty bungalow"] },
      { id: "home-bung-furn", name: "Furnished bungalow home deep cleaning", tab: "bungalow", price: 9999, mrp: 11499, duration: "9 hrs", badge: "FURNISHED", seed: "homebung2", bullets: ["Large team, machine assisted"] },
      { id: "home-partial", name: "Partial home cleaning", tab: "partial", price: 2499, duration: "4 hrs", seed: "homepart1", bullets: ["Pick the rooms that need it most"] },
      { id: "home-custom", name: "Customise: living / bedroom / balcony combo", tab: "partial", price: 1999, duration: "3 hrs", seed: "homepart2", bullets: ["Build your own combination of rooms"] },
    ],
  }),

  "cockroach-control": sub({
    slug: "cockroach-control",
    label: "Cockroach Control",
    icon: "🪳",
    tone: "#ffe4e6",
    hero: "roach-hero",
    caption: "Gel that works for months.",
    rating: 4.79,
    bookings: "320K bookings",
    tabs: [
      { id: "kb", label: "Kitchen / bathroom", tag: "MOST BOOKED" },
      { id: "apt", label: "Apartment / bungalow", icon: "🏢" },
    ],
    covered: ["Odourless gel in kitchen and bathrooms", "Cracks, hinges and pipe entry points", "Follow-up visit within 30 days", "Safe for children and pets", "Written service warranty"],
    notCovered: ["Structural sealing of drains", "Furniture dismantling", "Outdoor garden areas"],
    equipment: [
      { label: "Odourless gel", seed: "eq-gel" },
      { label: "Crack & crevice tip", seed: "eq-tip" },
      { label: "Safety kit", seed: "eq-safety" },
      { label: "Inspection torch", seed: "eq-torch" },
    ],
    packageSpecs: [
      { id: "roach-kb-removal", name: "Cockroach control (includes utensil removal)", tab: "kb", price: 1499, mrp: 1799, duration: "2.5 hrs", badge: "HASSLE FREE", seed: "roachkb1", bullets: ["We empty and refill the cabinets for you"] },
      { id: "roach-kb-plain", name: "Cockroach control (no utensil removal)", tab: "kb", price: 1249, mrp: 1499, duration: "2 hrs", seed: "roachkb2", bullets: ["Cabinets to be emptied before the visit"] },
      { id: "roach-apt-cust", name: "Apartment pest control (utensil removal by customer)", tab: "apt", price: 1749, duration: "2.5 hrs", seed: "roachapt1", bullets: ["Whole flat, kitchen to balcony"] },
      { id: "roach-bung-cust", name: "Bungalow pest control (utensil removal by customer)", tab: "apt", price: 2199, duration: "3 hrs", seed: "roachapt2", bullets: ["All floors covered"] },
      { id: "roach-apt-incl", name: "Apartment pest control (utensil removal included)", tab: "apt", price: 1999, duration: "3 hrs", badge: "HASSLE FREE", seed: "roachapt3", bullets: ["Cabinets emptied and refilled by the pro"] },
      { id: "roach-bung-incl", name: "Bungalow pest control (utensil removal included)", tab: "apt", price: 2499, duration: "3.5 hrs", badge: "HASSLE FREE", seed: "roachapt4", bullets: ["Largest cover, utensils handled for you"] },
    ],
  }),

  "termite-control": sub({
    slug: "termite-control",
    label: "Termite Control",
    icon: "🐜",
    tone: "#fef9c3",
    hero: "termite-hero",
    caption: "Drill, fill and seal.",
    rating: 4.74,
    bookings: "140K bookings",
    tabs: [
      { id: "apt", label: "Apartment termite control", tag: "MOST BOOKED" },
      { id: "bungalow", label: "Bungalow termite control", icon: "🏡" },
    ],
    covered: ["Drill, fill and seal on affected walls", "Chemical barrier along the skirting", "Wooden furniture spot treatment", "3-year warranty on the treated area", "Post-service inspection"],
    notCovered: ["Repainting of drilled points", "Replacement of damaged wood", "Soil treatment outside the flat"],
    packageSpecs: [
      { id: "term-apt", name: "Apartment termite control", tab: "apt", price: 2999, mrp: 3499, duration: "3 hrs", unitNote: "3-year written warranty", seed: "termapt", bullets: ["Drill, fill and seal across the flat"] },
      { id: "term-bung", name: "Bungalow termite control", tab: "bungalow", price: 4499, mrp: 4999, duration: "4 hrs", unitNote: "3-year written warranty", seed: "termbung", bullets: ["All floors plus the ground barrier"] },
    ],
  }),

  "ants-bedbugs-control": sub({
    slug: "ants-bedbugs-control",
    label: "Ants & Bed Bugs Control",
    icon: "🛏️",
    tone: "#f1f5f9",
    hero: "bedbug-hero",
    caption: "Sleep easy again.",
    rating: 4.71,
    bookings: "96K bookings",
    tabs: [
      { id: "bed", label: "Bed bugs control", tag: "MOST BOOKED" },
      { id: "ants", label: "Ants control", icon: "🐜" },
    ],
    covered: ["Mattress, bed frame and joints", "Sofa seams and cushions", "Skirting and wall cracks", "Two visits 15 days apart", "Child and pet safe chemicals"],
    notCovered: ["Washing of bedding and linen", "Disposal of infested mattresses", "Outdoor treatment"],
    packageSpecs: [
      { id: "bug-bed", name: "Bed bugs control", tab: "bed", price: 1599, mrp: 1899, duration: "2 hrs", unitNote: "Two visits, 15 days apart", seed: "bugbed", bullets: ["Mattress, frame and sofa seams"] },
      { id: "bug-ants-apt", name: "Ants control (apartment)", tab: "ants", price: 799, duration: "1 hr", seed: "bugant1", bullets: ["Gel and spray combination"] },
      { id: "bug-ants-bung", name: "Ants control (bungalow)", tab: "ants", price: 1099, duration: "1.5 hrs", seed: "bugant2", bullets: ["All floors and entry points"] },
    ],
  }),
  "salon-women": sub({
    slug: "salon-women",
    label: "Salon for Women",
    icon: "💆‍♀️",
    tone: "#fce7f3",
    hero: "salonw-hero",
    caption: "Salon-grade, at home.",
    rating: 4.86,
    bookings: "2.1 M bookings",
    tabs: [{ id: "value", label: "Packages", tag: "COMBO DEALS" }, { id: "deep", label: "Facial & cleanup", icon: "🧖‍♀️" }, { id: "mini", label: "Quick services", icon: "⚡" }],
    areas: [
      { label: "Single-use kit", seed: "area-kit" },
      { label: "Branded products", seed: "area-brand" },
      { label: "Sanitised tools", seed: "area-tools" },
      { label: "Professional bed", seed: "area-bed" },
    ],
    covered: ["Single-use disposable kit for every booking", "Branded products, seals opened in front of you", "Trained and background-verified beautician", "Setup and clean-up included", "Free reschedule up to 2 hours before"],
    notCovered: ["Bridal or party makeup", "Hair colouring with your own product", "Services for clients under 12"],
    equipment: [
      { label: "Steamer", seed: "eq-steamer" },
      { label: "Wax heater", seed: "eq-wax" },
      { label: "Sanitised tool kit", seed: "eq-kit" },
      { label: "Disposable sheets", seed: "eq-sheets" },
    ],
    packageSpecs: [
      { id: "salon-wax", name: "Waxing (full arms + underarms)", price: 649, duration: "1 hr", seed: "wax1", bullets: ["Roll-on wax, single use"] },
      { id: "salon-facial", name: "Facial & cleanup", tab: "deep", price: 1099, mrp: 1399, duration: "1.5 hrs", seed: "facial1", bullets: ["Includes steam and massage"] },
      { id: "salon-mani", name: "Manicure & pedicure", price: 1049, mrp: 1249, duration: "1.5 hrs", seed: "mani1", bullets: ["Scrub, mask and polish"] },
      { id: "salon-thread", name: "Threading & face care", tab: "mini", price: 249, duration: "30 min", seed: "thread1", bullets: ["Eyebrows, upper lip and chin"] },
    ],
  }),

  "salon-men": sub({
    slug: "salon-men",
    label: "Salon for Men",
    icon: "💈",
    tone: "#e0e7ff",
    hero: "salonm-hero",
    caption: "A chair at your place.",
    rating: 4.8,
    bookings: "1.4 M bookings",
    tabs: [{ id: "value", label: "Grooming", tag: "MOST BOOKED" }, { id: "deep", label: "Massage", icon: "💆‍♂️" }, { id: "mini", label: "Quick services", icon: "⚡" }],
    covered: ["Sanitised clippers and blades", "Fresh cape and towel per booking", "Trained stylist", "Hair clean-up after the cut", "Free reschedule up to 2 hours before"],
    notCovered: ["Hair colouring with your own product", "Bridal grooming packages", "Services under 12 years"],
    equipment: [
      { label: "Clipper set", seed: "eq-clipper" },
      { label: "Sanitised blades", seed: "eq-blade" },
      { label: "Massage oils", seed: "eq-oil" },
      { label: "Portable chair", seed: "eq-chair" },
    ],
    packageSpecs: [
      { id: "men-cut", name: "Haircut for men", price: 429, duration: "45 min", seed: "mcut", bullets: ["Consultation, cut and finish"] },
      { id: "men-beard", name: "Beard shape & trim", tab: "mini", price: 249, duration: "30 min", seed: "mbeard", bullets: ["Line-up with hot towel"] },
      { id: "men-massage", name: "Stress relief massage (60 min)", tab: "deep", price: 1299, mrp: 1499, duration: "1 hr", seed: "mmass", bullets: ["Head, neck, back and legs"] },
    ],
  }),

  "ac-service": sub({
    slug: "ac-service",
    label: "AC Service & Repair",
    icon: "❄️",
    tone: "#e0f2fe",
    hero: "ac-hero",
    caption: "Cooling, restored.",
    rating: 4.63,
    bookings: "1.6 M bookings",
    tabs: [{ id: "value", label: "Service", tag: "MOST BOOKED" }, { id: "deep", label: "Repair", icon: "🛠️" }, { id: "mini", label: "Install & uninstall", icon: "📦" }],
    areas: [
      { label: "Jet pump wash", seed: "area-jet" },
      { label: "Filter & coil", seed: "area-coil" },
      { label: "Drain pipe", seed: "area-drain" },
      { label: "Gas pressure check", seed: "area-gas" },
    ],
    covered: ["Foam and jet wash of the indoor unit", "Filter, coil and drain pipe cleaning", "Gas pressure check", "Cooling test before and after", "30-day service warranty"],
    notCovered: ["Gas refill (charged separately)", "Spare parts and PCB repair", "Outdoor unit at height without access"],
    equipment: [
      { label: "Jet pump", seed: "eq-jet" },
      { label: "Foam cleaner", seed: "eq-foam" },
      { label: "Gauge set", seed: "eq-gauge" },
      { label: "Protective sheets", seed: "eq-sheet" },
    ],
    packageSpecs: [
      { id: "ac-jet", name: "AC service (power jet)", price: 599, mrp: 699, duration: "1 hr", seed: "ac1", bullets: ["Foam wash with jet pump"] },
      { id: "ac-two", name: "AC service (2 units)", price: 1099, mrp: 1398, duration: "2 hrs", badge: "2 UNITS", seed: "ac2", bullets: ["Save ₹299 on the pair"] },
      { id: "ac-repair", name: "AC not cooling — diagnosis", tab: "deep", price: 299, duration: "45 min", seed: "ac3", bullets: ["Visit fee adjusted against repair"] },
      { id: "ac-install", name: "Split AC installation", tab: "mini", price: 1499, duration: "2 hrs", seed: "ac4", bullets: ["Bracket, drill and gas check"] },
    ],
  }),

  "appliance-repair": sub({
    slug: "appliance-repair",
    label: "Appliance Repair",
    icon: "🔌",
    tone: "#dbeafe",
    hero: "appliance-hero",
    caption: "Fixed the same day.",
    rating: 4.6,
    bookings: "910K bookings",
    tabs: [{ id: "value", label: "Repair", tag: "MOST BOOKED" }, { id: "deep", label: "Deep clean", icon: "🧼" }, { id: "mini", label: "Installation", icon: "📦" }],
    covered: ["On-site diagnosis by a trained technician", "Genuine spare parts where available", "30-day warranty on the repair", "Visit fee adjusted against the bill", "Digital invoice"],
    notCovered: ["Parts under manufacturer warranty", "Appliances beyond economical repair", "Software or smart-hub setup"],
    equipment: [
      { label: "Multimeter", seed: "eq-meter" },
      { label: "Tool roll", seed: "eq-tools" },
      { label: "Spare kit", seed: "eq-spares" },
      { label: "Floor protection", seed: "eq-floor" },
    ],
    packageSpecs: [
      { id: "app-wash", name: "Washing machine repair", price: 449, duration: "1 hr", seed: "app1", bullets: ["Front and top load"] },
      { id: "app-fridge", name: "Refrigerator repair", price: 499, duration: "1 hr", seed: "app2", bullets: ["Cooling, noise and ice issues"] },
      { id: "app-chimney", name: "Chimney deep clean", tab: "deep", price: 649, mrp: 799, duration: "1.5 hrs", seed: "app3", bullets: ["Filters, hood and motor housing"] },
      { id: "app-micro", name: "Microwave repair", tab: "mini", price: 399, duration: "45 min", seed: "app4", bullets: ["Heating and turntable faults"] },
    ],
  }),

  "electrician": sub({
    slug: "electrician",
    label: "Electrician",
    icon: "💡",
    tone: "#fef3c7",
    hero: "electric-hero",
    caption: "Sparks, sorted.",
    rating: 4.75,
    bookings: "176K bookings",
    tabs: [{ id: "value", label: "Popular jobs", tag: "MOST BOOKED" }, { id: "deep", label: "Wiring", icon: "🔌" }, { id: "mini", label: "Quick fixes", icon: "⚡" }],
    covered: ["Fault diagnosis and safe isolation", "Switch, socket and MCB work", "Fan and light installation", "Testing after the job", "30-day warranty on workmanship"],
    notCovered: ["Material cost unless agreed", "Work on the building's main panel", "Wall chiselling and repainting"],
    equipment: [
      { label: "Tester & meter", seed: "eq-tester" },
      { label: "Insulated tools", seed: "eq-insul" },
      { label: "Drill", seed: "eq-drill" },
      { label: "Ladder", seed: "eq-ladder" },
    ],
    packageSpecs: [
      { id: "elec-visit", name: "Electrician consultation", price: 49, duration: "30 min", seed: "elec1", bullets: ["Visit fee adjusted against the job"] },
      { id: "elec-fan", name: "Ceiling fan replace / install", price: 99, duration: "45 min", seed: "elec2", bullets: ["Includes down-rod fitting"] },
      { id: "elec-switch", name: "Switchboard repair", tab: "mini", price: 199, duration: "45 min", seed: "elec3", bullets: ["Loose contacts and burnt sockets"] },
    ],
  }),

  "plumber": sub({
    slug: "plumber",
    label: "Plumber",
    icon: "🔧",
    tone: "#cffafe",
    hero: "plumb-hero",
    caption: "Leaks stop here.",
    rating: 4.74,
    bookings: "214K bookings",
    tabs: [{ id: "value", label: "Popular jobs", tag: "MOST BOOKED" }, { id: "deep", label: "Bathroom fittings", icon: "🚿" }, { id: "mini", label: "Quick fixes", icon: "⚡" }],
    covered: ["Leak tracing and sealing", "Tap, mixer and shower fitting", "Flush tank repair", "Drain unclogging", "30-day warranty on workmanship"],
    notCovered: ["Material cost unless agreed", "Breaking of tiles or slabs", "Common building pipeline work"],
    equipment: [
      { label: "Pipe wrench", seed: "eq-wrench" },
      { label: "Drain snake", seed: "eq-snake" },
      { label: "Leak sealant", seed: "eq-seal" },
      { label: "Bucket & mat", seed: "eq-mat" },
    ],
    packageSpecs: [
      { id: "plumb-visit", name: "Plumber consultation", price: 49, duration: "30 min", seed: "plumb1", bullets: ["Visit fee adjusted against the job"] },
      { id: "plumb-flush", name: "Flush tank repair", price: 199, duration: "45 min", seed: "plumb2", bullets: ["Valve, float and seal"] },
      { id: "plumb-drain", name: "Drain unclogging", tab: "mini", price: 299, duration: "1 hr", seed: "plumb3", bullets: ["Machine assisted"] },
    ],
  }),

  "carpenter": sub({
    slug: "carpenter",
    label: "Carpenter",
    icon: "🪚",
    tone: "#ffe4e6",
    hero: "carp-hero",
    caption: "Hinges to headboards.",
    rating: 4.66,
    bookings: "191K bookings",
    tabs: [{ id: "value", label: "Popular jobs", tag: "MOST BOOKED" }, { id: "deep", label: "Furniture", icon: "🪑" }, { id: "mini", label: "Quick fixes", icon: "⚡" }],
    covered: ["Door, drawer and hinge repair", "Furniture assembly", "Curtain rod and shelf mounting", "Alignment and lubrication", "30-day warranty on workmanship"],
    notCovered: ["Material and hardware cost", "Polishing and painting", "Custom furniture making"],
    equipment: [
      { label: "Cordless drill", seed: "eq-cdrill" },
      { label: "Hinge kit", seed: "eq-hinge" },
      { label: "Measuring set", seed: "eq-measure" },
      { label: "Dust sheet", seed: "eq-dust" },
    ],
    packageSpecs: [
      { id: "carp-visit", name: "Book a carpenter", price: 49, duration: "30 min", seed: "carp1", bullets: ["Visit fee adjusted against the job"] },
      { id: "carp-hinge", name: "Door hinge repair", price: 199, duration: "45 min", seed: "carp2", bullets: ["Up to 2 doors"] },
      { id: "carp-assemble", name: "Furniture assembly", tab: "deep", price: 599, duration: "1.5 hrs", seed: "carp3", bullets: ["Flat-pack beds and wardrobes"] },
    ],
  }),

  "painting": sub({
    slug: "painting",
    label: "Painting & Waterproofing",
    icon: "🎨",
    tone: "#ede9fe",
    hero: "paint-hero",
    caption: "Fresh walls, zero mess.",
    rating: 4.7,
    bookings: "60K bookings",
    tabs: [{ id: "value", label: "Painting", tag: "MOST BOOKED" }, { id: "deep", label: "Waterproofing", icon: "💧" }, { id: "mini", label: "Touch-ups", icon: "⚡" }],
    covered: ["Free site visit and quote", "Furniture covering and masking", "Two coats of the chosen paint", "Daily site clean-up", "1-year workmanship warranty"],
    notCovered: ["Paint material unless in the package", "Structural crack repair", "False ceiling work"],
    equipment: [
      { label: "Roller set", seed: "eq-roller" },
      { label: "Masking sheets", seed: "eq-mask" },
      { label: "Putty tools", seed: "eq-putty" },
      { label: "Ladder & platform", seed: "eq-plat" },
    ],
    packageSpecs: [
      { id: "paint-visit", name: "Wall painting consultation", price: 199, duration: "45 min", seed: "paint1", bullets: ["Measurement and written quote"] },
      { id: "paint-room", name: "1 room repaint (up to 120 sq ft)", price: 4999, mrp: 5999, duration: "2 days", seed: "paint2", bullets: ["Putty, primer and two coats"] },
      { id: "paint-water", name: "Terrace waterproofing", tab: "deep", price: 8999, duration: "2 days", badge: "5 YR WARRANTY", seed: "paint3", bullets: ["Crack filling and coating"] },
    ],
  }),

  "water-purifier": sub({
    slug: "water-purifier",
    label: "Water Purifier Care",
    icon: "💧",
    tone: "#cffafe",
    hero: "purifier-hero",
    caption: "Every drop, checked.",
    rating: 4.71,
    bookings: "260K bookings",
    tabs: [{ id: "value", label: "Service", tag: "MOST BOOKED" }, { id: "deep", label: "Yearly plans", icon: "📅" }, { id: "mini", label: "Installation", icon: "📦" }],
    covered: ["Filter and membrane inspection", "TDS test before and after", "Tank sanitisation", "Leak and flow check", "30-day service warranty"],
    notCovered: ["Filter and membrane cost", "Plumbing line changes", "Units older than 10 years"],
    equipment: [
      { label: "TDS meter", seed: "eq-tds" },
      { label: "Filter wrench", seed: "eq-fwrench" },
      { label: "Sanitiser", seed: "eq-sanit" },
      { label: "Spare O-rings", seed: "eq-orings" },
    ],
    packageSpecs: [
      { id: "wp-service", name: "Water purifier service", price: 499, mrp: 599, duration: "1 hr", seed: "wp1", bullets: ["TDS test included"] },
      { id: "wp-year", name: "3-year care plan", tab: "deep", price: 4999, mrp: 6999, duration: "6 visits", badge: "BEST VALUE", seed: "wp2", bullets: ["Filters included for 3 years"] },
      { id: "wp-install", name: "Purifier installation", tab: "mini", price: 699, duration: "1.5 hrs", seed: "wp3", bullets: ["Wall mount and tap connection"] },
    ],
  }),
};

export const CATEGORY_GROUPS = {
  "cleaning-pest": {
    slug: "cleaning-pest",
    title: "Cleaning & Pest Control",
    sections: [
      { title: "Cleaning", items: ["bathroom-cleaning", "kitchen-cleaning", "living-bedroom-cleaning", "full-home-cleaning"] },
      { title: "Pest Control", items: ["cockroach-control", "termite-control", "ants-bedbugs-control"] },
    ],
  },
  "salon-women-group": {
    slug: "salon-women-group",
    title: "Women's Salon & Spa",
    sections: [
      { title: "Salon at home", items: ["salon-women"] },
      { title: "Spa & massage", items: ["salon-men"] },
    ],
  },
  "salon-men-group": {
    slug: "salon-men-group",
    title: "Men's Salon & Massage",
    sections: [
      { title: "Grooming", items: ["salon-men"] },
      { title: "Also booked", items: ["salon-women"] },
    ],
  },
  "appliance-group": {
    slug: "appliance-group",
    title: "AC & Appliance Repair",
    sections: [
      { title: "Air conditioner", items: ["ac-service"] },
      { title: "Home appliances", items: ["appliance-repair", "water-purifier"] },
    ],
  },
  "repair-group": {
    slug: "repair-group",
    title: "Electrician, Plumber & Carpenter",
    sections: [
      { title: "On-demand pros", items: ["electrician", "plumber", "carpenter"] },
      { title: "Also booked", items: ["painting"] },
    ],
  },
  "painting-group": {
    slug: "painting-group",
    title: "Painting & Waterproofing",
    sections: [
      { title: "Painting", items: ["painting"] },
      { title: "Repairs before painting", items: ["carpenter", "plumber"] },
    ],
  },
  "carpenter-group": {
    slug: "carpenter-group",
    title: "Carpenter & Repairs",
    sections: [
      { title: "Carpentry", items: ["carpenter"] },
      { title: "Also booked", items: ["electrician", "plumber"] },
    ],
  },
  "purifier-group": {
    slug: "purifier-group",
    title: "Water Purifier Care",
    sections: [
      { title: "Purifier", items: ["water-purifier"] },
      { title: "Also booked", items: ["appliance-repair"] },
    ],
  },
};

export const findGroup = (slug) => CATEGORY_GROUPS[slug];
export const findSub = (slug) => SUBCATEGORIES[slug];
export const findPackage = (subSlug, pkgId) =>
  SUBCATEGORIES[subSlug]?.packages.find((p) => p.id === pkgId);

export const heroShots = (slug) => {
  const s = SUBCATEGORIES[slug];
  return [1, 2, 3].map((n) => img(`${s?.hero || slug}-${n}`, 1100, 720));
};
