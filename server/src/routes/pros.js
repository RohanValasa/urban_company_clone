const express = require("express");
const { httpError } = require("../lib/http");
const { skillFor } = require("../lib/skills");
const { inTelangana } = require("../lib/geo");
const { topProviders } = require("../lib/ranking");

/** Public: the best professionals for a service near a place, for customers browsing or asking the AI. */
function prosRouter() {
  const router = express.Router();

  router.get("/top", async (req, res) => {
    const skill = skillFor({ sub: String(req.query.service || "") });
    if (!skill) throw httpError(400, "Choose a service.");
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!inTelangana({ lat, lng })) throw httpError(400, "Choose a location in Telangana.");
    const limit = Math.min(10, Math.max(1, Number(req.query.limit) || 5));
    res.json({ pros: await topProviders({ skills: [skill], lat, lng, limit }) });
  });

  return router;
}

module.exports = { prosRouter };
