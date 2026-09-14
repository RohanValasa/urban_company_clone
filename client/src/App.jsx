import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Services from "./pages/Services";
import ScrollProgress from "./components/ScrollProgress";
import "./App.css";

export default function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <BrowserRouter>
      <ScrollProgress />
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
          <Link to="/bookings">My Bookings</Link>
        </div>
      </motion.nav>
      <Routes>
        <Route path="/" element={<Services />} />
      </Routes>
    </BrowserRouter>
  );
}
