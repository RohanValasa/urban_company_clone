import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VideoStage from "./VideoStage";
import { useCart } from "../context/CartContext";

const backdrop = { hidden: { opacity: 0 }, show: { opacity: 1 } };

const panel = {
  hidden: { opacity: 0, y: 70, scale: 0.95, rotateX: 6 },
  show: {
    opacity: 1, y: 0, scale: 1, rotateX: 0,
    transition: { type: "spring", stiffness: 180, damping: 24, mass: 0.85 },
  },
  out: { opacity: 0, y: 40, scale: 0.97, transition: { duration: 0.22, ease: "easeIn" } },
};

const reveal = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const tile = {
  hidden: { opacity: 0, y: 28, rotateX: -28, scale: 0.92 },
  show: { opacity: 1, y: 0, rotateX: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const VIEWPORT = { once: true, amount: 0.25 };

function Section({ title, children, className = "" }) {
  return (
    <motion.section
      className={`pd-section ${className}`}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
    >
      {title && <h3 className="pd-h3">{title}</h3>}
      {children}
    </motion.section>
  );
}

function BeforeAfter({ shot }) {
  return (
    <motion.figure className="ba" variants={tile}>
      <img src={shot.before} alt="Before" className="ba-img" />
      <motion.img
        src={shot.after}
        alt="After"
        className="ba-img ba-after"
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        whileInView={{ clipPath: "inset(0 42% 0 0)" }}
        viewport={VIEWPORT}
        whileHover={{ clipPath: "inset(0 4% 0 0)" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
      <span className="ba-tag ba-tag-before">Before</span>
      <span className="ba-tag ba-tag-after">After</span>
      <figcaption>{shot.label}</figcaption>
    </motion.figure>
  );
}

function Faq({ item, open, onToggle }) {
  return (
    <motion.div className={`faq ${open ? "faq-open" : ""}`} variants={tile}>
      <button className="faq-q" onClick={onToggle} aria-expanded={open}>
        <span>{item.q}</span>
        <motion.i animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.25 }}>+</motion.i>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="faq-a"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p>{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PackageDetail({ pkg, onClose }) {
  const { addItem, qtyOf } = useCart();
  const [faq, setFaq] = useState(0);
  const qty = pkg ? qtyOf(pkg.id) : 0;

  useEffect(() => {
    if (!pkg) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [pkg, onClose]);

  return (
    <AnimatePresence>
      {pkg && (
        <motion.div
          className="sheet-backdrop pd-backdrop"
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
            className="pd"
            variants={panel}
            initial="hidden"
            animate="show"
            exit="out"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={pkg.name}
          >
            <VideoStage src={pkg.video} shots={pkg.gallery} className="pd-stage" />

            <div className="pd-head">
              <div>
                <h2 className="pd-title">{pkg.name}</h2>
                <p className="pd-rating">
                  ★ {pkg.rating} <span>({pkg.reviews} reviews)</span>
                </p>
                <p className="pd-price">
                  ₹{pkg.price.toLocaleString("en-IN")}
                  {pkg.mrp && <s>₹{pkg.mrp.toLocaleString("en-IN")}</s>}
                  <em>• {pkg.duration}</em>
                </p>
                {pkg.unitNote && <p className="pd-unit">💎 {pkg.unitNote}</p>}
              </div>
              <motion.button
                className="add-btn pd-add"
                onClick={() => addItem({ _id: pkg.id, name: pkg.name, price: pkg.price, image: pkg.image })}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
              >
                {qty > 0 ? `Added (${qty})` : "Add"}
              </motion.button>
            </div>

            <Section title="Areas & surfaces included">
              <motion.div className="pd-grid" variants={stagger} initial="hidden" whileInView="show" viewport={VIEWPORT}>
                {pkg.areas.map((a) => (
                  <motion.figure className="pd-card" key={a.label} variants={tile} whileHover={{ y: -6, rotateX: 6, rotateY: -6 }}>
                    <span className="pd-card-label">{a.label}</span>
                    <img src={a.image} alt="" loading="lazy" />
                  </motion.figure>
                ))}
              </motion.div>
            </Section>

            <Section className="pd-split">
              <motion.div className="pd-list" variants={stagger} initial="hidden" whileInView="show" viewport={VIEWPORT}>
                <h3 className="pd-h3">What is covered</h3>
                {pkg.covered.map((c) => (
                  <motion.p className="pd-yes" key={c} variants={tile}><span>✓</span>{c}</motion.p>
                ))}
              </motion.div>
              <motion.div className="pd-list" variants={stagger} initial="hidden" whileInView="show" viewport={VIEWPORT}>
                <h3 className="pd-h3">What is not covered</h3>
                {pkg.notCovered.map((c) => (
                  <motion.p className="pd-no" key={c} variants={tile}><span>✕</span>{c}</motion.p>
                ))}
              </motion.div>
            </Section>

            <Section title="Before & after">
              <motion.div className="pd-ba-grid" variants={stagger} initial="hidden" whileInView="show" viewport={VIEWPORT}>
                {pkg.beforeAfter.map((shot) => (
                  <BeforeAfter shot={shot} key={shot.label} />
                ))}
              </motion.div>
            </Section>

            <Section title="Equipment we bring">
              <motion.div className="pd-grid" variants={stagger} initial="hidden" whileInView="show" viewport={VIEWPORT}>
                {pkg.equipment.map((e) => (
                  <motion.figure className="pd-card" key={e.label} variants={tile} whileHover={{ y: -6, rotateX: 6, rotateY: 6 }}>
                    <span className="pd-card-label">{e.label}</span>
                    <img src={e.image} alt="" loading="lazy" />
                  </motion.figure>
                ))}
              </motion.div>
            </Section>

            <Section title="Frequently asked questions">
              <motion.div className="pd-faqs" variants={stagger} initial="hidden" whileInView="show" viewport={VIEWPORT}>
                {pkg.faqs.map((f, i) => (
                  <Faq key={f.q} item={f} open={faq === i} onToggle={() => setFaq(faq === i ? -1 : i)} />
                ))}
              </motion.div>
            </Section>

            <Section className="pd-reviews">
              <div className="pd-score">
                <motion.strong
                  initial={{ scale: 0.6, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={VIEWPORT}
                  transition={{ type: "spring", stiffness: 220, damping: 16 }}
                >
                  ★{pkg.rated.avg}
                </motion.strong>
                <span>{pkg.rated.total} reviews</span>
              </div>

              <div className="pd-bars">
                {pkg.rated.rows.map((row) => (
                  <div className="pd-bar-row" key={row.stars}>
                    <span className="pd-bar-star">★ {row.stars}</span>
                    <span className="pd-bar-track">
                      <motion.i
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: row.pct / 100 }}
                        viewport={VIEWPORT}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </span>
                    <span className="pd-bar-count">{row.label}</span>
                  </div>
                ))}
              </div>

              <h3 className="pd-h3 pd-reviews-h">All reviews</h3>
              <motion.div className="pd-review-list" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.05 }}>
                {pkg.reviewList.map((r) => (
                  <motion.article className="pd-review" key={`${r.name}-${r.date}`} variants={tile}>
                    <header>
                      <strong>{r.name}</strong>
                      <span className="pd-review-pill">★ {r.rating}</span>
                    </header>
                    <p className="pd-review-meta">{r.date} • For {r.service}</p>
                    <p>{r.text}</p>
                  </motion.article>
                ))}
              </motion.div>
            </Section>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
