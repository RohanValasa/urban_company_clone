import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext(null);
const SHOW_FOR_MS = 8000;
const ICONS = {
  accepted: "🎉",
  offer: "🔔",
  "offer-expired": "⌛",
  "no-provider": "😕",
  "on-the-way": "🛵",
  arrived: "📍",
  started: "🧰",
  completed: "✅",
  cancelled: "✖️",
};

/**
 * Live pop-ups for whoever is signed in ("Yay! Request accepted by …"), from
 * the server's per-user event stream. Pages can also listen, to refresh
 * themselves when something happens.
 */
export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const listeners = useRef(new Set());
  const userId = user?.id;
  const role = user?.role;

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  useEffect(() => {
    if (!userId) return undefined;
    const source = new EventSource("/api/notifications/live");
    source.onmessage = (e) => {
      const event = JSON.parse(e.data);
      if (event.type !== "notification") return;
      const note = { ...event.note, id: `${Date.now()}-${Math.random()}` };
      listeners.current.forEach((fn) => fn(note));
      setToasts((list) => [...list.slice(-3), note]);
      setTimeout(() => dismiss(note.id), SHOW_FOR_MS);
    };
    return () => source.close();
  }, [userId, dismiss]);

  /** Calls `fn(note)` for every notification until the returned function is called. */
  const listen = useCallback((fn) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  const open = (note) => {
    dismiss(note.id);
    if (!note.bookingId) return;
    navigate(role === "professional" ? "/professional/dashboard" : `/bookings/${note.bookingId}`);
  };

  return (
    <NotificationsContext.Provider value={{ listen }}>
      {children}
      <div className="toasts" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.button
              key={t.id}
              className={`toast toast-${t.kind}`}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
              onClick={() => open(t)}
            >
              <span className="toast-icon" aria-hidden="true">{ICONS[t.kind] || "🔔"}</span>
              <span className="toast-text">
                <strong>{t.title}</strong>
                {t.body && <span>{t.body}</span>}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </NotificationsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
