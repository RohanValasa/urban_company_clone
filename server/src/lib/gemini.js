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

// `reason` says why the AI couldn't answer, so the app can tell the customer: limit, setup, offline or unreadable.
const failed = (status, message, reason) => Object.assign(httpError(status, message), { fallback: true, reason });

/**
 * Asks Google's Gemini for a JSON answer. Uses the free tier when the key is a
 * free AI Studio key. Errors worth falling back from (quota, outage, setup)
 * are marked `fallback`.
 */
function geminiBackend({ apiKey, model = "gemini-2.5-flash", partsModel, fetch: doFetch = fetch, timeoutMs = 60000 }) {
  return {
    name: "gemini",
    async json({ kind, system, image, text, schema }) {
      const m = (kind === "parts" && partsModel) || model;
      const parts = [];
      if (image) parts.push({ inlineData: { mimeType: image.mediaType, data: image.data } });
      parts.push({ text });

      let res;
      try {
        res = await doFetch(`${API}/${encodeURIComponent(m)}:generateContent`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts }],
            generationConfig: { responseMimeType: "application/json", responseSchema: toGeminiSchema(schema) },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (err) {
        console.error(`Gemini request failed: ${err.message}`);
        throw failed(502, "The AI assistant isn't reachable right now. Please try again shortly.", "offline");
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const why = data?.error?.message || res.statusText;
        console.error(`Gemini (${m}) answered ${res.status}: ${why}`);
        if (res.status === 429) throw failed(503, "The AI assistant has reached its limit for now. Please try again later.", "limit");
        if (res.status === 404) throw failed(502, `The AI model "${m}" wasn't found. Check GEMINI_MODEL in server/.env.`, "setup");
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          throw failed(502, "The AI assistant isn't set up correctly on this server. Check GEMINI_API_KEY and GEMINI_MODEL.", "setup");
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
