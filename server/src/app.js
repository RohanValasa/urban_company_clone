const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");
const { authRouter, duplicateMessage } = require("./routes/auth");
const { accountRouter } = require("./routes/account");
const { bookingsRouter } = require("./routes/bookings");
const { proRouter } = require("./routes/pro");
const { sessionCookies } = require("./lib/session");
const { googleVerifier } = require("./lib/google");

/**
 * Builds the API. `verifyGoogle` can be swapped out in tests, since a real
 * Google credential can't be minted offline.
 */
function createApp(config, { verifyGoogle = googleVerifier(config.googleClientId) } = {}) {
  const app = express();
  const session = sessionCookies(config);

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(cors({ origin: config.clientOrigins, credentials: true }));
  app.use(express.json({ limit: "20kb" }));
  app.use(cookieParser());

  app.get("/api/health", (req, res) => res.json({ ok: true }));
  app.get("/api/config", (req, res) =>
    res.json({
      googleClientId: config.googleClientId || null,
      upi: config.upiId ? { id: config.upiId, name: config.upiName } : null,
    })
  );

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.authRateLimit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // Only guess-able actions count; checking the session doesn't.
    skip: (req) => req.method === "GET" || req.path === "/logout",
    message: { error: "Too many attempts. Please wait a few minutes and try again." },
  });
  app.use("/api/auth", authLimiter, authRouter({ session, verifyGoogle }));
  app.use("/api/account", accountRouter({ session }));
  app.use("/api/bookings", bookingsRouter({ session }));
  app.use("/api/pro", proRouter({ session }));

  app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

  // Express 5 forwards rejected promises from async handlers here.
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err.code === 11000) return res.status(409).json({ error: duplicateMessage(err) });
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON." });
    const status = err.status || err.statusCode || 500;
    if (!err.expose) console.error(err);
    res.status(status).json({ error: err.expose ? err.message : "Something went wrong. Please try again." });
  });

  return app;
}

module.exports = { createApp };
