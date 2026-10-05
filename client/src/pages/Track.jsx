import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import LiveMap from "../components/LiveMap";
import { useLiveBooking } from "../hooks/useLiveBooking";
import { addressLine, rupees } from "../lib/format";
import { distanceKm, etaMinutes } from "../lib/geo";
import { formatSlot } from "../lib/slots";

const STEPS = [
  { status: "confirmed", label: "Booked" },
  { status: "assigned", label: "Professional assigned" },
  { status: "on-the-way", label: "On the way" },
  { status: "arrived", label: "Arrived" },
  { status: "completed", label: "Completed" },
];

function headline(b, eta) {
  const name = b.professional?.name.split(" ")[0];
  switch (b.status) {
    case "confirmed":
      return { title: "Finding a professional for you", sub: `Your slot: ${formatSlot(b.slot)}` };
    case "assigned":
      return { title: `${name} will be there on ${formatSlot(b.slot)}`, sub: "You'll see them on the map once they start the trip." };
    case "on-the-way":
      return {
        title: eta ? `${name} is ${eta.minutes} min away` : `${name} is on the way`,
        sub: eta ? `${eta.km.toFixed(1)} km from your home · updating live` : "Waiting for their location…",
      };
    case "arrived":
      return { title: `${name} has arrived`, sub: "Please meet them at the door." };
    case "completed":
      return { title: "Service completed", sub: "Thanks for booking with Servify!" };
    default:
      return { title: "Booking cancelled", sub: "" };
  }
}

export default function Track() {
  const { id } = useParams();
  const { booking: b, state } = useLiveBooking(id);

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
  const reached = STEPS.findIndex((s) => s.status === b.status);

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
                <span>Verified Servify professional · ★ 4.8</span>
              </div>
              {b.professional.phone && !["completed", "cancelled"].includes(b.status) && (
                <a className="btn-ghost" href={`tel:+91${b.professional.phone}`}>📞 Call</a>
              )}
            </div>
          ) : (
            <div className="co-card track-pro is-waiting">
              <span className="track-avatar">⏳</span>
              <div>
                <strong>Assigning a professional</strong>
                <span>We'll notify you as soon as someone accepts.</span>
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
            <p>
              💳 {b.payment.method === "upi" ? "UPI" : "Cash on delivery"} · <strong>{rupees(b.bill.total)}</strong>
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
