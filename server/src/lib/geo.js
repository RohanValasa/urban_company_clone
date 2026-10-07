/** Straight-line distance in km between two { lat, lng } points. */
function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// We serve all of Telangana. client/src/lib/telangana.json is the same file.
const TELANGANA = require("./telangana.json");

/** Ray casting: is the point inside the polygon `ring` of [lng, lat] pairs? */
function inRing(ring, lat, lng) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const inTelangana = ({ lat, lng } = {}) => {
  const b = TELANGANA.bounds;
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east &&
    inRing(TELANGANA.ring, lat, lng)
  );
};

module.exports = { distanceKm, inTelangana };
