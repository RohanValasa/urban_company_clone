const express = require("express");
const { Booking, PAYMENT_METHODS } = require("../models/Booking");
const { ValidationError } = require("../lib/validate");
const { httpError, requireUser } = require("../lib/http");
const { quote } = require("../lib/pricing");
const { subscribe, openStream } = require("../lib/live");

const PRO_FIELDS = "name phone avatar";

/** A booking the user may see: their own, or one assigned to them as the professional. */
async function viewableBooking(id, user) {
  const booking = await Booking.findById(id)
    .populate("professional", PRO_FIELDS)
    .catch(() => null);
  const mine = booking && (booking.user.equals(user._id) || booking.professional?._id.equals(user._id));
  if (!mine) throw httpError(404, "That booking doesn't exist.");
  return booking;
}

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

async function isFirstBooking(userId) {
  if (!userId) return undefined;
  return !(await Booking.exists({ user: userId, status: { $ne: "cancelled" } }));
}

function bookingsRouter({ session }) {
  const router = express.Router();

  // Public, so the bill shows before signing in.
  router.post("/quote", async (req, res) => {
    const userId = session.userId(req);
    const { items, coupon, tip, payment } = req.body || {};
    res.json(quote({ items, coupon, tip, payment, isFirstBooking: await isFirstBooking(userId) }));
  });

  router.use(requireUser(session));

  router.get("/", async (req, res) => {
    const bookings = await Booking.find({ user: req.user.id })
      .sort({ slot: -1 })
      .limit(100)
      .populate("professional", PRO_FIELDS);
    res.json({ bookings: bookings.map((b) => b.toPublic()) });
  });

  router.get("/:id", async (req, res) => {
    res.json({ booking: (await viewableBooking(req.params.id, req.user)).toPublic() });
  });

  // Live updates while the customer watches: status changes and the professional's position.
  router.get("/:id/live", async (req, res) => {
    const booking = await viewableBooking(req.params.id, req.user);
    const stream = openStream(req, res, { type: "booking", booking: booking.toPublic() });
    stream.onClose(subscribe(booking.id, stream.send));
  });

  router.post("/", async (req, res) => {
    const user = req.user;
    const body = req.body || {};
    if (user.role !== "customer") throw httpError(403, "Professional accounts can't book services. Sign in as a customer.");
    if (!user.phone) throw httpError(400, "Add your phone number first.");

    const address = user.addresses.id(String(body.addressId || ""));
    if (!address) throw httpError(400, "Choose an address for the visit.");
    const slot = slotInput(body.slot);
    if (!PAYMENT_METHODS.includes(body.payment)) throw new ValidationError("Choose how you'd like to pay.");

    const { items, bill, couponError } = quote({
      items: body.items,
      coupon: body.coupon,
      tip: body.tip,
      payment: body.payment,
      isFirstBooking: await isFirstBooking(user.id),
    });
    if (couponError) throw new ValidationError(couponError);

    const booking = await Booking.create({
      user: user.id,
      items,
      phone: user.phone,
      address: address.toPublic(),
      slot,
      avoidCalling: Boolean(body.avoidCalling),
      bill,
      payment: { method: body.payment, status: body.payment === "upi" ? "awaiting-confirmation" : "due" },
    });
    res.status(201).json({ booking: booking.toPublic() });
  });

  return router;
}

module.exports = { bookingsRouter, slotInput };
