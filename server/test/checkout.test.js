// Checkout: phone, addresses, bill quotes and bookings.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { slotInput } = require("../src/routes/bookings");
const { useApi, istSlot, cart, home } = require("./helpers");

const api = useApi();
const agent = () => api.agent();
const googleCustomer = (email = "asha@gmail.com", role = "customer") => api.googleUser(email, role);

test("quote works out taxes, savings and tip", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const { status, data } = await agent()("POST", "/bookings/quote", { items: cart, tip: 75 });
  assert.equal(status, 200);
  assert.deepEqual(data.bill, {
    itemTotal: 1596,
    mrpTotal: 1996,
    coupon: null,
    couponDiscount: 0,
    taxesAndFee: Math.round(1596 * 0.05) + 49,
    tip: 75,
    total: 1596 + Math.round(1596 * 0.05) + 49 + 75,
    saved: 400,
  });
  assert.ok(data.offers.length >= 3);
});

test("quote applies coupons only when they qualify", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const call = agent();
  const ten = await call("POST", "/bookings/quote", { items: cart, coupon: "servify10" });
  assert.equal(ten.data.bill.coupon, "SERVIFY10");
  assert.equal(ten.data.bill.couponDiscount, 150);
  assert.equal(ten.data.bill.saved, 550);

  const upiCash = await call("POST", "/bookings/quote", { items: cart, coupon: "UPI50", payment: "cash" });
  assert.equal(upiCash.data.bill.couponDiscount, 0);
  assert.match(upiCash.data.couponError, /UPI/);
  const upi = await call("POST", "/bookings/quote", { items: cart, coupon: "UPI50", payment: "upi" });
  assert.equal(upi.data.bill.couponDiscount, 50);

  const small = await call("POST", "/bookings/quote", { items: [{ ...cart[0], price: 300, mrp: 300 }], coupon: "BIG250" });
  assert.match(small.data.couponError, /more/);
  const unknown = await call("POST", "/bookings/quote", { items: cart, coupon: "FREEBIE" });
  assert.match(unknown.data.couponError, /doesn't exist/);
});

test("quote rejects broken carts and tips", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const call = agent();
  assert.equal((await call("POST", "/bookings/quote", { items: [] })).status, 400);
  assert.equal((await call("POST", "/bookings/quote", { items: [{ ...cart[0], price: -5 }] })).status, 400);
  assert.equal((await call("POST", "/bookings/quote", { items: [{ ...cart[0], qty: 50 }] })).status, 400);
  assert.equal((await call("POST", "/bookings/quote", { items: cart, tip: 99999 })).status, 400);
});

test("a Google customer adds a phone number at checkout", async (t) => {
  if (api.skip) return t.skip(api.skip);
  assert.equal((await agent()("PATCH", "/account/profile", { phone: "9876543210" })).status, 401);

  const call = await googleCustomer();
  assert.equal((await call("PATCH", "/account/profile", { phone: "12345" })).status, 400);
  const saved = await call("PATCH", "/account/profile", { phone: "+91 98765 43210" });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.user.phone, "9876543210");
  assert.equal((await call("GET", "/auth/me")).data.user.phone, "9876543210");

  const other = await googleCustomer("ravi@gmail.com");
  const taken = await other("PATCH", "/account/profile", { phone: "9876543210" });
  assert.equal(taken.status, 409);
});

test("addresses must be inside Hyderabad", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const call = await googleCustomer();
  const mumbai = await call("POST", "/account/addresses", { ...home, lat: 19.07, lng: 72.87 });
  assert.equal(mumbai.status, 400);
  assert.match(mumbai.data.error, /Hyderabad/);
  assert.equal((await call("POST", "/account/addresses", { ...home, area: "" })).status, 400);

  const added = await call("POST", "/account/addresses", home);
  assert.equal(added.status, 201);
  assert.equal(added.data.address.area, home.area);
  const list = await call("GET", "/account/addresses");
  assert.equal(list.data.addresses.length, 1);

  assert.equal((await call("DELETE", `/account/addresses/${added.data.address.id}`)).status, 204);
  assert.equal((await call("GET", "/account/addresses")).data.addresses.length, 0);
});

test("booking needs a phone, an address, a slot and a payment method", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const call = await googleCustomer();
  const order = { items: cart, slot: istSlot(10), payment: "cash" };

  const noPhone = await call("POST", "/bookings", order);
  assert.equal(noPhone.status, 400);
  assert.match(noPhone.data.error, /phone/);

  await call("PATCH", "/account/profile", { phone: "9876543210" });
  const noAddress = await call("POST", "/bookings", order);
  assert.match(noAddress.data.error, /address/);

  const { data } = await call("POST", "/account/addresses", home);
  const addressId = data.address.id;
  assert.equal((await call("POST", "/bookings", { ...order, addressId, slot: istSlot(22) })).status, 400);
  assert.equal((await call("POST", "/bookings", { ...order, addressId, slot: istSlot(10, 15) })).status, 400);
  assert.equal((await call("POST", "/bookings", { ...order, addressId, slot: istSlot(10, 0, -1) })).status, 400);
  assert.equal((await call("POST", "/bookings", { ...order, addressId, payment: "card" })).status, 400);

  const made = await call("POST", "/bookings", { ...order, addressId, coupon: "FIRST100", tip: 50, avoidCalling: true });
  assert.equal(made.status, 201);
  const booking = made.data.booking;
  assert.equal(booking.payment.status, "due");
  assert.equal(booking.bill.couponDiscount, 100);
  assert.equal(booking.address.house, home.house);
  assert.equal(booking.phone, "9876543210");
  assert.equal(booking.avoidCalling, true);

  // FIRST100 is gone after the first booking.
  const again = await call("POST", "/bookings", { ...order, addressId, coupon: "FIRST100" });
  assert.equal(again.status, 400);
  assert.match(again.data.error, /first booking/);

  const upi = await call("POST", "/bookings", { ...order, addressId, payment: "upi", coupon: "UPI50" });
  assert.equal(upi.data.booking.payment.status, "awaiting-confirmation");

  const mine = await call("GET", "/bookings");
  assert.equal(mine.data.bookings.length, 2);
  assert.equal((await agent()("GET", "/bookings")).status, 401);
});

test("professionals can't book and can't see others' addresses", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const pro = await googleCustomer("pro@gmail.com", "professional");
  await pro("PATCH", "/account/profile", { phone: "9000000001" });
  const { data } = await pro("POST", "/account/addresses", home);
  const res = await pro("POST", "/bookings", { items: cart, slot: istSlot(10), payment: "cash", addressId: data.address.id });
  assert.equal(res.status, 403);

  const customer = await googleCustomer();
  assert.equal((await customer("DELETE", `/account/addresses/${data.address.id}`)).status, 404);
});

test("slots run on the half hour, 8 AM to 7:30 PM India time", () => {
  assert.doesNotThrow(() => slotInput(istSlot(8)));
  assert.doesNotThrow(() => slotInput(istSlot(19, 30)));
  assert.throws(() => slotInput(istSlot(7, 30)), /8:00 AM/);
  assert.throws(() => slotInput(istSlot(20)), /8:00 AM/);
  assert.throws(() => slotInput(istSlot(10, 0, 9)), /week/);
  assert.throws(() => slotInput("not a date"), /Pick a time slot/);
});
