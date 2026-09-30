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

/** `{ email }` or `{ phone }` from what the user typed in the sign-in box. */
function loginIdentifier(raw) {
  const id = str(raw);
  if (id.includes("@")) return { email: id.toLowerCase() };
  const digits = id.replace(/\D/g, "");
  if (PHONE.test(digits)) return { phone: digits };
  throw new ValidationError("Enter your email or 10-digit phone number.");
}

module.exports = { ValidationError, signupInput, loginIdentifier, ROLES };
