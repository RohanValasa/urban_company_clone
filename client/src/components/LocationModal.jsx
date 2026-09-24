import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useUI } from "../context/UIContext";
import { PROVIDER, locateMe, searchPlaces } from "../lib/places";

const panel = {
  hidden: { opacity: 0, y: 40, scale: 0.95, rotateX: 8 },
  show: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: { type: "spring", stiffness: 220, damping: 24 } },
  out: { opacity: 0, y: 24, scale: 0.97, transition: { duration: 0.18, ease: "easeIn" } },
};

const row = {
  hidden: { opacity: 0, x: -12 },
  show: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.035, duration: 0.28 } }),
};

function Picker({ onClose, onPick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [message, setMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [active, setActive] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onType = (value) => {
    setQuery(value);
    setMessage("");
    if (value.trim().length < 2) {
      latest.current += 1; // drop any request still in flight
      setResults([]);
      setStatus("idle");
    } else {
      setStatus("loading");
    }
  };

  // Debounced search; the counter drops answers that arrive out of order.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return undefined;
    const id = ++latest.current;
    const t = setTimeout(async () => {
      try {
        const found = await searchPlaces(q);
        if (id !== latest.current) return;
        setResults(found);
        setActive(0);
        setStatus("done");
      } catch (err) {
        if (id !== latest.current) return;
        setResults([]);
        setStatus("error");
        setMessage(err.message);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  const choose = async (r) => {
    try {
      onPick(await r.resolve());
    } catch {
      setMessage("Couldn't load that place. Pick another result.");
    }
  };

  const useCurrent = async () => {
    setLocating(true);
    setMessage("");
    try {
      onPick(await locateMe());
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLocating(false);
    }
  };

  const onKeyDown = (e) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
    if (e.key === "Enter") { e.preventDefault(); choose(results[active]); }
  };

  return (
    <motion.div
      className="loc-panel"
      variants={panel}
      initial="hidden"
      animate="show"
      exit="out"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Choose your location"
    >
      <div className="loc-body">
        <label className="loc-search">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search for your location/society/apartment"
            aria-label="Search for your location"
          />
          {status === "loading" && <span className="loc-spinner" aria-hidden="true" />}
        </label>

        <motion.button
          type="button"
          className="loc-current"
          onClick={useCurrent}
          disabled={locating}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {locating ? "Finding you…" : "Use current location"}
        </motion.button>

        <AnimatePresence>
          {message && (
            <motion.p
              className="loc-message"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="loc-results">
        {status === "done" && results.length === 0 && (
          <p className="loc-empty">No places in Hyderabad match “{query.trim()}”.</p>
        )}
        {status === "idle" && <p className="loc-empty">We currently serve Hyderabad only.</p>}
        <ul>
          {results.map((r, i) => (
            <motion.li key={r.id} custom={i} variants={row} initial="hidden" animate="show">
              <button
                type="button"
                className={`loc-result ${i === active ? "is-active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(r)}
              >
                <span className="loc-pin" aria-hidden="true">📍</span>
                <span>
                  <strong>{r.title}</strong>
                  {r.subtitle && <small>{r.subtitle}</small>}
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="loc-foot">
        {PROVIDER === "google" ? (
          <span className="loc-google">
            powered by{" "}
            <b><i>G</i><i>o</i><i>o</i><i>g</i><i>l</i><i>e</i></b>
          </span>
        ) : (
          <span>
            Search by Photon · ©{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
              OpenStreetMap
            </a>{" "}
            contributors
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function LocationModal() {
  const { locationOpen, closeLocation, setLocation } = useUI();

  return createPortal(
    <AnimatePresence>
      {locationOpen && (
        <motion.div
          className="sheet-backdrop loc-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeLocation}
        >
          <motion.button
            className="sheet-close"
            onClick={closeLocation}
            aria-label="Close"
            initial={{ opacity: 0, scale: 0.6, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.14 } }}
            transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 18 }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
          <Picker
            onClose={closeLocation}
            onPick={(place) => {
              setLocation(place);
              closeLocation();
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
