import { useRef } from "react";
import { motion } from "framer-motion";
import ServiceCard from "./ServiceCard";

const railVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export default function ServiceRail({ title, subtitle, services }) {
  const trackRef = useRef(null);

  const scrollNext = () => {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="rail-section">
      <div className="rail-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="see-all">See all</button>
      </div>

      <div className="rail-wrap">
        <motion.div
          className="rail-track"
          ref={trackRef}
          variants={railVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {services.map((s) => (
            <ServiceCard key={s._id} service={s} />
          ))}
        </motion.div>

        <motion.button
          className="rail-arrow"
          onClick={scrollNext}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Scroll right"
        >
          →
        </motion.button>
      </div>
    </section>
  );
}
