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

  const signup = ({ name, email, password, role }) => {
    const users = readUsers();
    if (users.some((u) => u.email === email)) {
      throw new Error("An account with this email already exists.");
    }
    const newUser = { name, email, password, role };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
    const session = { name, email, role };
    setUser(session);
    return session;
  };

  const login = ({ email, password }) => {
    const users = readUsers();
    const match = users.find((u) => u.email === email && u.password === password);
    if (!match) throw new Error("Invalid email or password.");
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
