const { httpError } = require("./http");

const API = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Gemini's response schema is a subset of JSON Schema (OpenAPI style): upper-case
 * types and no additionalProperties. propertyOrdering keeps fields in our order.
 */
function toGeminiSchema(schema) {
  const out = { type: String(schema.type).toUpperCase() };
  if (schema.enum) out.enum = schema.enum;
  if (schema.items) out.items = toGeminiSchema(schema.items);
  if (schema.properties) {
    out.properties = Object.fromEntries(Object.entries(schema.properties).map(([k, v]) => [k, toGeminiSchema(v)]));
    out.propertyOrdering = Object.keys(schema.properties);
  }
  if (schema.required) out.required = schema.required;
  return out;
}

// `reason` says why the AI couldn't answer, so the app can tell the customer: limit, busy, setup, offline or unreadable.
const failed = (status, message, reason) => Object.assign(httpError(status, message), { fallback: true, reason });

/**
 * A booking suggestion doesn't need deep thinking, and thinking is most of the
 * wait. Gemini 3 and later take a thinking level; 2.5 Flash a token budget.
 */
function lightThinking(model) {
  if (/^gemini-2\.5-flash/.test(model)) return { thinkingBudget: 0 };
  if (/^gemini-([3-9]|\d{2,})/.test(model)) return { thinkingLevel: "low" };
  return null;
}

/** The newest-looking "x.y" version in a model name, for sorting. */
const versionOf = (name) => Number((name.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || 0);

/**
 * Asks Google's Gemini for a JSON answer; works on the free tier. Errors worth
 * falling back from (quota, overload, outage, setup) are marked `fallback`.
 *
 * Booking suggestions ("assist") get a short overall deadline and light
 * thinking, so customers aren't kept waiting; when the main model is
 * overloaded, a lighter Flash model the key can use is tried instead.
 */
function geminiBackend({
  apiKey,
  model = "gemini-3.8-flash",
  partsModel,
  backupModel,
  fetch: doFetch = fetch,
  assistDeadlineMs = 20000,
  slowDeadlineMs = 90000,
  retryDelayMs = 1500,
  log = console,
}) {
  const noThinkingConfig = new Set(); // models that rejected the thinking setting
  let modelList = null; // { at, names } from ListModels

  /** Models this key can call, newest first (cached for an hour). */
  async function availableModels() {
    if (modelList && Date.now() - modelList.at < 3600000) return modelList.names;
    try {
      const res = await doFetch(`${API}?pageSize=200`, { headers: { "x-goog-api-key": apiKey }, signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      const names = (data.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
        .map((m) => m.name.replace(/^models\//, ""))
        // Only general text models: not image, speech, transcription, robotics or computer-use ones.
        .filter((n) => /^gemini-/.test(n) && !/(image|tts|audio|live|embedding|vision|thinking-exp|learnlm|transcribe|computer-use|robotics|nano-banana|customtools|omni)/.test(n))
        .sort((a, b) => versionOf(b) - versionOf(a));
      modelList = { at: Date.now(), names };
    } catch (err) {
      log.error(`Couldn't list Gemini models: ${err.message}`);
      modelList = { at: Date.now(), names: [] };
    }
    return modelList.names;
  }

  /** A lighter model to try when `primary` is overloaded: GEMINI_BACKUP_MODEL, else a Flash-Lite, else another Flash. */
  async function backupFor(primary) {
    if (backupModel) return backupModel === primary ? null : backupModel;
    const names = (await availableModels()).filter((n) => n !== primary);
    return names.find((n) => /flash-lite/.test(n)) || names.find((n) => /flash/.test(n)) || null;
  }

  /** One request to one model. Returns { res, data }, or throws on a network failure or timeout. */
  async function call(m, { kind, system, image, text, schema }, timeoutMs) {
    const parts = [];
    if (image) parts.push({ inlineData: { mimeType: image.mediaType, data: image.data } });
    parts.push({ text });
    const generationConfig = { responseMimeType: "application/json", responseSchema: toGeminiSchema(schema) };
    const thinking = kind === "assist" && !noThinkingConfig.has(m) && lightThinking(m);
    if (thinking) generationConfig.thinkingConfig = thinking;
    const started = Date.now();
    const res = await doFetch(`${API}/${encodeURIComponent(m)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts }], generationConfig }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const data = await res.json().catch(() => ({}));
    // A model that doesn't take our thinking setting: forget the setting for it and ask again.
    if (res.status === 400 && thinking && /thinking/i.test(data?.error?.message || "")) {
      noThinkingConfig.add(m);
      return call(m, { kind, system, image, text, schema }, timeoutMs);
    }
    if (res.ok && process.env.NODE_ENV !== "production") log.log?.(`Gemini (${m}) answered in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    return { res, data };
  }

  return {
    name: "gemini",
    async json(request) {
      const primary = (request.kind !== "assist" && partsModel) || model;
      const deadline = Date.now() + (request.kind === "assist" ? assistDeadlineMs : slowDeadlineMs);
      const left = () => deadline - Date.now();

      // Try the main model; if it's overloaded, slow or unreachable, a backup (or the same one again).
      let m = primary;
      let res;
      let data;
      let lastProblem = "offline";
      for (let attempt = 1; attempt <= 2; attempt++) {
        if (left() < 2000) break;
        try {
          ({ res, data } = await call(m, request, left()));
        } catch (err) {
          const timedOut = err.name === "TimeoutError" || err.name === "AbortError";
          const detail = err.cause?.code || err.cause?.message || "";
          log.error(`Gemini (${m}) ${timedOut ? "took too long" : `request failed: ${err.message}${detail ? ` (${detail})` : ""}`} (attempt ${attempt})`);
          lastProblem = timedOut ? "busy" : "offline";
          res = null;
        }
        const overloaded = !res || res.status === 500 || res.status === 503;
        if (!overloaded) break;
        if (res) {
          log.error(`Gemini (${m}) answered ${res.status} (attempt ${attempt}): ${data?.error?.message || res.statusText}`);
          lastProblem = "busy";
        }
        if (attempt === 1) {
          const backup = await backupFor(m);
          if (backup) log.error(`→ Trying ${backup} instead.`);
          else await new Promise((r) => setTimeout(r, Math.min(retryDelayMs, Math.max(0, left() - 2000))));
          m = backup || m;
        }
      }

      if (!res) {
        throw lastProblem === "busy"
          ? failed(503, "The AI assistant is taking too long right now. Please try again in a minute.", "busy")
          : failed(502, "The AI assistant isn't reachable right now. Please try again shortly.", "offline");
      }
      if (!res.ok) {
        const why = data?.error?.message || res.statusText;
        if (res.status !== 500 && res.status !== 503) log.error(`Gemini (${m}) answered ${res.status}: ${why}`);
        if (res.status === 429) throw failed(503, "The AI assistant has reached its limit for now. Please try again later.", "limit");
        if (res.status === 404) {
          // Google names the replacement when it retires a model ("…use models/gemini-x-flash…").
          const suggested = [...why.matchAll(/models\/([\w.-]+)/g)].map((x) => x[1]).find((name) => name !== m);
          if (suggested) log.error(`→ Put GEMINI_MODEL=${suggested} in server/.env and restart the server.`);
          throw failed(502, `The AI model "${m}" wasn't found. Check GEMINI_MODEL in server/.env.`, "setup");
        }
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          throw failed(502, "The AI assistant isn't set up correctly on this server. Check GEMINI_API_KEY and GEMINI_MODEL.", "setup");
        }
        if (res.status === 500 || res.status === 503) {
          throw failed(503, "The AI assistant is overloaded right now. Please try again in a minute.", "busy");
        }
        throw failed(502, "The AI assistant isn't reachable right now. Please try again shortly.", "offline");
      }

      const candidate = data.candidates?.[0];
      if (data.promptFeedback?.blockReason || ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII"].includes(candidate?.finishReason)) {
        throw httpError(422, "We couldn't help with that. Try describing it in other words.");
      }
      // Thinking models can add "thought" parts; the answer is the rest.
      const answer = (candidate?.content?.parts || [])
        .filter((p) => !p.thought && typeof p.text === "string")
        .map((p) => p.text)
        .join("");
      try {
        return JSON.parse(answer);
      } catch {
        throw failed(502, "The AI assistant gave an unreadable answer. Please try again.", "unreadable");
      }
    },
    availableModels,
  };
}

module.exports = { geminiBackend, toGeminiSchema, lightThinking };
