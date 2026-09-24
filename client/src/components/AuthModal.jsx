import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PASSWORD_RULES, useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

const backdrop = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

const panel = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.2 } },
};

const fields = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};
const field = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const EMPTY_SIGNUP = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirm: "",
  address: "",
  role: "customer",
};

export default function AuthModal() {
  const { authMode, openAuth, closeAuth } = useUI();
  const { login, signup } = useAuth();
  const [signInForm, setSignInForm] = useState({ username: "", password: "" });
  const [signUpForm, setSignUpForm] = useState(EMPTY_SIGNUP);
  const [error, setError] = useState("");

  const dismiss = () => {
    setError("");
    closeAuth();
  };

  const switchTo = (mode) => {
    setError("");
    openAuth(mode);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setError("");
        closeAuth();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAuth]);

  const passwordChecks = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(signUpForm.password) }));
  const passwordsMatch = signUpForm.confirm.length > 0 && signUpForm.confirm === signUpForm.password;

  const handleSignIn = (e) => {
    e.preventDefault();
    try {
      login(signInForm);
      setSignInForm({ username: "", password: "" });
      dismiss();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    if (!passwordsMatch) return setError("Passwords do not match.");
    try {
      signup(signUpForm);
      setSignUpForm(EMPTY_SIGNUP);
      dismiss();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AnimatePresence>
      {authMode && (
        <motion.div
          className="modal-backdrop"
          variants={backdrop}
          initial="hidden"
          animate="show"
          exit="hidden"
          onClick={dismiss}
        >
          <motion.div
            className={`modal ${authMode === "signup" ? "modal-wide" : ""}`}
            variants={panel}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button className="modal-close" onClick={dismiss} aria-label="Close">✕</button>

            <div className="modal-tabs">
              {["signin", "signup"].map((mode) => (
                <button
                  key={mode}
                  className={authMode === mode ? "active" : ""}
                  onClick={() => switchTo(mode)}
                >
                  {mode === "signin" ? "Sign in" : "Sign up"}
                  {authMode === mode && <motion.span layoutId="tab-underline" className="tab-underline" />}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {authMode === "signin" ? (
                <motion.form
                  key="signin"
                  onSubmit={handleSignIn}
                  variants={fields}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                >
                  <motion.h2 variants={field}>Welcome back</motion.h2>
                  <motion.p className="modal-sub" variants={field}>
                    Sign in to book services and track your jobs.
                  </motion.p>

                  <motion.label variants={field}>
                    Username
                    <input
                      required
                      autoFocus
                      placeholder="Your name or email"
                      value={signInForm.username}
                      onChange={(e) => setSignInForm({ ...signInForm, username: e.target.value })}
                    />
                  </motion.label>

                  <motion.label variants={field}>
                    Password
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={signInForm.password}
                      onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                    />
                  </motion.label>

                  {error && <motion.p className="auth-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}

                  <motion.button className="btn btn-block" type="submit" variants={field} whileTap={{ scale: 0.98 }}>
                    Sign in
                  </motion.button>

                  <motion.p className="modal-switch" variants={field}>
                    New to UrbanClone?{" "}
                    <button type="button" onClick={() => switchTo("signup")}>Create an account</button>
                  </motion.p>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  onSubmit={handleSignUp}
                  variants={fields}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
                >
                  <motion.h2 variants={field}>Create your account</motion.h2>
                  <motion.p className="modal-sub" variants={field}>
                    Book trusted professionals in minutes.
                  </motion.p>

                  <motion.div className="role-toggle" variants={field}>
                    {[
                      { value: "customer", label: "🏠 I need a service" },
                      { value: "professional", label: "🛠️ I provide a service" },
                    ].map((r) => (
                      <button
                        type="button"
                        key={r.value}
                        className={signUpForm.role === r.value ? "active" : ""}
                        onClick={() => setSignUpForm({ ...signUpForm, role: r.value })}
                      >
                        {r.label}
                      </button>
                    ))}
                  </motion.div>

                  <motion.div className="field-row" variants={field}>
                    <label>
                      Full name
                      <input
                        required
                        placeholder="Jane Doe"
                        value={signUpForm.name}
                        onChange={(e) => setSignUpForm({ ...signUpForm, name: e.target.value })}
                      />
                    </label>
                    <label>
                      Phone number
                      <input
                        required
                        inputMode="numeric"
                        pattern="\d{10}"
                        title="10 digits"
                        placeholder="9876543210"
                        value={signUpForm.phone}
                        onChange={(e) =>
                          setSignUpForm({ ...signUpForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                        }
                      />
                    </label>
                  </motion.div>

                  <motion.label variants={field}>
                    Email
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                    />
                  </motion.label>

                  <motion.div className="field-row" variants={field}>
                    <label>
                      Password
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={signUpForm.password}
                        onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                      />
                    </label>
                    <label>
                      Confirm password
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={signUpForm.confirm}
                        onChange={(e) => setSignUpForm({ ...signUpForm, confirm: e.target.value })}
                      />
                    </label>
                  </motion.div>

                  <AnimatePresence>
                    {signUpForm.password && (
                      <motion.ul
                        className="pw-rules"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {passwordChecks.map((r) => (
                          <li key={r.label} className={r.ok ? "ok" : ""}>
                            <span>{r.ok ? "✓" : "○"}</span> {r.label}
                          </li>
                        ))}
                        <li className={passwordsMatch ? "ok" : ""}>
                          <span>{passwordsMatch ? "✓" : "○"}</span> Passwords match
                        </li>
                      </motion.ul>
                    )}
                  </AnimatePresence>

                  <motion.label variants={field}>
                    <span>Address <em>(optional)</em></span>
                    <input
                      placeholder="Flat, street, landmark"
                      value={signUpForm.address}
                      onChange={(e) => setSignUpForm({ ...signUpForm, address: e.target.value })}
                    />
                  </motion.label>

                  {error && <motion.p className="auth-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}

                  <motion.button className="btn btn-block" type="submit" variants={field} whileTap={{ scale: 0.98 }}>
                    Create account
                  </motion.button>

                  <motion.p className="modal-switch" variants={field}>
                    Already have an account?{" "}
                    <button type="button" onClick={() => switchTo("signin")}>Sign in</button>
                  </motion.p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
