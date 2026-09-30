const { Schema, model } = require("mongoose");

const ROLES = ["customer", "professional"];

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
    role: { type: String, enum: ROLES, default: "customer" },
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
  };
};

module.exports = { User: model("User", userSchema), ROLES };
