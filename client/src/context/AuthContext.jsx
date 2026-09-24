import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const USERS_KEY = "uc_users";
const SESSION_KEY = "uc_session";

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
  { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  }, [user]);

  const signup = ({ name, phone, email, password, address, role }) => {
    const users = readUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with this email already exists.");
    }
    if (!/^\d{10}$/.test(phone)) {
      throw new Error("Enter a valid 10-digit phone number.");
    }
    if (PASSWORD_RULES.some((r) => !r.test(password))) {
      throw new Error("Password does not meet all the requirements.");
    }
    const newUser = { name, phone, email, password, address, role };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
    const session = { name, email, role };
    setUser(session);
    return session;
  };

  const login = ({ username, password }) => {
    const id = username.trim().toLowerCase();
    const match = readUsers().find(
      (u) => (u.email.toLowerCase() === id || u.name.toLowerCase() === id) && u.password === password
    );
    if (!match) throw new Error("Invalid username or password.");
    const session = { name: match.name, email: match.email, role: match.role };
    setUser(session);
    return session;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
