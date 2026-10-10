// The AI ID check: what counts as verified, PDFs, and checks queued while the AI is busy.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { useApi, MADHAPUR } = require("./helpers");
const { idChecker } = require("../src/lib/idcheck");
const { User } = require("../src/models/User");

const verdict = (over = {}) => ({
  documentType: "aadhaar", readable: true, nameOnDocument: "Asha Rao", nameMatches: true,
  last4OnDocument: "4321", last4Matches: true, looksGenuine: true, decision: "approve", reason: "All good.", ...over,
});
const backendReturning = (answer) => ({
  name: "gemini",
  calls: [],
  async json(req) {
    this.calls.push(req);
    if (answer instanceof Error) throw answer;
    return answer;
  },
});
const ID = { docType: "aadhaar", last4: "4321", name: "Asha Rao", image: { mediaType: "image/jpeg", data: "eA==" } };

test("an ID is approved only when every check passes", async () => {
  const ok = backendReturning(verdict());
  assert.deepEqual(await idChecker({ backend: ok })(ID), { status: "approved", reason: "Your ID is verified.", by: "gemini" });
  assert.equal(ok.calls[0].kind, "id");
  assert.match(ok.calls[0].text, /Asha Rao/);
  assert.match(ok.calls[0].text, /4321/);

  // Even if the model says approve, a failed check rejects it, with a reason to fix.
  const cases = [
    [{ nameMatches: false }, /name on the ID/],
    [{ last4Matches: false }, /last 4/],
    [{ documentType: "pan" }, /different document/],
    [{ looksGenuine: false }, /genuine/],
    [{ readable: false }, /clearer/],
    [{ documentType: "none" }, /identity document/],
  ];
  for (const [over, reason] of cases) {
    const r = await idChecker({ backend: backendReturning(verdict(over)) })(ID);
    assert.equal(r.status, "rejected", JSON.stringify(over));
    assert.match(r.reason, reason);
  }
  const no = await idChecker({ backend: backendReturning(verdict({ decision: "reject", nameMatches: false, reason: "Please use your own ID." })) })(ID);
  assert.equal(no.reason, "Please use your own ID.");
});

test("busy AI → retry later; declined → a person reviews; no AI → dev approves, production waits", async () => {
  await assert.rejects(idChecker({ backend: backendReturning(Object.assign(new Error("quota"), { fallback: true })) })(ID), (e) => e.retry);
  const declined = await idChecker({ backend: backendReturning(Object.assign(new Error("no"), { status: 422 })) })(ID);
  assert.equal(declined.status, "pending");
  assert.equal((await idChecker({ isProd: false })(ID)).status, "approved");
  assert.equal((await idChecker({ isProd: true })(ID)).status, "pending");
});

// The app with an ID check we control: busy until `aiUp` is set.
const state = { aiUp: false, seen: [] };
const api = useApi({
  deps: {
    checkId: async (input) => {
      state.seen.push(input);
      if (!state.aiUp) throw Object.assign(new Error("AI busy"), { retry: true });
      return { status: "approved", reason: "Your ID is verified.", by: "test" };
    },
  },
});

async function newPro() {
  const pro = await api.googleUser("asha@pro.test", "professional");
  await pro("PUT", "/pro/profile", { skills: ["cleaning"], area: { label: "Madhapur", ...MADHAPUR }, payout: { method: "upi", upiId: "asha@okaxis" } });
  return pro;
}

test("ID PDFs are accepted, password-protected ones (like e-Aadhaar) are not", async (t) => {
  if (api.skip) return t.skip(api.skip);
  state.aiUp = true;
  const pro = await newPro();
  const pdf = (text) => Buffer.from(`%PDF-1.7\n${text}\n%%EOF`).toString("base64");
  const locked = await pro("PUT", "/pro/profile", { idDoc: { type: "aadhaar", last4: "4321", file: { mediaType: "application/pdf", data: pdf("1 0 obj << /Encrypt 2 0 R >>") } } });
  assert.equal(locked.status, 400);
  assert.match(locked.data.error, /password-protected/);
  assert.equal((await pro("PUT", "/pro/profile", { idDoc: { type: "aadhaar", last4: "4321", file: { mediaType: "application/pdf", data: Buffer.from("hello").toString("base64") } } })).status, 400);
  const ok = await pro("PUT", "/pro/profile", { idDoc: { type: "aadhaar", last4: "4321", file: { mediaType: "application/pdf", data: pdf("1 0 obj << >>") } } });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.profile.idDoc.status, "approved");
  assert.equal(state.seen.at(-1).image.mediaType, "application/pdf");
});

test("when the AI is busy the ID waits, encrypted, and is checked again a few minutes later", async (t) => {
  if (api.skip) return t.skip(api.skip);
  state.aiUp = false;
  const pro = await newPro();
  const live = await api.watch(pro, "/notifications/live");
  await live.waitFor((e) => e.type === "hello");
  const photo = Buffer.from("a very recognisable ID photo").toString("base64");
  const saved = await pro("PUT", "/pro/profile", { idDoc: { type: "aadhaar", last4: "4321", image: { mediaType: "image/jpeg", data: photo } } });
  assert.equal(saved.data.profile.idDoc.status, "pending");
  assert.match(saved.data.profile.idDoc.reason, /few minutes/);

  let stored = await User.findOne({ email: "asha@pro.test" }).select("+provider.idDoc.fileSealed");
  assert.ok(stored.provider.idDoc.fileSealed);
  assert.equal(stored.provider.idDoc.fileSealed.includes(photo), false, "stored encrypted");
  const later = new Date(Date.now() + 2 * 60000);

  // Still busy: it waits longer.
  await api.app.locals.idChecks.sweep(later);
  stored = await User.findOne({ email: "asha@pro.test" }).select("+provider.idDoc.fileSealed");
  assert.equal(stored.provider.idDoc.tries, 2);
  assert.ok(stored.provider.idDoc.nextTryAt > later);

  // The AI is back: approved, the file is deleted, and the professional hears about it.
  state.aiUp = true;
  await api.app.locals.idChecks.sweep(new Date(Date.now() + 60 * 60000));
  stored = await User.findOne({ email: "asha@pro.test" }).select("+provider.idDoc.fileSealed");
  assert.equal(stored.provider.idDoc.status, "approved");
  assert.equal(stored.provider.idDoc.fileSealed, undefined);
  assert.equal(state.seen.at(-1).image.data, photo, "the same file was checked");
  const note = await live.waitFor((e) => e.note?.kind === "id-approved");
  assert.match(note.note.title, /verified/);
  live.close();
});
