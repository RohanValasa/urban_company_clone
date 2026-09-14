import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ServiceCard from "../components/ServiceCard";
import Reveal from "../components/Reveal";

const MOCK = [
  { _id: "1", name: "Home Deep Cleaning", category: "Cleaning", price: 1499, rating: 4.8, duration: "4 hrs", image: "https://placehold.co/400x250?text=Cleaning" },
  { _id: "2", name: "AC Service & Repair", category: "Appliance", price: 599, rating: 4.6, duration: "1 hr", image: "https://placehold.co/400x250?text=AC+Service" },
  { _id: "3", name: "Tap & Pipe Repair", category: "Plumbing", price: 349, rating: 4.7, duration: "45 min", image: "https://placehold.co/400x250?text=Plumbing" },
  { _id: "4", name: "Salon for Women", category: "Beauty", price: 899, rating: 4.9, duration: "2 hrs", image: "https://placehold.co/400x250?text=Salon" },
];

const CATEGORIES = ["All", "Cleaning", "Appliance", "Plumbing", "Beauty"];

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

      <motion.div
        className="chips"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } },
        }}
      >
        {CATEGORIES.map((c) => (
          <motion.button
            key={c}
            className={`chip ${activeCategory === c ? "chip-active" : ""}`}
            onClick={() => setActiveCategory(c)}
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.94 }}
          >
            {c}
          </motion.button>
        ))}
      </motion.div>

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
              <ServiceCard key={s._id} service={s} onBook={() => alert(`Booking ${s.name}`)} />
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
