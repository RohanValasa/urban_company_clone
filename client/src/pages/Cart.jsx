import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { items, setQty, removeItem, total, clear } = useCart();
  const [placed, setPlaced] = useState(false);

  if (placed) {
    return (
      <main className="page cart-page">
        <motion.div
          className="order-success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            className="order-success-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 16 }}
          >
            ✅
          </motion.span>
          <h1>Booking confirmed!</h1>
          <p>A professional will reach out shortly to schedule your service.</p>
          <Link to="/" className="btn">Back to Services</Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="page cart-page">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        Your Cart
      </motion.h1>

      {items.length === 0 ? (
        <div className="cart-empty">
          <span>🛒</span>
          <p className="muted">Your cart is empty.</p>
          <Link to="/" className="btn">Browse services</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <motion.ul className="cart-list" layout>
            <AnimatePresence>
              {items.map((item) => (
                <motion.li
                  key={item._id}
                  className="cart-item"
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <img src={item.image} alt={item.name} />
                  <div className="cart-item-info">
                    <span className="badge">{item.category}</span>
                    <h3>{item.name}</h3>
                    <span className="cart-item-price">₹{item.price}</span>
                  </div>
                  <div className="stepper">
                    <button onClick={() => setQty(item._id, item.qty - 1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => setQty(item._id, item.qty + 1)}>+</button>
                  </div>
                  <button className="cart-remove" onClick={() => removeItem(item._id)} aria-label="Remove">
                    ✕
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>

          <motion.div
            className="cart-summary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h2>Order Summary</h2>
            <div className="cart-row">
              <span>Subtotal</span>
              <span>₹{total}</span>
            </div>
            <div className="cart-row">
              <span>Convenience fee</span>
              <span>₹29</span>
            </div>
            <div className="cart-row cart-total">
              <span>Total</span>
              <span>₹{total + 29}</span>
            </div>
            <motion.button
              className="btn btn-block"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setPlaced(true);
                clear();
              }}
            >
              Confirm Booking
            </motion.button>
          </motion.div>
        </div>
      )}
    </main>
  );
}
