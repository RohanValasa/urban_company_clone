const express = require("express");
const { requireUser } = require("../lib/http");
const { imageInput, ValidationError } = require("../lib/validate");

/**
 * "Ask Servify AI": the customer types, speaks or photographs a problem and
 * gets the service and packages to book. Signed-in only, since every call
 * costs money, and rate limited per account.
 */
function aiRouter({ session, ai, aiLimiter }) {
  const router = express.Router();

  router.post("/assist", requireUser(session), aiLimiter, async (req, res) => {
    const text = typeof req.body?.text === "string" ? req.body.text.trim().slice(0, 1000) : "";
    const image = imageInput(req.body?.image);
    if (!text && !image) throw new ValidationError("Tell us about the problem, or add a photo.");
    res.json(await ai.assist({ text, image }));
  });

  return router;
}

module.exports = { aiRouter };
