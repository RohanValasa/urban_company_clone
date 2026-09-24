import { motion } from "framer-motion";

const railVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function CategoryRail({ categories, active, onSelect }) {
  return (
    <motion.div className="cat-rail" variants={railVariants} initial="hidden" animate="show">
      {categories.map((c) => (
        <motion.button
          key={c.name}
          className={`cat-item ${active === c.name ? "cat-item-active" : ""}`}
          variants={itemVariants}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => onSelect(c.name)}
        >
          <span className="cat-icon" style={{ background: c.color }}>
            {c.icon}
          </span>
          <span className="cat-label">{c.name}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}
