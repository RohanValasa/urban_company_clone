// Which writing system a piece of text uses, so replies can match the customer's:
// Telugu typed in English letters gets a reply in English letters, Telugu script
// gets Telugu script, and so on.
const SCRIPTS = [
  ["telugu", /[ఀ-౿]/],
  ["arabic", /[؀-ۿ]/], // Urdu
  ["devanagari", /[ऀ-ॿ]/], // Hindi
];

/** "telugu", "arabic", "devanagari", "latin", or "" when there are no letters. Any native letter wins over English words mixed in. */
function scriptOf(text) {
  const s = String(text || "");
  for (const [name, re] of SCRIPTS) if (re.test(s)) return name;
  return /[a-z]/i.test(s) ? "latin" : "";
}

module.exports = { scriptOf };
