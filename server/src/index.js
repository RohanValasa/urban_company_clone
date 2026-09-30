const mongoose = require("mongoose");
const config = require("./config");
const { createApp } = require("./app");

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log(`MongoDB connected (${mongoose.connection.name})`);

  createApp(config).listen(config.port, () => {
    console.log(`Servify API on http://localhost:${config.port}`);
    if (!config.googleClientId) console.log("GOOGLE_CLIENT_ID is not set, so Google sign-in is off.");
  });
}

main().catch((err) => {
  console.error("Could not start the server:", err.message);
  process.exit(1);
});
