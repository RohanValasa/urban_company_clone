import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import TripSharer from "../components/TripSharer";
import { api } from "../lib/api";
import { addressLine, rupees } from "../lib/format";
import { formatSlot } from "../lib/slots";

const REFRESH_MS = 15000;

const NEXT = {
  assigned: { status: "on-the-way", label: "🛵 Start trip" },
  "on-the-way": { status: "arrived", label: "📍 I've arrived" },
  arrived: { status: "completed", label: "✅ Mark job completed" },
};
const STATUS_LABEL = {
  assigned: "Accepted",
  "on-the-way": "On the way",
  arrived: "At the customer",
  completed: "Completed",
  cancelled: "Cancelled",
};

const services = (items) => items.map((i) => (i.qty > 1 ? `${i.name} × ${i.qty}` : i.name)).join(", ");
const payoutOf = (job) => job.bill.total - job.bill.taxesAndFee;

export default function ProfessionalDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const load = useCallback(
    () =>
      api("/pro/jobs").then(
        (data) => {
          setJobs(data);
          setError("");
        },
        (err) => setError(err.message)
      ),
    []
  );

  // New jobs show up without a refresh.
  useEffect(() => {
    let live = true;
    const tick = () => live && load();
    tick();
    const timer = setInterval(tick, REFRESH_MS);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [load]);

  const act = async (id, path, body) => {
    setBusy(id);
    setError("");
    try {
      await api(`/pro/jobs/${id}/${path}`, { method: "POST", body });
    } catch (err) {
      setError(err.message);
    }
    await load();
    setBusy(null);
  };

  const mine = jobs?.mine || [];
  const active = mine.filter((j) => !["completed", "cancelled"].includes(j.status));
  const done = mine.filter((j) => j.status === "completed");
  const earned = done.reduce((sum, j) => sum + payoutOf(j), 0);

  return (
    <main className="page pro">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        Welcome, {user?.name?.split(" ")[0] ?? "Pro"} 👋
      </motion.h1>
      <p className="auth-sub" style={{ marginBottom: 28 }}>Accept jobs near you and keep customers updated on the way.</p>

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
      {!jobs && !error && <p className="muted" style={{ marginTop: 24 }}>Loading jobs…</p>}

      {active.length > 0 && (
        <>
          <h2 className="section-title">Your jobs</h2>
          <ul className="job-list">
            {active.map((j) => {
              const next = NEXT[j.status];
              return (
                <li key={j.id} className="job-card is-mine">
                  <div className="job-top">
                    <div>
                      <h3>{services(j.items)}</h3>
                      <span className="muted-inline">🕘 {formatSlot(j.slot)}</span>
                    </div>
                    <span className="status-pill status-confirmed">{STATUS_LABEL[j.status]}</span>
                  </div>
                  <div className="job-customer">
                    <span>📍 {addressLine(j.address)}</span>
                    <span>
                      📞 <a href={`tel:+91${j.phone}`}>+91 {j.phone}</a>
                      {j.avoidCalling && <em> · prefers no call before arrival</em>}
                    </span>
                    <span>
                      💳 {j.payment.method === "upi" ? "Paid by UPI" : `Collect ${rupees(j.bill.total)} in cash`} · you
                      earn <strong>{rupees(payoutOf(j))}</strong>
                    </span>
                  </div>
                  <AnimatePresence>
                    {j.status === "on-the-way" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <TripSharer job={j} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {next && (
                    <button className="btn job-action" disabled={busy === j.id} onClick={() => act(j.id, "status", { status: next.status })}>
                      {busy === j.id ? "Updating…" : next.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {jobs && (
        <>
          <h2 className="section-title">New jobs near you</h2>
          {jobs.open.length === 0 ? (
            <p className="muted">No open jobs right now. This list refreshes on its own.</p>
          ) : (
            <ul className="job-list">
              {jobs.open.map((j) => (
                <li key={j.id} className="job-card">
                  <div className="job-top">
                    <div>
                      <h3>{services(j.items)}</h3>
                      <span className="muted-inline">🕘 {formatSlot(j.slot)} · 📍 {j.area}</span>
                    </div>
                    <span className="job-payout">{rupees(j.payout)}</span>
                  </div>
                  <button className="btn job-action" disabled={busy === j.id} onClick={() => act(j.id, "accept")}>
                    {busy === j.id ? "Accepting…" : "Accept job"}
                  </button>
                </li>
              ))}
            </ul>
          )}
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
                  <span className="muted-inline">{formatSlot(j.slot)}</span>
                </div>
                <span className="status-pill status-completed">{rupees(payoutOf(j))}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
