/** Straight-line distance in km between two { lat, lng } points. */
export function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Rough minutes to arrive at city speeds (about 20 km/h door to door). */
export const etaMinutes = (km) => Math.max(1, Math.round((km / 20) * 60));
