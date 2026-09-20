import { createContext, useContext, useEffect, useState } from "react";

const UIContext = createContext(null);
const CITY_KEY = "uc_city";

// eslint-disable-next-line react-refresh/only-export-components
export const CITIES = ["Hyderabad", "Bengaluru", "Mumbai", "Delhi NCR", "Chennai", "Pune"];

export function UIProvider({ children }) {
  const [authMode, setAuthMode] = useState(null);
  const [city, setCityState] = useState(() => localStorage.getItem(CITY_KEY) || CITIES[0]);

  const setCity = (next) => {
    setCityState(next);
    localStorage.setItem(CITY_KEY, next);
  };

  useEffect(() => {
    document.body.style.overflow = authMode ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [authMode]);

  return (
    <UIContext.Provider
      value={{
        authMode,
        openAuth: setAuthMode,
        closeAuth: () => setAuthMode(null),
        city,
        setCity,
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
