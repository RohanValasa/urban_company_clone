// Gemini requests and answers, with Google's API replaced by a stub.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { geminiBackend, toGeminiSchema } = require("../src/lib/gemini");
const { aiAssistant, ASSIST_SCHEMA } = require("../src/lib/assistant");

/** A stand-in for fetch that records the request and replies with `reply`. */
function fakeFetch(status, body) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, headers: init.headers, body: JSON.parse(init.body) });
    return { ok: status < 400, status, statusText: "x", json: async () => body };
  };
  fn.calls = calls;
  return fn;
}
const answer = (obj, extraParts = []) => ({
  candidates: [{ finishReason: "STOP", content: { parts: [...extraParts, { text: JSON.stringify(obj) }] } }],
});
const ASSIST = {
  understood: true, language: "en", reply: "A plumber will fix it.", issue: "Leaking tap.", service: "plumber",
  packages: [{ id: "plumb-tap-2", qty: 1 }], urgency: "soon", safetyTip: "", whatToExpect: "30 minutes.",
  preferredDate: "", preferredTime: "",
};
const PHOTO = { mediaType: "image/jpeg", data: "QUJD" };

test("the schema is converted to Gemini's format", () => {
  const g = toGeminiSchema(ASSIST_SCHEMA);
  assert.equal(g.type, "OBJECT");
  assert.equal(g.additionalProperties, undefined);
  assert.equal(g.properties.packages.type, "ARRAY");
  assert.equal(g.properties.packages.items.properties.qty.type, "INTEGER");
  assert.deepEqual(g.properties.urgency.enum, ["routine", "soon", "urgent", "emergency"]);
  assert.deepEqual(g.propertyOrdering, Object.keys(ASSIST_SCHEMA.properties));
  assert.ok(!JSON.stringify(g).includes("additionalProperties"));
});

test("a request carries the key, the photo, the prompt and the schema, and thoughts are skipped", async () => {
  const fetch = fakeFetch(200, answer(ASSIST, [{ text: "thinking about taps…", thought: true }]));
  const ai = aiAssistant({ backend: geminiBackend({ apiKey: "free-key", model: "gemini-3.8-flash", fetch }) });
  const r = await ai.assist({ text: "tap leaking", image: PHOTO });
  assert.equal(r.service.slug, "plumber");
  assert.equal(r.items[0].id, "plumb-tap-2");

  const [call] = fetch.calls;
  assert.match(call.url, /\/v1beta\/models\/gemini-3\.8-flash:generateContent$/);
  assert.equal(call.headers["x-goog-api-key"], "free-key");
  assert.match(call.body.systemInstruction.parts[0].text, /booking assistant for Servify/);
  assert.deepEqual(call.body.contents[0].parts[0], { inlineData: { mimeType: "image/jpeg", data: "QUJD" } });
  assert.match(call.body.contents[0].parts[1].text, /<customer_words>tap leaking/);
  assert.equal(call.body.generationConfig.responseMimeType, "application/json");
  assert.equal(call.body.generationConfig.responseSchema.type, "OBJECT");
});

test("the parts check can use its own model", async () => {
  const fetch = fakeFetch(200, answer({ identified: true, partName: "6A MCB", description: "Breaker.", fairLow: 150, fairHigh: 400, confidence: "high", notes: "" }));
  const ai = aiAssistant({ backend: geminiBackend({ apiKey: "k", model: "gemini-3.8-flash", partsModel: "gemini-3.8-pro", fetch }) });
  const p = await ai.priceParts({ image: PHOTO, note: "", job: "Electrician" });
  assert.equal(p.name, "6A MCB");
  assert.match(fetch.calls[0].url, /gemini-3\.8-pro:generateContent/);
});

test("out of free quota: the basic assistant answers instead", async () => {
  const fetch = fakeFetch(429, { error: { message: "Resource has been exhausted" } });
  const ai = aiAssistant({ backend: geminiBackend({ apiKey: "k", fetch }) });
  const r = await ai.assist({ text: "my AC is not cooling" });
  assert.equal(r.fellBack, true);
  assert.equal(r.fallbackReason, "limit");
  assert.equal(r.service.slug, "ac");
  // Parts fall back to the price list when the part was named.
  const p = await ai.priceParts({ image: PHOTO, note: "tap spindle", job: "Plumber" });
  assert.equal(p.name, "Tap spindle");
  await assert.rejects(ai.priceParts({ image: PHOTO, note: "", job: "Plumber" }), (e) => e.status === 503);
});

test("an overloaded model or a dropped connection is retried once", async () => {
  const quiet = console.error;
  console.error = () => {};
  let calls = 0;
  const flaky = async () => {
    calls++;
    if (calls === 1) return { ok: false, status: 503, statusText: "x", json: async () => ({ error: { message: "The model is overloaded." } }) };
    return { ok: true, status: 200, json: async () => answer(ASSIST) };
  };
  const ai = aiAssistant({ backend: geminiBackend({ apiKey: "k", fetch: flaky, retryDelayMs: 1 }) });
  assert.equal((await ai.assist({ text: "tap leaking" })).service.slug, "plumber");
  assert.equal(calls, 2);

  const alwaysBusy = aiAssistant({ backend: geminiBackend({ apiKey: "k", fetch: fakeFetch(503, { error: { message: "overloaded" } }), retryDelayMs: 1 }) });
  const r = await alwaysBusy.assist({ text: "tap leaking" });
  assert.equal(r.fallbackReason, "busy");

  let tries = 0;
  const dropped = geminiBackend({ apiKey: "k", retryDelayMs: 1, fetch: async () => { tries++; throw Object.assign(new Error("fetch failed"), { cause: { code: "ECONNRESET" } }); } });
  await assert.rejects(dropped.json({ kind: "assist", system: "s", text: "t", schema: ASSIST_SCHEMA }), (e) => e.reason === "offline");
  assert.equal(tries, 2);
  console.error = quiet;
});

test("set-up mistakes and blocked answers", async () => {
  const retired = "This model models/gemini-9 is no longer available to new users. Please update your code to use models/gemini-10-flash.";
  const wrongModel = geminiBackend({ apiKey: "k", model: "gemini-9", fetch: fakeFetch(404, { error: { message: retired } }) });
  const logged = [];
  const realError = console.error;
  console.error = (line) => logged.push(line);
  await assert.rejects(wrongModel.json({ kind: "assist", system: "s", text: "t", schema: ASSIST_SCHEMA }), (e) => e.fallback && e.reason === "setup" && /GEMINI_MODEL/.test(e.message));
  console.error = realError;
  assert.ok(logged.some((line) => line.includes("GEMINI_MODEL=gemini-10-flash")), "suggests the replacement model");
  const badKey = geminiBackend({ apiKey: "k", fetch: fakeFetch(403, { error: { message: "denied" } }) });
  await assert.rejects(badKey.json({ kind: "assist", system: "s", text: "t", schema: ASSIST_SCHEMA }), (e) => e.fallback && /GEMINI_API_KEY/.test(e.message));
  const blocked = geminiBackend({ apiKey: "k", fetch: fakeFetch(200, { promptFeedback: { blockReason: "SAFETY" } }) });
  await assert.rejects(blocked.json({ kind: "assist", system: "s", text: "t", schema: ASSIST_SCHEMA }), (e) => e.status === 422 && !e.fallback);
  const garbled = geminiBackend({ apiKey: "k", fetch: fakeFetch(200, { candidates: [{ content: { parts: [{ text: "not json" }] } }] }) });
  await assert.rejects(garbled.json({ kind: "assist", system: "s", text: "t", schema: ASSIST_SCHEMA }), (e) => e.status === 502 && e.fallback);
  const offline = geminiBackend({ apiKey: "k", retryDelayMs: 1, fetch: async () => { throw new Error("ENOTFOUND"); } });
  await assert.rejects(offline.json({ kind: "assist", system: "s", text: "t", schema: ASSIST_SCHEMA }), (e) => e.fallback);
});
