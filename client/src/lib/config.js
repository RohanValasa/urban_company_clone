import { api } from "./api";

let config = null;

/** Settings the server shares with the browser (Google client id, UPI payee). Fetched once. */
export function getConfig() {
  if (!config) {
    config = api("/config");
    // Let the next caller retry after a failure.
    config.catch(() => {
      config = null;
    });
  }
  return config;
}
