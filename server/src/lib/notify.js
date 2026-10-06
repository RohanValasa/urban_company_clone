const { publish, subscribe } = require("./live");

/**
 * Pop-up notifications for one person ("Request accepted by Ravi Kumar").
 * They ride the same in-memory hub as booking updates, on a per-user channel.
 */
const channel = (userId) => `user:${userId}`;

const notify = (userId, note) => publish(channel(userId), { type: "notification", note: { at: new Date(), ...note } });

const onNotifications = (userId, listener) => subscribe(channel(userId), listener);

module.exports = { notify, onNotifications };
