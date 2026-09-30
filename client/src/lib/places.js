/**
 * Location search, fenced to Hyderabad.
 *
 * With VITE_GOOGLE_MAPS_API_KEY set, suggestions come from Google Places
 * (Places API (New) + Geocoding API must be enabled on the key). Without a
 * key it falls back to Photon, a free OpenStreetMap geocoder, so the picker
 * still works in development.
 */

export const HYDERABAD = {
  center: { lat: 17.385, lng: 78.4867 },
  // Greater Hyderabad plus the ORR belt.
  bounds: { south: 17.2, west: 78.2, north: 17.62, east: 78.7 },
};

export const DEFAULT_LOCATION = {
  title: "Hyderabad",
  subtitle: "Telangana, India",
  ...HYDERABAD.center,
};

export const inHyderabad = ({ lat, lng }) => {
  const b = HYDERABAD.bounds;
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
};

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const PROVIDER = GOOGLE_KEY ? "google" : "osm";

export class OutsideCityError extends Error {
  constructor() {
    super("We only serve Hyderabad right now, and that spot is outside the city.");
  }
}

// ---------------------------------------------------------------- Google

let googleReady = null;

function loadGoogle() {
  if (!googleReady) {
    googleReady = new Promise((resolve, reject) => {
      if (window.google?.maps?.importLibrary) {
        resolve(window.google.maps);
        return;
      }
      const cb = "__ucMapsReady";
      window[cb] = () => {
        delete window[cb];
        resolve(window.google.maps);
      };
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_KEY)}&v=weekly&loading=async&callback=${cb}`;
      s.async = true;
      s.onerror = () => {
        googleReady = null;
        reject(new Error("Google Maps failed to load."));
      };
      document.head.appendChild(s);
    });
  }
  return googleReady;
}

let sessionToken = null;

async function googleSearch(input) {
  const maps = await loadGoogle();
  const { AutocompleteSuggestion, AutocompleteSessionToken } = await maps.importLibrary("places");
  sessionToken ??= new AutocompleteSessionToken();
  const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input,
    sessionToken,
    locationRestriction: HYDERABAD.bounds,
    includedRegionCodes: ["in"],
    language: "en-IN",
    region: "in",
  });

  return suggestions
    .map((s) => s.placePrediction)
    .filter(Boolean)
    .map((p) => {
      const title = p.mainText?.text ?? p.text.text;
      return {
        id: p.placeId,
        title,
        subtitle: p.secondaryText?.text ?? "",
        resolve: async () => {
          const place = p.toPlace();
          await place.fetchFields({ fields: ["location", "formattedAddress"] });
          sessionToken = null; // a selection ends the billing session
          return {
            title,
            subtitle: place.formattedAddress,
            lat: place.location.lat(),
            lng: place.location.lng(),
          };
        },
      };
    });
}

const AREA_TYPES = ["sublocality_level_1", "sublocality", "neighborhood", "premise", "route"];

async function googleReverse({ lat, lng }) {
  const maps = await loadGoogle();
  const { Geocoder } = await maps.importLibrary("geocoding");
  const { results } = await new Geocoder().geocode({ location: { lat, lng } });
  const best = results[0];
  if (!best) return null;
  const area = AREA_TYPES
    .map((t) => best.address_components.find((c) => c.types.includes(t)))
    .find(Boolean);
  return {
    title: area?.long_name ?? best.formatted_address.split(",")[0],
    subtitle: best.formatted_address,
    lat,
    lng,
  };
}

// ---------------------------------------------------------------- Photon (OSM)

const PHOTON = "https://photon.komoot.io";
const { south, west, north, east } = HYDERABAD.bounds;

const photonPlace = (f) => {
  const p = f.properties;
  const [lng, lat] = f.geometry.coordinates;
  const title = p.name || [p.housenumber, p.street].filter(Boolean).join(" ") || p.district || p.city;
  const parts = [p.street !== title && p.street, p.district, p.locality, p.city, p.state, p.postcode]
    .filter((x) => x && x !== title);
  return { title, subtitle: [...new Set(parts)].join(", "), lat, lng };
};

async function photonSearch(input) {
  const url =
    `${PHOTON}/api/?q=${encodeURIComponent(input)}&limit=8&lang=en` +
    `&bbox=${west},${south},${east},${north}&lat=${HYDERABAD.center.lat}&lon=${HYDERABAD.center.lng}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Location search is unavailable right now.");
  const { features = [] } = await res.json();
  return features
    .map((f) => ({ ...photonPlace(f), id: `${f.properties.osm_type}${f.properties.osm_id}` }))
    .filter(inHyderabad)
    .map((place) => ({ ...place, resolve: async () => place }));
}

async function photonReverse({ lat, lng }) {
  const res = await fetch(`${PHOTON}/reverse?lat=${lat}&lon=${lng}&lang=en`);
  if (!res.ok) return null;
  const { features = [] } = await res.json();
  return features[0] ? { ...photonPlace(features[0]), lat, lng } : null;
}

// ---------------------------------------------------------------- public API

/** Suggestions for the typed text; each has title, subtitle and resolve(). */
export const searchPlaces = (input) =>
  (PROVIDER === "google" ? googleSearch : photonSearch)(input);

/** Browser location, reverse geocoded, or an error the UI can show as-is. */
export async function locateMe() {
  if (!navigator.geolocation) throw new Error("This browser can't share its location.");
  const coords = await new Promise((resolve, reject) => {
    // The browser's own timeout only starts once permission is granted, so an
    // ignored prompt would hang forever without this guard.
    const guard = setTimeout(
      () => reject(new Error("Still waiting for location access. Allow it in your browser, or search for your area.")),
      15000
    );
    navigator.geolocation.getCurrentPosition(
      (p) => {
        clearTimeout(guard);
        resolve({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      (e) => {
        clearTimeout(guard);
        reject(
          new Error(
            e.code === e.PERMISSION_DENIED
              ? "Location access is blocked. Allow it in your browser, or search for your area."
              : "Couldn't find your location. Try searching instead."
          )
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
  if (!inHyderabad(coords)) throw new OutsideCityError();

  const reverse = PROVIDER === "google" ? googleReverse : photonReverse;
  const place = await reverse(coords).catch(() => null);
  return place ?? { title: "Current location", subtitle: "Hyderabad, Telangana", ...coords };
}
