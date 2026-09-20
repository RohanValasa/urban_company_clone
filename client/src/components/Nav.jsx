import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useUI, CITIES } from "../context/UIContext";

const SERVICE_LINKS = [
  { label: "Salon", category: "Beauty" },
  { label: "Cleaning", category: "Cleaning" },
  { label: "Plumbing", category: "Plumbing" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [term, setTerm] = useState("");
  const { count } = useCart();
  const { user, logout } = useAuth();
  const { city, setCity, openAuth } = useUI();
  const navigate = useNavigate();
  const menusRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (menusRef.current && !menusRef.current.contains(e.target)) {
        setCityOpen(false);
        setUserOpen(false);
      }
    };
    window.addEventListener("pointerdown", onClick);
    return () => window.removeEventListener("pointerdown", onClick);
  }, []);

  const search = (e) => {
    e.preventDefault();
    navigate(term.trim() ? `/?q=${encodeURIComponent(term.trim())}` : "/");
  };

  const handleLogout = () => {
    logout();
    setUserOpen(false);
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

      <div className="nav-services">
        {SERVICE_LINKS.map((s) => (
          <Link key={s.label} to={`/?category=${s.category}`}>
            {s.label}
          </Link>
        ))}
      </div>

      <div className="nav-tools" ref={menusRef}>
        <div className="nav-select">
          <button className="nav-field" onClick={() => { setCityOpen((v) => !v); setUserOpen(false); }}>
            <span className="nav-field-icon">📍</span>
            <span className="nav-field-text">{city}</span>
            <span className="nav-caret">▾</span>
          </button>
          <AnimatePresence>
            {cityOpen && (
              <motion.ul
                className="nav-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.16 }}
              >
                {CITIES.map((c) => (
                  <li key={c}>
                    <button
                      className={c === city ? "active" : ""}
                      onClick={() => { setCity(c); setCityOpen(false); }}
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <form className="nav-field nav-search" onSubmit={search}>
          <span className="nav-field-icon">🔍</span>
          <input
            placeholder="Search for a service"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </form>

        <Link to="/cart" className="nav-icon-btn" aria-label="Cart">
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

        <div className="nav-select">
          <button
            className={`nav-icon-btn ${user ? "nav-avatar" : ""}`}
            onClick={() => { setUserOpen((v) => !v); setCityOpen(false); }}
            aria-label="Account"
          >
            {user ? user.name.charAt(0).toUpperCase() : "👤"}
          </button>
          <AnimatePresence>
            {userOpen && (
              <motion.div
                className="nav-dropdown nav-dropdown-right"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.16 }}
              >
                {user ? (
                  <>
                    <div className="dropdown-head">
                      <strong>{user.name}</strong>
                      <span className="role">{user.role}</span>
                    </div>
                    <Link
                      to={user.role === "professional" ? "/professional/dashboard" : "/bookings"}
                      onClick={() => setUserOpen(false)}
                    >
                      {user.role === "professional" ? "Dashboard" : "My bookings"}
                    </Link>
                    <button onClick={handleLogout}>Log out</button>
                  </>
                ) : (
                  <>
                    <div className="dropdown-head">
                      <strong>Welcome</strong>
                      <span>Book services in seconds</span>
                    </div>
                    <button onClick={() => { openAuth("signin"); setUserOpen(false); }}>Sign in</button>
                    <button
                      className="dropdown-cta"
                      onClick={() => { openAuth("signup"); setUserOpen(false); }}
                    >
                      Sign up
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
}
