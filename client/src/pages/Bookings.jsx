import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { formatSlot } from "../lib/slots";
import { addressLine, rupees } from "../lib/format";

const STATUS = {
  confirmed: { label: "Finding a professional", tone: "pending" },
  assigned: { label: "Professional assigned", tone: "confirmed" },
  "on-the-way": { label: "On the way · Track", tone: "live" },
  arrived: { label: "Arrived", tone: "live" },
  completed: { label: "Completed", tone: "completed" },
  cancelled: { label: "Cancelled", tone: "cancelled" },
};
const statusOf = (b) => STATUS[b.status] || STATUS.confirmed;

const paymentLabel = (p) =>
  p.method === "upi"
    ? p.status === "paid" ? "Paid by UPI" : "UPI · confirming payment"
    : "Cash on delivery";

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    api("/bookings").then(
      (data) => live && setBookings(data.bookings),
      (err) => live && setError(err.message)
    );
    return () => {
      live = false;
    };
  }, []);

  return (
    <main className="page">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        My Bookings
      </motion.h1>
      <p className="auth-sub" style={{ marginBottom: 28 }}>Signed in as {user?.name}</p>

      {error && <p className="auth-error">{error}</p>}
      {!bookings && !error && <p className="muted">Loading your bookings…</p>}
      {bookings?.length === 0 && (
        <div className="cart-empty">
          <span>📅</span>
          <p className="muted">You haven't booked anything yet.</p>
          <Link to="/" className="btn">Browse services</Link>
        </div>
      )}

      {bookings?.length > 0 && (
        <motion.ul
          className="booking-list"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          {bookings.map((b) => {
            const status = statusOf(b);
            return (
              <motion.li
                key={b.id}
                className="booking-item booking-card"
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              >
                <Link to={`/bookings/${b.id}`} className="booking-link" aria-label={`Track booking #${b.id.slice(-6).toUpperCase()}`} />
                <div className="booking-main">
                  <h3>{b.items.map((i) => (i.qty > 1 ? `${i.name} × ${i.qty}` : i.name)).join(", ")}</h3>
                  <span className="muted-inline">🕘 {formatSlot(b.slot)}</span>
                  <span className="muted-inline">📍 {addressLine(b.address)}</span>
                  <span className="muted-inline">
                    💳 {paymentLabel(b.payment)} · <strong>{rupees(b.bill.total)}</strong> · #{b.id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <span className={`status-pill status-${status.tone}`}>{status.label}</span>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </main>
  );
}
