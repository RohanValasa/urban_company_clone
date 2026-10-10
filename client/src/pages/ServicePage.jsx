import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion, useScroll, useSpring, useTransform, useReducedMotion } from "framer-motion";
import VideoStage from "../components/VideoStage";
import PackageDetail from "../components/PackageDetail";
import SplitHeading from "../components/motion/SplitHeading";
import Tilt from "../components/motion/Tilt";
import { Art } from "../components/Art";
import { findSub, heroShots } from "../data/services";
import { useCart } from "../context/CartContext";
import TopPros from "../components/TopPros";

const SOFT = { stiffness: 110, damping: 26, mass: 0.6 };

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const rowVariants = {
  hidden: { opacity: 0, y: 44, rotateX: -18 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
const tabVariants = {
  hidden: { opacity: 0, y: 20, rotateY: -30 },
  show: { opacity: 1, y: 0, rotateY: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function ServicePage() {
  const { slug } = useParams();
  const sub = findSub(slug);
  const heroRef = useRef(null);
  const reduced = useReducedMotion();
  const { items, addItem, setQty, qtyOf, count, total, mrpTotal } = useCart();
  const [tab, setTab] = useState(sub?.tabs?.[0]?.id || "value");
  const [detail, setDetail] = useState(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const stageY = useSpring(useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 80]), SOFT);
  const stageRotate = useSpring(useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -6]), SOFT);
  const copyY = useSpring(useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 60]), SOFT);

  if (!sub) {
    return (
      <main className="page">
        <h1>Service not found</h1>
        <Link to="/" className="btn">Back home</Link>
      </main>
    );
  }

  const shown = sub.packages.filter((p) => p.tab === tab);
  const tabLabel = sub.tabs.find((t) => t.id === tab)?.label || "Services";

  return (
    <main className="page service-page">
      <div className="blob blob-a" />

      <motion.div className="crumb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <Link to="/">Home</Link> <span>›</span> {sub.label}
      </motion.div>

      <section className="sp-hero" ref={heroRef}>
        <motion.div className="sp-intro" style={{ y: copyY }}>
          <div className="sp-title-row">
            <SplitHeading as="h1" text={sub.label} className="sp-title" />
            <motion.span
              className={`sp-instant ${sub.slot ? "is-slot" : ""}`}
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 240, damping: 18 }}
            >
              <em>{sub.slot ? "🕘 Earliest" : "⚡ Instant"}</em>
              <strong>{sub.slot || sub.eta}</strong>
            </motion.span>
          </div>

          <motion.p
            className="sp-rating"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            ★ {sub.rating} <span>({sub.bookings})</span>
          </motion.p>

          <div className="sp-picker">
            <p className="sp-picker-head">Select a service</p>
            <motion.div className="sp-tabs" variants={listVariants} initial="hidden" animate="show">
              {sub.tabs.map((t) => (
                <motion.button
                  key={t.id}
                  className={`sp-tab ${tab === t.id ? "is-active" : ""}`}
                  variants={tabVariants}
                  onClick={() => setTab(t.id)}
                  whileHover={{ y: -5, scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="sp-tab-art">
                    {t.tag ? <em>{t.tag}</em> : <Art pic={t.image} />}
                  </span>
                  <span className="sp-tab-label">{t.label}</span>
                  {tab === t.id && <motion.span className="sp-tab-underline" layoutId="sp-tab-underline" />}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </motion.div>

        <motion.div className="sp-stage-wrap" style={{ y: stageY, rotate: stageRotate }}>
          <VideoStage src={sub.video} shots={heroShots(slug)} caption={sub.caption} className="sp-stage" />
        </motion.div>
      </section>

      <div className="sp-body">
        <div>
          <TopPros service={sub.slug} title={`Top ${sub.label} professionals`} />
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <h2 className="sp-list-title">{tabLabel}</h2>

              <motion.div className="sp-list" variants={listVariants} initial="hidden" animate="show">
                {shown.length === 0 && <p className="muted">Nothing here yet — try another tab.</p>}

                {shown.map((p) => {
                  const qty = qtyOf(p.id);
                  return (
                    <motion.article className="sp-row" key={p.id} variants={rowVariants}>
                      <div className="sp-row-copy">
                        <h3>{p.name}</h3>
                        <p className="sp-row-rating">★ {p.rating} <span>({p.reviews} reviews)</span></p>
                        <p className="sp-row-price">
                          ₹{p.price.toLocaleString("en-IN")}
                          {p.mrp && <s>₹{p.mrp.toLocaleString("en-IN")}</s>}
                          <em>• {p.duration}</em>
                        </p>
                        {p.unitNote && <p className="sp-row-unit">💎 {p.unitNote}</p>}
                        <ul>
                          {p.bullets.map((b) => <li key={b}>{b}</li>)}
                        </ul>
                        <motion.button
                          className="sp-details"
                          onClick={() => setDetail(p)}
                          whileHover={{ x: 3 }}
                        >
                          View details
                        </motion.button>
                      </div>

                      <div className="sp-row-media">
                        <Tilt className="sp-thumb" max={12} lift={6}>
                          {p.badge && <span className="sp-badge">{p.badge}</span>}
                          <Art pic={p.image} alt={p.name} />
                        </Tilt>
                        <motion.button
                          className="add-btn sp-add"
                          onClick={() => addItem({ _id: p.id, name: p.name, price: p.price, mrp: p.mrp, category: sub.label, sub: sub.slug, image: p.image })}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.94 }}
                        >
                          {qty > 0 ? `Added (${qty})` : "Add"}
                        </motion.button>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="sp-rail">
          <motion.div
            className="sp-promise"
            initial={{ opacity: 0, x: 30, rotateY: 12 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="sp-promise-head">
              <h3>Servify Promise</h3>
              <span className="sp-seal">QUALITY<br />ASSURED</span>
            </div>
            {["Verified professionals", "Hassle free booking", "Transparent pricing"].map((t, i) => (
              <motion.p
                key={t}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.1 }}
              >
                ✓ {t}
              </motion.p>
            ))}
          </motion.div>

          <motion.div
            className="sp-cart"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              {count === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.span
                    className="sp-cart-icon"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    🛒
                  </motion.span>
                  <p>No items in your cart</p>
                </motion.div>
              ) : (
                <motion.div
                  key="full"
                  className="sp-cart-full"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <h3>Cart</h3>
                  <ul className="sp-cart-lines">
                    {items.map((item) => (
                      <li key={item._id}>
                        <span className="sp-cart-name">{item.name}</span>
                        <div className="stepper">
                          <button onClick={() => setQty(item._id, item.qty - 1)} aria-label={`One less ${item.name}`}>−</button>
                          <span>{item.qty}</span>
                          <button onClick={() => setQty(item._id, item.qty + 1)} aria-label={`One more ${item.name}`}>+</button>
                        </div>
                        <span className="sp-cart-price">
                          ₹{(item.price * item.qty).toLocaleString("en-IN")}
                          {item.mrp > item.price && <s>₹{(item.mrp * item.qty).toLocaleString("en-IN")}</s>}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/cart" className="sp-cart-cta" aria-label={`View cart, ${count} item${count > 1 ? "s" : ""}`}>
                    <span>
                      ₹{total.toLocaleString("en-IN")}
                      {mrpTotal > total && <s>₹{mrpTotal.toLocaleString("en-IN")}</s>}
                    </span>
                    <strong>View Cart</strong>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </aside>
      </div>

      <PackageDetail pkg={detail} onClose={() => setDetail(null)} />
    </main>
  );
}
