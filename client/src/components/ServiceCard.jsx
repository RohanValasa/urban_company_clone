import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0 },
};

export default function ServiceCard({ service }) {
  const { name, price, mrp, rating, image, instant } = service;
  const { addItem, setQty, qtyOf } = useCart();
  const qty = qtyOf(service._id);

  return (
    <motion.article className="card" variants={cardVariants}>
      <div className="card-img-wrap">
        <motion.img
          src={image}
          alt={name}
          className="card-img"
          loading="lazy"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <h3 className="card-title">{name}</h3>

      <div className="card-meta">
        <span className="card-rating">★ {rating}</span>
        {instant && (
          <>
            <span className="card-dot">·</span>
            <span className="card-instant">⚡ Instant</span>
          </>
        )}
      </div>

      <div className="card-price-row">
        <span className="card-price">
          ₹{price.toLocaleString("en-IN")}
          {mrp && <s>₹{mrp.toLocaleString("en-IN")}</s>}
        </span>

        <AnimatePresence mode="wait" initial={false}>
          {qty === 0 ? (
            <motion.button
              key="add"
              className="add-btn"
              onClick={() => addItem(service)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              Add
            </motion.button>
          ) : (
            <motion.div
              key="stepper"
              className="stepper"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => setQty(service._id, qty - 1)}>
                −
              </motion.button>
              <span>{qty}</span>
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => setQty(service._id, qty + 1)}>
                +
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
