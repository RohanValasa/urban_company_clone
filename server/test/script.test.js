// Replies come back in the letters the customer used: Telugu typed in English
// letters gets English letters, Telugu script gets Telugu script, and so on.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { aiAssistant } = require("../src/lib/assistant");
const { basicAssistant } = require("../src/lib/basic-assistant");
const { scriptOf } = require("../src/lib/script");
const CATALOG = require("../src/data/catalog.json");

const NOW = new Date("2026-10-10T15:00:00+05:30").getTime();
const basic = basicAssistant(CATALOG);
const NATIVE = /[ऀ-ॿ؀-ۿఀ-౿]/;

test("which letters a text is written in", () => {
  assert.equal(scriptOf("Naa wash basin tap leak avthundhi"), "latin");
  assert.equal(scriptOf("మా బెడ్ రూమ్ లో AC పని చేయడం లేదు"), "telugu");
  assert.equal(scriptOf("मेरा AC खराब है"), "devanagari");
  assert.equal(scriptOf("میرا AC خراب ہے"), "arabic");
  assert.equal(scriptOf(""), "");
});

test("basic mode answers in the customer's language and letters", async () => {
  const cases = [
    ["Naa wash basin tap leak avthundhi", "te", /^Meeku Plumber service kavali/],
    ["maa intlo fan padindi", "te", /kavali anipistondi/],
    ["mera AC kaam nahi kar raha hai", "hi", /^Lagta hai aapko AC/],
    ["mujhe kal subah plumber chahiye", "hi", /Lagta hai aapko Plumber/],
    ["బాత్రూమ్ ట్యాప్ లీక్ అవుతోంది", "te", /సేవ అవసరం/],
    ["बाथरूम का नल लीक हो रहा है", "hi", /सेवा चाहिए/],
    ["My AC is not cooling", "en", /^Looks like you need AC/],
  ];
  for (const [text, language, reply] of cases) {
    const r = await basic.assist({ text, now: NOW });
    assert.equal(r.language, language, text);
    assert.match(r.reply, reply, text);
    if (scriptOf(text) === "latin") assert.doesNotMatch(r.reply + r.whatToExpect, NATIVE, text);
  }
});

/** An AI that answers with `answer`, recording the prompt it got. */
function fakeAi(answer) {
  const prompts = [];
  const backend = { name: "fake", json: async (req) => (prompts.push(req.text), answer) };
  return { ai: aiAssistant({ backend }), prompts };
}
const plumber = (over) => ({
  understood: true, language: "te", issue: "Basin tap leaking.", service: "plumber", packages: [{ id: "plumb-tap-2", qty: 1 }],
  urgency: "soon", safetyTip: "", preferredDate: "", preferredTime: "", ...over,
});

test("the AI is told which letters to write in", async () => {
  const { ai, prompts } = fakeAi(plumber({ reply: "Mee tap ki plumber ni pampistham.", whatToExpect: "30 nimishallo fix chestaru." }));
  await ai.assist({ text: "Naa wash basin tap leak avthundhi", now: NOW });
  await ai.assist({ text: "బాత్రూమ్ ట్యాప్ లీక్", now: NOW });
  assert.match(prompts[0], /typed in English \(Latin\) letters.*Telugu, Hindi or Urdu, write that language in English letters/s);
  assert.match(prompts[1], /Telugu script/);
});

test("a reply in the wrong letters is swapped for one in the right letters", async () => {
  // Telugu typed in English letters, but the AI answered in Telugu script.
  const { ai } = fakeAi(plumber({ reply: "మీ వాష్ బేసిన్ ట్యాప్ లీకేజీకి ప్లంబర్‌ను పంపుతాము.", whatToExpect: "ప్లంబర్ 30 నిమిషాల్లో సరిచేస్తారు.", safetyTip: "" }));
  const r = await ai.assist({ text: "Naa wash basin tap leak avthundhi", now: NOW });
  assert.equal(r.reply, "Meeku Plumber service kavali anipistondi. Memu suggest chesedi idi.");
  assert.match(r.whatToExpect, /^Verified professional/);
  assert.equal(r.service.slug, "plumber");

  // Hindi in English letters answered in Devanagari.
  const hindi = fakeAi(plumber({ language: "hi", reply: "हम प्लंबर भेजेंगे।", whatToExpect: "30 मिनट।" }));
  assert.match((await hindi.ai.assist({ text: "mera nal leak ho raha hai", now: NOW })).reply, /^Lagta hai aapko Plumber/);

  // English letters in the right language are kept as the AI wrote them.
  const good = fakeAi(plumber({ reply: "Mee tap ki plumber ni pampistham.", whatToExpect: "30 nimishallo fix chestaru." }));
  assert.equal((await good.ai.assist({ text: "Naa tap leak avthundhi", now: NOW })).reply, "Mee tap ki plumber ni pampistham.");

  // Telugu script asked, Telugu script answered: kept.
  const telugu = fakeAi(plumber({ reply: "మీ ట్యాప్ కోసం ప్లంబర్‌ను పంపుతాము.", whatToExpect: "30 నిమిషాలు." }));
  assert.equal((await telugu.ai.assist({ text: "ట్యాప్ లీక్ అవుతోంది", now: NOW })).reply, "మీ ట్యాప్ కోసం ప్లంబర్‌ను పంపుతాము.");

  // Telugu script asked, English answered: swapped to Telugu.
  const english = fakeAi(plumber({ reply: "We'll send a plumber.", whatToExpect: "30 minutes." }));
  assert.match((await english.ai.assist({ text: "ట్యాప్ లీక్ అవుతోంది", now: NOW })).reply, /సేవ అవసరం/);
});
