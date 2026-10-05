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
phone), `POST /api/auth/google`, `POST /api/auth/logout`, `GET /api/auth/me`,
`PATCH /api/account/profile`, `GET|POST /api/account/addresses`,
`DELETE /api/account/addresses/:id`, `POST /api/bookings/quote`,
`GET|POST /api/bookings`, `GET /api/bookings/:id`, `GET /api/bookings/:id/live`,
and for professionals `GET /api/pro/jobs`, `POST /api/pro/jobs/:id/accept`,
`POST /api/pro/jobs/:id/status`, `POST /api/pro/jobs/:id/location`.

Run the API tests with `npm test` in `server/`. They need a MongoDB at
`MONGODB_TEST_URI` (default `mongodb://127.0.0.1:27017/servify_test`) and are
skipped when none is reachable.

### Checkout

**View Cart** opens a checkout that unlocks one step at a time:

1. **Phone.** Email sign-ups already have one; Google sign-ups add it here, and
   it's saved on the account.
2. **Address.** Saved per account. The area comes from the Hyderabad-only
   location picker.
3. **Slot.** Every half hour from 8:00 AM to 7:30 PM (India time), up to a week
   ahead and at least an hour away.
4. **Payment.** Cash on delivery, or UPI with a QR code for the exact amount.

The bill (5% GST + ₹49 visit fee, coupons, tip) is worked out on the server, and
bookings are saved to MongoDB and listed under **My bookings**.

To show the UPI QR code, set `UPI_ID` (for example `yourname@okhdfcbank`) and
optionally `UPI_NAME` in `server/.env`. The app trusts the customer's "I've
paid" and marks the booking "confirming payment"; it can't check with the bank.
For automatic confirmation you'd need a payment gateway such as Razorpay.

### Live tracking

After booking, the customer's **Track booking** page (`/bookings/:id`) follows
the job live: *Booked → Professional assigned → On the way → Arrived →
Completed*. While the professional travels, their position moves on an
OpenStreetMap map with the distance and an ETA, like a ride-hailing app.

Professionals see **New jobs near you** on their dashboard (area only, no door
number or phone until they accept). After accepting they press **Start trip**,
which shares their location every few seconds, then **I've arrived** and
**Mark job completed**.

- Updates reach the customer instantly over Server-Sent Events
  (`GET /api/bookings/:id/live`); no extra service is needed.
- Real GPS only works on `https://` or `localhost`. Phones on your Wi-Fi
  (`http://192.168…`) won't share their location until the site has https.
- To try it on one computer, use two browsers (or a normal and a private
  window): sign up as a customer in one and as a professional in the other.
  In development the professional can choose **Simulate the drive** to send a
  fake route instead of real GPS.
- The live hub lives in the server's memory, so it assumes one server process.

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
