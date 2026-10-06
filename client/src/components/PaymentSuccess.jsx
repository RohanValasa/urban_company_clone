import { motion } from "framer-motion";
import { rupees } from "../lib/format";

/** A short "payment received" animation shown before the job is closed. */
export default function PaymentSuccess({ amount, how }) {
  return (
    <motion.div
      className="pay-success"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="status"
      aria-live="assertive"
    >
      <motion.div
        className="pay-success-card"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.svg viewBox="0 0 120 120" className="pay-success-tick" aria-hidden="true">
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            fill="#16a34a"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 14 }}
            style={{ originX: "60px", originY: "60px" }}
          />
          <motion.path
            d="M36 62 L53 78 L86 44"
            fill="none"
            stroke="#fff"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.35, duration: 0.45, ease: "easeOut" }}
          />
        </motion.svg>
        <motion.strong initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          {rupees(amount)} received
        </motion.strong>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}>
          {how}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
