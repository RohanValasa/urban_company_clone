const { Schema, model } = require("mongoose");

const PAYMENT_METHODS = ["cash", "upi"];
// searching: being offered to nearby professionals one by one.
// unassigned: nobody accepted; the customer can try again after a while.
// in-progress: the professional entered the customer's start OTP.
const STATUSES = ["searching", "unassigned", "assigned", "on-the-way", "arrived", "in-progress", "completed", "cancelled"];
// Steps a professional moves through with a plain button press. arrived → in-progress
// needs the OTP, and in-progress → completed needs the payment settled.
const NEXT_STATUS = { assigned: "on-the-way", "on-the-way": "arrived" };
const ACTIVE = ["assigned", "on-the-way", "arrived", "in-progress"];
const SHOW_OFFEREE = process.env.NODE_ENV !== "production";

const bookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [
      {
        _id: false,
        id: String,
        name: String,
        category: String,
        skill: String,
        price: Number,
        mrp: Number,
        qty: Number,
      },
    ],
    // Copies, so editing the account later doesn't rewrite past bookings.
    customerName: String,
    phone: { type: String, required: true },
    address: {
      label: String,
      house: String,
      area: String,
      landmark: String,
      lat: Number,
      lng: Number,
    },
    slot: { type: Date, required: true },
    avoidCalling: { type: Boolean, default: false },
    // For the professional: what's wrong, in the customer's words or the AI assistant's.
    note: { type: String, default: "" },
    // The professional the customer chose from "top professionals near you"; offered the job first.
    preferredPro: { type: Schema.Types.ObjectId, ref: "User" },
    // The customer's rating once the job is done.
    review: { stars: Number, comment: String, at: Date },
    // Spare parts the professional proposes at the job, each with the AI's fair price range.
    parts: [
      {
        name: String,
        description: String,
        notes: String,
        fairLow: Number,
        fairHigh: Number,
        confidence: { type: String, enum: ["low", "medium", "high"] },
        // "ai" (read from the photo) or "list" (Servify's price list of common parts).
        source: { type: String, default: "ai" },
        quoted: Number,
        status: { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
        addedAt: { type: Date, default: Date.now },
        decidedAt: Date,
      },
    ],
    bill: {
      itemTotal: Number,
      mrpTotal: Number,
      coupon: String,
      couponDiscount: Number,
      taxesAndFee: Number,
      tip: Number,
      total: Number,
      saved: Number,
    },
    payment: {
      method: { type: String, enum: PAYMENT_METHODS, required: true },
      // due: to be paid at the end. awaiting-confirmation: the customer says they paid by UPI.
      status: { type: String, enum: ["due", "awaiting-confirmation", "paid"], required: true },
      collectedAs: { type: String, enum: ["cash", "upi", "prepaid"] },
      paidAt: Date,
    },
    status: { type: String, enum: STATUSES, default: "searching", index: true },
    professional: { type: Schema.Types.ObjectId, ref: "User", index: true },
    // Who the job has been offered to, Uber-style: one professional at a time.
    dispatch: {
      skills: [String],
      offeredTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
      offerExpiresAt: { type: Date, index: true },
      offered: [{ type: Schema.Types.ObjectId }],
      rejectedBy: [{ type: Schema.Types.ObjectId }],
      nearby: { type: Number, default: 0 },
      // Professionals who cover this address for these services, online or not.
      serving: Number,
      exhaustedAt: Date,
    },
    // Given to the customer when the professional arrives; the professional types it to start.
    otp: {
      code: { type: String, select: false },
      attempts: { type: Number, default: 0 },
      sentAt: Date,
      verifiedAt: Date,
    },
    // The professional's last reported position while on the way.
    tracking: { lat: Number, lng: Number, at: Date },
    completedAt: Date,
  },
  { timestamps: true }
);

/** How a quoted price compares with the fair range: fair, slightly-high (up to 25% over) or high. */
const verdictOf = (part) =>
  part.quoted <= part.fairHigh ? "fair" : part.quoted <= part.fairHigh * 1.25 ? "slightly-high" : "high";

const partView = (p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  notes: p.notes,
  fairLow: p.fairLow,
  fairHigh: p.fairHigh,
  confidence: p.confidence,
  source: p.source || "ai",
  quoted: p.quoted,
  status: p.status,
  verdict: verdictOf(p),
});

/** Approved parts, paid to the professional on top of the bill. */
bookingSchema.methods.partsTotal = function partsTotal() {
  return (this.parts || []).filter((p) => p.status === "approved").reduce((sum, p) => sum + p.quoted, 0);
};

/** What the professional collects at the end: the bill if it wasn't paid online, plus approved parts. */
bookingSchema.methods.amountDue = function amountDue() {
  return (this.payment.status === "due" ? this.bill.total : 0) + this.partsTotal();
};

const position = (t) => (t?.lat == null ? null : { lat: t.lat, lng: t.lng, at: t.at });

/** Name and number of the assigned professional, once `professional` is populated. */
const proCard = (pro) =>
  pro?.name
    ? {
        id: pro.id,
        name: pro.name,
        phone: pro.phone || null,
        avatar: pro.avatar || null,
        rating: Math.round((pro.provider?.rating ?? 4.8) * 100) / 100,
        ratingCount: pro.provider?.ratingCount || 0,
        jobsDone: pro.provider?.jobsDone || 0,
      }
    : null;

/**
 * The booking as its customer or its professional sees it. The start OTP is
 * only ever shown to the customer.
 */
bookingSchema.methods.toPublic = function toPublic({ forCustomer = false, retryCooldownMs = 0 } = {}) {
  const { id, items, phone, address, slot, avoidCalling, bill, payment, status, createdAt, customerName, note } = this;
  const d = this.dispatch || {};
  return {
    id, items, phone, address, slot, avoidCalling, bill, status, createdAt, customerName,
    note: note || "",
    review: this.review?.stars ? { stars: this.review.stars, comment: this.review.comment || "" } : null,
    parts: (this.parts || []).map(partView),
    partsTotal: this.partsTotal(),
    amountDue: this.amountDue(),
    payment: { method: payment.method, status: payment.status, collectedAs: payment.collectedAs || null },
    professional: proCard(this.professional),
    tracking: position(this.tracking),
    dispatch: ["searching", "unassigned"].includes(status)
      ? {
          asked: d.offered?.length || 0,
          nearby: d.nearby || 0,
          serving: d.serving ?? d.nearby ?? 0,
          offerExpiresAt: d.offerExpiresAt || null,
          retryAt: status === "unassigned" && d.exhaustedAt ? new Date(d.exhaustedAt.getTime() + retryCooldownMs) : null,
          // Development only: who has the request right now, to make testing easy.
          ...(SHOW_OFFEREE && d.offeredTo?.email && { offeredTo: { name: d.offeredTo.name, email: d.offeredTo.email } }),
        }
      : null,
    otp:
      forCustomer && status === "arrived" && this.otp?.code
        ? { code: this.otp.code }
        : { verified: Boolean(this.otp?.verifiedAt) },
  };
};

/** What a professional sees in a job offer: the work and the area, not the door or the phone number. */
bookingSchema.methods.toOffer = function toOffer(distanceKm) {
  const { id, items, slot, bill, payment } = this;
  return {
    id, items, slot,
    payout: bill.total - bill.taxesAndFee,
    payment: payment.method,
    area: this.address.area,
    note: this.note || "",
    location: { lat: this.address.lat, lng: this.address.lng },
    distanceKm: distanceKm == null ? null : Math.round(distanceKm * 10) / 10,
    expiresAt: this.dispatch.offerExpiresAt,
  };
};

module.exports = { Booking: model("Booking", bookingSchema), PAYMENT_METHODS, STATUSES, NEXT_STATUS, ACTIVE };
