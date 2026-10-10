/**
 * Sends a text message. No SMS gateway is wired up yet (it needs an account
 * with one, such as MSG91 or Twilio), so for now messages are written to the
 * server log. The customer also sees the same information in the app.
 */
function smsSender({ log = console.log } = {}) {
  return async (phone, text) => {
    log(`[sms → +91 ${phone}] ${text}`);
    return { sent: false, logged: true };
  };
}

module.exports = { smsSender };
