import { useEffect, useState } from "react";

/**
 * A booking that stays up to date: the server pushes status changes and the
 * professional's position over Server-Sent Events.
 */
export function useLiveBooking(id) {
  const [booking, setBooking] = useState(null);
  const [state, setState] = useState("connecting");

  useEffect(() => {
    const source = new EventSource(`/api/bookings/${id}/live`);
    source.onopen = () => setState("live");
    source.onmessage = (e) => {
      const event = JSON.parse(e.data);
      if (event.type === "booking") setBooking(event.booking);
      if (event.type === "location") setBooking((b) => b && { ...b, tracking: event.tracking });
    };
    // EventSource retries by itself; CLOSED means the server refused (not found, signed out).
    source.onerror = () => setState(source.readyState === EventSource.CLOSED ? "failed" : "reconnecting");
    return () => source.close();
  }, [id]);

  // Actions (retry, cancel) return the new booking straight away; the stream catches up.
  return { booking, state, setBooking };
}
