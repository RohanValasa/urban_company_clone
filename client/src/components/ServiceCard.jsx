import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function ServiceCard({ service }) {
  const { name, category, price, rating, duration, image } = service;
  const { addItem, setQty, qtyOf } = useCart();
  const qty = qtyOf(service._id);

  return (
    <motion.article
      className="card"
      variants={cardVariants}
      whileHover={{ y: -10, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
    >
      <div className="card-img-wrap">
        <motion.img
          src={image}
          alt={name}
          className="card-img"
          loading="lazy"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="card-body">
        <span className="badge">{category}</span>
        <h3>{name}</h3>
        <div className="meta">
          <span>⭐ {rating}</span>
          <span>{duration}</span>
        </div>
        <div className="card-footer">
          <strong>₹{price}</strong>

          <AnimatePresence mode="wait" initial={false}>
            {qty === 0 ? (
              <motion.button
                key="add"
                className="btn"
                onClick={() => addItem(service)}
                whileHover={{ scale: 1.06 }}
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
      </div>
    </motion.article>
  );
}
