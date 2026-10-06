/** Straight-line distance in km between two { lat, lng } points. */
function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// Matches HYDERABAD.bounds in client/src/lib/places.js: we only serve the city.
const BOUNDS = { south: 17.2, west: 78.2, north: 17.62, east: 78.7 };
const inHyderabad = ({ lat, lng }) =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat >= BOUNDS.south && lat <= BOUNDS.north && lng >= BOUNDS.west && lng <= BOUNDS.east;

module.exports = { distanceKm, inHyderabad };
