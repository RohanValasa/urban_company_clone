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

const position = (t) => (t?.lat == null ? null : { lat: t.lat, lng: t.lng, at: t.at });

/** Name and number of the assigned professional, once `professional` is populated. */
const proCard = (pro) =>
  pro?.name
    ? { id: pro.id, name: pro.name, phone: pro.phone || null, avatar: pro.avatar || null, rating: pro.provider?.rating ?? 4.8 }
    : null;

/**
 * The booking as its customer or its professional sees it. The start OTP is
 * only ever shown to the customer.
 */
bookingSchema.methods.toPublic = function toPublic({ forCustomer = false, retryCooldownMs = 0 } = {}) {
  const { id, items, phone, address, slot, avoidCalling, bill, payment, status, createdAt, customerName } = this;
  const d = this.dispatch || {};
  return {
    id, items, phone, address, slot, avoidCalling, bill, status, createdAt, customerName,
    payment: { method: payment.method, status: payment.status, collectedAs: payment.collectedAs || null },
    professional: proCard(this.professional),
    tracking: position(this.tracking),
    dispatch: ["searching", "unassigned"].includes(status)
      ? {
          asked: d.offered?.length || 0,
          nearby: d.nearby || 0,
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
    location: { lat: this.address.lat, lng: this.address.lng },
    distanceKm: distanceKm == null ? null : Math.round(distanceKm * 10) / 10,
    expiresAt: this.dispatch.offerExpiresAt,
  };
};

module.exports = { Booking: model("Booking", bookingSchema), PAYMENT_METHODS, STATUSES, NEXT_STATUS, ACTIVE };
