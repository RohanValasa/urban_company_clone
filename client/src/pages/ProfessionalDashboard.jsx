import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const MOCK_JOBS = [
  { id: "j1", name: "Tap & Pipe Repair", customer: "Aarav Mehta", date: "16 Sep, 11:00 AM", payout: 349 },
  { id: "j2", name: "AC Service & Repair", customer: "Priya Singh", date: "17 Sep, 4:00 PM", payout: 599 },
  { id: "j3", name: "Home Deep Cleaning", customer: "Rohan Iyer", date: "19 Sep, 9:00 AM", payout: 1499 },
];

export default function ProfessionalDashboard() {
  const { user } = useAuth();
  const earnings = MOCK_JOBS.reduce((s, j) => s + j.payout, 0);

  return (
    <main className="page">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        Welcome, {user?.name?.split(" ")[0] ?? "Pro"} 👋
      </motion.h1>
      <p className="auth-sub" style={{ marginBottom: 28 }}>Here's what's on your schedule.</p>

      <motion.div
        className="stat-row"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        {[
          { label: "Upcoming jobs", value: MOCK_JOBS.length },
          { label: "Est. earnings", value: `₹${earnings}` },
          { label: "Rating", value: "4.8 ⭐" },
        ].map((s) => (
          <motion.div
            className="stat-card"
            key={s.label}
            variants={{ hidden: { opacity: 0, y: 16, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1 } }}
          >
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </motion.div>
        ))}
      </motion.div>

      <h2 className="section-title">Upcoming Jobs</h2>
      <motion.ul
        className="booking-list"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
      >
        {MOCK_JOBS.map((j) => (
          <motion.li
            key={j.id}
            className="booking-item"
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          >
            <div>
              <h3>{j.name}</h3>
              <span className="muted-inline">{j.customer} · {j.date}</span>
            </div>
            <span className="status-pill status-confirmed">₹{j.payout}</span>
          </motion.li>
        ))}
      </motion.ul>
    </main>
  );
}
