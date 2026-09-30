import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const MOCK_BOOKINGS = [
  { id: "b1", name: "Home Deep Cleaning", date: "18 Sep, 10:00 AM", status: "Confirmed" },
  { id: "b2", name: "AC Service & Repair", date: "22 Sep, 2:30 PM", status: "Pending" },
];

export default function Bookings() {
  const { user } = useAuth();

  return (
    <main className="page">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        My Bookings
      </motion.h1>
      <p className="auth-sub" style={{ marginBottom: 28 }}>Signed in as {user?.name}</p>

      <motion.ul
        className="booking-list"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      >
        {MOCK_BOOKINGS.map((b) => (
          <motion.li
            key={b.id}
            className="booking-item"
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          >
            <div>
              <h3>{b.name}</h3>
              <span className="muted-inline">{b.date}</span>
            </div>
            <span className={`status-pill status-${b.status.toLowerCase()}`}>{b.status}</span>
          </motion.li>
        ))}
      </motion.ul>
    </main>
  );
}
