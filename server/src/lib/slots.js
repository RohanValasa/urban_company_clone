const { ValidationError } = require("./validate");

// Visit slots, in India time. Keep in step with client/src/lib/slots.js.
const IST_OFFSET_MIN = 330;
const FIRST_SLOT = 8 * 60; // 8:00 AM
const LAST_SLOT = 19 * 60 + 30; // 7:30 PM
const MIN_LEAD_MS = 60 * 60 * 1000;
const MAX_AHEAD_MS = 8 * 24 * 60 * 60 * 1000;

/** A start time on the half hour, within opening hours (IST), over an hour away and within a week. */
function slotInput(raw, now = Date.now()) {
  const slot = new Date(raw);
  if (typeof raw !== "string" || Number.isNaN(slot.getTime())) throw new ValidationError("Pick a time slot.");
  const minutes = (slot.getUTCHours() * 60 + slot.getUTCMinutes() + IST_OFFSET_MIN) % 1440;
  const onHalfHour = minutes % 30 === 0 && slot.getUTCSeconds() === 0 && slot.getUTCMilliseconds() === 0;
  if (!onHalfHour || minutes < FIRST_SLOT || minutes > LAST_SLOT) {
    throw new ValidationError("Slots run every half hour from 8:00 AM to 7:30 PM.");
  }
  if (slot.getTime() < now + MIN_LEAD_MS) throw new ValidationError("That slot has passed. Please pick a later one.");
  if (slot.getTime() > now + MAX_AHEAD_MS) throw new ValidationError("You can book up to a week ahead.");
  return slot;
}

/**
 * The bookable slot for an IST date ("2026-10-11") and time ("09:00"), moved
 * to the next half hour; null when it isn't one we can offer.
 */
function slotAt(date, time, now = Date.now()) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
  const t = /^(\d{1,2}):(\d{2})$/.exec(time || "");
  if (!d || !t) return null;
  const minutes = Math.ceil((Number(t[1]) * 60 + Number(t[2])) / 30) * 30;
  const at = new Date(Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), 0, minutes - IST_OFFSET_MIN));
  try {
    return slotInput(at.toISOString(), now).toISOString();
  } catch {
    return null;
  }
}

/** "Saturday, 10 October 2026, 3:20 pm" in India time, for prompts. */
const nowInIndia = (now = Date.now()) =>
  new Date(now).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/** Today's date in India as YYYY-MM-DD. */
const todayInIndia = (now = Date.now()) => new Date(now + IST_OFFSET_MIN * 60000).toISOString().slice(0, 10);

module.exports = { slotInput, slotAt, nowInIndia, todayInIndia };
