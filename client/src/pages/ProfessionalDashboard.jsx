import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import TripSharer from "../components/TripSharer";
import PaymentSuccess from "../components/PaymentSuccess";
import UpiQr from "../components/checkout/UpiQr";
import { api } from "../lib/api";
import { getConfig } from "../lib/config";
import { addressLine, rupees } from "../lib/format";
import { formatSlot } from "../lib/slots";
import { compressImage } from "../lib/image";

const STATUS_LABEL = {
  assigned: "Accepted",
  "on-the-way": "On the way",
  arrived: "At the customer",
  "in-progress": "Working",
  completed: "Completed",
  cancelled: "Cancelled",
};
const ACTIVE = ["assigned", "on-the-way", "arrived", "in-progress"];
const CELEBRATE_MS = 2200;

const services = (items) => items.map((i) => (i.qty > 1 ? `${i.name} × ${i.qty}` : i.name)).join(", ");
// What the professional keeps: the service minus Servify's taxes and fee, plus parts they fitted.
const payoutOf = (job) => job.bill.total - job.bill.taxesAndFee + (job.partsTotal || 0);

const VERDICT_LABEL = { fair: "Fair price", "slightly-high": "A little high", high: "High" };
const PART_STATUS = { pending: "Waiting for the customer", approved: "Approved", declined: "Declined" };

/** Photograph a part, enter your price; the AI shows the customer a fair range to approve against. */
function PartCheck({ job, onChange }) {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [note, setNote] = useState("");
  const [quoted, setQuoted] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setPhoto(await compressImage(file, 1280, 0.82));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/pro/jobs/${job.id}/parts`, {
        method: "POST",
        body: { image: { mediaType: photo.mediaType, data: photo.data }, note, quoted: Number(quoted) },
      });
      setPhoto(null);
      setNote("");
      setQuoted("");
      setOpen(false);
      onChange();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="part-check">
      {job.parts.length > 0 && (
        <ul className="part-list">
          {job.parts.map((p) => (
            <li key={p.id} className={`is-${p.status}`}>
              <div>
                <strong>🔩 {p.name}</strong>
                <span>
                  Your price ₹{p.quoted.toLocaleString("en-IN")} · usual ₹{p.fairLow.toLocaleString("en-IN")}–₹{p.fairHigh.toLocaleString("en-IN")} ·{" "}
                  {VERDICT_LABEL[p.verdict]}
                </span>
              </div>
              <span className={`part-pill is-${p.status}`}>{PART_STATUS[p.status]}</span>
            </li>
          ))}
        </ul>
      )}
      {!open ? (
        <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>🔩 Needs a spare part? Check a fair price</button>
      ) : (
        <form className="part-form" onSubmit={submit}>
          <p className="co-hint">
            Take a photo of the part (the old one is fine) and enter your price. The AI shows the customer the usual price in
            Telangana, and they approve it before you fit it.
          </p>
          <label className="ask-photo-btn">
            <input type="file" accept="image/*" capture="environment" onChange={pick} />
            📷 {photo ? "Retake photo" : "Photo of the part"}
          </label>
          {photo && <img className="part-preview" src={photo.preview} alt="The part" />}
          <div className="part-fields">
            <label>
              What is it? <em>(optional)</em>
              <input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 6A MCB, tap spindle" />
            </label>
            <label>
              Your price (₹)
              <input inputMode="numeric" value={quoted} onChange={(e) => setQuoted(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="300" />
            </label>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <div className="part-actions">
            <button className="btn" disabled={!photo || !quoted || busy}>{busy ? "Checking the price…" : "Check price & send to customer"}</button>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Seconds left on an offer, ticking down. */
function Countdown({ until }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.round((new Date(until).getTime() - now) / 1000));
  return <span className={`offer-timer ${left <= 15 ? "is-low" : ""}`}>{left}s</span>;
}

/** The customer reads out a 4-digit code; typing it starts the job. */
function OtpEntry({ onSubmit, busy }) {
  const [code, setCode] = useState("");
  return (
    <form
      className="otp-entry"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(code);
      }}
    >
      <label>
        Ask the customer for the 4-digit start code sent to their phone
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="• • • •"
          aria-label="Start code"
        />
      </label>
      <button className="btn" disabled={code.length !== 4 || busy}>
        {busy ? "Checking…" : "Start job"}
      </button>
    </form>
  );
}

/** Closing a job: collect what's owed (cash or a UPI QR), unless it was paid at booking. */
function Settle({ job, upi, busy, onDone }) {
  const [showQr, setShowQr] = useState(false);
  const due = job.amountDue;
  if (job.parts.some((p) => p.status === "pending")) {
    return (
      <div className="settle">
        <p className="settle-wait">⏳ Waiting for {job.customerName || "the customer"} to approve or decline the spare part on their phone.</p>
      </div>
    );
  }
  if (due === 0) {
    return (
      <div className="settle">
        <p className="settle-paid">✓ Paid by UPI when booking. Nothing to collect.</p>
        <button className="btn" disabled={busy} onClick={() => onDone(null, "Paid online at booking")}>
          {busy ? "Completing…" : "✅ Complete job"}
        </button>
      </div>
    );
  }
  return (
    <div className="settle">
      <p className="settle-due">
        Collect <strong>{rupees(due)}</strong> from {job.customerName || "the customer"}
        {job.partsTotal > 0 && (
          <span className="settle-split">
            {job.payment.status === "due" ? `Service ${rupees(job.bill.total)} + parts ${rupees(job.partsTotal)}` : `Service paid online · parts ${rupees(job.partsTotal)}`}
          </span>
        )}
      </p>
      {upi && (
        <>
          <button className="btn-ghost" onClick={() => setShowQr((v) => !v)}>
            {showQr ? "Hide QR" : "📱 Show UPI QR to customer"}
          </button>
          {showQr && <UpiQr upi={upi} amount={due} note={`Servify job #${job.id.slice(-6).toUpperCase()}`} />}
        </>
      )}
      <div className="settle-actions">
        {upi && (
          <button className="btn" disabled={busy} onClick={() => onDone("upi", "Paid by UPI")}>
            Customer paid by UPI
          </button>
        )}
        <button className={upi ? "btn-ghost" : "btn"} disabled={busy} onClick={() => onDone("cash", "Collected in cash")}>
          💵 Collected cash
        </button>
      </div>
    </div>
  );
}

export default function ProfessionalDashboard() {
  const { user } = useAuth();
  const { listen } = useNotifications();
  const [profile, setProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [jobs, setJobs] = useState(null);
  const [upi, setUpi] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [celebrate, setCelebrate] = useState(null);

  const load = useCallback(async () => {
    try {
      const [p, o, j] = await Promise.all([api("/pro/profile"), api("/pro/offers"), api("/pro/jobs")]);
      setProfile(p.profile);
      setOffers(o.offers);
      setJobs(j.jobs);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    let live = true;
    const tick = () => live && load();
    tick();
    // New offers arrive as notifications; this is a fallback.
    const timer = setInterval(tick, 20000);
    getConfig().then((c) => live && setUpi(c.upi), () => {});
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [load]);

  useEffect(() => listen(() => load()), [listen, load]);

  const act = async (id, run) => {
    setBusy(id);
    setError("");
    try {
      await run();
    } catch (err) {
      setError(err.message);
    }
    await load();
    setBusy(null);
  };

  const toggleOnline = () =>
    act("online", async () => {
      const res = await api("/pro/online", { method: "PATCH", body: { online: !profile.online } });
      setProfile(res.profile);
    });

  const complete = (job, collected, how) =>
    act(job.id, async () => {
      setCelebrate({ amount: job.amountDue || job.bill.total, how });
      await new Promise((r) => setTimeout(r, CELEBRATE_MS));
      await api(`/pro/jobs/${job.id}/complete`, { method: "POST", body: collected ? { collected } : {} });
      setCelebrate(null);
    });

  const all = jobs || [];
  const active = all.filter((j) => ACTIVE.includes(j.status));
  const done = all.filter((j) => j.status === "completed");
  const earned = done.reduce((sum, j) => sum + payoutOf(j), 0);
  const ready = profile?.status.ready;

  return (
    <main className="page pro">
      <div className="pro-head">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            Welcome, {user?.name?.split(" ")[0] ?? "Pro"} 👋
          </motion.h1>
          <p className="auth-sub">Requests from customers near you show up here instantly.</p>
        </div>
        {profile && (
          <button
            className={`online-toggle ${profile.online ? "is-on" : ""}`}
            onClick={toggleOnline}
            disabled={!ready || busy === "online"}
            aria-pressed={profile.online}
          >
            <span className="online-knob" aria-hidden="true" />
            {profile.online ? "Online" : "Offline"}
          </button>
        )}
      </div>

      {profile && !ready && (
        <div className="pro-banner">
          <strong>Finish your profile to start getting jobs.</strong>
          <span>
            {[...profile.status.missing, profile.status.idStatus !== "approved" && "ID verification"].filter(Boolean).join(", ")}
          </span>
          <Link to="/professional/onboarding" className="btn">Complete profile</Link>
        </div>
      )}

      <div className="stat-row">
        {[
          { label: "Active jobs", value: active.length },
          { label: "Jobs completed", value: done.length },
          { label: "Earned", value: rupees(earned) },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {error && <p className="auth-error" style={{ marginTop: 16 }}>{error}</p>}

      <h2 className="section-title">New requests</h2>
      {offers.length === 0 ? (
        <p className="muted">
          {profile?.online ? "No requests right now. New ones pop up here as soon as a nearby customer books." : "Go online to receive requests."}
        </p>
      ) : (
        <ul className="job-list">
          <AnimatePresence>
            {offers.map((o) => (
              <motion.li
                key={o.id}
                className="job-card is-offer"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30 }}
              >
                <div className="job-top">
                  <div>
                    <h3>{services(o.items)}</h3>
                    <span className="muted-inline">
                      🕘 {formatSlot(o.slot)} · 📍 {o.area}
                      {o.distanceKm != null && ` · ${o.distanceKm} km away`}
                    </span>
                    {o.note && <p className="job-note" dir="auto">📝 {o.note}</p>}
                  </div>
                  <div className="offer-side">
                    <span className="job-payout">{rupees(o.payout)}</span>
                    <Countdown until={o.expiresAt} />
                  </div>
                </div>
                <div className="offer-actions">
                  <button className="btn" disabled={busy === o.id} onClick={() => act(o.id, () => api(`/pro/offers/${o.id}/accept`, { method: "POST" }))}>
                    Accept
                  </button>
                  <button className="btn-ghost" disabled={busy === o.id} onClick={() => act(o.id, () => api(`/pro/offers/${o.id}/reject`, { method: "POST" }))}>
                    Reject
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {active.length > 0 && (
        <>
          <h2 className="section-title">Your jobs</h2>
          <ul className="job-list">
            {active.map((j) => (
              <li key={j.id} className="job-card is-mine">
                <div className="job-top">
                  <div>
                    <h3>{services(j.items)}</h3>
                    <span className="muted-inline">🕘 {formatSlot(j.slot)}</span>
                  </div>
                  <span className="status-pill status-confirmed">{STATUS_LABEL[j.status]}</span>
                </div>
                <div className="job-customer">
                  <span>👤 {j.customerName}</span>
                  {j.note && <span className="job-note" dir="auto">📝 {j.note}</span>}
                  <span>📍 {addressLine(j.address)}</span>
                  <span>
                    📞 <a href={`tel:+91${j.phone}`}>+91 {j.phone}</a>
                    {j.avoidCalling && <em> · prefers no call before arrival</em>}
                  </span>
                  <span>
                    💳 {j.amountDue > 0 ? `Collect ${rupees(j.amountDue)} at the end` : "Paid by UPI"} · you earn{" "}
                    <strong>{rupees(payoutOf(j))}</strong>
                  </span>
                </div>

                {j.status === "assigned" && (
                  <button
                    className="btn job-action"
                    disabled={busy === j.id}
                    onClick={() => act(j.id, () => api(`/pro/jobs/${j.id}/status`, { method: "POST", body: { status: "on-the-way" } }))}
                  >
                    🛵 Start trip
                  </button>
                )}
                {j.status === "on-the-way" && (
                  <>
                    <TripSharer job={j} />
                    <button
                      className="btn job-action"
                      disabled={busy === j.id}
                      onClick={() => act(j.id, () => api(`/pro/jobs/${j.id}/status`, { method: "POST", body: { status: "arrived" } }))}
                    >
                      📍 I've arrived
                    </button>
                  </>
                )}
                {j.status === "arrived" && (
                  <OtpEntry
                    busy={busy === j.id}
                    onSubmit={(otp) => act(j.id, () => api(`/pro/jobs/${j.id}/start`, { method: "POST", body: { otp } }))}
                  />
                )}
                {j.status === "in-progress" && (
                  <>
                    <PartCheck job={j} onChange={load} />
                    <Settle job={j} upi={upi} busy={busy === j.id} onDone={(collected, how) => complete(j, collected, how)} />
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {done.length > 0 && (
        <>
          <h2 className="section-title">Completed</h2>
          <ul className="booking-list">
            {done.map((j) => (
              <li key={j.id} className="booking-item">
                <div>
                  <h3>{services(j.items)}</h3>
                  <span className="muted-inline">
                    {formatSlot(j.slot)} · {j.payment.collectedAs === "cash" ? "cash" : "UPI"}
                  </span>
                </div>
                <span className="status-pill status-completed">{rupees(payoutOf(j))}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <AnimatePresence>{celebrate && <PaymentSuccess amount={celebrate.amount} how={celebrate.how} />}</AnimatePresence>
    </main>
  );
}
