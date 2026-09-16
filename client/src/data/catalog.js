const img = (seed) => `https://picsum.photos/seed/${seed}/600/450`;

export const SERVICES = [
  { _id: "1", name: "Home deep cleaning", category: "Cleaning", price: 1499, mrp: 1899, rating: 4.81, duration: "4 hrs", image: img("uc-cleaning-1") },
  { _id: "2", name: "Intense bathroom cleaning (2 bathrooms)", category: "Cleaning", price: 918, mrp: 998, rating: 4.81, duration: "1.5 hrs", image: img("uc-cleaning-2") },
  { _id: "3", name: "Intense bathroom cleaning (3 bathrooms)", category: "Cleaning", price: 1197, mrp: 1497, rating: 4.81, duration: "2 hrs", image: img("uc-cleaning-3") },
  { _id: "4", name: "Fridge cleaning", category: "Cleaning", price: 399, rating: 4.84, duration: "45 min", image: img("uc-cleaning-4"), instant: true },
  { _id: "5", name: "Sofa & carpet shampooing", category: "Cleaning", price: 849, mrp: 999, rating: 4.72, duration: "2 hrs", image: img("uc-cleaning-5") },
  { _id: "6", name: "AC service & repair", category: "Appliance", price: 599, mrp: 699, rating: 4.63, duration: "1 hr", image: img("uc-ac-1"), instant: true },
  { _id: "7", name: "Washing machine repair", category: "Appliance", price: 449, rating: 4.55, duration: "1 hr", image: img("uc-appliance-2") },
  { _id: "8", name: "Chimney deep clean", category: "Appliance", price: 649, mrp: 799, rating: 4.68, duration: "1.5 hrs", image: img("uc-appliance-3") },
  { _id: "9", name: "Tap & pipe repair", category: "Plumbing", price: 349, rating: 4.74, duration: "45 min", image: img("uc-plumbing-1"), instant: true },
  { _id: "10", name: "Water tank cleaning", category: "Plumbing", price: 799, mrp: 949, rating: 4.61, duration: "2 hrs", image: img("uc-plumbing-2") },
  { _id: "11", name: "Cockroach control (includes utensil removal)", category: "Plumbing", price: 1249, mrp: 1499, rating: 4.79, duration: "2 hrs", image: img("uc-pest-1") },
  { _id: "12", name: "Apartment cockroach control", category: "Plumbing", price: 1849, mrp: 2099, rating: 4.79, duration: "3 hrs", image: img("uc-pest-2") },
  { _id: "13", name: "Salon for women", category: "Beauty", price: 899, mrp: 1099, rating: 4.9, duration: "2 hrs", image: img("uc-beauty-1") },
  { _id: "14", name: "Men's grooming at home", category: "Beauty", price: 599, rating: 4.76, duration: "1 hr", image: img("uc-beauty-2"), instant: true },
  { _id: "15", name: "Hair spa & styling", category: "Beauty", price: 1099, mrp: 1399, rating: 4.83, duration: "1.5 hrs", image: img("uc-beauty-3") },
];

export const CATEGORIES = [
  { name: "All", icon: "✨", color: "linear-gradient(135deg,#7c3aed,#db2777)" },
  { name: "Cleaning", icon: "🧹", color: "linear-gradient(135deg,#34d399,#059669)" },
  { name: "Appliance", icon: "🔌", color: "linear-gradient(135deg,#60a5fa,#2563eb)" },
  { name: "Plumbing", icon: "🚿", color: "linear-gradient(135deg,#fbbf24,#d97706)" },
  { name: "Beauty", icon: "💅", color: "linear-gradient(135deg,#f472b6,#db2777)" },
];

export const COLLECTIONS = [
  {
    slug: "cleaning-essentials",
    eyebrow: "Monthly plan",
    headline: "Cleaning essentials,\nsorted every month.",
    cta: "Explore plans",
    theme: "linear-gradient(115deg,#12082b 0%,#3b1d8f 55%,#1d4ed8 100%)",
    hero: img("uc-banner-cleaning"),
    sections: [
      { title: "Cleaning Essentials", subtitle: "Monthly cleaning essential services", ids: ["2", "3", "4", "11", "12"] },
      { title: "Deep cleaning", subtitle: "For when the whole house needs it", ids: ["1", "5", "10"] },
    ],
  },
  {
    slug: "appliance-care",
    eyebrow: "Yearly cover",
    headline: "3-year filter life.\n3-year warranty.",
    cta: "Buy now",
    theme: "linear-gradient(115deg,#0b1120 0%,#1e3a8a 60%,#0ea5e9 100%)",
    hero: img("uc-banner-appliance"),
    sections: [
      { title: "Appliance Care", subtitle: "Service, repair and deep cleans", ids: ["6", "7", "8"] },
      { title: "Instant service", subtitle: "A professional at your door today", ids: ["4", "9", "14"] },
    ],
  },
  {
    slug: "salon-at-home",
    eyebrow: "New in your city",
    headline: "Salon-grade care,\nat your doorstep.",
    cta: "Book now",
    theme: "linear-gradient(115deg,#2b0819 0%,#9d174d 55%,#db2777 100%)",
    hero: img("uc-banner-salon"),
    sections: [
      { title: "Salon at Home", subtitle: "Curated beauty services for you", ids: ["13", "14", "15"] },
      { title: "Popular add-ons", subtitle: "Pairs well with your booking", ids: ["5", "4"] },
    ],
  },
];

export const findServices = (ids) =>
  ids.map((id) => SERVICES.find((s) => s._id === id)).filter(Boolean);

export const findCollection = (slug) => COLLECTIONS.find((c) => c.slug === slug);
