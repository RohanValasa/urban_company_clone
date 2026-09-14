import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Services from "./pages/Services";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Cart from "./pages/Cart";
import Bookings from "./pages/Bookings";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollProgress from "./components/ScrollProgress";
import { CartProvider, useCart } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <motion.nav
      className={`nav ${scrolled ? "nav-scrolled" : ""}`}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to="/" className="logo">
        <motion.span whileHover={{ rotate: [0, -6, 6, -3, 0] }} transition={{ duration: 0.5 }}>
          UrbanClone
        </motion.span>
      </Link>

      <div className="nav-links">
        <Link to="/">Services</Link>

        {user?.role === "professional" && <Link to="/professional/dashboard">Dashboard</Link>}
        {user?.role === "customer" && <Link to="/bookings">My Bookings</Link>}

        {user?.role !== "professional" && (
          <Link to="/cart" className="cart-link">
            🛒
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  className="cart-badge"
                  key={count}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        )}

        {!user ? (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup" className="btn nav-cta">Sign up</Link>
          </>
        ) : (
          <div className="avatar-menu">
            <button className="avatar" onClick={() => setMenuOpen((v) => !v)}>
              {user.name.charAt(0).toUpperCase()}
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="avatar-dropdown"
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <span className="avatar-name">{user.name}</span>
                  <span className="avatar-role">{user.role}</span>
                  <button onClick={handleLogout}>Log out</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollProgress />
          <Nav />
          <Routes>
            <Route path="/" element={<Services />} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/cart" element={<Cart />} />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute role="customer">
                  <Bookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/professional/dashboard"
              element={
                <ProtectedRoute role="professional">
                  <ProfessionalDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
