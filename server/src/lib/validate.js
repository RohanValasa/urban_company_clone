const { ROLES } = require("../models/User");

// Keep in step with PASSWORD_RULES in client/src/context/AuthContext.jsx.
const PASSWORD_RULES = [
  { label: "at least 8 characters", test: (v) => v.length >= 8 },
  { label: "an uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "a lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "a number", test: (v) => /\d/.test(v) },
  { label: "a special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\d{10}$/;

const str = (v) => (typeof v === "string" ? v.trim() : "");

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
    this.expose = true;
  }
}

function checkPassword(password) {
  if (typeof password !== "string" || password.length > 128) {
    throw new ValidationError("Enter a password of up to 128 characters.");
  }
  const missing = PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.label);
  if (missing.length) throw new ValidationError(`Password needs ${missing.join(", ")}.`);
}

/** Cleaned sign-up fields, or a ValidationError naming the first problem. */
function signupInput(body = {}) {
  const input = {
    name: str(body.name),
    email: str(body.email).toLowerCase(),
    phone: str(body.phone),
    address: str(body.address),
    role: str(body.role) || "customer",
  };
  if (input.name.length < 2 || input.name.length > 80) throw new ValidationError("Enter your full name.");
  if (!EMAIL.test(input.email) || input.email.length > 254) throw new ValidationError("Enter a valid email address.");
  if (!PHONE.test(input.phone)) throw new ValidationError("Enter a valid 10-digit phone number.");
  if (input.address.length > 200) throw new ValidationError("Keep the address under 200 characters.");
  if (!ROLES.includes(input.role)) throw new ValidationError("Choose whether you need or provide a service.");
  checkPassword(body.password);
  return { ...input, password: body.password };
}

/** A 10-digit Indian mobile number, ignoring spaces, dashes and a +91 prefix. */
function phoneInput(raw) {
  let digits = str(raw).replace(/[\s-]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  if (!/^[6-9]\d{9}$/.test(digits)) throw new ValidationError("Enter a valid 10-digit mobile number.");
  return digits;
}

const ID_TYPES = ["aadhaar", "pan", "voter", "dl", "passport"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Cleans a professional's profile form. Every part is optional so it can be
 * saved step by step; whatever is sent must be valid.
 * Needs the skill keys and the Hyderabad check passed in to avoid a cycle.
 */
function providerInput(body = {}, { skillKeys, inCity }) {
  const out = {};
  if (body.skills !== undefined) {
    const skills = Array.isArray(body.skills) ? [...new Set(body.skills.map(str))] : [];
    if (skills.length === 0 || skills.some((s) => !skillKeys.includes(s))) throw new ValidationError("Pick at least one service you offer.");
    out.skills = skills;
  }
  if (body.experienceYears !== undefined) {
    const years = Number(body.experienceYears);
    if (!Number.isInteger(years) || years < 0 || years > 60) throw new ValidationError("Enter your years of experience (0–60).");
    out.experienceYears = years;
  }
  if (body.about !== undefined) {
    const about = str(body.about);
    if (about.length > 1000) throw new ValidationError("Keep the experience note under 1000 characters.");
    out.about = about;
  }
  if (body.area !== undefined) {
    const area = { label: str(body.area?.label).slice(0, 120), lat: Number(body.area?.lat), lng: Number(body.area?.lng) };
    if (!inCity(area)) throw new ValidationError("Choose a service area inside Hyderabad.");
    out.area = area;
  }
  if (body.radiusKm !== undefined) {
    const r = Number(body.radiusKm);
    if (!Number.isInteger(r) || r < 1 || r > 30) throw new ValidationError("Choose how far you'll travel (1–30 km).");
    out.radiusKm = r;
  }
  if (body.idDoc !== undefined) {
    const type = str(body.idDoc?.type);
    const last4 = str(body.idDoc?.last4).toUpperCase();
    const image = body.idDoc?.image;
    if (!ID_TYPES.includes(type)) throw new ValidationError("Choose which ID you're uploading.");
    if (!/^[A-Z0-9]{4}$/.test(last4)) throw new ValidationError("Enter the last 4 characters of your ID number.");
    if (!IMAGE_TYPES.includes(image?.mediaType) || typeof image?.data !== "string") {
      throw new ValidationError("Upload a photo of your ID (JPG, PNG or WebP).");
    }
    if (image.data.length * 0.75 > MAX_IMAGE_BYTES) throw new ValidationError("That photo is too large. Please use one under 4 MB.");
    out.idDoc = { type, last4, image: { mediaType: image.mediaType, data: image.data } };
  }
  if (body.payout !== undefined) {
    const method = str(body.payout?.method);
    if (method === "upi") {
      const upiId = str(body.payout?.upiId).toLowerCase();
      if (!/^[a-z0-9._-]{2,256}@[a-z]{2,64}$/.test(upiId)) throw new ValidationError("Enter a valid UPI ID, like name@okbank.");
      out.payout = { method, upiId };
    } else if (method === "bank") {
      const holder = str(body.payout?.holder);
      const ifsc = str(body.payout?.ifsc).toUpperCase();
      const account = str(body.payout?.accountNumber).replace(/\s/g, "");
      if (holder.length < 2 || holder.length > 80) throw new ValidationError("Enter the account holder's name.");
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) throw new ValidationError("Enter a valid IFSC code, like SBIN0001234.");
      if (!/^\d{9,18}$/.test(account)) throw new ValidationError("Enter a valid bank account number (9–18 digits).");
      out.payout = { method, holder, ifsc, accountNumber: account };
    } else {
      throw new ValidationError("Choose UPI or bank account for your payouts.");
    }
  }
  return out;
}

/** `{ email }` or `{ phone }` from what the user typed in the sign-in box. */
function loginIdentifier(raw) {
  const id = str(raw);
  if (id.includes("@")) return { email: id.toLowerCase() };
  const digits = id.replace(/\D/g, "");
  if (PHONE.test(digits)) return { phone: digits };
  throw new ValidationError("Enter your email or 10-digit phone number.");
}

module.exports = { ValidationError, signupInput, loginIdentifier, phoneInput, providerInput, str, ROLES, ID_TYPES };
