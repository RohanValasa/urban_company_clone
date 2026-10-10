const express = require("express");
const { MAX_ADDRESSES } = require("../models/User");
const { ValidationError, phoneInput, str } = require("../lib/validate");
const { httpError, requireUser } = require("../lib/http");
const { inTelangana } = require("../lib/geo");

const LABELS = ["Home", "Work", "Other"];

function addressInput(body = {}) {
  const input = {
    label: LABELS.includes(body.label) ? body.label : "Home",
    house: str(body.house),
    area: str(body.area),
    landmark: str(body.landmark),
    lat: Number(body.lat),
    lng: Number(body.lng),
  };
  if (input.house.length > 120) throw new ValidationError("Keep the house or flat number under 120 characters.");
  if (input.area.length < 3 || input.area.length > 160) throw new ValidationError("Choose your area on the map.");
  if (input.landmark.length > 120) throw new ValidationError("Keep the landmark under 120 characters.");
  if (!inTelangana(input)) throw new ValidationError("We only serve Telangana right now. Pick a location inside the state.");
  return input;
}

/** The signed-in user's phone number and saved addresses. */
function accountRouter({ session }) {
  const router = express.Router();
  router.use(requireUser(session));

  router.patch("/profile", async (req, res) => {
    const user = req.user;
    if (req.body?.phone !== undefined) user.phone = phoneInput(req.body.phone);
    try {
      await user.save();
    } catch (err) {
      if (err.code === 11000) throw httpError(409, "That phone number is already on another Servify account.");
      throw err;
    }
    res.json({ user: user.toPublic() });
  });

  router.get("/addresses", (req, res) => {
    res.json({ addresses: req.user.addresses.map((a) => a.toPublic()) });
  });

  router.post("/addresses", async (req, res) => {
    const user = req.user;
    if (user.addresses.length >= MAX_ADDRESSES) throw httpError(400, `You can save up to ${MAX_ADDRESSES} addresses.`);
    user.addresses.push(addressInput(req.body));
    await user.save();
    res.status(201).json({ address: user.addresses.at(-1).toPublic() });
  });

  router.delete("/addresses/:id", async (req, res) => {
    const address = req.user.addresses.id(req.params.id);
    if (!address) throw httpError(404, "That address doesn't exist.");
    address.deleteOne();
    await req.user.save();
    res.status(204).end();
  });

  return router;
}

module.exports = { accountRouter };
