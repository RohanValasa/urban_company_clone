import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";
import SplitHeading from "./motion/SplitHeading";
import CategorySheet from "./CategorySheet";
import { CATEGORY_TILES, SMART_TILES, HERO_SHOTS } from "../data/catalog";
import { findGroup } from "../data/services";
import { useUI } from "../context/UIContext";

const SOFT = { stiffness: 120, damping: 24, mass: 0.5 };

const tiles = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.25 } },
};
const tile = {
  hidden: { opacity: 0, y: 26, rotateX: -35, scale: 0.9 },
  show: {
    opacity: 1, y: 0, rotateX: 0, scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Hero() {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const { city } = useUI();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const copyY = useSpring(useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 90]), SOFT);
  const copyFade = useTransform(scrollYProgress, [0, 0.8], [1, reduced ? 1 : 0.25]);
  const slowY = useSpring(useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -110]), SOFT);
  const fastY = useSpring(useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -210]), SOFT);

  return (
    <section className="hero" ref={ref}>
      <CategorySheet
        group={group}
        onClose={() => setGroup(null)}
        onPick={(slug) => {
          setGroup(null);
          navigate(`/s/${slug}`);
        }}
      />

      <div className="hero-aura hero-aura-a" />
      <div className="hero-aura hero-aura-b" />

      <motion.div className="hero-copy" style={{ y: copyY, opacity: copyFade }}>
        <motion.div
          className="location-pill"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          📍 Delivering to <strong>{city}</strong>
        </motion.div>

        <SplitHeading text="Home services at your doorstep" className="hero-title" />

        <motion.div
          className="tile-card"
          variants={tiles}
          initial="hidden"
          animate="show"
        >
          <div className="tile-grid">
            {CATEGORY_TILES.map((t) => (
              <motion.div variants={tile} key={t.label}>
                <button type="button" className="tile" onClick={() => setGroup(findGroup(t.group))}>
                  <span className="tile-art" style={{ background: t.tone }}>
                    <span>{t.icon}</span>
                  </span>
                  <span className="tile-label">{t.label}</span>
                </button>
              </motion.div>
            ))}
          </div>

          <motion.h3 className="tile-heading" variants={tile}>Native Smart Products</motion.h3>
          <div className="tile-grid tile-grid-sm">
            {SMART_TILES.map((t) => (
              <motion.div variants={tile} key={t.label}>
                <Link to="/?category=Appliance" className="tile">
                  <span className="tile-art" style={{ background: t.tone }}>
                    <span>{t.icon}</span>
                    <em className="tile-badge">{t.badge}</em>
                  </span>
                  <span className="tile-label">{t.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <div className="hero-mosaic">
        {HERO_SHOTS.map((shot, i) => (
          <motion.figure
            key={shot.seed}
            className={`shot ${shot.tall ? "shot-tall" : ""}`}
            style={{ y: i % 2 === 0 ? slowY : fastY }}
            initial={{ opacity: 0, scale: 1.08, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={`https://picsum.photos/seed/${shot.seed}/700/${shot.tall ? 900 : 640}`} alt="" loading="eager" />
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
