// Gemini requests and answers, with Google's API replaced by a stub.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { geminiBackend, toGeminiSchema } = require("../src/lib/gemini");
const { aiAssistant, ASSIST_SCHEMA } = require("../src/lib/assistant");

/** A stand-in for fetch that records the request and replies with `reply`. */
function fakeFetch(status, body) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, headers: init.headers, body: init.body && JSON.parse(init.body) });
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
const silent = { log() {}, error() {} };
const reply = (status, body) => ({ ok: status < 400, status, statusText: "x", json: async () => body });
const BUSY = reply(503, { error: { message: "This model is currently experiencing high demand." } });
// What Google's ListModels returns for a free key (trimmed).
const MODELS = {
  models: [
    { name: "models/gemini-3.8-flash", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-3.8-flash-image", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-3.8-flash-lite-transcribe", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-3.9-flash-lite-computer-use-preview", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-3.5-flash-lite", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-3.8-flash-lite", supportedGenerationMethods: ["generateContent"] },
    { name: "models/text-embedding-5", supportedGenerationMethods: ["embedContent"] },
  ],
};

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

test("out of free quota: another model's quota is used, else the basic assistant answers", async () => {
  const QUOTA = reply(429, { error: { message: "You exceeded your current quota." } });
  const asked = [];
  const swap = geminiBackend({
    apiKey: "k", log: silent,
    fetch: async (url) => {
      if (url.includes("pageSize")) return reply(200, MODELS);
      asked.push(url.match(/models\/([\w.-]+):/)[1]);
      return asked.length === 1 ? QUOTA : reply(200, answer(ASSIST));
    },
  });
  assert.equal((await swap.json({ kind: "assist", system: "s", text: "t", schema: ASSIST_SCHEMA })).service, "plumber");
  assert.deepEqual(asked, ["gemini-3.8-flash", "gemini-3.8-flash-lite"]);

  // No other model: no pointless retry of the same one.
  let tries = 0;
  const lone = geminiBackend({ apiKey: "k", log: silent, fetch: async (url) => (url.includes("pageSize") ? reply(200, { models: [] }) : (tries++, QUOTA)) });
  await assert.rejects(lone.json({ kind: "assist", system: "s", text: "t", schema: ASSIST_SCHEMA }), (e) => e.reason === "limit");
  assert.equal(tries, 1);

  const fetch = fakeFetch(429, { error: { message: "Resource has been exhausted" } });
  const ai = aiAssistant({ backend: geminiBackend({ apiKey: "k", fetch, log: silent }) });
  const r = await ai.assist({ text: "my AC is not cooling" });
  assert.equal(r.fellBack, true);
  assert.equal(r.fallbackReason, "limit");
  assert.equal(r.service.slug, "ac");
  // Parts fall back to the price list when the part was named.
  const p = await ai.priceParts({ image: PHOTO, note: "tap spindle", job: "Plumber" });
  assert.equal(p.name, "Tap spindle");
  await assert.rejects(ai.priceParts({ image: PHOTO, note: "", job: "Plumber" }), (e) => e.status === 503);
});

test("an overloaded model is swapped for a lighter one the key can use", async () => {
  const asked = [];
  const fetch = async (url) => {
    if (url.endsWith("?pageSize=200")) return reply(200, MODELS);
    asked.push(url.match(/models\/([\w.-]+):/)[1]);
    return asked.length === 1 ? BUSY : reply(200, answer(ASSIST));
  };
  const ai = aiAssistant({ backend: geminiBackend({ apiKey: "k", fetch, log: silent }) });
  assert.equal((await ai.assist({ text: "tap leaking" })).service.slug, "plumber");
  // The newest general Flash-Lite; never an image, transcription or computer-use model.
  assert.deepEqual(asked, ["gemini-3.8-flash", "gemini-3.8-flash-lite"]);

  // GEMINI_BACKUP_MODEL wins over the list.
  const chosen = [];
  const own = geminiBackend({
    apiKey: "k", backupModel: "gemini-3.5-flash", log: silent,
    fetch: async (url) => { chosen.push(url); return chosen.length === 1 ? BUSY : reply(200, answer(ASSIST)); },
  });
  await own.json({ kind: "assist", system: "s", text: "t", schema: ASSIST_SCHEMA });
  assert.match(chosen[1], /gemini-3\.5-flash:generateContent/);
  assert.ok(!chosen.some((u) => u.includes("pageSize")), "no need to list models");
});

test("with no backup, the same model is retried once; then basic mode answers", async () => {
  let calls = 0;
  const flaky = async (url) => {
    if (url.includes("pageSize")) return reply(200, { models: [] });
    calls++;
    return calls === 1 ? BUSY : reply(200, answer(ASSIST));
  };
  const ai = aiAssistant({ backend: geminiBackend({ apiKey: "k", fetch: flaky, retryDelayMs: 1, log: silent }) });
  assert.equal((await ai.assist({ text: "tap leaking" })).service.slug, "plumber");
  assert.equal(calls, 2);

  const alwaysBusy = aiAssistant({ backend: geminiBackend({ apiKey: "k", fetch: async () => BUSY, retryDelayMs: 1, log: silent }) });
  const r = await alwaysBusy.assist({ text: "tap leaking" });
  assert.equal(r.fallbackReason, "busy");
  assert.equal(r.service.slug, "plumber");

  let tries = 0;
  const dropped = geminiBackend({
    apiKey: "k", retryDelayMs: 1, log: silent,
    fetch: async (url) => {
      if (url.includes("pageSize")) return reply(200, { models: [] });
      tries++;
      throw Object.assign(new Error("fetch failed"), { cause: { code: "ECONNRESET" } });
    },
  });
  await assert.rejects(dropped.json({ kind: "assist", system: "s", text: "t", schema: ASSIST_SCHEMA }), (e) => e.reason === "offline");
  assert.equal(tries, 2);
});

test("a slow model doesn't keep the customer waiting: the whole answer has a deadline", async () => {
  // Never answers; only the abort signal ends it.
  const hang = async (url, init) => {
    if (url.includes("pageSize")) return reply(200, { models: [] });
    return new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(init.signal.reason)));
  };
  const ai = aiAssistant({ backend: geminiBackend({ apiKey: "k", fetch: hang, assistDeadlineMs: 2500, retryDelayMs: 1, log: silent }) });
  const awake = setInterval(() => {}, 100); // abort timers don't keep a test process alive (the server does)
  const started = Date.now();
  const r = await ai.assist({ text: "tap leaking" }).finally(() => clearInterval(awake));
  assert.ok(Date.now() - started < 4000, `answered in ${Date.now() - started}ms`);
  assert.equal(r.fellBack, true);
  assert.equal(r.fallbackReason, "busy");
  assert.equal(r.service.slug, "plumber");
});

test("booking suggestions ask for light thinking, and drop it if the model refuses", async () => {
  const fetch = fakeFetch(200, answer(ASSIST));
  await geminiBackend({ apiKey: "k", model: "gemini-3.8-flash", fetch, log: silent }).json({ kind: "assist", system: "s", text: "t", schema: ASSIST_SCHEMA });
  assert.deepEqual(fetch.calls[0].body.generationConfig.thinkingConfig, { thinkingLevel: "low" });
  const old = fakeFetch(200, answer(ASSIST));
  await geminiBackend({ apiKey: "k", model: "gemini-2.5-flash", fetch: old, log: silent }).json({ kind: "assist", system: "s", text: "t", schema: ASSIST_SCHEMA });
  assert.deepEqual(old.calls[0].body.generationConfig.thinkingConfig, { thinkingBudget: 0 });
  // The parts check keeps the model's own thinking.
  const parts = fakeFetch(200, answer({}));
  await geminiBackend({ apiKey: "k", fetch: parts, log: silent }).json({ kind: "parts", system: "s", text: "t", schema: ASSIST_SCHEMA });
  assert.equal(parts.calls[0].body.generationConfig.thinkingConfig, undefined);

  const bodies = [];
  const picky = geminiBackend({
    apiKey: "k", log: silent,
    fetch: async (url, init) => {
      const body = JSON.parse(init.body);
      bodies.push(body);
      return body.generationConfig.thinkingConfig ? reply(400, { error: { message: "Thinking level is not supported for this model." } }) : reply(200, answer(ASSIST));
    },
  });
  const ask = () => picky.json({ kind: "assist", system: "s", text: "t", schema: ASSIST_SCHEMA });
  assert.equal((await ask()).service, "plumber");
  assert.equal((await ask()).service, "plumber");
  assert.equal(bodies.length, 3, "asked without it again, and remembered");
});

test("set-up mistakes and blocked answers", async () => {
  const retired = "This model models/gemini-9 is no longer available to new users. Please update your code to use models/gemini-10-flash.";
  const wrongModel = geminiBackend({ apiKey: "k", model: "gemini-9", log: console, fetch: fakeFetch(404, { error: { message: retired } }) });
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
  const offline = geminiBackend({ apiKey: "k", retryDelayMs: 1, log: silent, fetch: async () => { throw new Error("ENOTFOUND"); } });
  await assert.rejects(offline.json({ kind: "assist", system: "s", text: "t", schema: ASSIST_SCHEMA }), (e) => e.fallback);
});
