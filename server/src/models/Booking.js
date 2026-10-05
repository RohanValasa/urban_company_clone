const { Schema, model } = require("mongoose");

const PAYMENT_METHODS = ["cash", "upi"];

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
    status: { type: String, enum: ["confirmed", "completed", "cancelled"], default: "confirmed" },
  },
  { timestamps: true }
);

bookingSchema.methods.toPublic = function toPublic() {
  const { id, items, phone, address, slot, avoidCalling, bill, payment, status, createdAt } = this;
  return { id, items, phone, address, slot, avoidCalling, bill, payment, status, createdAt };
};

module.exports = { Booking: model("Booking", bookingSchema), PAYMENT_METHODS };
