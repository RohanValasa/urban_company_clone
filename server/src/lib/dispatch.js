const { Booking, ACTIVE } = require("../models/Booking");
const { User } = require("../models/User");
const { distanceKm } = require("./geo");
const { publish } = require("./live");
const { notify } = require("./notify");

// A professional with a job within this window either side of the slot is busy.
const BUSY_WINDOW_MS = 2 * 60 * 60 * 1000;
// A search that lost its offer (say the server restarted mid-step) is picked up again after this.
const STUCK_MS = 15 * 1000;

const services = (b) => b.items.map((i) => i.name).join(", ");
const when = (date) =>
  new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

class DispatchError extends Error {
  constructor(message) {
    super(message);
    this.status = 409;
    this.expose = true;
  }
}

/**
 * Finds a professional for each booking, one at a time like a ride-hailing
 * app: the nearest suitable professional gets the request; if they reject it
 * or don't answer in time, it moves to the next. When nobody is left the
 * booking waits as "unassigned" until the customer tries again.
 *
 * Every hand-over is a conditional update, so a reply that races a timeout
 * (or two server ticks) can't assign the job twice.
 */
function dispatcher({ offerMs, retryCooldownMs }) {
  /** Tells everyone watching the booking that it changed. Each viewer's stream renders it for them. */
  async function announce(booking) {
    await booking.populate([
      { path: "professional", select: "name phone avatar provider.rating" },
      { path: "dispatch.offeredTo", select: "name email" },
    ]);
    publish(booking.id, { type: "booking", doc: booking });
    return booking;
  }

  /**
   * Approved professionals with every skill the job needs whose travel radius
   * covers the address (`serving`), and of those the ones online and free at
   * that time, nearest first (`available`).
   */
  async function candidates(booking) {
    const { lat, lng } = booking.address;
    if (lat == null) return { serving: 0, available: [] };
    const slot = booking.slot.getTime();
    const [pros, busy] = await Promise.all([
      User.find(
        {
          role: "professional",
          "provider.idDoc.status": "approved",
          "provider.payout.method": { $exists: true },
          "provider.skills": { $all: booking.dispatch.skills },
        },
        "name email provider"
      ),
      Booking.distinct("professional", {
        status: { $in: ACTIVE },
        slot: { $gte: new Date(slot - BUSY_WINDOW_MS), $lte: new Date(slot + BUSY_WINDOW_MS) },
      }),
    ]);
    const busySet = new Set(busy.map(String));
    const covering = pros
      .filter((p) => p.provider.area?.lat != null && !p._id.equals(booking.user))
      .map((pro) => ({ pro, km: distanceKm({ lat, lng }, pro.provider.area) }))
      .filter((x) => x.km <= x.pro.provider.radiusKm)
      .sort((a, b) => a.km - b.km);
    return {
      serving: covering.length,
      available: covering.filter((x) => x.pro.provider.online && !busySet.has(x.pro.id)),
    };
  }

  const nearbyProviders = async (booking) => (await candidates(booking)).available;

  /** Offers the job to the next professional who hasn't seen it, or gives up for now. */
  async function offerNext(booking) {
    const { available: nearby, serving } = await candidates(booking);
    const seen = new Set([...booking.dispatch.offered, ...booking.dispatch.rejectedBy].map(String));
    const next = nearby.find((x) => !seen.has(x.pro.id));
    booking.dispatch.nearby = nearby.length;
    booking.dispatch.serving = serving;

    if (!next) {
      booking.status = "unassigned";
      booking.dispatch.offeredTo = null;
      booking.dispatch.offerExpiresAt = null;
      booking.dispatch.exhaustedAt = new Date();
      await booking.save();
      notify(booking.user, {
        kind: "no-provider",
        bookingId: booking.id,
        ...(serving
          ? { title: "No professional available right now", body: "Everyone nearby is busy. Please wait a little and try again." }
          : { title: "No professionals near you yet", body: "We're still adding professionals in your area. Please try again later." }),
      });
      return announce(booking);
    }

    booking.dispatch.offeredTo = next.pro._id;
    booking.dispatch.offerExpiresAt = new Date(Date.now() + offerMs);
    booking.dispatch.offered.push(next.pro._id);
    await booking.save();
    notify(next.pro.id, {
      kind: "offer",
      bookingId: booking.id,
      title: "New job request",
      body: `${services(booking)} · ${booking.address.area}`,
      offer: booking.toOffer(next.km),
    });
    return announce(booking);
  }

  return {
    announce,
    nearbyProviders,

    /** Starts looking for a professional for a new (or retried) booking. */
    async start(booking, skills) {
      booking.status = "searching";
      booking.dispatch = { skills, offered: [], rejectedBy: [], nearby: 0 };
      return offerNext(booking);
    },

    async accept(bookingId, pro) {
      const booking = await Booking.findOneAndUpdate(
        {
          _id: bookingId,
          status: "searching",
          "dispatch.offeredTo": pro._id,
          "dispatch.offerExpiresAt": { $gt: new Date() },
        },
        { $set: { status: "assigned", professional: pro._id, "dispatch.offeredTo": null, "dispatch.offerExpiresAt": null } },
        { returnDocument: "after" }
      ).catch(() => null);
      if (!booking) throw new DispatchError("This request has expired or was given to someone else.");
      await announce(booking);
      notify(booking.user, {
        kind: "accepted",
        bookingId: booking.id,
        title: `Yay! Request accepted by ${pro.name}`,
        body: `${pro.name} will arrive on ${when(booking.slot)}.`,
      });
      return booking;
    },

    async reject(bookingId, pro) {
      const booking = await Booking.findOneAndUpdate(
        { _id: bookingId, status: "searching", "dispatch.offeredTo": pro._id },
        {
          $set: { "dispatch.offeredTo": null, "dispatch.offerExpiresAt": null },
          $addToSet: { "dispatch.rejectedBy": pro._id },
        },
        { returnDocument: "after" }
      ).catch(() => null);
      if (!booking) throw new DispatchError("This request is no longer yours to answer.");
      await offerNext(booking);
    },

    /** The customer asks again after nobody accepted. */
    async retry(booking) {
      const ready = new Date(Date.now() - retryCooldownMs);
      const claimed = await Booking.findOneAndUpdate(
        { _id: booking._id, status: "unassigned", "dispatch.exhaustedAt": { $lte: ready } },
        { $set: { status: "searching", "dispatch.offered": [], "dispatch.rejectedBy": [], "dispatch.exhaustedAt": null } },
        { returnDocument: "after" }
      );
      if (!claimed) throw new DispatchError("Please wait a little before trying again.");
      return offerNext(claimed);
    },

    /** Moves on from offers nobody answered in time. Runs every few seconds. */
    async sweep(now = new Date()) {
      const expired = await Booking.find({ status: "searching", "dispatch.offerExpiresAt": { $lte: now } });
      for (const b of expired) {
        const claimed = await Booking.findOneAndUpdate(
          { _id: b._id, status: "searching", "dispatch.offeredTo": b.dispatch.offeredTo, "dispatch.offerExpiresAt": b.dispatch.offerExpiresAt },
          { $set: { "dispatch.offeredTo": null, "dispatch.offerExpiresAt": null } },
          { returnDocument: "after" }
        );
        if (!claimed) continue;
        notify(b.dispatch.offeredTo, {
          kind: "offer-expired",
          bookingId: b.id,
          title: "Request expired",
          body: "You didn't answer in time, so it went to another professional.",
        });
        await offerNext(claimed);
      }
      const stuck = await Booking.find({
        status: "searching",
        "dispatch.offeredTo": null,
        updatedAt: { $lt: new Date(now.getTime() - STUCK_MS) },
      });
      for (const b of stuck) await offerNext(b);
    },
  };
}

module.exports = { dispatcher, DispatchError, when };
