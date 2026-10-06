const { Anthropic } = require("@anthropic-ai/sdk");

const MODEL = "claude-opus-5-5";

const DOC_NAMES = {
  aadhaar: "Aadhaar card",
  pan: "PAN card",
  voter: "Voter ID (EPIC) card",
  dl: "Indian driving licence",
  passport: "Indian passport",
};

const SCHEMA = {
  type: "object",
  properties: {
    decision: { type: "string", enum: ["approve", "reject"] },
    reason: { type: "string" },
  },
  required: ["decision", "reason"],
  additionalProperties: false,
};

/**
 * Checks a professional's ID photo. Returns { status, reason, by }.
 *
 * With ANTHROPIC_API_KEY (or another Anthropic credential) set, Claude looks
 * at the photo. Without one, development servers approve automatically and
 * production servers leave the profile pending.
 */
function idChecker({ hasCredentials, isProd, client }) {
  if (!hasCredentials) {
    return async () =>
      isProd
        ? { status: "pending", reason: "ID check isn't set up on this server yet.", by: "none" }
        : { status: "approved", reason: "Approved automatically: no AI key on this development server.", by: "dev-auto" };
  }

  const anthropic = client || new Anthropic();

  return async ({ docType, last4, name, image }) => {
    const docName = DOC_NAMES[docType] || "Indian government ID";
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      system:
        "You check identity documents for a home-services marketplace that is onboarding a service professional. " +
        "Approve only when the photo clearly shows the stated kind of document, the printed name reasonably matches " +
        "the applicant's name (allow initials, order changes and spelling variants), and the number on it ends in the " +
        "stated last 4 digits. Reject blurry, cropped, edited-looking or unrelated images, and say in one short, polite " +
        "sentence what the applicant should fix. Never repeat the full ID number in your reason.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } },
            {
              type: "text",
              text: `Applicant name: ${name}\nDocument type: ${docName}\nLast 4 digits they entered: ${last4}`,
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return { status: "pending", reason: "We couldn't check this automatically. Our team will review it.", by: "ai" };
    }
    const text = response.content.find((b) => b.type === "text")?.text;
    let verdict;
    try {
      verdict = JSON.parse(text);
    } catch {
      return { status: "pending", reason: "We couldn't read the check result. Please try again.", by: "ai" };
    }
    return {
      status: verdict.decision === "approve" ? "approved" : "rejected",
      reason: String(verdict.reason || "").slice(0, 300),
      by: "ai",
    };
  };
}

module.exports = { idChecker, DOC_NAMES };
