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
`POST /api/bookings/:id/retry`, `POST /api/bookings/:id/cancel`,
`GET /api/notifications/live`, and for professionals `GET|PUT /api/pro/profile`,
`PATCH /api/pro/online`, `GET /api/pro/offers`, `POST /api/pro/offers/:id/accept`,
`POST /api/pro/offers/:id/reject`, `GET /api/pro/jobs`,
`POST /api/pro/jobs/:id/status`, `POST /api/pro/jobs/:id/start` (the OTP),
`POST /api/pro/jobs/:id/complete`, `POST /api/pro/jobs/:id/location`.

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

### Demo accounts

`npm run seed` in `server/` creates 50 customers and 100 professionals spread
across Hyderabad and writes every login to [`DEMO_ACCOUNTS.md`](DEMO_ACCOUNTS.md).
Passwords are `Customer@001` … `Customer@050` and `Provider@001` …
`Provider@100`. The emails end in `.test`, so they can never reach a real inbox.
The seeded professionals skip the ID upload and are already approved; real
sign-ups have to go through it. Re-running the seed replaces only these demo
accounts and their bookings.

### Becoming a professional

Signing up with "I provide a service" opens a four-step profile at
`/professional/onboarding`:

1. **Services** you offer, years of experience, and a few lines about yourself
   in any language (English, Telugu, Hindi, Urdu…).
2. **Service area**: your base (current location or a Hyderabad locality) and
   how far you'll travel.
3. **Identity**: the ID type (Aadhaar, PAN, voter ID, driving licence or
   passport), its last 4 characters and a photo. Claude checks the photo is a
   genuine ID in your name. Only the last 4 characters and the verdict are kept;
   the photo is never stored.
4. **Payouts**: a UPI ID or a bank account. The account number is encrypted
   (AES-256-GCM) and only its last 4 digits are shown back. Card numbers aren't
   accepted.

Jobs only start arriving once all four are done and the ID is approved.

The ID check needs `ANTHROPIC_API_KEY` in `server/.env`. Without one, IDs are
approved automatically in development and left "pending" in production.

### Booking a professional

1. **Matching.** A new booking goes to the nearest online professional who does
   every service in it, whose travel distance covers the address, and who isn't
   already booked within two hours of the slot. They get the request on their
   dashboard with a countdown (`OFFER_SECONDS`, 90 by default) and see the area,
   not the door number or phone.
2. **Accept or reject.** On accept, the customer gets a notification:
   *"Yay! Request accepted by <full name>"*. On reject, or if time runs out, the
   request moves to the next nearest professional.
3. **Nobody free.** If everyone nearby declines, the booking waits. After
   `RETRY_COOLDOWN_SECONDS` (120 by default) the customer can press
   **Find a professional again**, or cancel.
4. **On the way.** The professional presses **Start trip** and their position
   moves on the customer's map with an ETA.
5. **Start code.** At **I've arrived**, the customer gets a 4-digit code on
   their tracking page and by SMS. The professional types it in to start the job
   (5 tries).
6. **Payment.** If the job was paid by UPI at booking, the professional just
   completes it. Otherwise they collect cash or show a UPI QR for the exact
   amount, then tap what they received. A "payment received" animation plays
   and the job is closed.

Notes:

- Updates reach both sides instantly over Server-Sent Events; no extra service
  is needed. The hub lives in the server's memory, so it assumes one server
  process.
- **SMS** is not wired to a gateway yet: the text is printed in the API console
  as `[sms → +91…]`. Plug a provider (MSG91, Twilio…) into `server/src/lib/sms.js`.
- To test on one computer, use two browsers (or a normal and a private window):
  a customer in one and a professional in the other. In development the
  tracking page names who has the request right now, so you know whom to sign
  in as. The professional can choose **Simulate the drive** to send a fake
  route instead of real GPS.
- Real GPS only works on `https://` or `localhost`.

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
