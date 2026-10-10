// Lists the Gemini models your key can use, and times a tiny request to each Flash
// model, so you can pick GEMINI_MODEL / GEMINI_BACKUP_MODEL in server/.env.
//
//   npm run gemini-models
//
// Free: uses a few requests of Gemini's free tier.
const config = require("../src/config");
const { geminiBackend } = require("../src/lib/gemini");

const SCHEMA = { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] };

(async () => {
  if (!config.geminiApiKey) {
    console.log("No GEMINI_API_KEY in server/.env, so there's nothing to list.");
    process.exit(1);
  }
  const silent = { log() {}, error() {} };
  const names = await geminiBackend({ apiKey: config.geminiApiKey, log: console }).availableModels();
  if (!names.length) {
    console.log("Google didn't list any models for this key. Check GEMINI_API_KEY.");
    process.exit(1);
  }
  console.log(`Your key can use ${names.length} Gemini models:\n  ${names.join("\n  ")}\n`);
  const backup = config.geminiBackupModel || `${names.find((n) => /flash-lite/.test(n)) || "none"} (picked automatically)`;
  console.log(`Your server/.env uses: GEMINI_MODEL=${config.geminiModel}, backup: ${backup}\n`);

  console.log("Timing a short booking-style request on each Flash model (a busy one can take up to 30 s):");
  for (const model of names.filter((n) => /flash/.test(n)).slice(0, 8)) {
    const backend = geminiBackend({ apiKey: config.geminiApiKey, model, backupModel: model, assistDeadlineMs: 30000, log: silent });
    process.stdout.write(`  ${model.padEnd(32)} …`);
    const started = Date.now();
    let result;
    try {
      await backend.json({ kind: "assist", system: "Answer with JSON.", text: "Say ok.", schema: SCHEMA });
      result = "works";
    } catch (err) {
      result = `${err.reason || "error"}: ${err.message}`;
    }
    process.stdout.write("\r");
    console.log(`  ${model.padEnd(32)} ${((Date.now() - started) / 1000).toFixed(1).padStart(5)}s  ${result}`);
  }
  console.log("\nPick a model that works and answers quickly, then put it in server/.env and restart the server.");
})();
