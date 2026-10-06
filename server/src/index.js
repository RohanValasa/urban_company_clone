const mongoose = require("mongoose");
const config = require("./config");
const { createApp } = require("./app");

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log(`MongoDB connected (${mongoose.connection.name})`);

  const app = createApp(config);
  // Moves job offers on when a professional doesn't answer in time.
  setInterval(() => app.locals.dispatch.sweep().catch((err) => console.error("Dispatch sweep failed:", err)), 5000);

  app.listen(config.port, () => {
    console.log(`Servify API on http://localhost:${config.port}`);
    if (!config.googleClientId) console.log("GOOGLE_CLIENT_ID is not set, so Google sign-in is off.");
    if (!config.aiIdCheck) {
      console.log(
        config.isProd
          ? "No Anthropic API key: new professionals' IDs wait for review."
          : "No Anthropic API key: new professionals' IDs are approved automatically (development only)."
      );
    }
  });
}

main().catch((err) => {
  console.error("Could not start the server:", err.message);
  process.exit(1);
});
