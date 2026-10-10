const express = require("express");
const { Booking, PAYMENT_METHODS } = require("../models/Booking");
const { ValidationError } = require("../lib/validate");
const { httpError, requireUser } = require("../lib/http");
const { quote } = require("../lib/pricing");
const { subscribe, openStream } = require("../lib/live");
const { notify } = require("../lib/notify");
const { slotInput } = require("../lib/slots");

const PRO_FIELDS = "name phone avatar provider.rating";

/** A booking the user may see: their own, or one assigned to them as the professional. */
async function viewableBooking(id, user) {
  const booking = await Booking.findById(id)
    .select("+otp.code")
    .populate("professional", PRO_FIELDS)
    .populate("dispatch.offeredTo", "name email")
    .catch(() => null);
  const mine = booking && (booking.user.equals(user._id) || booking.professional?._id.equals(user._id));
  if (!mine) throw httpError(404, "That booking doesn't exist.");
  return booking;
}

async function isFirstBooking(userId) {
  if (!userId) return undefined;
  return !(await Booking.exists({ user: userId, status: { $ne: "cancelled" } }));
}

function bookingsRouter({ session, dispatch, retryCooldownMs }) {
  const router = express.Router();
  const view = (booking, user) =>
    booking.toPublic({ forCustomer: booking.user.equals(user._id), retryCooldownMs });

  // Public, so the bill shows before signing in.
  router.post("/quote", async (req, res) => {
    const userId = session.userId(req);
    const { items, coupon, tip, payment } = req.body || {};
    res.json(quote({ items, coupon, tip, payment, isFirstBooking: await isFirstBooking(userId) }));
  });

  router.use(requireUser(session));

  router.get("/", async (req, res) => {
    const bookings = await Booking.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("professional", PRO_FIELDS);
    res.json({ bookings: bookings.map((b) => view(b, req.user)) });
  });

  router.get("/:id", async (req, res) => {
    res.json({ booking: view(await viewableBooking(req.params.id, req.user), req.user) });
  });

  // Live updates while someone watches a booking: every change, and the professional's position.
  router.get("/:id/live", async (req, res) => {
    const booking = await viewableBooking(req.params.id, req.user);
    const stream = openStream(req, res, { type: "booking", booking: view(booking, req.user) });
    stream.onClose(
      subscribe(booking.id, (event) =>
        stream.send(event.type === "booking" ? { type: "booking", booking: view(event.doc, req.user) } : event)
      )
    );
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
    if (items.some((i) => !i.skill)) throw new ValidationError("One of the services in your cart can't be booked yet.");

    const booking = new Booking({
      user: user.id,
      customerName: user.name,
      items,
      phone: user.phone,
      address: address.toPublic(),
      slot,
      avoidCalling: Boolean(body.avoidCalling),
      note: typeof body.note === "string" ? body.note.trim().slice(0, 500) : "",
      bill,
      payment: { method: body.payment, status: body.payment === "upi" ? "awaiting-confirmation" : "due" },
    });
    await dispatch.start(booking, [...new Set(items.map((i) => i.skill))]);
    res.status(201).json({ booking: view(booking, user) });
  });

  // Nobody accepted: ask the nearby professionals again.
  router.post("/:id/retry", async (req, res) => {
    const booking = await viewableBooking(req.params.id, req.user);
    if (!booking.user.equals(req.user._id)) throw httpError(404, "That booking doesn't exist.");
    const again = await dispatch.retry(booking);
    res.json({ booking: view(again, req.user) });
  });

  router.post("/:id/cancel", async (req, res) => {
    const booking = await viewableBooking(req.params.id, req.user);
    if (!booking.user.equals(req.user._id)) throw httpError(404, "That booking doesn't exist.");
    if (!["searching", "unassigned", "assigned"].includes(booking.status)) {
      throw httpError(409, "This booking can't be cancelled now that the professional is on the way.");
    }
    const pro = booking.professional?._id;
    booking.status = "cancelled";
    booking.dispatch.offeredTo = null;
    booking.dispatch.offerExpiresAt = null;
    await booking.save();
    await dispatch.announce(booking);
    if (pro) notify(pro, { kind: "cancelled", bookingId: booking.id, title: "Job cancelled", body: `${booking.customerName} cancelled the booking.` });
    res.json({ booking: view(booking, req.user) });
  });

  // The customer agrees to (or turns down) a spare part the professional proposed.
  router.post("/:id/parts/:partId", async (req, res) => {
    const booking = await viewableBooking(req.params.id, req.user);
    if (!booking.user.equals(req.user._id)) throw httpError(404, "That booking doesn't exist.");
    const part = booking.parts.id(req.params.partId);
    if (!part) throw httpError(404, "That part isn't on this booking.");
    if (!["approve", "decline"].includes(req.body?.decision)) throw new ValidationError("Approve or decline the part.");
    if (part.status !== "pending") throw httpError(409, `You already ${part.status} this part.`);
    if (booking.status !== "in-progress") throw httpError(409, "Parts can only be changed while the job is in progress.");
    part.status = req.body.decision === "approve" ? "approved" : "declined";
    part.decidedAt = new Date();
    await booking.save();
    await dispatch.announce(booking);
    notify(booking.professional._id, {
      kind: part.status === "approved" ? "part-approved" : "part-declined",
      bookingId: booking.id,
      title: `${booking.customerName} ${part.status} the ${part.name}`,
      body: part.status === "approved" ? `Add ₹${part.quoted} to what you collect.` : "Carry on without it, or talk to the customer.",
    });
    res.json({ booking: view(booking, req.user) });
  });

  return router;
}

module.exports = { bookingsRouter, slotInput };
