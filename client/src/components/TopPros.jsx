import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useUI } from "../context/UIContext";
import { api } from "../lib/api";
import { choosePro, preferredFor } from "../lib/preferredPro";

const stars = (r) => `★ ${r.toFixed(r >= 4.95 ? 2 : 1)}`;

/**
 * The best professionals for a service near the customer's location: the AI
 * pick, the best rated and the closest, highlighted. Choosing one sends the
 * booking to them first.
 */
export default function TopPros({ service, title = "Top professionals near you", compact = false }) {
  const { location } = useUI();
  const [state, setState] = useState({ key: null, pros: null, error: "" });
  const [chosen, setChosen] = useState(() => preferredFor(service));
  const key = `${service}|${location.lat}|${location.lng}`;

  useEffect(() => {
    let live = true;
    api(`/pros/top?service=${encodeURIComponent(service)}&lat=${location.lat}&lng=${location.lng}&limit=${compact ? 3 : 5}`)
      .then((d) => live && setState({ key, pros: d.pros, error: "" }))
      .catch((err) => live && setState({ key, pros: [], error: err.message }));
    return () => {
      live = false;
    };
  }, [key, service, location.lat, location.lng, compact]);

  useEffect(() => {
    const sync = () => setChosen(preferredFor(service));
    window.addEventListener("servify:preferred-pro", sync);
    return () => window.removeEventListener("servify:preferred-pro", sync);
  }, [service]);

  const pick = (pro) => {
    const next = chosen?.id === pro.id ? null : pro;
    choosePro(service, next);
    setChosen(next && preferredFor(service));
  };

  const loading = state.key !== key;
  const pros = loading ? null : state.pros;
  const place = location.title === "Current location" ? "you" : location.title;

  return (
    <section className={`top-pros ${compact ? "is-compact" : ""}`} aria-busy={loading}>
      <div className="top-pros-head">
        <h3>{title}</h3>
        <span>in {place}</span>
      </div>
      {loading && <div className="top-pros-skeleton" aria-hidden="true"><span /><span /><span /></div>}
      {pros && pros.length === 0 && (
        <p className="top-pros-empty">
          {state.error || `No professionals cover ${place} for this yet. You can still book, and we'll keep looking.`}
        </p>
      )}
      {pros && pros.length > 0 && (
        <ul className="top-pros-list">
          {pros.map((p, i) => {
            const isChosen = chosen?.id === p.id;
            return (
              <motion.li
                key={p.id}
                className={`top-pro ${isChosen ? "is-chosen" : ""}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="top-pro-avatar" aria-hidden="true">{p.name.charAt(0)}</span>
                <div className="top-pro-main">
                  <div className="top-pro-badges">
                    {p.aiPick && <span className="badge-ai">✨ AI pick</span>}
                    {p.bestRated && <span className="badge-best">🏆 Best rated {place === "you" ? "near you" : `in ${place}`}</span>}
                    {p.closest && <span className="badge-near">📍 Closest</span>}
                  </div>
                  <strong>{p.name}</strong>
                  <span className="top-pro-stats">
                    <b>{stars(p.rating)}</b> ({p.ratingCount} reviews) · {p.jobsDone} jobs · {p.experienceYears} yrs
                  </span>
                  <span className="top-pro-where">
                    {p.area} · {p.distanceKm} km away{p.online ? " · 🟢 online" : ""}
                  </span>
                  {!compact && p.about && <span className="top-pro-about" dir="auto">{p.about}</span>}
                </div>
                <button
                  type="button"
                  className={isChosen ? "btn" : "btn-ghost"}
                  onClick={() => pick(p)}
                  aria-pressed={isChosen}
                >
                  {isChosen ? "✓ Chosen" : "Choose"}
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
      {pros && pros.length > 0 && (
        <p className="top-pros-note">
          {chosen ? `We'll offer your booking to ${chosen.name.split(" ")[0]} first.` : "Choose one to send your booking to them first, or we'll pick the best available."}
        </p>
      )}
    </section>
  );
}
