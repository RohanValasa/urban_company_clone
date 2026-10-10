// Shared setup for API tests: a real MongoDB (MONGODB_TEST_URI, or a local
// "servify_test" database) and the app on a random port. Tests skip
// themselves when no MongoDB is reachable.
const { before, after, beforeEach } = require("node:test");
const mongoose = require("mongoose");
const { createApp } = require("../src/app");
const { User } = require("../src/models/User");
const { Booking } = require("../src/models/Booking");

const MONGO = process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017/servify_test";

/** Registers the hooks for a test file and returns its shared state. */
function useApi({ config = {}, deps = {} } = {}) {
  const api = { base: "", skip: false, sms: [], idChecks: [] };
  let server;

  before(async () => {
    try {
      await mongoose.connect(MONGO, { serverSelectionTimeoutMS: 2000 });
    } catch {
      api.skip = `MongoDB isn't reachable at ${MONGO}`;
      return;
    }
    await User.syncIndexes();
    const verifyGoogle = async (credential) => ({ emailVerified: true, ...JSON.parse(credential) });
    const app = createApp(
      {
        isProd: false,
        jwtSecret: "test-secret",
        googleClientId: "test",
        clientOrigins: [],
        authRateLimit: 1000,
        offerSeconds: 60,
        retryCooldownSeconds: 0,
        ...config,
      },
      {
        verifyGoogle,
        sendSms: async (phone, text) => api.sms.push({ phone, text }),
        checkId: async (input) => {
          api.idChecks.push(input);
          return input.last4 === "0000"
            ? { status: "rejected", reason: "The photo is too blurry.", by: "test" }
            : { status: "approved", reason: "Looks good.", by: "test" };
        },
        ...deps,
      }
    );
    api.dispatch = app.locals.dispatch;
    api.app = app;
    server = app.listen(0);
    api.base = `http://127.0.0.1:${server.address().port}/api`;
  });

  after(async () => {
    server?.closeAllConnections?.();
    server?.close();
    if (!api.skip) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    api.sms.length = 0;
    api.idChecks.length = 0;
    if (!api.skip) await Promise.all([User.deleteMany({}), Booking.deleteMany({})]);
  });

  /** A tiny client that keeps the session cookie, like a browser would. */
  api.agent = () => {
    let cookie = "";
    const call = async (method, path, body) => {
      const res = await fetch(api.base + path, {
        method,
        headers: { "content-type": "application/json", ...(cookie && { cookie }) },
        body: body && JSON.stringify(body),
      });
      const set = res.headers.get("set-cookie");
      if (set) cookie = set.split(";")[0];
      const data = res.status === 204 ? null : await res.json();
      return { status: res.status, data };
    };
    call.cookie = () => cookie;
    return call;
  };

  /** Signs in through the (stubbed) Google route; new accounts have no phone. */
  api.googleUser = async (email, role = "customer") => {
    const call = api.agent();
    const credential = JSON.stringify({ googleId: `g-${email}`, email, name: email.split("@")[0] });
    await call("POST", "/auth/google", { credential, role });
    return call;
  };

  /**
   * A signed-in, approved professional ready for jobs, based at `at`.
   * Returns the agent; `.user()` reads their account.
   */
  api.provider = async (email, { skills = ["cleaning"], at = MADHAPUR, radiusKm = 8, online = true } = {}) => {
    const call = await api.googleUser(email, "professional");
    await User.updateOne(
      { email },
      {
        name: email.split("@")[0].replace(/^./, (c) => c.toUpperCase()) + " Pro",
        provider: {
          skills,
          area: { label: "Test area", ...at },
          radiusKm,
          online,
          idDoc: { type: "aadhaar", last4: "1234", status: "approved" },
          payout: { method: "upi", upiId: "pro@okaxis" },
        },
      }
    );
    return call;
  };

  /** Opens a Server-Sent Events stream and collects its events. */
  api.watch = async (call, path) => {
    const controller = new AbortController();
    const res = await fetch(api.base + path, { headers: { cookie: call.cookie() }, signal: controller.signal });
    const events = [];
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    (async () => {
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let cut;
          while ((cut = buffer.indexOf("\n\n")) >= 0) {
            const chunk = buffer.slice(0, cut);
            buffer = buffer.slice(cut + 2);
            if (chunk.startsWith("data: ")) events.push(JSON.parse(chunk.slice(6)));
          }
        }
      } catch {
        // aborted
      }
    })();
    const waitFor = async (match) => {
      for (let i = 0; i < 150; i++) {
        const found = events.find(match);
        if (found) return found;
        await new Promise((r) => setTimeout(r, 20));
      }
      throw new Error("event never arrived");
    };
    return { events, waitFor, close: () => controller.abort(), contentType: res.headers.get("content-type") };
  };

  return api;
}

/** A start time `daysAhead` days from now at hours:minutes India time. */
function istSlot(hours, minutes = 0, daysAhead = 1) {
  const d = new Date();
  const utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysAhead, hours, minutes) - 330 * 60000;
  return new Date(utc).toISOString();
}

const cart = [
  { id: "bath-4", name: "Intense cleaning (4 bathroom)", category: "Bathroom Cleaning", sub: "bathroom-cleaning", price: 1596, mrp: 1996, qty: 1 },
];
const MADHAPUR = { lat: 17.4483, lng: 78.3915 };

const home = {
  label: "Home",
  house: "Flat 302, Lotus Residency",
  area: "Madhapur, Hyderabad",
  landmark: "Near metro",
  lat: 17.4483,
  lng: 78.3915,
};

module.exports = { useApi, istSlot, cart, home, MADHAPUR };
