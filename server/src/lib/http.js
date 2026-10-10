const { User } = require("../models/User");

// `expose` marks the message as safe to show the user.
const httpError = (status, message) => Object.assign(new Error(message), { status, expose: true });

/** Middleware that loads the signed-in user into `req.user`, or answers 401. */
function requireUser(session) {
  return async (req, res, next) => {
    const id = session.userId(req);
    const user = id && (await User.findById(id).catch(() => null));
    if (!user) return next(httpError(401, "Please sign in to continue."));
    req.user = user;
    next();
  };
}

module.exports = { httpError, requireUser };
