// The professional a customer picked from "Top professionals near you", per
// service, for this browser tab. Checkout sends it with the booking.
const KEY = "servify_preferred_pro";

const readAll = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};

const writeAll = (all) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Storage blocked: the choice lasts until the page reloads.
  }
  window.dispatchEvent(new Event("servify:preferred-pro"));
};

/** The chosen professional for a service (slug), or null. */
export const preferredFor = (service) => readAll()[service] || null;

export function choosePro(service, pro) {
  const all = readAll();
  if (pro) all[service] = { id: pro.id, name: pro.name, rating: pro.rating, service };
  else delete all[service];
  writeAll(all);
}

/** The chosen professional for any of these services (the first found). */
export const preferredAmong = (services) => services.map(preferredFor).find(Boolean) || null;

export const clearPreferred = () => writeAll({});
