const crypto = require("node:crypto");
const express = require("express");
const { Booking, NEXT_STATUS } = require("../models/Booking");
const { User } = require("../models/User");
const { httpError, requireUser } = require("../lib/http");
const { publish } = require("../lib/live");
const { notify } = require("../lib/notify");
const { providerInput, imageInput, ValidationError } = require("../lib/validate");
const { SKILLS, SKILL_KEYS } = require("../lib/skills");
const { inTelangana, distanceKm } = require("../lib/geo");
const { when } = require("../lib/dispatch");

const MAX_OTP_TRIES = 5;

function coordinate(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw httpError(400, "That location isn't valid.");
  return n;
}

const firstName = (name) => name.split(" ")[0];

/**
 * Everything a professional does: their profile, going online, answering job
 * offers, and moving a job from "on the way" to "completed".
 */
function proRouter({ session, dispatch, checkId, sendSms, seal, ai, aiLimiter }) {
  const router = express.Router();
  router.use(requireUser(session));
  router.use((req, res, next) => {
    if (req.user.role !== "professional") return next(httpError(403, "This is for professional accounts."));
    next();
  });

  const profileReply = (user) => ({ profile: user.providerProfile(), skills: SKILLS, user: user.toPublic() });

  /** A job assigned to this professional. */
  async function myJob(req, select = "") {
    const job = await Booking.findOne({ _id: req.params.id, professional: req.user._id })
      .select(select)
      .catch(() => null);
    if (!job) throw httpError(404, "That job isn't assigned to you.");
    return job;
  }

  router.get("/profile", (req, res) => res.json(profileReply(req.user)));

  // Saves any part of the onboarding form. A new ID photo is checked straight away and not stored.
  router.put("/profile", async (req, res) => {
    const user = await User.findById(req.user._id).select("+provider.payout.accountSealed");
    const input = providerInput(req.body, { skillKeys: SKILL_KEYS, inCity: inTelangana });
    if (!user.provider) user.provider = {};
    const p = user.provider;
    for (const key of ["skills", "experienceYears", "about", "area", "radiusKm"]) {
      if (input[key] !== undefined) p[key] = input[key];
    }
    if (input.payout) {
      const { accountNumber, ...rest } = input.payout;
      p.payout = accountNumber
        ? { ...rest, accountLast4: accountNumber.slice(-4), accountSealed: seal(accountNumber) }
        : rest;
    }
    if (input.idDoc) {
      const { type, last4, image } = input.idDoc;
      let result;
      try {
        result = await checkId({ docType: type, last4, name: user.name, image });
      } catch (err) {
        console.error("ID check failed:", err.message);
        result = { status: "pending", reason: "We couldn't check your ID just now. Please try again in a minute.", by: "error" };
      }
      p.idDoc = { type, last4, ...result, checkedAt: new Date() };
    }
    await user.save();
    res.json(profileReply(user));
  });

  router.patch("/online", async (req, res) => {
    const user = req.user;
    if (req.body?.online && !user.providerProfile().status.ready) {
      throw httpError(409, "Finish your profile and ID check before going online.");
    }
    if (!user.provider) user.provider = {};
    user.provider.online = Boolean(req.body?.online);
    await user.save();
    res.json(profileReply(user));
  });

  // Requests waiting for this professional's answer right now.
  router.get("/offers", async (req, res) => {
    const offers = await Booking.find({
      status: "searching",
      "dispatch.offeredTo": req.user._id,
      "dispatch.offerExpiresAt": { $gt: new Date() },
    });
    const home = req.user.provider?.area;
    res.json({
      offers: offers.map((b) => b.toOffer(home?.lat != null && b.address.lat != null ? distanceKm(home, b.address) : null)),
    });
  });

  router.post("/offers/:id/accept", async (req, res) => {
    const job = await dispatch.accept(req.params.id, req.user);
    res.json({ job: job.toPublic() });
  });

  router.post("/offers/:id/reject", async (req, res) => {
    await dispatch.reject(req.params.id, req.user);
    res.status(204).end();
  });

  router.get("/jobs", async (req, res) => {
    const jobs = await Booking.find({ professional: req.user._id }).sort({ slot: -1 }).limit(100);
    res.json({ jobs: jobs.map((b) => b.toPublic()) });
  });

  // Start trip → I've arrived. Arriving sends the customer a one-time code to start the job.
  router.post("/jobs/:id/status", async (req, res) => {
    const job = await myJob(req);
    const next = NEXT_STATUS[job.status];
    if (!next || req.body?.status !== next) throw httpError(409, `This job can't move to "${req.body?.status}" now.`);
    job.status = next;
    const name = firstName(req.user.name);

    if (next === "arrived") {
      if (job.address.lat != null) job.tracking = { lat: job.address.lat, lng: job.address.lng, at: new Date() };
      const code = String(crypto.randomInt(1000, 10000));
      job.otp = { code, attempts: 0, sentAt: new Date() };
      await job.save();
      await sendSms(job.phone, `Servify: ${req.user.name} has arrived. Share OTP ${code} to start your service. Don't share it otherwise.`);
      notify(job.user, {
        kind: "arrived",
        bookingId: job.id,
        title: `${name} has arrived`,
        body: `Share your start code ${code} with ${name} to begin the service.`,
        otp: code,
      });
    } else {
      await job.save();
      notify(job.user, { kind: "on-the-way", bookingId: job.id, title: `${name} is on the way`, body: "Track them live on the map." });
    }
    await dispatch.announce(job);
    res.json({ job: job.toPublic() });
  });

  // The customer reads out their OTP; only then can the job start.
  router.post("/jobs/:id/start", async (req, res) => {
    const job = await myJob(req, "+otp.code");
    if (job.status !== "arrived") throw httpError(409, "Mark yourself as arrived first.");
    if (job.otp.attempts >= MAX_OTP_TRIES) throw httpError(429, "Too many wrong codes. Ask the customer to contact support.");
    const given = typeof req.body?.otp === "string" ? req.body.otp.trim() : "";
    const ok = /^\d{4}$/.test(given) && job.otp.code && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(job.otp.code));
    if (!ok) {
      job.otp.attempts += 1;
      await job.save();
      throw httpError(400, `That code is wrong. ${MAX_OTP_TRIES - job.otp.attempts} tries left.`);
    }
    job.status = "in-progress";
    job.otp.verifiedAt = new Date();
    job.otp.code = undefined;
    await job.save();
    await dispatch.announce(job);
    notify(job.user, { kind: "started", bookingId: job.id, title: "Service started", body: `${firstName(req.user.name)} has started working.` });
    res.json({ job: job.toPublic() });
  });

  // Finishing a job settles the payment: already paid, or collected now by cash or UPI.
  router.post("/jobs/:id/complete", async (req, res) => {
    const job = await myJob(req);
    if (job.status !== "in-progress") throw httpError(409, "Start the job with the customer's OTP first.");
    if (job.parts.some((p) => p.status === "pending")) {
      throw httpError(409, "The customer hasn't answered about a spare part yet. Ask them to approve or decline it.");
    }
    if (job.amountDue() > 0) {
      const collected = req.body?.collected;
      if (!["cash", "upi"].includes(collected)) throw httpError(400, "Collect the payment by cash or UPI before completing.");
      job.payment.collectedAs = collected;
    } else {
      job.payment.collectedAs = "prepaid";
    }
    job.payment.status = "paid";
    job.payment.paidAt = new Date();
    job.status = "completed";
    job.completedAt = new Date();
    await job.save();
    await dispatch.announce(job);
    notify(job.user, {
      kind: "completed",
      bookingId: job.id,
      title: "Service completed 🎉",
      body: `Thanks for booking with Servify. ${firstName(req.user.name)} marked the job done on ${when(job.completedAt)}.`,
    });
    res.json({ job: job.toPublic() });
  });

  // A spare part the job needs: the AI checks the photo for a fair price, then
  // the customer approves or declines the professional's quote.
  router.post("/jobs/:id/parts", aiLimiter, async (req, res) => {
    const job = await myJob(req);
    if (job.status !== "in-progress") throw httpError(409, "Start the job before adding a spare part.");
    if (job.parts.length >= 10) throw httpError(409, "That's the most parts one job can have.");
    const image = imageInput(req.body?.image);
    const quoted = Number(req.body?.quoted);
    if (!Number.isInteger(quoted) || quoted < 1 || quoted > 200000) throw new ValidationError("Enter your price for the part in whole rupees.");
    const note = typeof req.body?.note === "string" ? req.body.note.trim().slice(0, 200) : "";
    if (!image && !note) throw new ValidationError("Add a photo of the part or type its name.");

    const estimate = await ai.priceParts({ image, note, job: job.items.map((i) => i.name).join(", ") });
    job.parts.push({ ...estimate, quoted, status: "pending" });
    await job.save();
    await dispatch.announce(job);
    const part = job.parts[job.parts.length - 1];
    notify(job.user, {
      kind: "part",
      bookingId: job.id,
      title: `${firstName(req.user.name)} needs a ${part.name}: ₹${quoted}`,
      body: `Fair price is about ₹${part.fairLow}–₹${part.fairHigh}. Approve or decline it on your booking.`,
    });
    res.status(201).json({ job: job.toPublic() });
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
