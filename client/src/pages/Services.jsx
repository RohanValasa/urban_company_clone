import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ServiceCard from "../components/ServiceCard";
import CategoryRail from "../components/CategoryRail";
import BannerRail from "../components/BannerRail";
import Reveal from "../components/Reveal";
import { SERVICES, CATEGORIES, COLLECTIONS } from "../data/catalog";
import { useUI } from "../context/UIContext";

const gridVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const { city } = useUI();
  const activeCategory = params.get("category") || "All";
  const query = params.get("q") || "";

  const patchParams = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v && v !== "All" ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const setActiveCategory = (category) => patchParams({ category });
  const setQuery = (q) => patchParams({ q });

  useEffect(() => {
    const timer = setTimeout(() => {
      setServices(SERVICES);
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
        📍 Delivering to <strong>{city}</strong>
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

      <BannerRail banners={COLLECTIONS} />

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
