import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCATION, inHyderabad } from "../lib/places";

const UIContext = createContext(null);
const LOCATION_KEY = "uc_location";

const loadLocation = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCATION_KEY));
    return saved?.title && inHyderabad(saved) ? saved : DEFAULT_LOCATION;
  } catch {
    return DEFAULT_LOCATION;
  }
};

export function UIProvider({ children }) {
  const [authMode, setAuthMode] = useState(null);
  const [location, setLocationState] = useState(loadLocation);
  const [locationOpen, setLocationOpen] = useState(false);

  const setLocation = (next) => {
    setLocationState(next);
    localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
  };

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
