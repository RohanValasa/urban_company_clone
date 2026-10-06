import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCATION, inHyderabad } from "../lib/places";
import { useAuth } from "./AuthContext";

const UIContext = createContext(null);
const LOCATION_KEY = "uc_location";

/**
 * The chosen location belongs to whoever chose it. It's kept for the browser
 * session while they're signed in; signed out, everyone starts at Hyderabad.
 */
const loadLocation = () => {
  try {
    localStorage.removeItem(LOCATION_KEY); // older builds kept it forever
    const saved = JSON.parse(sessionStorage.getItem(LOCATION_KEY));
    return saved?.place?.title && inHyderabad(saved.place) ? saved : { owner: null, place: null };
  } catch {
    return { owner: null, place: null };
  }
};

export function UIProvider({ children }) {
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState(null);
  const [chosen, setChosen] = useState(loadLocation);
  const [locationOpen, setLocationOpen] = useState(false);

  // A guest's pick carries into sign-in; another account's pick never shows.
  const mine = chosen.place && (chosen.owner === null || chosen.owner === user?.id);
  const location = mine ? chosen.place : DEFAULT_LOCATION;

  const setLocation = (place) => {
    const next = { owner: user?.id ?? null, place };
    setChosen(next);
    try {
      if (user) sessionStorage.setItem(LOCATION_KEY, JSON.stringify(next));
    } catch {
      // Storage can be blocked; the choice still holds until reload.
    }
  };

  // Signing out forgets the location for this browser session.
  useEffect(() => {
    if (user) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(LOCATION_KEY));
      if (saved?.owner) sessionStorage.removeItem(LOCATION_KEY);
    } catch {
      // nothing stored
    }
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = authMode || locationOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [authMode, locationOpen]);

  return (
    <UIContext.Provider
      value={{
        authMode,
        openAuth: setAuthMode,
        closeAuth: () => setAuthMode(null),
        location,
        setLocation,
        locationOpen,
        openLocation: () => setLocationOpen(true),
        closeLocation: () => setLocationOpen(false),
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
