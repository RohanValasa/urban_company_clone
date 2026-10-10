const DOC_NAMES = {
  aadhaar: "Aadhaar card",
  pan: "PAN card",
  voter: "Voter ID (EPIC) card",
  dl: "Indian driving licence",
  passport: "Indian passport",
};

const ID_SCHEMA = {
  type: "object",
  properties: {
    documentType: { type: "string", enum: ["aadhaar", "pan", "voter", "dl", "passport", "other", "none"] },
    readable: { type: "boolean" },
    nameOnDocument: { type: "string" },
    nameMatches: { type: "boolean" },
    last4OnDocument: { type: "string" },
    last4Matches: { type: "boolean" },
    looksGenuine: { type: "boolean" },
    decision: { type: "string", enum: ["approve", "reject"] },
    reason: { type: "string" },
  },
  required: ["documentType", "readable", "nameOnDocument", "nameMatches", "last4OnDocument", "last4Matches", "looksGenuine", "decision", "reason"],
  additionalProperties: false,
};

const ID_SYSTEM = `You check identity documents for Servify, a home-services marketplace in India, before a service professional is allowed into customers' homes. You get a photo, scan or PDF of one document, the applicant's name, the kind of document they say it is, and the last 4 characters of its number that they typed.

Check, and report each in the fields:
- documentType: what the document actually is (aadhaar, pan, voter, dl, passport), "other" for a different document, "none" if it isn't an identity document.
- readable: the name and number can be read (not too blurry, dark, cropped or covered).
- nameOnDocument and nameMatches: the printed name, and whether it reasonably matches the applicant's name. Allow initials, a missing or extra surname, a different order, and spelling variants between scripts; don't allow a different person.
- last4OnDocument and last4Matches: the last 4 characters of the document number, and whether they match what was typed. A masked Aadhaar (XXXX XXXX 1234) is fine: only the last 4 need to match.
- looksGenuine: it looks like a real document, not a screenshot of a template, a sample/specimen, a drawing, or an obviously edited image.

Approve only when it is the stated kind of document, readable, the name matches, the last 4 match, and it looks genuine. Otherwise reject, and in reason say in one short, polite sentence what the applicant should fix. Never repeat the full document number anywhere.`;

const failedChecks = (v, docType) => {
  if (v.documentType === "none") return "That doesn't look like an identity document. Please upload a photo or PDF of your ID.";
  if (!v.readable) return "We couldn't read the name or number. Please upload a clearer, well-lit photo of the whole card.";
  if (v.documentType !== docType) return `That looks like a different document from the ${DOC_NAMES[docType]} you chose. Pick the right type or upload the right card.`;
  if (!v.nameMatches) return "The name on the ID doesn't match your account name. Use the ID in your own name, or update your name.";
  if (!v.last4Matches) return "The last 4 characters you typed don't match the ID. Please check them.";
  if (!v.looksGenuine) return "This ID doesn't look genuine. Please upload a photo of your original card.";
  return null;
};

/**
 * Checks a professional's ID (photo or PDF) with whichever AI is set up.
 * Returns { status, reason, by }. Throws an error marked `retry` when the AI
 * couldn't answer just now, so the caller can queue the check.
 *
 * Without an AI, development servers approve automatically and production
 * servers leave the profile pending for a person to review.
 */
function idChecker({ backend, isProd }) {
  if (!backend) {
    return async () =>
      isProd
        ? { status: "pending", reason: "Our team will review your ID shortly.", by: "none" }
        : { status: "approved", reason: "Approved automatically: no AI is set up on this development server.", by: "dev-auto" };
  }

  return async ({ docType, last4, name, image }) => {
    const docName = DOC_NAMES[docType] || "Indian government ID";
    let verdict;
    try {
      verdict = await backend.json({
        kind: "id",
        system: ID_SYSTEM,
        image,
        text: `Applicant name: ${name}\nDocument they say it is: ${docName} (${docType})\nLast 4 characters they typed: ${last4}`,
        schema: ID_SCHEMA,
      });
    } catch (err) {
      if (err.fallback) throw Object.assign(new Error(err.message), { retry: true });
      // The AI declined to look at it: a person should.
      if (err.status === 422) return { status: "pending", reason: "Our team will review your ID shortly.", by: "ai" };
      throw err;
    }
    const problem = failedChecks(verdict, docType);
    if (verdict.decision === "approve" && !problem) {
      return { status: "approved", reason: "Your ID is verified.", by: backend.name };
    }
    const reason = String(verdict.reason || "").slice(0, 300) || problem || "We couldn't verify this ID. Please try another photo.";
    return { status: "rejected", reason: problem && verdict.decision === "approve" ? problem : reason, by: backend.name };
  };
}

module.exports = { idChecker, DOC_NAMES, ID_SCHEMA, ID_SYSTEM };
