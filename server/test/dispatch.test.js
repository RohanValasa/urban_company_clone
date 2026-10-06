// Matching a booking to nearby professionals, and the job from offer to payment.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { useApi, istSlot, cart, home, MADHAPUR } = require("./helpers");
const { Booking } = require("../src/models/Booking");
const { User } = require("../src/models/User");

const api = useApi();

// About 2 km and 5 km from the customer in Madhapur, and one across the city.
const KONDAPUR = { lat: 17.4609, lng: 78.3568 };
const GACHIBOWLI = { lat: 17.44, lng: 78.3489 };
const LB_NAGAR = { lat: 17.3457, lng: 78.5522 };

async function customer(email = "meera@shop.test") {
  const call = await api.googleUser(email);
  await call("PATCH", "/account/profile", { phone: "9876543210" });
  const { data } = await call("POST", "/account/addresses", home);
  call.addressId = data.address.id;
  return call;
}

async function book(call, extra = {}) {
  const made = await call("POST", "/bookings", { items: cart, slot: istSlot(10), payment: "cash", addressId: call.addressId, ...extra });
  assert.equal(made.status, 201, JSON.stringify(made.data));
  return made.data.booking;
}

const offeredTo = async (id) => String((await Booking.findById(id)).dispatch.offeredTo);
const idOf = async (email) => String((await User.findOne({ email }))._id);

test("the nearest matching professional gets the request first", async (t) => {
  if (api.skip) return t.skip(api.skip);
  await api.provider("far@pro.test", { at: GACHIBOWLI });
  await api.provider("near@pro.test", { at: KONDAPUR });
  await api.provider("plumber@pro.test", { skills: ["plumber"], at: MADHAPUR });
  await api.provider("offline@pro.test", { at: MADHAPUR, online: false });
  await api.provider("across@pro.test", { at: LB_NAGAR });

  const meera = await customer();
  const booking = await book(meera);
  assert.equal(booking.status, "searching");
  assert.equal(booking.dispatch.nearby, 2);
  assert.equal(booking.dispatch.asked, 1);
  assert.equal(await offeredTo(booking.id), await idOf("near@pro.test"));
  assert.equal(booking.dispatch.offeredTo.email, "near@pro.test");
});

test("a rejected request moves to the next professional", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const near = await api.provider("near@pro.test", { at: KONDAPUR });
  const far = await api.provider("far@pro.test", { at: GACHIBOWLI });
  const meera = await customer();
  const { id } = await book(meera);

  const offers = await near("GET", "/pro/offers");
  assert.equal(offers.data.offers.length, 1);
  const offer = offers.data.offers[0];
  assert.equal(offer.area, home.area);
  assert.equal(offer.address, undefined);
  assert.equal(offer.phone, undefined);
  assert.ok(offer.distanceKm > 0 && offer.distanceKm < 8);

  assert.equal((await far("POST", `/pro/offers/${id}/accept`)).status, 409);
  assert.equal((await near("POST", `/pro/offers/${id}/reject`)).status, 204);
  assert.equal(await offeredTo(id), await idOf("far@pro.test"));
  assert.equal((await near("POST", `/pro/offers/${id}/accept`)).status, 409);
  assert.equal((await meera("GET", `/bookings/${id}`)).data.booking.dispatch.asked, 2);
});

test("an unanswered request times out and moves on", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const near = await api.provider("near@pro.test", { at: KONDAPUR });
  await api.provider("far@pro.test", { at: GACHIBOWLI });
  const meera = await customer();
  const { id } = await book(meera);
  const nearLive = await api.watch(near, "/notifications/live");
  await nearLive.waitFor((e) => e.type === "hello");

  await api.dispatch.sweep(new Date(Date.now() + 61_000));
  assert.equal(await offeredTo(id), await idOf("far@pro.test"));
  await nearLive.waitFor((e) => e.note?.kind === "offer-expired");
  assert.equal((await near("POST", `/pro/offers/${id}/accept`)).status, 409);
  nearLive.close();
});

test("when nobody accepts, the customer waits and can try again", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const near = await api.provider("near@pro.test", { at: KONDAPUR });
  const meera = await customer();
  const live = await api.watch(meera, "/notifications/live");
  await live.waitFor((e) => e.type === "hello");
  const { id } = await book(meera);

  await near("POST", `/pro/offers/${id}/reject`);
  const after = (await meera("GET", `/bookings/${id}`)).data.booking;
  assert.equal(after.status, "unassigned");
  const note = await live.waitFor((e) => e.note?.kind === "no-provider");
  assert.match(note.note.title, /No professional available/);

  // Retrying asks everyone again, including whoever said no before.
  const again = await meera("POST", `/bookings/${id}/retry`);
  assert.equal(again.data.booking.status, "searching");
  assert.equal(await offeredTo(id), await idOf("near@pro.test"));
  live.close();
});

test("a customer can't retry too soon", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const meera = await customer();
  const { id } = await book(meera); // nobody nearby at all
  await Booking.updateOne({ _id: id }, { "dispatch.exhaustedAt": new Date(Date.now() + 60_000) });
  const res = await meera("POST", `/bookings/${id}/retry`);
  assert.equal(res.status, 409);
  assert.match(res.data.error, /wait/);
});

test("accepting notifies the customer with the professional's name", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const ravi = await api.provider("ravi@pro.test", { at: KONDAPUR });
  const meera = await customer();
  const live = await api.watch(meera, "/notifications/live");
  await live.waitFor((e) => e.type === "hello");
  const { id } = await book(meera);

  const res = await ravi("POST", `/pro/offers/${id}/accept`);
  assert.equal(res.status, 200);
  const note = await live.waitFor((e) => e.note?.kind === "accepted");
  assert.equal(note.note.title, "Yay! Request accepted by Ravi Pro");
  const seen = (await meera("GET", `/bookings/${id}`)).data.booking;
  assert.equal(seen.status, "assigned");
  assert.equal(seen.professional.name, "Ravi Pro");
  assert.equal(seen.dispatch, null);
  live.close();
});

test("arriving sends an OTP that only the customer sees, and the job starts with it", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const ravi = await api.provider("ravi@pro.test", { at: KONDAPUR });
  const meera = await customer();
  const { id } = await book(meera);
  await ravi("POST", `/pro/offers/${id}/accept`);

  const customerLive = await api.watch(meera, `/bookings/${id}/live`);
  const proLive = await api.watch(ravi, `/bookings/${id}/live`);
  assert.equal(customerLive.contentType, "text/event-stream");

  assert.equal((await ravi("POST", `/pro/jobs/${id}/start`, { otp: "1234" })).status, 409);
  await ravi("POST", `/pro/jobs/${id}/status`, { status: "on-the-way" });
  assert.equal((await ravi("POST", `/pro/jobs/${id}/location`, { lat: 17.45, lng: 78.37 })).status, 204);
  await customerLive.waitFor((e) => e.type === "location" && e.tracking.lat === 17.45);
  await ravi("POST", `/pro/jobs/${id}/status`, { status: "arrived" });

  const shown = await customerLive.waitFor((e) => e.type === "booking" && e.booking.status === "arrived");
  const code = shown.booking.otp.code;
  assert.match(code, /^\d{4}$/);
  assert.equal(api.sms.length, 1);
  assert.match(api.sms[0].text, new RegExp(code));
  assert.equal(api.sms[0].phone, "9876543210");
  const proView = await proLive.waitFor((e) => e.type === "booking" && e.booking.status === "arrived");
  assert.equal(proView.booking.otp.code, undefined);
  assert.equal((await ravi("GET", "/pro/jobs")).data.jobs[0].otp.code, undefined);

  const wrong = String((Number(code) + 1) % 10000).padStart(4, "0");
  const bad = await ravi("POST", `/pro/jobs/${id}/start`, { otp: wrong });
  assert.equal(bad.status, 400);
  assert.match(bad.data.error, /4 tries left/);
  assert.equal((await ravi("POST", `/pro/jobs/${id}/start`, { otp: "12345" })).status, 400);

  const started = await ravi("POST", `/pro/jobs/${id}/start`, { otp: code });
  assert.equal(started.status, 200);
  assert.equal(started.data.job.status, "in-progress");
  customerLive.close();
  proLive.close();
});

test("completing collects the payment unless it was paid up front", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const ravi = await api.provider("ravi@pro.test", { at: KONDAPUR });
  const meera = await customer();

  async function startJob(payment) {
    const { id } = await book(meera, { payment, slot: istSlot(10, 0, payment === "cash" ? 1 : 3) });
    await ravi("POST", `/pro/offers/${id}/accept`);
    await ravi("POST", `/pro/jobs/${id}/status`, { status: "on-the-way" });
    await ravi("POST", `/pro/jobs/${id}/status`, { status: "arrived" });
    const code = (await meera("GET", `/bookings/${id}`)).data.booking.otp.code;
    await ravi("POST", `/pro/jobs/${id}/start`, { otp: code });
    return id;
  }

  const cashJob = await startJob("cash");
  assert.equal((await ravi("POST", `/pro/jobs/${cashJob}/complete`, {})).status, 400);
  const done = await ravi("POST", `/pro/jobs/${cashJob}/complete`, { collected: "upi" });
  assert.equal(done.data.job.status, "completed");
  assert.deepEqual(done.data.job.payment, { method: "cash", status: "paid", collectedAs: "upi" });

  const upiJob = await startJob("upi");
  const prepaid = await ravi("POST", `/pro/jobs/${upiJob}/complete`, {});
  assert.equal(prepaid.data.job.payment.collectedAs, "prepaid");
});

test("busy professionals aren't offered overlapping jobs", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const ravi = await api.provider("ravi@pro.test", { at: KONDAPUR });
  await api.provider("sam@pro.test", { at: GACHIBOWLI });
  const meera = await customer();
  const first = await book(meera);
  await ravi("POST", `/pro/offers/${first.id}/accept`);
  const second = await book(meera, { slot: istSlot(10, 30) });
  assert.equal(await offeredTo(second.id), await idOf("sam@pro.test"));
});

test("customers can cancel before the trip starts", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const ravi = await api.provider("ravi@pro.test", { at: KONDAPUR });
  const meera = await customer();
  const { id } = await book(meera);
  await ravi("POST", `/pro/offers/${id}/accept`);
  const res = await meera("POST", `/bookings/${id}/cancel`);
  assert.equal(res.data.booking.status, "cancelled");
  assert.equal((await ravi("POST", `/pro/jobs/${id}/status`, { status: "on-the-way" })).status, 409);
});

test("onboarding checks every part, runs the ID check and hides bank numbers", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const pro = await api.googleUser("new@pro.test", "professional");
  const empty = (await pro("GET", "/pro/profile")).data;
  assert.equal(empty.profile.status.ready, false);
  assert.ok(empty.skills.length >= 8);
  assert.equal((await pro("PATCH", "/pro/online", { online: true })).status, 409);

  const bad = [
    { skills: ["juggling"] },
    { area: { label: "Mumbai", lat: 19.07, lng: 72.87 } },
    { radiusKm: 99 },
    { payout: { method: "upi", upiId: "not-an-id" } },
    { payout: { method: "bank", holder: "Asha", ifsc: "BAD", accountNumber: "12" } },
    { idDoc: { type: "aadhaar", last4: "12", image: { mediaType: "image/jpeg", data: "eA==" } } },
    { idDoc: { type: "ration", last4: "1234", image: { mediaType: "image/jpeg", data: "eA==" } } },
  ];
  for (const body of bad) assert.equal((await pro("PUT", "/pro/profile", body)).status, 400, JSON.stringify(body));

  const saved = await pro("PUT", "/pro/profile", {
    skills: ["plumber", "electrician"],
    experienceYears: 6,
    about: "ఆరు సంవత్సరాల అనుభవం · छह साल का अनुभव",
    area: { label: "Madhapur", ...MADHAPUR },
    radiusKm: 10,
    payout: { method: "bank", holder: "Asha Rao", ifsc: "sbin0001234", accountNumber: "123456789012" },
    idDoc: { type: "aadhaar", last4: "0000", image: { mediaType: "image/jpeg", data: "eA==" } },
  });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.profile.idDoc.status, "rejected");
  assert.match(saved.data.profile.idDoc.reason, /blurry/);
  assert.equal(saved.data.profile.payout.accountLast4, "9012");
  assert.equal(JSON.stringify(saved.data).includes("123456789012"), false);
  assert.equal(api.idChecks[0].name, "new");

  const stored = await User.findOne({ email: "new@pro.test" }).select("+provider.payout.accountSealed");
  assert.ok(stored.provider.payout.accountSealed);
  assert.equal(stored.provider.payout.accountSealed.includes("123456789012"), false);
  assert.equal(stored.provider.idDoc.image, undefined);

  const retried = await pro("PUT", "/pro/profile", {
    idDoc: { type: "aadhaar", last4: "4321", image: { mediaType: "image/jpeg", data: "eA==" } },
  });
  assert.equal(retried.data.profile.status.ready, true);
  assert.equal((await pro("PATCH", "/pro/online", { online: true })).data.profile.online, true);
});
