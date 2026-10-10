// Visit slots, always in India time whatever the browser's time zone.
// Keep in step with slotInput in server/src/routes/bookings.js.

const IST_OFFSET_MS = 330 * 60 * 1000;
const FIRST = 8 * 60; // 8:00 AM
const LAST = 19 * 60 + 30; // 7:30 PM
const LEAD_MS = 60 * 60 * 1000;
export const DAYS_AHEAD = 7;

const TZ = { timeZone: "Asia/Kolkata" };

/** The next week of days that still have a free slot, each with its slots. */
export function slotDays(now = Date.now()) {
  const today = new Date(now + IST_OFFSET_MS);
  const days = [];
  for (let d = 0; d < DAYS_AHEAD; d++) {
    const y = today.getUTCFullYear();
    const m = today.getUTCMonth();
    const date = today.getUTCDate() + d;
    const slots = [];
    for (let min = FIRST; min <= LAST; min += 30) {
      const at = Date.UTC(y, m, date, 0, min) - IST_OFFSET_MS;
      slots.push({ iso: new Date(at).toISOString(), time: formatTime(at), open: at >= now + LEAD_MS });
    }
    if (!slots.some((s) => s.open)) continue;
    const noon = Date.UTC(y, m, date, 12) - IST_OFFSET_MS;
    days.push({
      key: new Date(noon).toISOString().slice(0, 10),
      weekday: d === 0 ? "Today" : d === 1 ? "Tomorrow" : new Date(noon).toLocaleDateString("en-IN", { ...TZ, weekday: "short" }),
      date: new Date(noon).toLocaleDateString("en-IN", { ...TZ, day: "numeric", month: "short" }),
      slots,
    });
  }
  return days;
}

export const formatTime = (at) =>
  new Date(at).toLocaleTimeString("en-IN", { ...TZ, hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();

/** "Tue, 7 Oct · 10:30 AM" */
export const formatSlot = (iso) =>
  `${new Date(iso).toLocaleDateString("en-IN", { ...TZ, weekday: "short", day: "numeric", month: "short" })} · ${formatTime(iso)}`;

export const slotStillOpen = (iso, now = Date.now()) => new Date(iso).getTime() >= now + LEAD_MS;
