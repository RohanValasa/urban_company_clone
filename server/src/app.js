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
const { requireUser } = require("./lib/http");
const { openStream } = require("./lib/live");
const { onNotifications } = require("./lib/notify");
const { dispatcher } = require("./lib/dispatch");
const { idChecker } = require("./lib/idcheck");
const { idQueue } = require("./lib/idqueue");
const { createAi, createBackend } = require("./lib/assistant");
const { aiRouter } = require("./routes/ai");
const { prosRouter } = require("./routes/pros");
const { smsSender } = require("./lib/sms");
const { sealer } = require("./lib/seal");
const { SKILLS } = require("./lib/skills");

/**
 * Builds the API. Outside services (Google sign-in, the AI ID check, SMS) can
 * be swapped out in tests, since they can't run offline.
 */
function createApp(
  config,
  {
    verifyGoogle = googleVerifier(config.googleClientId),
    checkId = idChecker({ backend: createBackend(config), isProd: config.isProd }),
    ai = createAi(config),
    sendSms = smsSender(),
  } = {}
) {
  const app = express();
  const session = sessionCookies(config);
  const offerMs = (config.offerSeconds ?? 90) * 1000;
  const retryCooldownMs = (config.retryCooldownSeconds ?? 120) * 1000;
  const dispatch = dispatcher({ offerMs, retryCooldownMs });
  const { seal, open } = sealer(config.fieldKey || config.jwtSecret);
  const idChecks = idQueue({ checkId, seal, open });
  // The server calls dispatch.sweep() on a timer; tests call it directly.
  app.locals.dispatch = dispatch;
  app.locals.aiMode = ai.mode;
  // The server retries queued ID checks on a timer; tests call it directly.
  app.locals.idChecks = idChecks;

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(cors({ origin: config.clientOrigins, credentials: true }));
  // The onboarding form, the AI assistant and the parts check carry a photo.
  app.use(["/api/pro/profile", "/api/ai/assist", "/api/pro/jobs/:id/parts"], express.json({ limit: "6mb" }));
  app.use(express.json({ limit: "20kb" }));
  app.use(cookieParser());

  app.get("/api/health", (req, res) => res.json({ ok: true }));
  app.get("/api/config", (req, res) =>
    res.json({
      googleClientId: config.googleClientId || null,
      upi: config.upiId ? { id: config.upiId, name: config.upiName } : null,
      skills: SKILLS,
      offerSeconds: offerMs / 1000,
      // Which assistant answers: "gemini", "claude", or the free keyword-based "basic" one.
      aiMode: ai.mode,
    })
  );

  // Pop-up notifications for whoever is signed in, as Server-Sent Events.
  app.get("/api/notifications/live", requireUser(session), (req, res) => {
    const stream = openStream(req, res, { type: "hello" });
    stream.onClose(onNotifications(req.user.id, stream.send));
  });

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
  // Each AI call costs money, so every account gets a budget (per hour).
  const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: config.aiRateLimit ?? 30,
    keyGenerator: (req) => String(req.user._id),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "You've used the AI assistant a lot this hour. Please try again a bit later." },
  });
  app.use("/api/ai", aiRouter({ session, ai, aiLimiter }));
  app.use("/api/pros", prosRouter());
  app.use("/api/bookings", bookingsRouter({ session, dispatch, retryCooldownMs }));
  app.use("/api/pro", proRouter({ session, dispatch, idChecks, sendSms, seal, ai, aiLimiter }));

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
