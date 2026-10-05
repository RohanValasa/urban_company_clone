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
  clientOrigins: (env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((o) => o.trim()),
  authRateLimit: Number(env.AUTH_RATE_LIMIT) || 20,
};
