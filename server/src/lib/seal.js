const crypto = require("node:crypto");

/**
 * Encrypts small secrets (bank account numbers) before they are stored, so a
 * database dump alone doesn't reveal them. The key comes from FIELD_KEY, or
 * is derived from JWT_SECRET when that isn't set.
 */
function sealer(secret) {
  const key = crypto.createHash("sha256").update(`servify-fields:${secret}`).digest();
  return {
    seal(plain) {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
      const body = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
      return [iv, cipher.getAuthTag(), body].map((b) => b.toString("base64url")).join(".");
    },
    open(sealed) {
      const [iv, tag, body] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
    },
  };
}

module.exports = { sealer };
