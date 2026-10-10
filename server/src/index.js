const mongoose = require("mongoose");
const config = require("./config");
const { createApp } = require("./app");

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log(`MongoDB connected (${mongoose.connection.name})`);

  const app = createApp(config);
  // Moves job offers on when a professional doesn't answer in time.
  setInterval(() => app.locals.dispatch.sweep().catch((err) => console.error("Dispatch sweep failed:", err)), 5000);
  // Re-tries ID checks the AI couldn't do straight away.
  setInterval(() => app.locals.idChecks.sweep().catch((err) => console.error("ID check retry failed:", err)), 60000);

  app.listen(config.port, () => {
    console.log(`Servify API on http://localhost:${config.port}`);
    const mode = app.locals.aiMode;
    console.log(
      mode === "basic"
        ? "AI assistant: basic mode (free keyword matching, no photos). Add GEMINI_API_KEY or ANTHROPIC_API_KEY for the full AI."
        : `AI assistant: ${mode === "gemini" ? `Gemini (${config.geminiModel})` : `Claude (${config.aiModel})`}, with basic mode as a backup.`
    );
    if (!config.googleClientId) console.log("GOOGLE_CLIENT_ID is not set, so Google sign-in is off.");
    if (mode === "basic") {
      console.log(
        config.isProd
          ? "No AI set up: new professionals' IDs wait for a person to review them."
          : "No AI set up: new professionals' IDs are approved automatically (development only)."
      );
    }
  });
}

main().catch((err) => {
  console.error("Could not start the server:", err.message);
  process.exit(1);
});
