import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  const { openAuth } = useUI();

  if (!user) {
    return (
      <main className="page">
        <motion.div
          className="gate"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="gate-icon">🔒</span>
          <h1>Sign in to continue</h1>
          <p>You need an account to view this page.</p>
          <div className="gate-actions">
            <button className="btn" onClick={() => openAuth("signin")}>Sign in</button>
            <button className="see-all" onClick={() => openAuth("signup")}>Create account</button>
          </div>
        </motion.div>
      </main>
    );
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}
