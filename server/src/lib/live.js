const { EventEmitter } = require("node:events");

/**
 * Pushes booking updates (status changes, the professional's position) to
 * whoever is watching that booking. Kept in memory, so it works for a single
 * server process; several processes would need something shared like Redis.
 */
const hub = new EventEmitter();
hub.setMaxListeners(0);

const publish = (bookingId, event) => hub.emit(String(bookingId), event);

function subscribe(bookingId, listener) {
  const key = String(bookingId);
  hub.on(key, listener);
  return () => hub.off(key, listener);
}

/** Streams events to the browser as Server-Sent Events until it disconnects. */
function openStream(req, res, first) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);
  send(first);
  // A comment line every 25s stops proxies from closing an idle stream.
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25000);
  return {
    send,
    onClose(cleanup) {
      req.on("close", () => {
        clearInterval(heartbeat);
        cleanup();
      });
    },
  };
}

module.exports = { publish, subscribe, openStream };
