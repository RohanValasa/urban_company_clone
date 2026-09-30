const jwt = require("jsonwebtoken");

const COOKIE = "servify_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Sessions are a signed token in an httpOnly cookie, so page scripts can
 * never read it.
 */
function sessionCookies({ jwtSecret, isProd }) {
  const options = { httpOnly: true, sameSite: "lax", secure: isProd, path: "/" };

  return {
    start(res, user) {
      const token = jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: MAX_AGE_MS / 1000 });
      res.cookie(COOKIE, token, { ...options, maxAge: MAX_AGE_MS });
    },
    end(res) {
      res.clearCookie(COOKIE, options);
    },
    /** The user id in the request's session, or null. */
    userId(req) {
      const token = req.cookies?.[COOKIE];
      if (!token) return null;
      try {
        return jwt.verify(token, jwtSecret).sub;
      } catch {
        return null;
      }
    },
  };
}

module.exports = { sessionCookies, COOKIE };
