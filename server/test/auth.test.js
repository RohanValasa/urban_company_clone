// Runs the API against a real MongoDB (MONGODB_TEST_URI, or a local
// "servify_test" database). Skipped when no MongoDB is reachable.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { createApp } = require("../src/app");
const { User } = require("../src/models/User");

const MONGO = process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017/servify_test";
const config = {
  isProd: false,
  jwtSecret: "test-secret",
  googleClientId: "test-client.apps.googleusercontent.com",
  clientOrigins: ["http://localhost:5173"],
  authRateLimit: 1000,
};

// Stands in for Google: the "credential" is JSON describing the Google profile.
const verifyGoogle = async (credential) => {
  if (credential === "forged") throw new Error("bad signature");
  return { emailVerified: true, ...JSON.parse(credential) };
};

let server;
let base;
let skip = false;

before(async () => {
  try {
    await mongoose.connect(MONGO, { serverSelectionTimeoutMS: 2000 });
  } catch {
    skip = `MongoDB isn't reachable at ${MONGO}`;
    return;
  }
  await User.syncIndexes();
  server = createApp(config, { verifyGoogle }).listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server?.close();
  if (!skip) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  if (!skip) await User.deleteMany({});
});

/** A tiny client that keeps the session cookie, like a browser would. */
function agent() {
  let cookie = "";
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { "content-type": "application/json", ...(cookie && { cookie }) },
      body: body && JSON.stringify(body),
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const data = res.status === 204 ? null : await res.json();
    return { status: res.status, data, setCookie: set };
  };
}

const priya = {
  name: "Priya Sharma",
  email: "Priya@Example.com",
  phone: "9876543210",
  password: "Str0ng!pass",
  role: "customer",
};

test("sign up starts a session and hides the password", async (t) => {
  if (skip) return t.skip(skip);
  const call = agent();
  const res = await call("POST", "/auth/signup", priya);
  assert.equal(res.status, 201);
  assert.equal(res.data.user.email, "priya@example.com");
  assert.equal(res.data.user.passwordHash, undefined);
  assert.match(res.setCookie, /HttpOnly/i);

  const me = await call("GET", "/auth/me");
  assert.equal(me.data.user.name, "Priya Sharma");

  const stored = await User.findOne({ email: "priya@example.com" }).select("+passwordHash");
  assert.notEqual(stored.passwordHash, priya.password);
  assert.match(stored.passwordHash, /^\$2[aby]\$12\$/);
});

test("sign up rejects weak passwords and bad fields", async (t) => {
  if (skip) return t.skip(skip);
  const call = agent();
  const weak = await call("POST", "/auth/signup", { ...priya, password: "password" });
  assert.equal(weak.status, 400);
  assert.match(weak.data.error, /uppercase/);

  const phone = await call("POST", "/auth/signup", { ...priya, phone: "12345" });
  assert.equal(phone.status, 400);

  const role = await call("POST", "/auth/signup", { ...priya, role: "admin" });
  assert.equal(role.status, 400);
  assert.equal(await User.countDocuments(), 0);
});

test("sign up refuses a taken email or phone", async (t) => {
  if (skip) return t.skip(skip);
  const call = agent();
  await call("POST", "/auth/signup", priya);
  const email = await call("POST", "/auth/signup", { ...priya, phone: "9000000000" });
  assert.equal(email.status, 409);
  assert.match(email.data.error, /email/);
  const phone = await call("POST", "/auth/signup", { ...priya, email: "other@example.com" });
  assert.equal(phone.status, 409);
  assert.match(phone.data.error, /phone/);
});

test("sign in with email or phone, and sign out", async (t) => {
  if (skip) return t.skip(skip);
  await agent()("POST", "/auth/signup", priya);

  const call = agent();
  const wrong = await call("POST", "/auth/login", { identifier: "priya@example.com", password: "Wr0ng!pass" });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.data.error, "Invalid email/phone or password.");
  const nobody = await call("POST", "/auth/login", { identifier: "nobody@example.com", password: priya.password });
  assert.equal(nobody.data.error, wrong.data.error);

  const byEmail = await call("POST", "/auth/login", { identifier: " PRIYA@example.com ", password: priya.password });
  assert.equal(byEmail.status, 200);
  const byPhone = await call("POST", "/auth/login", { identifier: "98765 43210", password: priya.password });
  assert.equal(byPhone.data.user.email, "priya@example.com");

  assert.equal((await call("POST", "/auth/logout")).status, 204);
  assert.equal((await call("GET", "/auth/me")).data.user, null);
});

test("a tampered session cookie is ignored", async (t) => {
  if (skip) return t.skip(skip);
  const res = await fetch(`${base}/auth/me`, { headers: { cookie: "servify_session=not.a.token" } });
  assert.deepEqual(await res.json(), { user: null });
});

test("Google creates an account with the chosen role", async (t) => {
  if (skip) return t.skip(skip);
  const call = agent();
  const credential = JSON.stringify({ googleId: "g-1", email: "Asha@gmail.com", name: "Asha Rao", avatar: "https://lh3.googleusercontent.com/a" });
  const res = await call("POST", "/auth/google", { credential, role: "professional" });
  assert.equal(res.status, 201);
  assert.equal(res.data.user.role, "professional");
  assert.equal(res.data.user.google, true);
  assert.equal(res.data.user.phone, null);

  // Signing in again finds the same account.
  const again = await agent()("POST", "/auth/google", { credential, role: "customer" });
  assert.equal(again.status, 200);
  assert.equal(again.data.user.id, res.data.user.id);
  assert.equal(again.data.user.role, "professional");

  // Google-only accounts have no password to guess.
  const pw = await agent()("POST", "/auth/login", { identifier: "asha@gmail.com", password: "Anything1!" });
  assert.equal(pw.status, 401);
  assert.match(pw.data.error, /Google/);
});

test("Google links to an existing account with the same email", async (t) => {
  if (skip) return t.skip(skip);
  const made = await agent()("POST", "/auth/signup", priya);
  const credential = JSON.stringify({ googleId: "g-2", email: "priya@example.com", name: "P" });
  const res = await agent()("POST", "/auth/google", { credential });
  assert.equal(res.status, 200);
  assert.equal(res.data.user.id, made.data.user.id);
  assert.equal(res.data.user.name, "Priya Sharma");
  assert.equal(await User.countDocuments(), 1);

  // The password still works too.
  const pw = await agent()("POST", "/auth/login", { identifier: priya.email, password: priya.password });
  assert.equal(pw.status, 200);
});

test("Google rejects bad or unverified credentials", async (t) => {
  if (skip) return t.skip(skip);
  const call = agent();
  assert.equal((await call("POST", "/auth/google", { credential: "forged" })).status, 401);
  assert.equal((await call("POST", "/auth/google", {})).status, 400);
  const unverified = JSON.stringify({ googleId: "g-3", email: "x@gmail.com", emailVerified: false });
  assert.equal((await call("POST", "/auth/google", { credential: unverified })).status, 401);
  assert.equal(await User.countDocuments(), 0);
});

test("Google sign-in reports when it isn't configured", async (t) => {
  if (skip) return t.skip(skip);
  const off = createApp({ ...config, googleClientId: "" }).listen(0);
  try {
    const port = off.address().port;
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/google`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ credential: "x" }),
    });
    assert.equal(res.status, 503);
    assert.match((await res.json()).error, /isn't set up/);
    const cfg = await (await fetch(`http://127.0.0.1:${port}/api/config`)).json();
    assert.equal(cfg.googleClientId, null);
  } finally {
    off.close();
  }
});
