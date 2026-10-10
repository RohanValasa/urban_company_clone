import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";
import SplitHeading from "./motion/SplitHeading";
import { TRENDY } from "../data/catalog";

const SOFT = { stiffness: 90, damping: 26, mass: 0.6 };

const rowA = TRENDY.filter((_, i) => i % 2 === 0);
const rowB = TRENDY.filter((_, i) => i % 2 === 1);

function Chip({ label, i }) {
  return (
    <motion.span
      className="chip-wrap"
      initial={{ opacity: 0, y: 24, rotateX: -60 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.55, delay: (i % 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={`/?q=${encodeURIComponent(label)}`} className="chip">
        <span className="chip-spark">↗</span>
        {label}
      </Link>
    </motion.span>
  );
}

export default function TrendySearches() {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const driftA = useSpring(useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["6%", "-14%"]), SOFT);
  const driftB = useSpring(useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["-10%", "8%"]), SOFT);
  const skew = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], reduced ? [0, 0, 0] : [4, 0, -4]), SOFT);

  return (
    <section className="trendy" ref={ref}>
      <div className="trendy-head">
        <span className="eyebrow">Live in your city</span>
        <SplitHeading as="h2" text="Trendy searches" className="section-title" />
      </div>

      <motion.div className="trendy-rows" style={{ skewY: skew }}>
        <motion.div className="trendy-row" style={{ x: driftA }}>
          {rowA.map((t, i) => <Chip key={t} label={t} i={i} />)}
        </motion.div>
        <motion.div className="trendy-row" style={{ x: driftB }}>
          {rowB.map((t, i) => <Chip key={t} label={t} i={i} />)}
        </motion.div>
      </motion.div>
    </section>
  );
}
