const express = require("express");
const { Booking, NEXT_STATUS } = require("../models/Booking");
const { httpError, requireUser } = require("../lib/http");
const { publish } = require("../lib/live");

const STALE_MS = 2 * 60 * 60 * 1000;

/** Tells everyone watching this booking about its latest state. */
async function announce(booking) {
  await booking.populate("professional", "name phone avatar");
  publish(booking.id, { type: "booking", booking: booking.toPublic() });
  return booking;
}

function coordinate(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw httpError(400, "That location isn't valid.");
  return n;
}

/** Jobs for professionals: accept them, move them along, and share their position. */
function proRouter({ session }) {
  const router = express.Router();
  router.use(requireUser(session));
  router.use((req, res, next) => {
    if (req.user.role !== "professional") return next(httpError(403, "This is for professional accounts."));
    next();
  });

  /** A job assigned to this professional. */
  async function myJob(req) {
    const job = await Booking.findOne({ _id: req.params.id, professional: req.user._id }).catch(() => null);
    if (!job) throw httpError(404, "That job isn't assigned to you.");
    return job;
  }

  router.get("/jobs", async (req, res) => {
    const [open, mine] = await Promise.all([
      Booking.find({ status: "confirmed", professional: null, slot: { $gte: new Date(Date.now() - STALE_MS) } })
        .sort({ slot: 1 })
        .limit(50),
      Booking.find({ professional: req.user._id }).sort({ slot: -1 }).limit(50),
    ]);
    res.json({ open: open.map((b) => b.toOpenJob()), mine: mine.map((b) => b.toPublic()) });
  });

  router.post("/jobs/:id/accept", async (req, res) => {
    // Only one professional can win the job: the update checks it's still unassigned.
    const job = await Booking.findOneAndUpdate(
      { _id: req.params.id, status: "confirmed", professional: null },
      { professional: req.user._id, status: "assigned" },
      { returnDocument: "after" }
    ).catch(() => null);
    if (!job) throw httpError(409, "Someone else has already taken this job.");
    res.json({ job: (await announce(job)).toPublic() });
  });

  router.post("/jobs/:id/status", async (req, res) => {
    const job = await myJob(req);
    const next = NEXT_STATUS[job.status];
    if (!next || req.body?.status !== next) throw httpError(409, `This job can't move to "${req.body?.status}" now.`);
    job.status = next;
    if (next === "arrived" && job.address.lat != null) {
      job.tracking = { lat: job.address.lat, lng: job.address.lng, at: new Date() };
    }
    if (next === "completed" && job.payment.method === "cash") job.payment.status = "paid";
    await job.save();
    res.json({ job: (await announce(job)).toPublic() });
  });

  // Sent every few seconds from the professional's phone while they travel.
  router.post("/jobs/:id/location", async (req, res) => {
    const job = await myJob(req);
    if (job.status !== "on-the-way") throw httpError(409, "Start the trip before sharing your location.");
    const tracking = {
      lat: coordinate(req.body?.lat, -90, 90),
      lng: coordinate(req.body?.lng, -180, 180),
      at: new Date(),
    };
    job.tracking = tracking;
    await job.save();
    publish(job.id, { type: "location", tracking });
    res.status(204).end();
  });

  return router;
}

module.exports = { proRouter };
