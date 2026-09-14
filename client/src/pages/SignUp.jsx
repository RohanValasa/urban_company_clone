import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  {
    value: "customer",
    title: "I need a service",
    desc: "Book cleaning, repairs, salon and more at home.",
    icon: "🏠",
  },
  {
    value: "professional",
    title: "I provide a service",
    desc: "Get bookings and grow your business with us.",
    icon: "🛠️",
  },
];

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const session = signup({ ...form, role });
      navigate(session.role === "professional" ? "/professional/dashboard" : "/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="auth-page">
      <motion.div
        className="auth-card auth-card-wide"
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1>Create your account</h1>
        <p className="auth-sub">Choose how you'll use UrbanClone.</p>

        <div className="role-picker">
          {ROLES.map((r) => (
            <motion.button
              type="button"
              key={r.value}
              className={`role-card ${role === r.value ? "role-card-active" : ""}`}
              onClick={() => setRole(r.value)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="role-icon">{r.icon}</span>
              <strong>{r.title}</strong>
              <span className="role-desc">{r.desc}</span>
            </motion.button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Doe"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength={4}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 4 characters"
            />
          </label>

          {error && (
            <motion.p className="auth-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {error}
            </motion.p>
          )}

          <motion.button
            className="btn btn-block"
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Create Account
          </motion.button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </motion.div>
    </main>
  );
}
