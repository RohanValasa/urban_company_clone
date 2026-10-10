// The AI assistant and the spare-part price check, with Claude replaced by a stub.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { useApi, istSlot, cart, home, MADHAPUR } = require("./helpers");
const { aiAssistant, CATALOG } = require("../src/lib/assistant");
const { skillFor } = require("../src/lib/skills");

// A fake Anthropic client: records each request and replies with the next queued answer.
const claude = { requests: [], answers: [] };
const fakeClient = {
  beta: {
    messages: {
      create: async (params) => {
        claude.requests.push(params);
        const next = claude.answers.shift();
        if (next instanceof Error) throw next;
        if (next === "refusal") return { stop_reason: "refusal", content: [] };
        return { stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(next) }] };
      },
    },
  },
};

const api = useApi({ deps: { ai: aiAssistant({ client: fakeClient }) }, config: { aiRateLimit: 1000 } });
const PHOTO = { mediaType: "image/jpeg", data: Buffer.from("fake jpeg bytes").toString("base64") };

const assistAnswer = (over = {}) => ({
  understood: true,
  language: "te",
  reply: "మీ బాత్రూమ్ ట్యాప్ లీక్ కోసం ప్లంబర్‌ను పంపుతాము.",
  issue: "Bathroom tap is leaking at the spindle; bring a spindle and washers.",
  service: "plumber",
  packages: [{ id: "plumb-tap", qty: 2 }],
  urgency: "soon",
  safetyTip: "",
  whatToExpect: "ప్లంబర్ ట్యాప్‌ను సరిచేస్తారు, సుమారు 30 నిమిషాలు.",
  preferredDate: "",
  preferredTime: "",
  ...over,
});

const plumberTap = () => {
  const plumber = CATALOG.find((s) => s.slug === "plumber");
  return plumber.packages.find((p) => /tap/i.test(p.name)) || plumber.packages[0];
};

test("the catalogue the AI picks from matches the client and every service can be booked", () => {
  const client = path.join(__dirname, "../../client/src/data/services.js");
  for (const s of CATALOG) {
    assert.ok(skillFor({ sub: s.slug }), `${s.slug} has a skill`);
    assert.ok(fs.readFileSync(client, "utf8").includes(`"${s.slug}"`), `${s.slug} is in the client catalogue`);
  }
  const ids = CATALOG.flatMap((s) => s.packages.map((p) => p.id));
  assert.equal(new Set(ids).size, ids.length, "package ids are unique");
});

test("the assistant needs a sign-in and something to look at", async (t) => {
  if (api.skip) return t.skip(api.skip);
  assert.equal((await api.agent()("POST", "/ai/assist", { text: "tap leaking" })).status, 401);
  const meera = await api.googleUser("meera@shop.test");
  assert.equal((await meera("POST", "/ai/assist", {})).status, 400);
  assert.equal((await meera("POST", "/ai/assist", { image: { mediaType: "image/gif", data: "R0lG" } })).status, 400);
});

test("a photo and Telugu text become catalogue packages at catalogue prices, with the time asked for", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const meera = await api.googleUser("meera@shop.test");
  const tap = plumberTap();
  const tomorrow = new Date(Date.now() + 330 * 60000 + 86400000).toISOString().slice(0, 10);
  claude.requests.length = 0;
  claude.answers.push(
    assistAnswer({
      packages: [{ id: tap.id, qty: 2 }, { id: "not-a-real-package", qty: 1 }, { id: "bath-combo2", qty: 1 }],
      preferredDate: tomorrow,
      preferredTime: "09:10",
    })
  );
  const res = await meera("POST", "/ai/assist", { text: "naa bathroom tap leak avtundi, repu morning", image: PHOTO });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  const out = res.data;
  assert.equal(out.understood, true);
  assert.deepEqual(out.service, { slug: "plumber", label: "Plumber" });
  // Unknown ids and packages from another service are dropped; prices come from the catalogue.
  assert.equal(out.items.length, 1);
  assert.equal(out.items[0].id, tap.id);
  assert.equal(out.items[0].price, tap.price);
  assert.equal(out.items[0].qty, 2);
  assert.equal(out.items[0].sub, "plumber");
  assert.equal(out.total, tap.price * 2);
  // 09:10 rounds up to the 09:30 slot tomorrow (IST).
  assert.equal(out.slot, new Date(`${tomorrow}T09:30:00+05:30`).toISOString());
  assert.equal(out.slotUnavailable, false);

  const sent = claude.requests[0];
  assert.equal(sent.model, "claude-opus-5-5");
  assert.equal(sent.output_config.format.type, "json_schema");
  assert.equal(sent.system[0].cache_control.type, "ephemeral");
  assert.match(sent.system[0].text, /plumb/);
  assert.equal(sent.messages[0].content[0].type, "image");
  assert.match(sent.messages[0].content[1].text, /<customer_words>naa bathroom tap leak avtundi/);
});

test("unclear requests, unbookable times, refusals and outages come back politely", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const meera = await api.googleUser("meera@shop.test");

  claude.answers.push(assistAnswer({ understood: false, service: "", packages: [], reply: "Can you tell me which room?" }));
  const unclear = (await meera("POST", "/ai/assist", { text: "help" })).data;
  assert.equal(unclear.understood, false);
  assert.equal(unclear.items.length, 0);
  assert.equal(unclear.reply, "Can you tell me which room?");

  claude.answers.push(assistAnswer({ preferredDate: "2020-01-01", preferredTime: "23:00" }));
  const late = (await meera("POST", "/ai/assist", { text: "fix my tap at midnight" })).data;
  assert.equal(late.slot, null);
  assert.equal(late.slotUnavailable, true);

  claude.answers.push("refusal");
  assert.equal((await meera("POST", "/ai/assist", { text: "something" })).status, 422);

  const { Anthropic } = require("@anthropic-ai/sdk");
  claude.answers.push(new Anthropic.APIConnectionError({ message: "offline" }));
  const down = await meera("POST", "/ai/assist", { text: "tap" });
  assert.equal(down.status, 502);
  assert.match(down.data.error, /isn't reachable/);
});

test("without an Anthropic key the AI features say they're off", async () => {
  const off = aiAssistant({ hasCredentials: false });
  assert.equal(off.enabled, false);
  await assert.rejects(off.assist({ text: "tap" }), (err) => err.status === 503 && /ANTHROPIC_API_KEY/.test(err.message));
});

test("a spare part: AI fair price, customer approval, and it's added to what's collected", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const ravi = await api.provider("ravi@pro.test", { at: MADHAPUR });
  const meera = await api.googleUser("meera@shop.test");
  await meera("PATCH", "/account/profile", { phone: "9876543210" });
  const { data: addr } = await meera("POST", "/account/addresses", home);
  const made = await meera("POST", "/bookings", { items: cart, slot: istSlot(10), payment: "upi", addressId: addr.address.id, note: "Tap leaks under the sink." });
  assert.equal(made.status, 201);
  const id = made.data.booking.id;
  assert.equal(made.data.booking.note, "Tap leaks under the sink.");
  assert.equal((await ravi("GET", "/pro/offers")).data.offers[0].note, "Tap leaks under the sink.");

  await ravi("POST", `/pro/offers/${id}/accept`);
  // Not before the job starts.
  assert.equal((await ravi("POST", `/pro/jobs/${id}/parts`, { image: PHOTO, quoted: 300 })).status, 409);
  await ravi("POST", `/pro/jobs/${id}/status`, { status: "on-the-way" });
  await ravi("POST", `/pro/jobs/${id}/status`, { status: "arrived" });
  const code = (await meera("GET", `/bookings/${id}`)).data.booking.otp.code;
  await ravi("POST", `/pro/jobs/${id}/start`, { otp: code });

  assert.equal((await ravi("POST", `/pro/jobs/${id}/parts`, { quoted: 300 })).status, 400);
  assert.equal((await ravi("POST", `/pro/jobs/${id}/parts`, { image: PHOTO, quoted: 0 })).status, 400);

  claude.requests.length = 0;
  claude.answers.push({ identified: true, partName: "Tap spindle", description: "Opens and closes the tap.", fairLow: 250, fairHigh: 150, confidence: "medium", notes: "Brass costs more." });
  const added = await ravi("POST", `/pro/jobs/${id}/parts`, { image: PHOTO, quoted: 320, note: "half-turn spindle" });
  assert.equal(added.status, 201, JSON.stringify(added.data));
  const [part] = added.data.job.parts;
  assert.equal(part.fairLow, 150); // swapped into order
  assert.equal(part.fairHigh, 250);
  assert.equal(part.verdict, "high"); // 320 is more than 25% over 250
  assert.equal(part.status, "pending");
  assert.match(claude.requests[0].messages[0].content[1].text, /<technician_note>half-turn spindle/);

  // Can't finish while the customer hasn't answered; only the customer can answer.
  assert.equal((await ravi("POST", `/pro/jobs/${id}/complete`, {})).status, 409);
  assert.equal((await ravi("POST", `/bookings/${id}/parts/${part.id}`, { decision: "approve" })).status, 404);
  const approved = await meera("POST", `/bookings/${id}/parts/${part.id}`, { decision: "approve" });
  assert.equal(approved.data.booking.partsTotal, 320);
  assert.equal(approved.data.booking.amountDue, 320); // the bill was paid by UPI; the part wasn't
  assert.equal((await meera("POST", `/bookings/${id}/parts/${part.id}`, { decision: "decline" })).status, 409);

  // A part the AI can't identify isn't added.
  claude.answers.push({ identified: false, partName: "", description: "", fairLow: 0, fairHigh: 0, confidence: "low", notes: "Take a closer photo of the label." });
  const unclear = await ravi("POST", `/pro/jobs/${id}/parts`, { image: PHOTO, quoted: 100 });
  assert.equal(unclear.status, 422);
  assert.match(unclear.data.error, /closer photo/);

  assert.equal((await ravi("POST", `/pro/jobs/${id}/complete`, {})).status, 400);
  const done = await ravi("POST", `/pro/jobs/${id}/complete`, { collected: "cash" });
  assert.equal(done.data.job.status, "completed");
  assert.equal(done.data.job.payment.collectedAs, "cash");
});

test("a declined part isn't charged, and the job closes as prepaid", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const ravi = await api.provider("ravi@pro.test", { at: MADHAPUR });
  const meera = await api.googleUser("meera@shop.test");
  await meera("PATCH", "/account/profile", { phone: "9876543210" });
  const { data: addr } = await meera("POST", "/account/addresses", home);
  const { id } = (await meera("POST", "/bookings", { items: cart, slot: istSlot(10), payment: "upi", addressId: addr.address.id })).data.booking;
  await ravi("POST", `/pro/offers/${id}/accept`);
  await ravi("POST", `/pro/jobs/${id}/status`, { status: "on-the-way" });
  await ravi("POST", `/pro/jobs/${id}/status`, { status: "arrived" });
  await ravi("POST", `/pro/jobs/${id}/start`, { otp: (await meera("GET", `/bookings/${id}`)).data.booking.otp.code });

  claude.answers.push({ identified: true, partName: "6A MCB", description: "Trips on overload.", fairLow: 180, fairHigh: 350, confidence: "high", notes: "" });
  const { parts } = (await ravi("POST", `/pro/jobs/${id}/parts`, { image: PHOTO, quoted: 300 })).data.job;
  assert.equal(parts[0].verdict, "fair");
  const declined = await meera("POST", `/bookings/${id}/parts/${parts[0].id}`, { decision: "decline" });
  assert.equal(declined.data.booking.amountDue, 0);
  const done = await ravi("POST", `/pro/jobs/${id}/complete`, {});
  assert.equal(done.data.job.payment.collectedAs, "prepaid");
});
