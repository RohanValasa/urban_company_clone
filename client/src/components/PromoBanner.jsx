import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";

const SOFT = { stiffness: 100, damping: 26, mass: 0.6 };

const headline = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};
const line = {
  hidden: { opacity: 0, y: "100%", rotateX: -70 },
  show: {
    opacity: 1, y: "0%", rotateX: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function PromoBanner({ banner, slug, flip = false }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const imgY = useSpring(useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["-14%", "14%"]), SOFT);
  const imgScale = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], reduced ? [1, 1, 1] : [1.25, 1.08, 1.25]), SOFT);
  const rotate = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], reduced ? [0, 0, 0] : [flip ? 7 : -7, 0, flip ? -7 : 7]), SOFT);
  const depth = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], reduced ? [0, 0, 0] : [-120, 0, -120]), SOFT);
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0.15, 0.8, 0.15]);

  const lines = banner.headline.split("\n");

  return (
    <section className={`promo-stage ${flip ? "promo-flip" : ""}`} ref={ref}>
      <motion.div className="promo-perspective" style={{ rotateY: rotate, z: depth }}>
        <Link to={`/collection/${slug}`} className="promo" style={{ background: banner.theme }}>
          <motion.div className="promo-media" style={{ y: imgY, scale: imgScale }}>
            <img src={banner.image} alt="" loading="lazy" />
          </motion.div>
          <motion.span className="promo-glow" style={{ opacity: glow, background: banner.accent }} aria-hidden="true" />

          <div className="promo-body">
            <motion.span
              className="promo-eyebrow"
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5 }}
              style={{ color: banner.accent }}
            >
              {banner.eyebrow}
            </motion.span>

            <motion.h2
              className="promo-headline"
              variants={headline}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
            >
              {lines.map((l) => (
                <span className="split-mask" key={l}>
                  <motion.span className="split-word" variants={line}>{l}</motion.span>
                </span>
              ))}
            </motion.h2>

            <motion.p
              className="promo-sub"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              {banner.sub}
            </motion.p>

            <motion.span
              className="promo-cta"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
            >
              {banner.cta} <em>→</em>
            </motion.span>
          </div>
        </Link>
      </motion.div>
    </section>
  );
}
