import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { findSub } from "../data/services";

const backdrop = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

const sheet = {
  hidden: { opacity: 0, y: 60, scale: 0.94, rotateX: 8 },
  show: {
    opacity: 1, y: 0, scale: 1, rotateX: 0,
    transition: { type: "spring", stiffness: 190, damping: 24, mass: 0.8, staggerChildren: 0.05, delayChildren: 0.12 },
  },
  out: { opacity: 0, y: 30, scale: 0.96, transition: { duration: 0.22, ease: "easeIn" } },
};

const item = {
  hidden: { opacity: 0, y: 26, rotateX: -35, scale: 0.9 },
  show: { opacity: 1, y: 0, rotateX: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function CategorySheet({ group, onClose, onPick }) {
  useEffect(() => {
    if (!group) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [group, onClose]);

  return (
    <AnimatePresence>
      {group && (
        <motion.div
          className="sheet-backdrop"
          variants={backdrop}
          initial="hidden"
          animate="show"
          exit="hidden"
          onClick={onClose}
        >
          <motion.button
            className="sheet-close"
            onClick={onClose}
            aria-label="Close"
            initial={{ opacity: 0, scale: 0.6, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 18 }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>

          <motion.div
            className="sheet"
            variants={sheet}
            initial="hidden"
            animate="show"
            exit="out"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={group.title}
          >
            <motion.h2 className="sheet-title" variants={item}>{group.title}</motion.h2>

            {group.sections.map((section) => (
              <motion.div className="sheet-section" key={section.title} variants={item}>
                <motion.h3 variants={item}>{section.title}</motion.h3>
                <div className="sheet-grid">
                  {section.items.map((slug) => {
                    const s = findSub(slug);
                    if (!s) return null;
                    return (
                      <motion.button
                        key={`${section.title}-${slug}`}
                        className="sheet-item"
                        variants={item}
                        onClick={() => onPick(slug)}
                        whileHover={{ y: -6, rotateX: 6, rotateY: -6, scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <span className="sheet-art" style={{ background: s.tone }}>
                          <motion.span
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.15, type: "spring", stiffness: 240, damping: 16 }}
                          >
                            {s.icon}
                          </motion.span>
                        </span>
                        <span className="sheet-label">{s.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
