# urban_company_clone

## Running the client

```bash
cd client
npm install
npm run dev
```

### Location search (Hyderabad only)

The location picker in the navbar only accepts places inside Hyderabad. Search
and "Use current location" both check against the city's bounds.

- **Google Maps:** copy `client/.env.example` to `client/.env.local` and set
  `VITE_GOOGLE_MAPS_API_KEY`. The key needs **Places API (New)** and
  **Geocoding API** enabled. Restrict it to your domain in Google Cloud.
- **No key:** the picker falls back to Photon, a free OpenStreetMap search, so
  it still works while developing.

"Use current location" needs the page on `https://` or `localhost`. Browsers
block location access on plain `http://`.
