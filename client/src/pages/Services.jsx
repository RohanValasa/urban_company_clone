import { Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Hero from "../components/Hero";
import TrendySearches from "../components/TrendySearches";
import PromoBanner from "../components/PromoBanner";
import ServiceRail from "../components/ServiceRail";
import ServiceCard from "../components/ServiceCard";
import CategoryRail from "../components/CategoryRail";
import SplitHeading from "../components/motion/SplitHeading";
import Reveal from "../components/Reveal";
import { SERVICES, CATEGORIES, HOME_SECTIONS, findServices } from "../data/catalog";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const PERKS = [
  { icon: "✅", label: "Verified professionals" },
  { icon: "⏱️", label: "On-time service" },
  { icon: "💳", label: "Secure payments" },
  { icon: "🔁", label: "Free rescheduling" },
];

export default function Services() {
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get("category") || "All";
  const query = params.get("q") || "";
  const browsing = Boolean(query) || activeCategory !== "All";

  const patchParams = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v && v !== "All" ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const visible = SERVICES.filter((s) => {
    const matchesCategory = activeCategory === "All" || s.category === activeCategory;
    const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <main className="page">
      <div className="blob blob-a" />
      <div className="blob blob-b" />

      {browsing ? (
        <section className="browse">
          <SplitHeading
            as="h1"
            text={query ? `Results for “${query}”` : `${activeCategory} services`}
            className="browse-title"
          />

          <motion.input
            className="search"
            placeholder="Search for a service..."
            value={query}
            onChange={(e) => patchParams({ q: e.target.value })}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileFocus={{ scale: 1.01 }}
          />

          <CategoryRail
            categories={CATEGORIES}
            active={activeCategory}
            onSelect={(category) => patchParams({ category })}
          />

          <AnimatePresence mode="wait">
            {visible.length === 0 ? (
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
        </section>
      ) : (
        <>
          <Hero />
          <TrendySearches />

          {HOME_SECTIONS.map((section, i) => (
            <Fragment key={section.slug}>
              <PromoBanner banner={section.banner} slug={section.slug} flip={i % 2 === 1} />
              <ServiceRail
                title={section.title}
                subtitle={section.subtitle}
                services={findServices(section.ids)}
                seeAllTo={`/collection/${section.slug}`}
              />
            </Fragment>
          ))}
        </>
      )}

      <Reveal direction="up" className="perk-strip">
        {PERKS.map((p) => (
          <div className="perk" key={p.label}>
            <span className="perk-icon">{p.icon}</span>
            {p.label}
          </div>
        ))}
      </Reveal>
    </main>
  );
}
