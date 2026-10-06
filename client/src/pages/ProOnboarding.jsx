import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../lib/api";
import { AREAS } from "../lib/areas";
import { compressImage } from "../lib/image";
import { locateMe } from "../lib/places";

const STEPS = ["Services", "Service area", "Identity", "Payouts"];
const ID_TYPES = [
  { value: "aadhaar", label: "Aadhaar card" },
  { value: "pan", label: "PAN card" },
  { value: "voter", label: "Voter ID" },
  { value: "dl", label: "Driving licence" },
  { value: "passport", label: "Passport" },
];

const EMPTY = {
  skills: [],
  experienceYears: "",
  about: "",
  area: null,
  radiusKm: 8,
  idType: "aadhaar",
  idLast4: "",
  idImage: null,
  payoutMethod: "upi",
  upiId: "",
  holder: "",
  accountNumber: "",
  accountConfirm: "",
  ifsc: "",
};

/** What can be sent for each step, or a message saying what's missing. */
function stepPayload(step, f, profile) {
  if (step === 0) {
    if (f.skills.length === 0) return { error: "Pick at least one service you offer." };
    if (f.experienceYears === "") return { error: "Enter your years of experience." };
    return { body: { skills: f.skills, experienceYears: Number(f.experienceYears), about: f.about } };
  }
  if (step === 1) {
    if (!f.area) return { error: "Choose where you're based." };
    return { body: { area: f.area, radiusKm: Number(f.radiusKm) } };
  }
  if (step === 2) {
    if (!f.idImage && profile?.idDoc.status === "approved") return { body: null };
    if (f.idLast4.length !== 4) return { error: "Enter the last 4 characters of your ID number." };
    if (!f.idImage) return { error: "Add a clear photo of your ID." };
    return {
      body: { idDoc: { type: f.idType, last4: f.idLast4, image: { mediaType: f.idImage.mediaType, data: f.idImage.data } } },
    };
  }
  if (f.payoutMethod === "upi") return { body: { payout: { method: "upi", upiId: f.upiId } } };
  if (f.accountNumber !== f.accountConfirm) return { error: "The account numbers don't match." };
  return { body: { payout: { method: "bank", holder: f.holder, ifsc: f.ifsc, accountNumber: f.accountNumber } } };
}

/** Joining as a professional: services, area, ID check and payout details, one step at a time. */
export default function ProOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [skills, setSkills] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  // Returning professionals continue where they left off.
  useEffect(() => {
    api("/pro/profile").then(
      ({ profile: p, skills: list }) => {
        setSkills(list);
        setProfile(p);
        setForm((f) => ({
          ...f,
          skills: p.skills,
          experienceYears: p.skills.length ? String(p.experienceYears) : "",
          about: p.about,
          area: p.area,
          radiusKm: p.radiusKm,
          payoutMethod: p.payout?.method || "upi",
          upiId: p.payout?.upiId || "",
          holder: p.payout?.holder || "",
          ifsc: p.payout?.ifsc || "",
        }));
      },
      (err) => setError(err.message)
    );
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleSkill = (key) =>
    set({ skills: form.skills.includes(key) ? form.skills.filter((k) => k !== key) : [...form.skills, key] });

  const next = async () => {
    setError("");
    const { body, error: problem } = stepPayload(step, form, profile);
    if (problem) return setError(problem);
    if (body) {
      setSaving(true);
      try {
        const saved = await api("/pro/profile", { method: "PUT", body });
        setProfile(saved.profile);
        if (step === 2 && saved.profile.idDoc.status !== "approved") {
          set({ idImage: null });
          return setError(saved.profile.idDoc.reason || "We couldn't verify that ID. Please try another photo.");
        }
      } catch (err) {
        return setError(err.message);
      } finally {
        setSaving(false);
      }
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else setStep(STEPS.length);
  };

  const useMyLocation = async () => {
    setLocating(true);
    setError("");
    try {
      const place = await locateMe();
      set({ area: { label: [place.title, place.subtitle].filter(Boolean).join(", "), lat: place.lat, lng: place.lng } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  };

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      set({ idImage: await compressImage(file) });
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const done = step === STEPS.length;

  return (
    <main className="page onboard">
      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>Join Servify as a professional</motion.h1>
      <p className="auth-sub">A few details so we can send you the right jobs and pay you on time.</p>

      {!done && (
        <ol className="onboard-steps">
          {STEPS.map((label, i) => (
            <li key={label} className={i < step ? "is-done" : i === step ? "is-now" : ""}>
              <span>{i < step ? "✓" : i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      )}

      <AnimatePresence mode="wait">
        <motion.section
          key={step}
          className="onboard-card"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && (
            <>
              <h2>What services do you offer?</h2>
              <div className="onboard-skills">
                {skills.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className={form.skills.includes(s.key) ? "active" : ""}
                    aria-pressed={form.skills.includes(s.key)}
                    onClick={() => toggleSkill(s.key)}
                  >
                    <span aria-hidden="true">{s.icon}</span> {s.label}
                  </button>
                ))}
              </div>
              <label className="onboard-field onboard-narrow">
                Years of experience
                <input
                  inputMode="numeric"
                  value={form.experienceYears}
                  onChange={(e) => set({ experienceYears: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                  placeholder="5"
                />
              </label>
              <label className="onboard-field">
                <span>
                  Tell customers about your experience <em>(English, తెలుగు, हिंदी or اردو)</em>
                </span>
                <textarea
                  dir="auto"
                  rows={4}
                  maxLength={1000}
                  value={form.about}
                  onChange={(e) => set({ about: e.target.value })}
                  placeholder="I have 5 years of experience in bathroom and kitchen cleaning…"
                />
              </label>
            </>
          )}

          {step === 1 && (
            <>
              <h2>Where are you based?</h2>
              <p className="co-hint">You'll get requests from customers within your travel distance of this place.</p>
              <button className="btn-ghost onboard-locate" type="button" onClick={useMyLocation} disabled={locating}>
                {locating ? "Finding you…" : "📍 Use my current location"}
              </button>
              <div className="onboard-areas">
                {AREAS.map((a) => (
                  <button
                    key={a.name}
                    type="button"
                    className={form.area?.label === a.label ? "active" : ""}
                    onClick={() => set({ area: { label: a.label, lat: a.lat, lng: a.lng } })}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
              {form.area && <p className="onboard-picked">Based in <strong>{form.area.label}</strong></p>}
              <label className="onboard-field">
                How far will you travel? <strong>{form.radiusKm} km</strong>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={form.radiusKm}
                  onChange={(e) => set({ radiusKm: Number(e.target.value) })}
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Verify your identity</h2>
              {profile?.idDoc.status === "approved" && !form.idImage ? (
                <p className="onboard-verified">
                  ✓ Your {ID_TYPES.find((t) => t.value === profile.idDoc.type)?.label} ending {profile.idDoc.last4} is verified.
                  You can continue, or upload a new one.
                </p>
              ) : (
                <p className="co-hint">
                  Our AI checks that the photo is a real ID with your name on it. We keep only the last 4 characters of
                  the number; the photo itself is not stored.
                </p>
              )}
              <div className="onboard-row">
                <label className="onboard-field">
                  ID type
                  <select value={form.idType} onChange={(e) => set({ idType: e.target.value })}>
                    {ID_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>
                <label className="onboard-field">
                  Last 4 characters of the number
                  <input
                    maxLength={4}
                    value={form.idLast4}
                    onChange={(e) => set({ idLast4: e.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 4) })}
                    placeholder="1234"
                  />
                </label>
              </div>
              <label className="onboard-upload">
                <input type="file" accept="image/*" capture="environment" onChange={pickPhoto} />
                {form.idImage ? (
                  <img src={form.idImage.preview} alt="Your ID photo" />
                ) : (
                  <span>📷 Take or upload a photo of the front of your ID</span>
                )}
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Where should we send your earnings?</h2>
              <div className="role-toggle">
                {[
                  { value: "upi", label: "📱 UPI ID" },
                  { value: "bank", label: "🏦 Bank account" },
                ].map((m) => (
                  <button
                    type="button"
                    key={m.value}
                    className={form.payoutMethod === m.value ? "active" : ""}
                    onClick={() => set({ payoutMethod: m.value })}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {form.payoutMethod === "upi" ? (
                <label className="onboard-field">
                  UPI ID
                  <input value={form.upiId} onChange={(e) => set({ upiId: e.target.value.trim() })} placeholder="yourname@okhdfcbank" />
                </label>
              ) : (
                <>
                  <label className="onboard-field">
                    Account holder's name
                    <input value={form.holder} onChange={(e) => set({ holder: e.target.value })} placeholder="As printed on your passbook" />
                  </label>
                  <div className="onboard-row">
                    <label className="onboard-field">
                      Account number
                      <input
                        inputMode="numeric"
                        value={form.accountNumber}
                        onChange={(e) => set({ accountNumber: e.target.value.replace(/\D/g, "").slice(0, 18) })}
                      />
                    </label>
                    <label className="onboard-field">
                      Confirm account number
                      <input
                        inputMode="numeric"
                        value={form.accountConfirm}
                        onChange={(e) => set({ accountConfirm: e.target.value.replace(/\D/g, "").slice(0, 18) })}
                      />
                    </label>
                  </div>
                  <label className="onboard-field onboard-narrow">
                    IFSC code
                    <input value={form.ifsc} onChange={(e) => set({ ifsc: e.target.value.toUpperCase().slice(0, 11) })} placeholder="SBIN0001234" />
                  </label>
                  {profile?.payout?.accountLast4 && !form.accountNumber && (
                    <p className="co-hint">Saved account ends in {profile.payout.accountLast4}. Enter it again to change it.</p>
                  )}
                </>
              )}
              <p className="co-hint">
                Payouts go to UPI or a bank account. We don't take card numbers: storing them safely needs a certified
                payment provider.
              </p>
            </>
          )}

          {done && (
            <div className="onboard-done">
              <span className="onboard-done-icon">🎉</span>
              <h2>You're all set!</h2>
              <p>Your profile is verified. Go online on your dashboard to start receiving job requests near you.</p>
              <button className="btn" onClick={() => navigate("/professional/dashboard")}>Go to dashboard</button>
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          {!done && (
            <div className="onboard-actions">
              {step > 0 && (
                <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)} disabled={saving}>
                  Back
                </button>
              )}
              <button type="button" className="btn" onClick={next} disabled={saving}>
                {saving ? (step === 2 && form.idImage ? "Checking your ID…" : "Saving…") : step === STEPS.length - 1 ? "Finish" : "Continue"}
              </button>
            </div>
          )}
        </motion.section>
      </AnimatePresence>
    </main>
  );
}
