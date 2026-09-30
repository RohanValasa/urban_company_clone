import { FAMILIES, pic, scene } from "../lib/art";

const art = (emoji, family) => pic(emoji, FAMILIES[family].tone);
// Banners sit on their own dark gradient, so their scenes have no tone.
const banner = (main, accents) => scene(main, accents, "transparent");

export const SERVICES = [
  // Cleaning & pest control
  { _id: "c1", name: "Intense cleaning (2 bathroom)", category: "Cleaning", price: 978, mrp: 1058, rating: 4.81, count: "7.2M", duration: "2 hrs", image: art("🚽", "cleaning") },
  { _id: "c2", name: "Intense cleaning (3 bathroom)", category: "Cleaning", price: 1437, mrp: 1587, rating: 4.81, count: "7.2M", duration: "3 hrs", image: art("🛁", "cleaning") },
  { _id: "c3", name: "Fridge cleaning", category: "Cleaning", price: 399, rating: 4.84, count: "180K", duration: "45 min", image: art("🧊", "cleaning"), instant: true },
  { _id: "c4", name: "Kitchen window cleaning", category: "Cleaning", price: 399, rating: 4.78, count: "75K", duration: "45 min", image: art("🪟", "cleaning") },
  { _id: "c5", name: "Full home cleaning", category: "Cleaning", price: 3199, mrp: 3799, rating: 4.79, count: "1.2M", duration: "5 hrs", image: art("🏠", "cleaning") },
  { _id: "c6", name: "Sofa cleaning (3 seater)", category: "Cleaning", price: 849, mrp: 999, rating: 4.72, count: "640K", duration: "2 hrs", image: art("🛋️", "cleaning") },
  { _id: "c7", name: "Cockroach & ant control", category: "Cleaning", price: 1249, mrp: 1499, rating: 4.79, count: "320K", duration: "2 hrs", image: art("🪳", "pest") },
  { _id: "c8", name: "Kitchen deep cleaning", category: "Cleaning", price: 1599, mrp: 1899, rating: 4.77, count: "410K", duration: "3 hrs", image: art("🍳", "cleaning") },

  // Salon & spa
  { _id: "s1", name: "Waxing (full arms + underarms)", category: "Beauty", price: 649, rating: 4.86, count: "2.1M", duration: "1 hr", image: art("🍯", "salonW") },
  { _id: "s2", name: "Facial & cleanup", category: "Beauty", price: 1099, mrp: 1399, rating: 4.83, count: "980K", duration: "1.5 hrs", image: art("🧖‍♀️", "salonW") },
  { _id: "s3", name: "Haircut & styling", category: "Beauty", price: 899, rating: 4.79, count: "760K", duration: "1 hr", image: art("💇‍♀️", "salonW") },
  { _id: "s4", name: "Manicure & pedicure", category: "Beauty", price: 1049, mrp: 1249, rating: 4.81, count: "540K", duration: "1.5 hrs", image: art("💅", "salonW") },
  { _id: "s5", name: "Threading & face care", category: "Beauty", price: 249, rating: 4.88, count: "3.4M", duration: "30 min", image: art("🧵", "salonW"), instant: true },
  { _id: "s6", name: "Haircut for men", category: "Beauty", price: 429, rating: 4.8, count: "1.4M", duration: "45 min", image: art("💇‍♂️", "salonM") },
  { _id: "s7", name: "Stress relief massage (60 min)", category: "Beauty", price: 1299, mrp: 1499, rating: 4.77, count: "430K", duration: "1 hr", image: art("💆‍♂️", "spaM") },

  // AC & appliance
  { _id: "a1", name: "AC service (power jet)", category: "Appliance", price: 599, mrp: 699, rating: 4.63, count: "1.6M", duration: "1 hr", image: art("❄️", "appliance"), instant: true },
  { _id: "a2", name: "Washing machine repair", category: "Appliance", price: 449, rating: 4.55, count: "410K", duration: "1 hr", image: art("🧺", "appliance") },
  { _id: "a3", name: "Chimney deep clean", category: "Appliance", price: 649, mrp: 799, rating: 4.68, count: "220K", duration: "1.5 hrs", image: art("💨", "appliance") },
  { _id: "a4", name: "Refrigerator repair", category: "Appliance", price: 499, rating: 4.6, count: "190K", duration: "1 hr", image: art("🧊", "appliance") },
  { _id: "a5", name: "Microwave repair", category: "Appliance", price: 399, rating: 4.58, count: "90K", duration: "45 min", image: art("🍲", "appliance") },
  { _id: "a6", name: "Water purifier service", category: "Appliance", price: 499, mrp: 599, rating: 4.71, count: "260K", duration: "1 hr", image: art("🚰", "appliance") },

  // Home repair & installation
  { _id: "r1", name: "Plumber consultation", category: "Plumbing", price: 49, rating: 4.74, count: "214K", duration: "30 min", image: art("🪠", "plumbing"), instant: true },
  { _id: "r2", name: "Book a carpenter", category: "Plumbing", price: 49, rating: 4.66, count: "191K", duration: "30 min", image: art("🪚", "carpentry"), instant: true },
  { _id: "r3", name: "Flush tank repair", category: "Plumbing", price: 199, rating: 4.75, count: "161K", duration: "45 min", image: art("🚽", "plumbing") },
  { _id: "r4", name: "Electrician consultation", category: "Plumbing", price: 49, rating: 4.75, count: "176K", duration: "30 min", image: art("💡", "electric"), instant: true },
  { _id: "r5", name: "Ceiling fan replace / install", category: "Plumbing", price: 99, rating: 4.85, count: "95K", duration: "45 min", image: art("🌀", "electric"), off: "10% OFF" },
  { _id: "r6", name: "Wall painting consultation", category: "Plumbing", price: 199, rating: 4.7, count: "60K", duration: "45 min", image: art("🖌️", "painting") },
];

export const CATEGORIES = [
  { name: "All", icon: "✨", color: "linear-gradient(135deg,#7c3aed,#db2777)" },
  { name: "Cleaning", icon: "🧹", color: "linear-gradient(135deg,#34d399,#059669)" },
  { name: "Appliance", icon: "🔌", color: "linear-gradient(135deg,#60a5fa,#2563eb)" },
  { name: "Plumbing", icon: "🔧", color: "linear-gradient(135deg,#fbbf24,#d97706)" },
  { name: "Beauty", icon: "💅", color: "linear-gradient(135deg,#f472b6,#db2777)" },
];

export const CATEGORY_TILES = [
  { label: "Instant Help", icon: "🙋‍♀️", group: "insta-group" },
  { label: "Women's Salon & Spa", icon: "🧖‍♀️", group: "salon-women-group" },
  { label: "Men's Salon & Massage", icon: "💈", group: "salon-men-group" },
  { label: "Cleaning & Pest Control", icon: "🧹", group: "cleaning-pest" },
  { label: "Wall Panels", icon: "🪵", group: "wall-panels-group" },
  { label: "Painting & Waterproofing", icon: "🖌️", group: "painting-group" },
  { label: "AC & Appliance Repair", icon: "❄️", group: "appliance-group" },
  { label: "Electrician, Plumber & Carpenter", icon: "🧰", group: "repair-group" },
];

export const SMART_TILES = [
  { label: "Smart Water Purifier", icon: "🚰", badge: "Sale" },
  { label: "Smart Door Locks", icon: "🔐", badge: "Sale" },
];

export const TRENDY = [
  "AC service", "Bathroom cleaning", "Sofa cleaning", "Haircut for men", "Waxing",
  "Kitchen deep clean", "Electrician", "Pest control", "Facial", "Massage", "Carpenter", "Fridge repair",
];

export const HERO_SHOTS = [
  { key: "salon", tall: true, scene: scene("💆‍♀️", ["💅", "💄", "🧴"], FAMILIES.spaW.tone) },
  { key: "clean", tall: false, scene: scene("🧽", ["🫧", "🧴", "🪣"], FAMILIES.cleaning.tone) },
  { key: "repair", tall: false, scene: scene("🧑‍🔧", ["❄️", "🔧", "⚙️"], FAMILIES.appliance.tone) },
  { key: "paint", tall: true, scene: scene("🧑‍🎨", ["🖌️", "🎨", "🪣"], FAMILIES.painting.tone) },
];

export const HOME_SECTIONS = [
  {
    slug: "most-booked",
    title: "Most booked services",
    subtitle: "What everyone around you is booking this week",
    ids: ["c1", "c2", "r1", "r2", "r4", "a1", "s1", "s5"],
    banner: {
      eyebrow: "Trending now",
      headline: "The services\neveryone's booking.",
      sub: "Top-rated pros, up to 20% off this week",
      cta: "See what's hot",
      theme: "linear-gradient(120deg,#160b33 0%,#4c1d95 48%,#7c3aed 100%)",
      accent: "#c4b5fd",
      image: banner("🧑‍🔧", ["🧹", "💇‍♀️", "❄️"]),
    },
  },
  {
    slug: "salon-at-home",
    title: "Salon for women",
    subtitle: "Salon-grade care in your living room",
    ids: ["s1", "s2", "s3", "s4", "s5", "s7"],
    banner: {
      eyebrow: "Beauty at home",
      headline: "Salon-grade care,\nat your doorstep.",
      sub: "Facials, waxing and styling by trained experts",
      cta: "Book a session",
      theme: "linear-gradient(120deg,#2b0819 0%,#9d174d 52%,#f472b6 100%)",
      accent: "#fbcfe8",
      image: banner("💆‍♀️", ["💅", "💄", "🧖‍♀️"]),
    },
  },
  {
    slug: "cleaning-essentials",
    title: "Cleaning essentials",
    subtitle: "Monthly cleaning essential services",
    ids: ["c1", "c2", "c3", "c4", "c6", "c7", "c8"],
    banner: {
      eyebrow: "Deep clean",
      headline: "A cleaner home,\nwithout any hassle.",
      sub: "Full home cleaning starting from ₹3,199",
      cta: "Book now",
      theme: "linear-gradient(120deg,#0b2119 0%,#065f46 50%,#10b981 100%)",
      accent: "#a7f3d0",
      image: banner("🧹", ["🫧", "🧽", "🛋️"]),
    },
  },
  {
    slug: "appliance-care",
    title: "Appliance repair & service",
    subtitle: "Same-day fixes for everything at home",
    ids: ["a1", "a2", "a3", "a4", "a5", "a6"],
    banner: {
      eyebrow: "Yearly cover",
      headline: "3-year filter life.\n3-year warranty.",
      sub: "Service plans that pay for themselves",
      cta: "Explore plans",
      theme: "linear-gradient(120deg,#07162e 0%,#1e3a8a 52%,#0ea5e9 100%)",
      accent: "#bae6fd",
      image: banner("🚰", ["❄️", "🧺", "🔧"]),
    },
  },
  {
    slug: "home-repair",
    title: "Home repair & installation",
    subtitle: "Plumbers, electricians and carpenters on call",
    ids: ["r1", "r2", "r3", "r4", "r5", "r6"],
    banner: {
      eyebrow: "On demand",
      headline: "Fix it today,\nnot next week.",
      sub: "A verified pro at your door in 60 minutes",
      cta: "Get a pro",
      theme: "linear-gradient(120deg,#2b1503 0%,#b45309 52%,#fbbf24 100%)",
      accent: "#fde68a",
      image: banner("🧰", ["🔨", "🪠", "💡"]),
    },
  },
];

export const findServices = (ids) =>
  ids.map((id) => SERVICES.find((s) => s._id === id)).filter(Boolean);

export const COLLECTIONS = HOME_SECTIONS.map((s, i) => ({
  slug: s.slug,
  ...s.banner,
  sections: [
    { title: s.title, subtitle: s.subtitle, ids: s.ids },
    {
      title: "You may also like",
      subtitle: "Popular with people who booked this",
      ids: HOME_SECTIONS[(i + 1) % HOME_SECTIONS.length].ids.slice(0, 5),
    },
  ],
}));

export const findCollection = (slug) => COLLECTIONS.find((c) => c.slug === slug);
