import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

// The server checks the same rules (server/src/lib/validate.js).
// eslint-disable-next-line react-refresh/only-export-components
export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
  { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

/** Accounts used to be kept in the browser, passwords and all. Clear them out. */
function forgetLocalAccounts() {
  try {
    localStorage.removeItem("uc_users");
    localStorage.removeItem("uc_session");
  } catch {
    // Storage can be blocked; there's nothing to clear then.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // True until we know whether the browser already has a session.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    forgetLocalAccounts();
    let live = true;
    api("/auth/me")
      .then((data) => live && setUser(data.user))
      .catch(() => {})
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  const signup = useCallback(async ({ name, phone, email, password, address, role }) => {
    const data = await api("/auth/signup", { method: "POST", body: { name, phone, email, password, address, role } });
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    const data = await api("/auth/login", { method: "POST", body: { identifier, password } });
    setUser(data.user);
    return data.user;
  }, []);

  /** `role` only matters when the Google account is new to Servify. */
  const loginWithGoogle = useCallback(async (credential, role) => {
    const data = await api("/auth/google", { method: "POST", body: { credential, role } });
    setUser(data.user);
    return data.user;
  }, []);

  /** Saves a phone number on the account (Google sign-ups start without one). */
  const savePhone = useCallback(async (phone) => {
    const data = await api("/account/profile", { method: "PATCH", body: { phone } });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      window.google?.accounts.id.disableAutoSelect();
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, signup, login, loginWithGoogle, savePhone, logout }),
    [user, loading, signup, login, loginWithGoogle, savePhone, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
