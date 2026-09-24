import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";
import ServiceCard from "./ServiceCard";
import SplitHeading from "./motion/SplitHeading";

const SOFT = { stiffness: 110, damping: 26, mass: 0.5 };

const railVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export default function ServiceRail({ title, subtitle, services, seeAllTo }) {
  const trackRef = useRef(null);
  const sectionRef = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });

  const lift = useSpring(useTransform(scrollYProgress, [0, 0.45, 1], reduced ? [0, 0, 0] : [70, 0, -50]), SOFT);
  const tiltX = useSpring(useTransform(scrollYProgress, [0, 0.45, 1], reduced ? [0, 0, 0] : [9, 0, -6]), SOFT);
  const fade = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0.35, 1, 1, 0.45]);

  const scrollBy = (dir) => {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="rail-section" ref={sectionRef}>
      <div className="rail-head">
        <div>
          <SplitHeading as="h2" text={title} className="section-title" />
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        <div className="rail-nav">
          <motion.button className="rail-arrow" onClick={() => scrollBy(-1)} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }} aria-label="Scroll left">←</motion.button>
          <motion.button className="rail-arrow" onClick={() => scrollBy(1)} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }} aria-label="Scroll right">→</motion.button>
          {seeAllTo && <Link to={seeAllTo} className="see-all">See all</Link>}
        </div>
      </div>

      <div className="rail-wrap">
        <motion.div
          className="rail-track"
          ref={trackRef}
          style={{ y: lift, rotateX: tiltX, opacity: fade }}
          variants={railVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {services.map((s) => (
            <ServiceCard key={s._id} service={s} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
