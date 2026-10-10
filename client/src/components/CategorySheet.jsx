import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { findSub } from "../data/services";
import { Emoji } from "./Art";

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

// dir 1 (the tier picker) enters and leaves on the right; the grid enters from
// the left after "back" (-1), only staggers its children on first open (0),
// and always leaves to the left.
const view = {
  hidden: (dir) => ({ opacity: dir ? 0 : 1, x: dir * 40 }),
  show: {
    opacity: 1, x: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.05, delayChildren: 0.05 },
  },
  out: (dir) => ({ opacity: 0, x: dir === 1 ? 40 : -40, transition: { duration: 0.18, ease: "easeIn" } }),
};

const lowestPrice = (slug) => Math.min(...findSub(slug).packages.map((p) => p.price));

function Preference({ sub, onBack, onPick }) {
  return (
    <motion.div key="pref" custom={1} variants={view} initial="hidden" animate="show" exit="out">
      <button type="button" className="pref-back" onClick={onBack} aria-label="Back">←</button>
      <h2 className="sheet-title pref-title">Select your preference</h2>
      <div className="pref-list">
        {sub.choices.map((c, i) => (
          <motion.button
            type="button"
            key={c.slug}
            className="pref-option"
            onClick={() => onPick(c.slug)}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.07, duration: 0.35 }}
            whileHover={{ x: 4 }}
          >
            <span className="pref-art">
              {c.badge && <em className="pref-badge">✪ {c.badge}</em>}
              <Emoji char={c.avatar} label={c.name} />
            </span>
            <span className="pref-copy">
              <strong>{c.name}</strong>
              {c.tags && (
                <span className="pref-tags">
                  {c.tags.map((t) => <span key={t}>{t}</span>)}
                </span>
              )}
              <span className="pref-blurb">
                Starts at ₹{lowestPrice(c.slug).toLocaleString("en-IN")} {c.blurb}
              </span>
            </span>
            <span className="pref-chevron" aria-hidden="true">›</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default function CategorySheet({ group, onClose, onPick }) {
  // A sub-category with `choices` opens a tier picker before its page.
  const [pref, setPref] = useState(null);
  const [backed, setBacked] = useState(false);
  const [lastGroup, setLastGroup] = useState(group);
  if (group !== lastGroup) {
    setLastGroup(group);
    setPref(null);
    setBacked(false);
  }

  const pick = (slug) => {
    const s = findSub(slug);
    if (s?.choices) setPref(s);
    else onPick(slug);
  };

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

  return createPortal(
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
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.14 } }}
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
            aria-label={pref ? "Select your preference" : group.title}
          >
            <AnimatePresence mode="wait">
              {pref ? (
                <Preference sub={pref} onBack={() => { setPref(null); setBacked(true); }} onPick={onPick} />
              ) : (
                <motion.div key="grid" custom={backed ? -1 : 0} variants={view} initial="hidden" animate="show" exit="out">
                  <motion.h2 className="sheet-title" variants={item}>{group.title}</motion.h2>

                  {group.sections.map((section, si) => (
                    <motion.div className="sheet-section" key={section.title || si} variants={item}>
                      {section.title && <motion.h3 variants={item}>{section.title}</motion.h3>}
                      <div className="sheet-grid">
                        {section.items.map((slug) => {
                          const s = findSub(slug);
                          if (!s) return null;
                          return (
                            <motion.button
                              key={`${si}-${slug}`}
                              className="sheet-item"
                              variants={item}
                              onClick={() => pick(slug)}
                              whileHover={{ y: -6, rotateX: 6, rotateY: -6, scale: 1.03 }}
                              whileTap={{ scale: 0.96 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                              <span className="sheet-art">
                                <motion.span
                                  initial={{ scale: 0.6, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: 0.15, type: "spring", stiffness: 240, damping: 16 }}
                                >
                                  <Emoji char={s.icon} label={s.label} />
                                </motion.span>
                                {s.eta && !s.slot && <em className="sheet-eta">{s.eta.replace(/^In /, "")}</em>}
                              </span>
                              <span className="sheet-label">{s.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
