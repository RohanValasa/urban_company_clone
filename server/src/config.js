const crypto = require("node:crypto");
require("dotenv").config({ quiet: true });

const env = process.env;
const isProd = env.NODE_ENV === "production";

function jwtSecret() {
  if (env.JWT_SECRET) return env.JWT_SECRET;
  if (isProd) throw new Error("JWT_SECRET must be set in production.");
  // A per-run secret keeps development safe; sessions just end on restart.
  console.warn("JWT_SECRET is not set; using a random one, so sessions reset when the server restarts.");
  return crypto.randomBytes(32).toString("hex");
}

module.exports = {
  isProd,
  port: Number(env.PORT) || 5000,
  mongoUri: env.MONGODB_URI || "mongodb://127.0.0.1:27017/servify",
  jwtSecret: jwtSecret(),
  googleClientId: env.GOOGLE_CLIENT_ID || "",
  // Where UPI payments go. Without it the UPI option shows no QR code.
  upiId: env.UPI_ID || "",
  upiName: env.UPI_NAME || "Servify",
  // Seconds a professional has to answer a job offer before it moves on.
  offerSeconds: Number(env.OFFER_SECONDS) || 90,
  // How long a customer waits before asking again when nobody accepted.
  retryCooldownSeconds: Number(env.RETRY_COOLDOWN_SECONDS) || 120,
  // Claude checks ID photos when an Anthropic credential is available.
  hasAnthropicKey: Boolean(env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN),
  aiRateLimit: Number(env.AI_RATE_LIMIT) || 30,
  fieldKey: env.FIELD_KEY || "",
  clientOrigins: (env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((o) => o.trim()),
  authRateLimit: Number(env.AUTH_RATE_LIMIT) || 20,
};
