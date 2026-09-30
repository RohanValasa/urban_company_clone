const { OAuth2Client } = require("google-auth-library");

/**
 * Checks a "Sign in with Google" credential: Google's signature, that it was
 * issued for our client id, and that it hasn't expired.
 */
function googleVerifier(clientId) {
  if (!clientId) return null;
  const client = new OAuth2Client(clientId);

  return async (credential) => {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const p = ticket.getPayload();
    return { googleId: p.sub, email: p.email, emailVerified: p.email_verified, name: p.name, avatar: p.picture };
  };
}

module.exports = { googleVerifier };
