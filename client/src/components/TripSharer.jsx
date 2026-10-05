import { useEffect, useRef, useState } from "react";
import LiveMap from "./LiveMap";
import { api } from "../lib/api";

const SEND_EVERY_MS = 3000;
const SIM_STEPS = 30;
const SIM_TICK_MS = 2000;

/** Sends positions to the server (which pushes them to the customer), at most every few seconds. */
function reporter(jobId, setMe, setProblem, lastSent) {
  return (lat, lng, force = false) => {
    setMe({ lat, lng });
    const now = Date.now();
    if (!force && now - lastSent.current < SEND_EVERY_MS) return;
    lastSent.current = now;
    api(`/pro/jobs/${jobId}/location`, { method: "POST", body: { lat, lng } }).catch((err) => setProblem(err.message));
  };
}

const canLocate = typeof navigator !== "undefined" && "geolocation" in navigator;

/**
 * Shares the professional's position for one job while they travel.
 * "gps" uses the phone's location; "simulate" (development only) drives a
 * fake route to the customer so the live map can be tried on one computer.
 */
export default function TripSharer({ job }) {
  const [mode, setMode] = useState(import.meta.env.DEV ? null : "gps");
  const [me, setMe] = useState(job.tracking);
  const [problem, setProblem] = useState("");
  const lastSent = useRef(0);
  const { lat: destLat, lng: destLng } = job.address;

  useEffect(() => {
    if (mode !== "gps" || !canLocate) return undefined;
    const report = reporter(job.id, setMe, setProblem, lastSent);
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        setProblem("");
        report(pos.coords.latitude, pos.coords.longitude);
      },
      (err) =>
        setProblem(
          err.code === err.PERMISSION_DENIED
            ? "Location is blocked. Allow it for this site in your browser settings."
            : "Couldn't get your location. Phones only share it on https:// or localhost."
        ),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [mode, job.id]);

  useEffect(() => {
    if (mode !== "simulate" || destLat == null) return undefined;
    const report = reporter(job.id, setMe, setProblem, lastSent);
    const dest = { lat: destLat, lng: destLng };
    // Start about 3 km away and drive in two legs, like turning onto the street.
    const start = { lat: dest.lat + 0.018, lng: dest.lng - 0.02 };
    const corner = { lat: dest.lat + 0.002, lng: start.lng };
    const path = [];
    for (let i = 0; i <= SIM_STEPS; i++) {
      const t = i / SIM_STEPS;
      const [a, b, local] = t < 0.5 ? [start, corner, t * 2] : [corner, dest, (t - 0.5) * 2];
      const wobble = Math.sin(i * 1.7) * 0.0003;
      path.push({ lat: a.lat + (b.lat - a.lat) * local + wobble, lng: a.lng + (b.lng - a.lng) * local - wobble });
    }
    let i = 0;
    report(path[0].lat, path[0].lng, true);
    const timer = setInterval(() => {
      i += 1;
      if (i >= path.length) return clearInterval(timer);
      report(path[i].lat, path[i].lng, true);
    }, SIM_TICK_MS);
    return () => clearInterval(timer);
  }, [mode, job.id, destLat, destLng]);

  return (
    <div className="trip">
      {!mode ? (
        <div className="trip-pick">
          <p className="co-hint">How should we share your location with the customer?</p>
          <div className="trip-modes">
            <button className="btn" onClick={() => setMode("gps")}>📍 Use my live location</button>
            <button className="btn-ghost" onClick={() => setMode("simulate")}>🛵 Simulate the drive (demo)</button>
          </div>
        </div>
      ) : (
        <p className="trip-status">
          <span className="live-dot is-live">Live</span>
          {mode === "gps" ? "Sharing your location with the customer" : "Simulating a drive to the customer"}
          {import.meta.env.DEV && (
            <button className="link-btn" onClick={() => setMode(mode === "gps" ? "simulate" : "gps")}>
              Switch to {mode === "gps" ? "simulation" : "real location"}
            </button>
          )}
        </p>
      )}
      {mode === "gps" && !canLocate && <p className="auth-error">This browser can't share location.</p>}
      {problem && <p className="auth-error">{problem}</p>}
      {destLat != null && <LiveMap home={{ lat: destLat, lng: destLng }} pro={me} className="trip-map" />}
    </div>
  );
}
