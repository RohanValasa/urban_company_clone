import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import { useCart } from "../context/CartContext";
import { useSpeech } from "../hooks/useSpeech";
import { api } from "../lib/api";
import { getConfig } from "../lib/config";
import { compressImage } from "../lib/image";
import { saveDraft } from "../lib/aiDraft";
import { findPackage } from "../data/services";
import { rupees } from "../lib/format";
import { formatSlot } from "../lib/slots";

const VOICES = [
  { lang: "te-IN", label: "తెలుగు" },
  { lang: "hi-IN", label: "हिंदी" },
  { lang: "ur-IN", label: "اردو" },
  { lang: "en-IN", label: "English" },
];

const EXAMPLES = [
  "My AC is dripping water inside the room",
  "కిచెన్ సింక్ బ్లాక్ అయింది, రేపు ఉదయం రావాలి",
  "बाथरूम में बहुत कॉकरोच हैं",
  "Switch board is sparking when I turn on the geyser",
  "Naa washing machine spin avvatledu",
];

export default function AskAI() {
  const { user } = useAuth();
  const { openAuth } = useUI();
  const { addItem, setQty, qtyOf } = useCart();
  const navigate = useNavigate();

  const [mode, setMode] = useState(null);
  const [voice, setVoice] = useState("te-IN");
  const [text, setText] = useState("");
  const [partial, setPartial] = useState("");
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // What was typed before the mic started; speech is appended to it.
  const [typedBefore, setTypedBefore] = useState("");
  const speech = useSpeech({
    lang: voice,
    onText: (heard, speaking) => {
      setText([typedBefore, heard].filter(Boolean).join(" "));
      setPartial(speaking);
    },
  });

  useEffect(() => {
    let live = true;
    getConfig().then((c) => live && setMode(c.aiMode || "basic"), () => {});
    return () => {
      live = false;
    };
  }, []);

  const toggleMic = () => {
    if (speech.listening) return speech.stop();
    setTypedBefore(text.trim());
    speech.start();
  };

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      setPhoto(await compressImage(file, 1280, 0.82));
    } catch (err) {
      setError(err.message);
    }
  };

  const ask = async (e) => {
    e?.preventDefault();
    if (speech.listening) speech.stop();
    if (!user) {
      openAuth("signin");
      return;
    }
    if (!text.trim() && !photo) {
      setError("Tell us about the problem, or add a photo.");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const body = { text: text.trim() };
      if (photo) body.image = { mediaType: photo.mediaType, data: photo.data };
      setResult(await api("/ai/assist", { method: "POST", body }));
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  const book = () => {
    for (const item of result.items) {
      const image = findPackage(item.sub, item.id)?.image;
      addItem({ _id: item.id, name: item.name, price: item.price, mrp: item.mrp, category: item.category, sub: item.sub, image });
      setQty(item.id, Math.max(item.qty, qtyOf(item.id) + 1));
    }
    saveDraft({ slot: result.slot, note: result.issue });
    navigate("/cart");
  };

  const alarm = result && ["emergency", "urgent"].includes(result.urgency);

  return (
    <main className="page ask">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <span className="ask-eyebrow">✨ New · Servify AI</span>
        <h1>Show us or tell us the problem</h1>
        <p className="auth-sub">
          Snap a photo, speak, or type in English, తెలుగు, हिंदी or اردو. We'll work out what's wrong and pick the right
          service for you.
        </p>
      </motion.div>

      {mode === "basic" && (
        <p className="ask-off">
          Basic mode: we match the words you type or say. Photos need the full AI, which isn't set up on this server
          (add <code>GEMINI_API_KEY</code> to <code>server/.env</code>).
        </p>
      )}

      <form className="ask-box" onSubmit={ask}>
        <label className="ask-text">
          <span className="sr-only">Describe the problem</span>
          <textarea
            dir="auto"
            rows={4}
            maxLength={1000}
            value={partial ? `${text} ${partial}`.trim() : text}
            onChange={(e) => setText(e.target.value)}
            readOnly={speech.listening}
            placeholder="e.g. Naa bathroom tap leak avtundi, repu morning evaraina pampandi"
          />
        </label>

        <div className="ask-tools">
          {speech.supported && (
            <>
              <select value={voice} onChange={(e) => setVoice(e.target.value)} aria-label="Language to speak in" disabled={speech.listening}>
                {VOICES.map((v) => (
                  <option key={v.lang} value={v.lang}>{v.label}</option>
                ))}
              </select>
              <button
                type="button"
                className={`ask-mic ${speech.listening ? "is-on" : ""}`}
                onClick={toggleMic}
                aria-pressed={speech.listening}
              >
                <span aria-hidden="true">🎙️</span> {speech.listening ? "Listening… tap to stop" : "Speak"}
              </button>
            </>
          )}
          <label className="ask-photo-btn">
            <input type="file" accept="image/*" capture="environment" onChange={pickPhoto} />
            <span aria-hidden="true">📷</span> {photo ? "Change photo" : "Add photo"}
          </label>
          {photo && (
            <span className="ask-thumb">
              <img src={photo.preview} alt="Your photo of the problem" />
              <button type="button" onClick={() => setPhoto(null)} aria-label="Remove photo">×</button>
            </span>
          )}
          <button className="btn ask-go" disabled={busy}>
            {busy ? "Looking…" : "Find the right service"}
          </button>
        </div>
        {speech.error && <p className="auth-error">{speech.error}</p>}
        {!speech.supported && <p className="co-hint">Voice typing works in Chrome, Edge and Safari. You can type in any language here.</p>}
        <p className="co-hint">
          {mode === "basic" ? "Nothing you type is stored." : "Your photo is checked by AI and not stored."} Voice is turned into
          text by your browser's speech service.
        </p>
      </form>

      {!result && !busy && (
        <div className="ask-examples">
          <span>Try:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" dir="auto" onClick={() => setText(ex)}>{ex}</button>
          ))}
        </div>
      )}

      {busy && (
        <div className="ask-thinking" role="status">
          <span /><span /><span />
          Looking at the problem…
        </div>
      )}
      {error && <p className="auth-error" style={{ marginTop: 14 }}>{error}</p>}

      <AnimatePresence>
        {result && (
          <motion.section className="ask-result" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {result.safetyTip && (
              <p className={`ask-safety ${alarm ? "is-alarm" : ""}`} dir="auto" role="alert">
                ⚠️ {result.safetyTip}
              </p>
            )}
            <p className="ask-reply" dir="auto">{result.reply}</p>
            {result.fellBack && <p className="ask-mode">The AI is busy right now, so basic mode answered.</p>}

            {result.understood && (
              <>
                <div className="ask-service">
                  <span>Suggested</span>
                  <strong>{result.service.label}</strong>
                </div>
                <ul className="ask-items">
                  {result.items.map((i) => (
                    <li key={i.id}>
                      <div>
                        <strong>{i.name}</strong>
                        {i.duration && <span>{i.duration}</span>}
                      </div>
                      <span className="ask-price">
                        {i.qty > 1 && `${i.qty} × `}
                        {rupees(i.price)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="ask-total">
                  Estimated <strong>{rupees(result.total)}</strong> <span>+ taxes and visit fee</span>
                </p>
                {result.whatToExpect && <p className="ask-expect" dir="auto">🧰 {result.whatToExpect}</p>}
                {result.slot && <p className="ask-slot">🕘 {formatSlot(result.slot)}: we'll pick this time at checkout.</p>}
                {result.slotUnavailable && <p className="ask-slot">🕘 That time isn't bookable, so pick a slot at checkout.</p>}
                {result.issue && (
                  <p className="ask-note">
                    <span>Note for the professional</span>
                    {result.issue}
                  </p>
                )}
                <div className="ask-actions">
                  <button className="btn" onClick={book}>Add to cart & book</button>
                  <Link className="btn-ghost" to={`/s/${result.service.slug}`}>See all {result.service.label} options</Link>
                </div>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
