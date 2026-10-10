const { Schema, model } = require("mongoose");

const ROLES = ["customer", "professional"];

const addressSchema = new Schema({
  label: { type: String, trim: true, maxlength: 20, default: "Home" },
  // Optional: the area from the map is often enough to find the place.
  house: { type: String, trim: true, maxlength: 120, default: "" },
  area: { type: String, required: true, trim: true, maxlength: 160 },
  landmark: { type: String, trim: true, maxlength: 120, default: "" },
  lat: Number,
  lng: Number,
});

addressSchema.methods.toPublic = function toPublic() {
  const { id, label, house, area, landmark, lat, lng } = this;
  return { id, label, house, area, landmark, lat: lat ?? null, lng: lng ?? null };
};

// Everything a professional fills in when they join. Only the last 4 digits of
// the ID are kept, and the ID photo is checked and then thrown away.
const providerSchema = new Schema(
  {
    skills: { type: [String], default: [] },
    experienceYears: { type: Number, min: 0, max: 60, default: 0 },
    // In any language: English, తెలుగు, हिंदी, اردو …
    about: { type: String, trim: true, maxlength: 1000, default: "" },
    area: { label: String, lat: Number, lng: Number },
    radiusKm: { type: Number, min: 1, max: 30, default: 8 },
    idDoc: {
      type: { type: String },
      last4: String,
      status: { type: String, enum: ["missing", "pending", "approved", "rejected"], default: "missing" },
      reason: String,
      by: String,
      checkedAt: Date,
      // While the AI couldn't check it yet: the file, encrypted, kept only until it's checked.
      fileSealed: { type: String, select: false },
      tries: { type: Number, default: 0 },
      nextTryAt: Date,
    },
    payout: {
      method: { type: String, enum: ["upi", "bank"] },
      upiId: String,
      holder: String,
      ifsc: String,
      accountLast4: String,
      accountSealed: { type: String, select: false },
    },
    online: { type: Boolean, default: true },
    // Average of customers' star ratings; new professionals start at 4.8 with no ratings.
    rating: { type: Number, default: 4.8 },
    ratingCount: { type: Number, default: 0 },
    jobsDone: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Google accounts start without a phone number, so it is only unique when set.
    phone: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    address: { type: String, trim: true, maxlength: 200, default: "" },
    addresses: { type: [addressSchema], default: [] },
    role: { type: String, enum: ROLES, default: "customer" },
    provider: providerSchema,
  },
  { timestamps: true }
);

/** The fields the client is allowed to see. */
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    phone: this.phone || null,
    address: this.address,
    role: this.role,
    avatar: this.avatar || null,
    google: Boolean(this.googleId),
    ...(this.role === "professional" && { provider: providerStatus(this.provider) }),
  };
};

/** Whether a professional can receive jobs, and what's still missing if not. */
function providerStatus(p) {
  const missing = [];
  if (!p?.skills?.length) missing.push("services");
  if (p?.area?.lat == null) missing.push("service area");
  if (!p?.payout?.method) missing.push("payout details");
  const id = p?.idDoc?.status || "missing";
  return { ready: missing.length === 0 && id === "approved", missing, idStatus: id, online: p?.online ?? false };
}

/** The professional's own view of their profile (masked where it matters). */
userSchema.methods.providerProfile = function providerProfile() {
  const p = this.provider || {};
  return {
    skills: p.skills || [],
    experienceYears: p.experienceYears || 0,
    about: p.about || "",
    area: p.area?.lat != null ? { label: p.area.label, lat: p.area.lat, lng: p.area.lng } : null,
    radiusKm: p.radiusKm || 8,
    idDoc: { type: p.idDoc?.type || null, last4: p.idDoc?.last4 || null, status: p.idDoc?.status || "missing", reason: p.idDoc?.reason || null },
    payout: p.payout?.method
      ? { method: p.payout.method, upiId: p.payout.upiId || null, holder: p.payout.holder || null, ifsc: p.payout.ifsc || null, accountLast4: p.payout.accountLast4 || null }
      : null,
    online: p.online ?? false,
    rating: p.rating ?? 4.8,
    ratingCount: p.ratingCount || 0,
    jobsDone: p.jobsDone || 0,
    status: providerStatus(p),
  };
};

module.exports = { User: model("User", userSchema), ROLES, MAX_ADDRESSES: 10 };
