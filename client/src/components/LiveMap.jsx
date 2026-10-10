import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pin = (emoji, className) =>
  L.divIcon({ className: `map-pin ${className}`, html: `<span>${emoji}</span>`, iconSize: [44, 44], iconAnchor: [22, 22] });

/** Glides a marker to its new spot instead of jumping. */
function glide(marker, to, ms = 1200) {
  const from = marker.getLatLng();
  const start = performance.now();
  let frame;
  const step = (now) => {
    const t = Math.min(1, (now - start) / ms);
    const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    marker.setLatLng([from.lat + (to.lat - from.lat) * ease, from.lng + (to.lng - from.lng) * ease]);
    if (t < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

/**
 * OpenStreetMap with the customer's home and, when known, the professional.
 * `pro` moves smoothly each time it changes.
 */
export default function LiveMap({ home, pro, proEmoji = "🛵", className = "" }) {
  const box = useRef(null);
  const map = useRef(null);
  const proMarker = useRef(null);
  const route = useRef(null);
  const fitted = useRef(false);

  useEffect(() => {
    const m = L.map(box.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    m.setView([home.lat, home.lng], 15);
    L.marker([home.lat, home.lng], { icon: pin("🏠", "map-pin-home"), keyboard: false }).addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      proMarker.current = null;
      route.current = null;
      fitted.current = false;
    };
  }, [home.lat, home.lng]);

  useEffect(() => {
    const m = map.current;
    if (!m) return undefined;
    if (!pro) {
      proMarker.current?.remove();
      route.current?.remove();
      proMarker.current = null;
      route.current = null;
      return undefined;
    }
    if (!proMarker.current) {
      proMarker.current = L.marker([pro.lat, pro.lng], { icon: pin(proEmoji, "map-pin-pro"), zIndexOffset: 500 }).addTo(m);
      route.current = L.polyline([[pro.lat, pro.lng], [home.lat, home.lng]], {
        color: "#6d28d9",
        weight: 4,
        dashArray: "8 10",
        opacity: 0.7,
      }).addTo(m);
    }
    route.current.setLatLngs([[pro.lat, pro.lng], [home.lat, home.lng]]);
    if (!fitted.current) {
      m.fitBounds(L.latLngBounds([pro.lat, pro.lng], [home.lat, home.lng]), { padding: [60, 60], maxZoom: 16 });
      fitted.current = true;
    } else {
      m.panInside([pro.lat, pro.lng], { padding: [60, 60] });
    }
    return glide(proMarker.current, pro);
  }, [pro, pro?.lat, pro?.lng, home.lat, home.lng, proEmoji]);

  return <div ref={box} className={`live-map ${className}`} role="img" aria-label="Map showing the professional and your home" />;
}
