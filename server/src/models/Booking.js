const { Schema, model } = require("mongoose");

const PAYMENT_METHODS = ["cash", "upi"];
// confirmed: waiting for a professional to accept. Each later step is set by them.
const STATUSES = ["confirmed", "assigned", "on-the-way", "arrived", "completed", "cancelled"];
const NEXT_STATUS = { assigned: "on-the-way", "on-the-way": "arrived", arrived: "completed" };

const bookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [
      {
        _id: false,
        id: String,
        name: String,
        category: String,
        price: Number,
        mrp: Number,
        qty: Number,
      },
    ],
    // Copies, so editing the account later doesn't rewrite past bookings.
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
      // cash: paid to the professional after the job.
      // upi: the customer says they paid; nothing here checks with the bank.
      status: { type: String, enum: ["due", "awaiting-confirmation", "paid"], required: true },
    },
    status: { type: String, enum: STATUSES, default: "confirmed" },
    professional: { type: Schema.Types.ObjectId, ref: "User", index: true },
    // The professional's last reported position while on the way.
    tracking: { lat: Number, lng: Number, at: Date },
  },
  { timestamps: true }
);

const position = (t) => (t?.lat == null ? null : { lat: t.lat, lng: t.lng, at: t.at });

/** Name and number of the assigned professional, once `professional` is populated. */
const proCard = (pro) => (pro?.name ? { id: pro.id, name: pro.name, phone: pro.phone || null, avatar: pro.avatar || null } : null);

bookingSchema.methods.toPublic = function toPublic() {
  const { id, items, phone, address, slot, avoidCalling, bill, payment, status, createdAt } = this;
  return {
    id, items, phone, address, slot, avoidCalling, bill, payment, status, createdAt,
    professional: proCard(this.professional),
    tracking: position(this.tracking),
  };
};

/** What professionals see before accepting: the job and area, not the customer's door or number. */
bookingSchema.methods.toOpenJob = function toOpenJob() {
  const { id, items, slot, bill, payment, status } = this;
  return {
    id, items, slot, status,
    payout: bill.total - bill.taxesAndFee,
    payment: payment.method,
    area: this.address.area,
    location: { lat: this.address.lat, lng: this.address.lng },
  };
};

module.exports = { Booking: model("Booking", bookingSchema), PAYMENT_METHODS, STATUSES, NEXT_STATUS };
