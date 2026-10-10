const { User } = require("../models/User");
const { notify } = require("./notify");

// Waits between tries: 1, 2, 4, 8 minutes, then every 15 minutes, for about a day.
const MAX_TRIES = 100;
const waitMinutes = (tries) => Math.min(2 ** tries, 15);

/** Saves an ID check's result and tells the professional. */
async function finish(user, result) {
  const idDoc = user.provider.idDoc;
  Object.assign(idDoc, { ...result, checkedAt: new Date(), fileSealed: undefined, nextTryAt: undefined });
  await user.save();
  notify(user._id, {
    kind: result.status === "approved" ? "id-approved" : "id-rejected",
    title: result.status === "approved" ? "Your ID is verified ✅" : "We couldn't verify your ID",
    body: result.status === "approved" ? "You can go online and start getting jobs." : result.reason,
  });
}

/**
 * ID checks that the AI couldn't do straight away (busy, out of quota,
 * unreachable) wait here, encrypted, and are tried again every few minutes.
 * The file is deleted as soon as there's an answer.
 */
function idQueue({ checkId, seal, open }) {
  /** Checks an ID now, or queues it. Returns the idDoc fields to save. */
  async function check({ user, type, last4, image }) {
    try {
      const result = await checkId({ docType: type, last4, name: user.name, image });
      return { type, last4, ...result, checkedAt: new Date(), tries: 0 };
    } catch (err) {
      if (!err.retry) {
        console.error("ID check failed:", err.message);
        return { type, last4, status: "pending", reason: "We couldn't check your ID just now. Please upload it again in a minute.", by: "error", checkedAt: new Date() };
      }
      return {
        type,
        last4,
        status: "pending",
        reason: "We're checking your ID. This usually takes a few minutes, and we'll let you know.",
        by: "queue",
        fileSealed: seal(JSON.stringify(image)),
        tries: 1,
        nextTryAt: new Date(Date.now() + waitMinutes(1) * 60000),
      };
    }
  }

  /** Tries the queued checks that are due. Called every minute by the server. */
  async function sweep(now = new Date()) {
    const due = await User.find({ "provider.idDoc.status": "pending", "provider.idDoc.nextTryAt": { $lte: now } })
      .select("+provider.idDoc.fileSealed")
      .limit(20);
    for (const user of due) {
      const idDoc = user.provider.idDoc;
      if (!idDoc.fileSealed) continue;
      try {
        const image = JSON.parse(open(idDoc.fileSealed));
        await finish(user, await checkId({ docType: idDoc.type, last4: idDoc.last4, name: user.name, image }));
      } catch (err) {
        idDoc.tries = (idDoc.tries || 0) + 1;
        if (!err.retry || idDoc.tries >= MAX_TRIES) {
          // Give up on the AI: a person reviews it, and the file isn't kept.
          console.error(`ID check for ${user.email} gave up: ${err.message}`);
          Object.assign(idDoc, { reason: "Our team will review your ID shortly.", by: "none", fileSealed: undefined, nextTryAt: undefined });
        } else {
          idDoc.nextTryAt = new Date(now.getTime() + waitMinutes(idDoc.tries) * 60000);
        }
        await user.save();
      }
    }
    return due.length;
  }

  return { check, sweep };
}

module.exports = { idQueue };
