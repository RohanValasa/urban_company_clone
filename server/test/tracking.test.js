// Professionals take jobs and share their position; customers watch it live.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { useApi, istSlot, cart, home } = require("./helpers");

const api = useApi();

/** A customer with a phone and address, who has booked one job. Returns [customer, bookingId]. */
async function bookedCustomer() {
  const customer = await api.googleUser("meera@gmail.com");
  await customer("PATCH", "/account/profile", { phone: "9876543210" });
  const { data } = await customer("POST", "/account/addresses", home);
  const made = await customer("POST", "/bookings", {
    items: cart,
    slot: istSlot(10),
    payment: "cash",
    addressId: data.address.id,
  });
  assert.equal(made.status, 201);
  return [customer, made.data.booking.id];
}

async function pro(email = "ravi@gmail.com") {
  const call = await api.googleUser(email, "professional");
  await call("PATCH", "/account/profile", { phone: "9000000001" });
  return call;
}

/** Opens the live stream and collects its events. */
async function watch(call, id) {
  const controller = new AbortController();
  const res = await fetch(`${api.base}/bookings/${id}/live`, {
    headers: { cookie: call.cookie() },
    signal: controller.signal,
  });
  assert.equal(res.headers.get("content-type"), "text/event-stream");
  const events = [];
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let cut;
        while ((cut = buffer.indexOf("\n\n")) >= 0) {
          const chunk = buffer.slice(0, cut);
          buffer = buffer.slice(cut + 2);
          if (chunk.startsWith("data: ")) events.push(JSON.parse(chunk.slice(6)));
        }
      }
    } catch {
      // aborted
    }
  })();
  const waitFor = async (match) => {
    for (let i = 0; i < 100; i++) {
      const found = events.find(match);
      if (found) return found;
      await new Promise((r) => setTimeout(r, 20));
    }
    throw new Error("event never arrived");
  };
  return { events, waitFor, close: () => controller.abort() };
}

test("open jobs hide the customer's door and number until accepted", async (t) => {
  if (api.skip) return t.skip(api.skip);
  await bookedCustomer();
  const ravi = await pro();
  const { data } = await ravi("GET", "/pro/jobs");
  assert.equal(data.open.length, 1);
  const job = data.open[0];
  assert.equal(job.area, home.area);
  assert.equal(job.payout, 1596);
  assert.equal(job.address, undefined);
  assert.equal(job.phone, undefined);

  const customer = await api.googleUser("other@gmail.com");
  assert.equal((await customer("GET", "/pro/jobs")).status, 403);
});

test("only one professional can accept a job", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const [customer, id] = await bookedCustomer();
  const ravi = await pro();
  const sam = await pro("sam@gmail.com").catch(() => null);
  const [a, b] = await Promise.all([ravi("POST", `/pro/jobs/${id}/accept`), sam("POST", `/pro/jobs/${id}/accept`)]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);

  const seen = await customer("GET", `/bookings/${id}`);
  assert.equal(seen.data.booking.status, "assigned");
  assert.ok(["ravi", "sam"].includes(seen.data.booking.professional.name));
  assert.equal((await (await api.googleUser("stranger@gmail.com"))("GET", `/bookings/${id}`)).status, 404);
});

test("the customer sees the trip live, step by step", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const [customer, id] = await bookedCustomer();
  const ravi = await pro();
  await ravi("POST", `/pro/jobs/${id}/accept`);

  const live = await watch(customer, id);
  const first = await live.waitFor((e) => e.type === "booking");
  assert.equal(first.booking.status, "assigned");

  // Can't share a position before starting, or skip steps.
  assert.equal((await ravi("POST", `/pro/jobs/${id}/location`, { lat: 17.44, lng: 78.38 })).status, 409);
  assert.equal((await ravi("POST", `/pro/jobs/${id}/status`, { status: "arrived" })).status, 409);

  assert.equal((await ravi("POST", `/pro/jobs/${id}/status`, { status: "on-the-way" })).status, 200);
  await live.waitFor((e) => e.type === "booking" && e.booking.status === "on-the-way");

  assert.equal((await ravi("POST", `/pro/jobs/${id}/location`, { lat: 17.441, lng: 78.381 })).status, 204);
  const moved = await live.waitFor((e) => e.type === "location");
  assert.equal(moved.tracking.lat, 17.441);
  assert.equal((await ravi("POST", `/pro/jobs/${id}/location`, { lat: "north", lng: 78 })).status, 400);

  const stored = await customer("GET", `/bookings/${id}`);
  assert.equal(stored.data.booking.tracking.lng, 78.381);

  await ravi("POST", `/pro/jobs/${id}/status`, { status: "arrived" });
  const arrived = await live.waitFor((e) => e.type === "booking" && e.booking.status === "arrived");
  assert.equal(arrived.booking.tracking.lat, home.lat);

  await ravi("POST", `/pro/jobs/${id}/status`, { status: "completed" });
  const done = await live.waitFor((e) => e.type === "booking" && e.booking.status === "completed");
  assert.equal(done.booking.payment.status, "paid");
  live.close();

  // Other professionals can't touch it.
  const sam = await pro("sam@gmail.com");
  assert.equal((await sam("POST", `/pro/jobs/${id}/location`, { lat: 17.4, lng: 78.4 })).status, 404);
});

test("addresses can skip the house number", async (t) => {
  if (api.skip) return t.skip(api.skip);
  const customer = await api.googleUser("meera@gmail.com");
  const res = await customer("POST", "/account/addresses", { ...home, house: "" });
  assert.equal(res.status, 201);
  assert.equal(res.data.address.house, "");
});
