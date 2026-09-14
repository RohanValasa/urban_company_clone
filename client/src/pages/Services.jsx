import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ServiceCard from "../components/ServiceCard";
import CategoryRail from "../components/CategoryRail";
import Reveal from "../components/Reveal";

const MOCK = [
  { _id: "1", name: "Home Deep Cleaning", category: "Cleaning", price: 1499, rating: 4.8, duration: "4 hrs", image: "https://picsum.photos/seed/uc-cleaning-1/500/340" },
  { _id: "2", name: "Bathroom Cleaning", category: "Cleaning", price: 699, rating: 4.6, duration: "1.5 hrs", image: "https://picsum.photos/seed/uc-cleaning-2/500/340" },
  { _id: "3", name: "AC Service & Repair", category: "Appliance", price: 599, rating: 4.6, duration: "1 hr", image: "https://picsum.photos/seed/uc-ac-1/500/340" },
  { _id: "4", name: "Washing Machine Repair", category: "Appliance", price: 449, rating: 4.5, duration: "1 hr", image: "https://picsum.photos/seed/uc-appliance-2/500/340" },
  { _id: "5", name: "Tap & Pipe Repair", category: "Plumbing", price: 349, rating: 4.7, duration: "45 min", image: "https://picsum.photos/seed/uc-plumbing-1/500/340" },
  { _id: "6", name: "Water Tank Cleaning", category: "Plumbing", price: 799, rating: 4.6, duration: "2 hrs", image: "https://picsum.photos/seed/uc-plumbing-2/500/340" },
  { _id: "7", name: "Salon for Women", category: "Beauty", price: 899, rating: 4.9, duration: "2 hrs", image: "https://picsum.photos/seed/uc-beauty-1/500/340" },
  { _id: "8", name: "Men's Grooming", category: "Beauty", price: 599, rating: 4.7, duration: "1 hr", image: "https://picsum.photos/seed/uc-beauty-2/500/340" },
];

const CATEGORIES = [
  { name: "All", icon: "✨", color: "linear-gradient(135deg,#7c3aed,#db2777)" },
  { name: "Cleaning", icon: "🧹", color: "linear-gradient(135deg,#34d399,#059669)" },
  { name: "Appliance", icon: "🔌", color: "linear-gradient(135deg,#60a5fa,#2563eb)" },
  { name: "Plumbing", icon: "🚿", color: "linear-gradient(135deg,#fbbf24,#d97706)" },
  { name: "Beauty", icon: "💅", color: "linear-gradient(135deg,#f472b6,#db2777)" },
];

const gridVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setServices(MOCK);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const visible = services.filter((s) => {
    const matchesCategory = activeCategory === "All" || s.category === activeCategory;
    const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <main className="page">
      <div className="blob blob-a" />
      <div className="blob blob-b" />

      <motion.div
        className="location-pill"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        📍 Delivering to <strong>Hyderabad</strong>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        What do you need done?
      </motion.h1>

      <motion.input
        className="search"
        placeholder="Search for a service..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        whileFocus={{ scale: 1.01 }}
      />

      <CategoryRail categories={CATEGORIES} active={activeCategory} onSelect={setActiveCategory} />

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.p
            key="loading"
            className="muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Loading services...
          </motion.p>
        ) : visible.length === 0 ? (
          <motion.p
            key="empty"
            className="muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            No services match that search.
          </motion.p>
        ) : (
          <motion.div
            key={`${activeCategory}-${query}`}
            className="grid"
            variants={gridVariants}
            initial="hidden"
            animate="show"
          >
            {visible.map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Reveal direction="up" className="perk-strip">
        {[
          { icon: "✅", label: "Verified professionals" },
          { icon: "⏱️", label: "On-time service" },
          { icon: "💳", label: "Secure payments" },
          { icon: "🔁", label: "Free rescheduling" },
        ].map((p) => (
          <div className="perk" key={p.label}>
            <span className="perk-icon">{p.icon}</span>
            {p.label}
          </div>
        ))}
      </Reveal>
    </main>
  );
}
