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
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const failed = (status, message, reason) => Object.assign(httpError(status, message), { fallback: true, reason });

/**
 * Asks Google's Gemini for a JSON answer. Uses the free tier when the key is a
 * free AI Studio key. Errors worth falling back from (quota, outage, setup)
 * are marked `fallback`.
 */
function geminiBackend({ apiKey, model = "gemini-3.8-flash", partsModel, fetch: doFetch = fetch, timeoutMs = 90000, retryDelayMs = 1500 }) {
  return {
    name: "gemini",
    async json({ kind, system, image, text, schema }) {
      const m = (kind === "parts" && partsModel) || model;
      const parts = [];
      if (image) parts.push({ inlineData: { mimeType: image.mediaType, data: image.data } });
      parts.push({ text });

      const body = JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json", responseSchema: toGeminiSchema(schema) },
      });

      // One retry for a dropped connection or an overloaded model, which new Gemini models often are.
      let res;
      let data;
      for (let attempt = 1; ; attempt++) {
        try {
          res = await doFetch(`${API}/${encodeURIComponent(m)}:generateContent`, {
            method: "POST",
            headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
            body,
            signal: AbortSignal.timeout(timeoutMs),
          });
        } catch (err) {
          const detail = err.cause?.code || err.cause?.message || err.message;
          console.error(`Gemini request failed (attempt ${attempt}): ${err.message}${detail !== err.message ? ` (${detail})` : ""}`);
          if (attempt < 2) {
            await pause(retryDelayMs);
            continue;
          }
          throw failed(502, "The AI assistant isn't reachable right now. Please try again shortly.", "offline");
        }
        data = await res.json().catch(() => ({}));
        if ((res.status === 500 || res.status === 503) && attempt < 2) {
          console.error(`Gemini (${m}) answered ${res.status} (attempt ${attempt}): ${data?.error?.message || res.statusText}. Retrying…`);
          await pause(retryDelayMs);
          continue;
        }
        break;
      }

      if (!res.ok) {
        const why = data?.error?.message || res.statusText;
        console.error(`Gemini (${m}) answered ${res.status}: ${why}`);
        if (res.status === 429) throw failed(503, "The AI assistant has reached its limit for now. Please try again later.", "limit");
        if (res.status === 404) {
          // Google names the replacement when it retires a model ("…use models/gemini-x-flash…").
          const suggested = [...why.matchAll(/models\/([\w.-]+)/g)].map((x) => x[1]).find((name) => name !== m);
          if (suggested) console.error(`→ Put GEMINI_MODEL=${suggested} in server/.env and restart the server.`);
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
  };
}

module.exports = { geminiBackend, toGeminiSchema };
