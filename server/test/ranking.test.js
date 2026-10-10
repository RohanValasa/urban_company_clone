// "Top professionals near you", best-rated-first matching, the customer's
// chosen professional, and star ratings after a job.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { useApi, istSlot, cart, home, MADHAPUR } = require("./helpers");
const { Booking } = require("../src/models/Booking");
const { User } = require("../src/models/User");

const api = useApi();
const KONDAPUR = { lat: 17.4609, lng: 78.3568 }; // ~2 km from Madhapur
const GACHIBOWLI = { lat: 17.44, lng: 78.3489 }; // ~5 km

async function customer() {
  const call = await api.googleUser("meera@shop.test");
  await call("PATCH", "/account/profile", { phone: "9876543210" });
  call.addressId = (await call("POST", "/account/addresses", home)).data.address.id;
  return call;
}
const setPro = (email, provider) =>
  User.updateOne({ email }, { $set: Object.fromEntries(Object.entries(provider).map(([k, v]) => [`provider.${k}`, v])) });
const idOf = async (email) => String((await User.findOne({ email }))._id);
const offeredTo = async (id) => String((await Booking.findById(id)).dispatch.offeredTo);

test("top professionals: best rated, closest and AI pick, with no private details", async (t) => {
  if (api.skip) return t.skip(api.skip);
  await api.provider("near@pro.test", { at: KONDAPUR });
  await api.provider("star@pro.test", { at: GACHIBOWLI });
  await api.provider("plumber@pro.test", { skills: ["plumber"], at: MADHAPUR });
  await setPro("near@pro.test", { rating: 4.5, jobsDone: 20, experienceYears: 1 });
  await setPro("star@pro.test", { rating: 4.95, ratingCount: 210, jobsDone: 480, experienceYears: 9, about: "Deep-cleaning expert." });

  const res = await fetch(`${api.base}/pros/top?service=bathroom-cleaning&lat=${MADHAPUR.lat}&lng=${MADHAPUR.lng}`);
  const { pros } = await res.json();
  assert.equal(res.status, 200);
  assert.equal(pros.length, 2, "only cleaners who cover Madhapur");
  const star = pros.find((p) => p.name === "Star Pro");
  const near = pros.find((p) => p.name === "Near Pro");
  assert.equal(star.bestRated, true);
  assert.equal(star.aiPick, true);
  assert.equal(near.closest, true);
  assert.equal(pros[0].name, "Star Pro", "the AI pick comes first");
  assert.equal(star.jobsDone, 480);
  assert.equal(star.ratingCount, 210);
  assert.ok(star.distanceKm > near.distanceKm);
  for (const p of pros) {
    assert.equal(p.email, undefined);
    assert.equal(p.phone, undefined);
  }

  assert.equal((await fetch(`${api.base}/pros/top?service=juggling&lat=17.4&lng=78.4`)).status, 400);
  assert.equal((await fetch(`${api.base}/pros/top?service=plumber&lat=19.07&lng=72.87`)).status, 400, "outside Telangana");
});

test("jobs go to the best rated professional first, and to the one the customer chose before anyone", async (t) => {
  if (api.skip) return t.skip(api.skip);
  await api.provider("near@pro.test", { at: KONDAPUR });
  await api.provider("star@pro.test", { at: GACHIBOWLI });
  await setPro("near@pro.test", { rating: 4.5 });
  await setPro("star@pro.test", { rating: 4.9 });
  const meera = await customer();

  const first = await meera("POST", "/bookings", { items: cart, slot: istSlot(10), payment: "cash", addressId: meera.addressId });
  assert.equal(await offeredTo(first.data.booking.id), await idOf("star@pro.test"), "higher rating beats closer");

  const chosen = await meera("POST", "/bookings", {
    items: cart, slot: istSlot(10, 0, 3), payment: "cash", addressId: meera.addressId, preferredPro: await idOf("near@pro.test"),
  });
  assert.equal(await offeredTo(chosen.data.booking.id), await idOf("near@pro.test"), "the chosen professional first");

  // A bogus choice is ignored.
  const bogus = await meera("POST", "/bookings", { items: cart, slot: istSlot(10, 0, 5), payment: "cash", addressId: meera.addressId, preferredPro: "nope" });
  assert.equal(bogus.status, 201);
});

test("customers rate a finished job once; the professional's average and job count update", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const ravi = await api.provider("ravi@pro.test", { at: KONDAPUR });
  await setPro("ravi@pro.test", { rating: 4.5, ratingCount: 1, jobsDone: 7 });
  const meera = await customer();
  const { id } = (await meera("POST", "/bookings", { items: cart, slot: istSlot(10), payment: "cash", addressId: meera.addressId })).data.booking;
  await ravi("POST", `/pro/offers/${id}/accept`);
  assert.equal((await meera("POST", `/bookings/${id}/rate`, { stars: 5 })).status, 409, "not before it's done");
  await ravi("POST", `/pro/jobs/${id}/status`, { status: "on-the-way" });
  await ravi("POST", `/pro/jobs/${id}/status`, { status: "arrived" });
  await ravi("POST", `/pro/jobs/${id}/start`, { otp: (await meera("GET", `/bookings/${id}`)).data.booking.otp.code });
  await ravi("POST", `/pro/jobs/${id}/complete`, { collected: "cash" });

  assert.equal((await meera("POST", `/bookings/${id}/rate`, { stars: 9 })).status, 400);
  assert.equal((await ravi("POST", `/bookings/${id}/rate`, { stars: 1 })).status, 404, "only the customer");
  const rated = await meera("POST", `/bookings/${id}/rate`, { stars: 5, comment: "Spotless!" });
  assert.equal(rated.status, 200);
  assert.deepEqual(rated.data.booking.review, { stars: 5, comment: "Spotless!" });
  assert.equal((await meera("POST", `/bookings/${id}/rate`, { stars: 1 })).status, 409, "only once");

  const pro = (await User.findOne({ email: "ravi@pro.test" })).provider;
  assert.equal(pro.ratingCount, 2);
  assert.equal(pro.rating, 4.75);
  assert.equal(pro.jobsDone, 8);
});
