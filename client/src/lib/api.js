const OFFLINE = "Can't reach the Servify server. Make sure it's running (npm run dev in server/).";

/**
 * Calls the Servify API. The session rides along in an httpOnly cookie.
 * Resolves to the JSON body, or throws an Error with a message fit to show.
 */
export async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(OFFLINE);
  }
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // The dev proxy answers with a bare 5xx when the server is down.
    throw new Error(data?.error || (res.status >= 500 ? OFFLINE : "Something went wrong. Please try again."));
  }
  if (!data) throw new Error(OFFLINE);
  return data;
}
