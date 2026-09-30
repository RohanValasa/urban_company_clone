const express = require("express");
const bcrypt = require("bcryptjs");
const { User, ROLES } = require("../models/User");
const { ValidationError, signupInput, loginIdentifier } = require("../lib/validate");

const BCRYPT_COST = 12;
// Compared against when no account matches, so a miss takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync("servify-no-such-account", BCRYPT_COST);

// `expose` marks the message as safe to show the user.
const httpError = (status, message) => Object.assign(new Error(message), { status, expose: true });

/** Which field a duplicate-key error from MongoDB is about. */
function duplicateMessage(err) {
  const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
  if (field === "phone") return "An account with this phone number already exists.";
  if (field === "googleId") return "This Google account is already linked to another Servify account.";
  return "An account with this email already exists. Sign in instead.";
}

/**
 * @param {object} deps
 * @param {ReturnType<import("../lib/session").sessionCookies>} deps.session
 * @param {null | ((credential: string) => Promise<object>)} deps.verifyGoogle
 */
function authRouter({ session, verifyGoogle }) {
  const router = express.Router();

  router.post("/signup", async (req, res) => {
    const input = signupInput(req.body);
    const clash = await User.findOne({ $or: [{ email: input.email }, { phone: input.phone }] }, "email");
    if (clash) {
      const field = clash.email === input.email ? "email" : "phone";
      throw httpError(409, duplicateMessage({ keyPattern: { [field]: 1 } }));
    }
    const { password, ...fields } = input;
    const user = await User.create({ ...fields, passwordHash: await bcrypt.hash(password, BCRYPT_COST) });
    session.start(res, user);
    res.status(201).json({ user: user.toPublic() });
  });

  router.post("/login", async (req, res) => {
    const where = loginIdentifier(req.body?.identifier);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const user = await User.findOne(where).select("+passwordHash");

    const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
    if (!user || !user.passwordHash || !ok) {
      if (user && !user.passwordHash) throw httpError(401, "This account uses Google. Continue with Google to sign in.");
      throw httpError(401, "Invalid email/phone or password.");
    }
    session.start(res, user);
    res.json({ user: user.toPublic() });
  });

  router.post("/google", async (req, res) => {
    if (!verifyGoogle) throw httpError(503, "Google sign-in isn't set up on this server yet.");
    const credential = req.body?.credential;
    if (typeof credential !== "string" || !credential) throw new ValidationError("Missing Google credential.");

    let profile;
    try {
      profile = await verifyGoogle(credential);
    } catch {
      throw httpError(401, "Google sign-in failed. Please try again.");
    }
    if (!profile.email || !profile.emailVerified) throw httpError(401, "Your Google email address isn't verified.");

    const email = profile.email.toLowerCase();
    let user = await User.findOne({ googleId: profile.googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // Google has verified the address, so link it to the existing account.
        user.googleId = profile.googleId;
        if (!user.avatar && profile.avatar) user.avatar = profile.avatar;
        await user.save();
      } else {
        const role = ROLES.includes(req.body?.role) ? req.body.role : "customer";
        user = await User.create({
          name: (profile.name || email.split("@")[0]).slice(0, 80),
          email,
          googleId: profile.googleId,
          avatar: profile.avatar,
          role,
        });
        res.status(201);
      }
    }
    session.start(res, user);
    res.json({ user: user.toPublic() });
  });

  router.post("/logout", (req, res) => {
    session.end(res);
    res.status(204).end();
  });

  router.get("/me", async (req, res) => {
    const id = session.userId(req);
    const user = id && (await User.findById(id).catch(() => null));
    if (!user) {
      if (id) session.end(res);
      return res.json({ user: null });
    }
    res.json({ user: user.toPublic() });
  });

  return router;
}

module.exports = { authRouter, duplicateMessage };
