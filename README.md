# urban_company_clone

## Running it

Accounts live in MongoDB behind a small Express API in `server/`. Run the API
and the client in two terminals:

```bash
# 1. API: http://localhost:5000
cd server
cp .env.example .env    # then fill in JWT_SECRET (and GOOGLE_CLIENT_ID, below)
npm install
npm run dev

# 2. Client: http://localhost:5173
cd client
npm install
npm run dev
```

The Vite dev server forwards `/api` to the API, so the browser sees one origin
and the session cookie works without CORS setup. If the API runs elsewhere,
start the client with `API_URL=http://host:port npm run dev`.

**MongoDB.** The API reads `MONGODB_URI` from `server/.env`. Either install
MongoDB locally, run it in Docker
(`docker run -d --name servify-mongo -p 27017:27017 mongo:7`), or paste a free
[MongoDB Atlas](https://www.mongodb.com/atlas) connection string.

### Sign in and sign up

- **Email or phone + password.** Passwords must have 8+ characters with
  upper and lower case letters, a number and a symbol. The server checks this
  too and stores only a bcrypt hash.
- **Google.** One click creates or opens the account. A Google address that
  matches an existing account is linked to it. On the sign-up tab, the "I need
  / I provide a service" choice sets the new account's role.
- Sessions are a signed token in an `httpOnly` cookie that lasts 7 days, so page
  scripts can't read it. Sign-in routes are rate limited.

API: `POST /api/auth/signup`, `POST /api/auth/login` (`identifier` is an email or
phone), `POST /api/auth/google`, `POST /api/auth/logout`, `GET /api/auth/me`.

Run the API tests with `npm test` in `server/`. They need a MongoDB at
`MONGODB_TEST_URI` (default `mongodb://127.0.0.1:27017/servify_test`) and are
skipped when none is reachable.

### Turning on "Sign in with Google"

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create a project, set up the **OAuth consent screen** (External, app name
   "Servify"), and add yourself as a test user.
2. **Create credentials → OAuth client ID → Web application.** Under
   **Authorised JavaScript origins** add `http://localhost:5173` (and your
   live site's address later). You don't need a redirect URI.
3. Copy the client ID (`….apps.googleusercontent.com`) into `server/.env` as
   `GOOGLE_CLIENT_ID` and restart the API.

The client fetches the ID from the API, so it only needs setting in one place.
Until it's set, the modal shows a note where the Google button would be.

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

### Pictures

Every picture is a 3D icon from Microsoft's
[Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT licence),
bundled in `client/src/assets/emoji`. `client/src/lib/art.js` picks the icon for
each service, tab, area and tool from the words in its name, so nothing loads
from an image host. To change a picture, add or reorder a rule in `RULES`, or
set `icon` on a package spec to force one.
