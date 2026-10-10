import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import LiveMap from "../components/LiveMap";
import { useLiveBooking } from "../hooks/useLiveBooking";
import { api } from "../lib/api";
import { addressLine, rupees } from "../lib/format";
import { distanceKm, etaMinutes } from "../lib/geo";
import { formatSlot } from "../lib/slots";

const STEPS = [
  { status: "searching", label: "Booked" },
  { status: "assigned", label: "Professional accepted" },
  { status: "on-the-way", label: "On the way" },
  { status: "arrived", label: "Arrived" },
  { status: "in-progress", label: "Service in progress" },
  { status: "completed", label: "Completed" },
];
const CANCELLABLE = ["searching", "unassigned", "assigned"];

const VERDICT = {
  fair: { label: "Fair price", tone: "fair" },
  "slightly-high": { label: "A little above the usual price", tone: "warn" },
  high: { label: "Well above the usual price", tone: "high" },
};

/** A spare part the professional wants to fit, with the AI's fair price range. */
function PartCard({ part, busy, onDecide }) {
  const verdict = VERDICT[part.verdict];
  return (
    <div className={`part-card is-${part.status}`}>
      <div className="part-top">
        <div>
          <strong>🔩 {part.name}</strong>
          {part.description && <span>{part.description}</span>}
        </div>
        <span className="part-quote">₹{part.quoted.toLocaleString("en-IN")}</span>
      </div>
      <div className="part-fair">
        <span>
          Usual price in Telangana: <strong>₹{part.fairLow.toLocaleString("en-IN")}–₹{part.fairHigh.toLocaleString("en-IN")}</strong>
        </span>
        <span className={`part-verdict is-${verdict.tone}`}>{verdict.label}</span>
      </div>
      {part.notes && <p className="part-notes">{part.notes}</p>}
      <p className="part-ai">
        {part.source === "list"
          ? "From Servify's price list of common parts; brand and size change the price."
          : `AI estimate from the professional's photo${part.confidence === "low" ? " (not very sure)" : ""}.`}{" "}
        Ask them if anything looks off.
      </p>
      {part.status === "pending" ? (
        <div className="part-actions">
          <button className="btn" disabled={busy} onClick={() => onDecide("approve")}>Approve ₹{part.quoted.toLocaleString("en-IN")}</button>
          <button className="btn-ghost" disabled={busy} onClick={() => onDecide("decline")}>Decline</button>
        </div>
      ) : (
        <p className={`part-status is-${part.status}`}>{part.status === "approved" ? "✓ You approved this part" : "✕ You declined this part"}</p>
      )}
    </div>
  );
}

/** Seconds until `at`, ticking; 0 once it's passed. */
function useSecondsUntil(at) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!at) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [at]);
  return at ? Math.max(0, Math.ceil((new Date(at).getTime() - now) / 1000)) : 0;
}

const searchingSub = (d) => {
  if (!d) return "Asking professionals near you…";
  const asked = d.asked ? `Asked ${d.asked} of ${d.nearby} nearby professional${d.nearby === 1 ? "" : "s"}` : "Asking professionals near you";
  return `${asked}. You'll get a notification the moment someone accepts.`;
};

function headline(b, eta) {
  const name = b.professional?.name.split(" ")[0];
  switch (b.status) {
    case "searching":
      return { title: "Finding a professional for you", sub: searchingSub(b.dispatch) };
    case "unassigned":
      return b.dispatch?.serving
        ? {
            title: "Everyone nearby is busy right now",
            sub: "No professional could take this yet. Please wait a little and try again — your booking is saved.",
          }
        : {
            title: "No professionals near you yet",
            sub: "We're still adding professionals for this service in your area. Try again later — your booking is saved.",
          };
    case "assigned":
      return { title: `Yay! ${b.professional.name} accepted your request`, sub: `They'll be there on ${formatSlot(b.slot)}. You'll see them on the map once they start the trip.` };
    case "on-the-way":
      return {
        title: eta ? `${name} is ${eta.minutes} min away` : `${name} is on the way`,
        sub: eta ? `${eta.km.toFixed(1)} km from your home · updating live` : "Waiting for their location…",
      };
    case "arrived":
      return { title: `${name} has arrived`, sub: "Share the start code below with them so they can begin." };
    case "in-progress":
      return { title: `${name} is working on it`, sub: b.amountDue > 0 ? `Pay ${rupees(b.amountDue)} by cash or UPI when the job is done.` : "Already paid — sit back and relax." };
    case "completed":
      return { title: "Service completed", sub: "Thanks for booking with Servify!" };
    default:
      return { title: "Booking cancelled", sub: "" };
  }
}

export default function Track() {
  const { id } = useParams();
  const { booking: b, state, setBooking } = useLiveBooking(id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const retryIn = useSecondsUntil(b?.status === "unassigned" ? b.dispatch?.retryAt : null);

  const act = async (path, body) => {
    setBusy(true);
    setError("");
    try {
      const res = await api(`/bookings/${id}/${path}`, { method: "POST", body });
      setBooking(res.booking);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  if (state === "failed" && !b) {
    return (
      <main className="page">
        <div className="cart-empty">
          <span>🔍</span>
          <p className="muted">We couldn't find that booking.</p>
          <Link to="/bookings" className="btn">My bookings</Link>
        </div>
      </main>
    );
  }
  if (!b) return <main className="page"><p className="muted">Loading your booking…</p></main>;

  const home = b.address.lat != null ? { lat: b.address.lat, lng: b.address.lng } : null;
  const moving = ["on-the-way", "arrived"].includes(b.status) && b.tracking;
  const km = moving && home ? distanceKm(b.tracking, home) : null;
  const eta = b.status === "on-the-way" && km != null ? { km, minutes: etaMinutes(km) } : null;
  const head = headline(b, eta);
  const reached = b.status === "unassigned" ? 0 : STEPS.findIndex((s) => s.status === b.status);

  return (
    <main className="page track">
      <div className="crumb">
        <Link to="/bookings">My bookings</Link> <span>›</span> #{b.id.slice(-6).toUpperCase()}
      </div>

      <div className="track-layout">
        <section className="track-main">
          <motion.div className="track-head" key={b.status} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <h1>{head.title}</h1>
              <p>{head.sub}</p>
            </div>
            <span className={`live-dot is-${state}`}>{state === "live" ? "Live" : state === "failed" ? "Offline" : "Connecting…"}</span>
          </motion.div>

          {b.status === "searching" && (
            <div className="searching" aria-hidden="true">
              <span /><span /><span />
              <em>🔍</em>
            </div>
          )}

          {b.status === "searching" && b.dispatch?.offeredTo && (
            <p className="dev-hint">
              Testing: the request is with <strong>{b.dispatch.offeredTo.name}</strong> ({b.dispatch.offeredTo.email}). Sign in as them in
              another browser to accept or reject.
            </p>
          )}

          {b.status === "unassigned" && (
            <div className="co-card retry-card">
              <p>⏳ We'll keep your booking. Try again in a bit — professionals come online all the time.</p>
              <button className="btn" disabled={busy || retryIn > 0} onClick={() => act("retry")}>
                {retryIn > 0 ? `Try again in ${Math.floor(retryIn / 60)}:${String(retryIn % 60).padStart(2, "0")}` : busy ? "Searching…" : "🔁 Find a professional again"}
              </button>
            </div>
          )}

          {b.status === "arrived" && b.otp?.code && (
            <motion.div className="otp-card" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <span>Your start code</span>
              <strong aria-label={`Start code ${b.otp.code.split("").join(" ")}`}>{b.otp.code}</strong>
              <p>Tell this to {b.professional?.name.split(" ")[0]} only once they're at your door. We've also sent it to +91 {b.phone}.</p>
            </motion.div>
          )}

          {b.parts?.length > 0 && (
            <section className="parts">
              <h2>Spare parts</h2>
              {b.parts.map((p) => (
                <PartCard key={p.id} part={p} busy={busy} onDecide={(decision) => act(`parts/${p.id}`, { decision })} />
              ))}
            </section>
          )}

          {error && <p className="auth-error">{error}</p>}

          {home && <LiveMap home={home} pro={moving ? { lat: b.tracking.lat, lng: b.tracking.lng } : null} className="track-map" />}

          {b.status !== "cancelled" && (
            <ol className="track-steps">
              {STEPS.map((s, i) => (
                <li key={s.status} className={i < reached ? "is-done" : i === reached ? "is-now" : ""}>
                  <span className="track-step-dot" aria-hidden="true">{i < reached ? "✓" : ""}</span>
                  {s.label}
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="track-side">
          {b.professional ? (
            <div className="co-card track-pro">
              <span className="track-avatar">
                {b.professional.avatar ? (
                  <img src={b.professional.avatar} alt="" referrerPolicy="no-referrer" />
                ) : (
                  b.professional.name.charAt(0).toUpperCase()
                )}
              </span>
              <div>
                <strong>{b.professional.name}</strong>
                <span>Verified Servify professional · ★ {b.professional.rating ?? 4.8}</span>
              </div>
              {b.professional.phone && !["completed", "cancelled"].includes(b.status) && (
                <a className="btn-ghost" href={`tel:+91${b.professional.phone}`}>📞 Call</a>
              )}
            </div>
          ) : (
            <div className="co-card track-pro is-waiting">
              <span className="track-avatar">⏳</span>
              <div>
                <strong>{b.status === "unassigned" ? "No professional yet" : "Assigning a professional"}</strong>
                <span>
                  {b.status !== "unassigned"
                    ? "We'll notify you as soon as someone accepts."
                    : b.dispatch?.serving
                      ? "Everyone nearby is busy. Try again soon."
                      : "None in your area yet. Try again later."}
                </span>
              </div>
            </div>
          )}

          <div className="co-card track-details">
            <h3>Booking details</h3>
            <ul>
              {b.items.map((i) => (
                <li key={i.id}>
                  <span>{i.qty > 1 ? `${i.name} × ${i.qty}` : i.name}</span>
                  <span>{rupees(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <p>🕘 {formatSlot(b.slot)}</p>
            <p>📍 {addressLine(b.address)}</p>
            {b.note && <p dir="auto">📝 {b.note}</p>}
            <p>
              💳 {b.payment.status === "paid" ? "Paid" : b.payment.method === "upi" ? "UPI" : "Cash on delivery"} · <strong>{rupees(b.bill.total)}</strong>
            </p>
            {b.partsTotal > 0 && (
              <p>
                🔩 Spare parts · <strong>{rupees(b.partsTotal)}</strong>
                {b.status !== "completed" && " (pay the professional at the end)"}
              </p>
            )}
          </div>

          {CANCELLABLE.includes(b.status) && (
            <button
              className="btn-ghost track-cancel"
              disabled={busy}
              onClick={() => window.confirm("Cancel this booking?") && act("cancel")}
            >
              Cancel booking
            </button>
          )}
        </aside>
      </div>
    </main>
  );
}
