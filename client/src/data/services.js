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
      { id: "bath-4", name: "Intense cleaning (4 bathroom)", price: 1596, mrp: 1996, duration: "4 hrs", unitNote: "₹399 per bathroom", badge: "4 bathrooms", seed: "bath4", bullets: ["Floor & tile cleaning with a scrub machine"] },
      { id: "bath-2", name: "Intense cleaning (2 bathroom)", price: 918, mrp: 998, duration: "2 hrs", unitNote: "₹459 per bathroom", badge: "2 bathrooms", seed: "bath2", bullets: ["Floor & tile cleaning with a scrub machine"] },
      { id: "bath-3", name: "Intense cleaning (3 bathroom)", price: 1437, mrp: 1587, duration: "3 hrs", unitNote: "₹479 per bathroom", badge: "3 bathrooms", seed: "bath3", bullets: ["Stain removal on tiles and fittings"] },
      { id: "bath-deep", name: "One time deep clean (1 bathroom)", tab: "deep", price: 549, mrp: 649, duration: "1.5 hrs", seed: "bathdeep", bullets: ["Descaling of taps, shower and glass"] },
      { id: "bath-mini", name: "Toilet seat & washbasin refresh", tab: "mini", price: 249, duration: "45 min", seed: "bathmini", bullets: ["Quick sanitisation, no machine used"] },
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
    covered: ["Grease on tiles and chimney hood", "Countertops, sink & taps", "Cabinet shutters from outside", "Stove top & backsplash", "Floor scrubbing"],
    notCovered: ["Inside of cabinets with contents", "Dismantling of chimney motor", "Utensil washing"],
    packageSpecs: [
      { id: "kit-deep", name: "Kitchen deep cleaning", price: 1599, mrp: 1899, duration: "3 hrs", seed: "kit1", bullets: ["Degreasing of tiles, shutters and stove"] },
      { id: "kit-mini", name: "Kitchen window cleaning", tab: "mini", price: 399, duration: "45 min", seed: "kit2", bullets: ["Glass, grill and sill"] },
      { id: "kit-combo", name: "Kitchen + 1 bathroom combo", price: 2099, mrp: 2498, duration: "4 hrs", badge: "COMBO", seed: "kit3", bullets: ["Best value for a monthly reset"] },
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
    covered: ["Dusting of all reachable surfaces", "Fan, light and switchboard wipe", "Sofa and mattress vacuuming", "Window glass from inside", "Floor mopping"],
    notCovered: ["Wall painting or patch work", "Moving heavy furniture alone", "Curtain washing"],
    packageSpecs: [
      { id: "liv-2", name: "Living room + 1 bedroom", price: 1249, mrp: 1499, duration: "3 hrs", seed: "liv1", bullets: ["Vacuum, dust and mop"] },
      { id: "liv-sofa", name: "Sofa cleaning (3 seater)", tab: "mini", price: 849, mrp: 999, duration: "2 hrs", seed: "liv2", bullets: ["Shampoo and wet vacuum"] },
      { id: "liv-deep", name: "Bedroom deep clean", tab: "deep", price: 999, duration: "2 hrs", seed: "liv3", bullets: ["Mattress and headboard included"] },
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
    packageSpecs: [
      { id: "home-2bhk", name: "Full home cleaning (2 BHK)", price: 3199, mrp: 3799, duration: "5 hrs", unitNote: "2 professionals", badge: "2 BHK", seed: "home1", bullets: ["Every room, kitchen and bathrooms"] },
      { id: "home-3bhk", name: "Full home cleaning (3 BHK)", price: 4299, mrp: 4999, duration: "6 hrs", badge: "3 BHK", seed: "home2", bullets: ["Team of 3, machine assisted"] },
      { id: "home-empty", name: "Empty home deep clean", tab: "deep", price: 3899, duration: "6 hrs", seed: "home3", bullets: ["Ideal before moving in"] },
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
    tabs: [{ id: "value", label: "Treatments", tag: "MOST BOOKED" }, { id: "deep", label: "Yearly plans", icon: "📅" }, { id: "mini", label: "Add-ons", icon: "⚡" }],
    covered: ["Odourless gel in kitchen and bathrooms", "Cracks, hinges and pipe entry points", "Follow-up visit within 30 days", "Safe for children and pets", "Written service warranty"],
    notCovered: ["Structural sealing of drains", "Furniture dismantling", "Outdoor garden areas"],
    equipment: [
      { label: "Odourless gel", seed: "eq-gel" },
      { label: "Crack & crevice tip", seed: "eq-tip" },
      { label: "Safety kit", seed: "eq-safety" },
      { label: "Inspection torch", seed: "eq-torch" },
    ],
    packageSpecs: [
      { id: "roach-1bhk", name: "Cockroach & ant control (1 BHK)", price: 1249, mrp: 1499, duration: "2 hrs", seed: "roach1", bullets: ["30-day warranty with free re-visit"] },
      { id: "roach-3bhk", name: "Cockroach & ant control (3 BHK)", price: 1749, mrp: 1999, duration: "2.5 hrs", badge: "3 BHK", seed: "roach2", bullets: ["Covers kitchen, bathrooms and balconies"] },
      { id: "roach-year", name: "Yearly plan (4 treatments)", tab: "deep", price: 3999, mrp: 4996, duration: "4 visits", badge: "BEST VALUE", seed: "roach3", bullets: ["One visit every quarter"] },
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
    tabs: [{ id: "value", label: "Treatments", tag: "MOST BOOKED" }, { id: "deep", label: "Yearly plans", icon: "📅" }, { id: "mini", label: "Add-ons", icon: "⚡" }],
    covered: ["Drill, fill and seal on affected walls", "Chemical barrier along skirting", "Wooden furniture spot treatment", "3-year warranty on treated area", "Post-service inspection"],
    notCovered: ["Repainting of drilled points", "Replacement of damaged wood", "Soil treatment outside the flat"],
    packageSpecs: [
      { id: "term-1bhk", name: "Termite treatment (1 BHK)", price: 2999, mrp: 3499, duration: "3 hrs", seed: "term1", bullets: ["3-year written warranty"] },
      { id: "term-3bhk", name: "Termite treatment (3 BHK)", price: 4499, mrp: 4999, duration: "4 hrs", badge: "3 BHK", seed: "term2", bullets: ["Includes furniture spot treatment"] },
      { id: "term-wood", name: "Wooden furniture treatment", tab: "mini", price: 1299, duration: "1.5 hrs", seed: "term3", bullets: ["For wardrobes and cabinets"] },
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
    tabs: [{ id: "value", label: "Treatments", tag: "MOST BOOKED" }, { id: "deep", label: "Yearly plans", icon: "📅" }, { id: "mini", label: "Add-ons", icon: "⚡" }],
    covered: ["Mattress, bed frame and joints", "Sofa seams and cushions", "Skirting and wall cracks", "Two visits 15 days apart", "Child and pet safe chemicals"],
    notCovered: ["Washing of bedding and linen", "Disposal of infested mattresses", "Outdoor treatment"],
    packageSpecs: [
      { id: "bug-1bed", name: "Bed bugs treatment (1 bedroom)", price: 1599, mrp: 1899, duration: "2 hrs", seed: "bug1", bullets: ["Two visits, 15 days apart"] },
      { id: "bug-2bed", name: "Bed bugs treatment (2 bedrooms)", price: 2399, mrp: 2799, duration: "3 hrs", badge: "2 BEDROOMS", seed: "bug2", bullets: ["Mattress and sofa seams covered"] },
      { id: "bug-ants", name: "Ants control", tab: "mini", price: 799, duration: "1 hr", seed: "bug3", bullets: ["Gel and spray combination"] },
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
