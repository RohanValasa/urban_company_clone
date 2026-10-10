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
2. **Address.** Saved per account. The area comes from the Telangana-only
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
across Telangana and writes every login to [`DEMO_ACCOUNTS.md`](DEMO_ACCOUNTS.md).
Most are in Hyderabad; professionals 77–100 and customers 43–50 are in
Warangal, Karimnagar, Nizamabad, Khammam, Nalgonda, Mahbubnagar, Siddipet and
Adilabad.
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
2. **Service area**: your base (current location, a Hyderabad locality or a Telangana town) and
   how far you'll travel.
3. **Identity**: the ID type (Aadhaar, PAN, voter ID, driving licence or
   passport), its last 4 characters and a photo. Claude checks the photo is a
   genuine ID in your name. Only the last 4 characters and the verdict are kept;
   the photo is never stored.
4. **Payouts**: a UPI ID or a bank account. The account number is encrypted
   (AES-256-GCM) and only its last 4 digits are shown back. Card numbers aren't
   accepted.

Jobs only start arriving once all four are done and the ID is approved.

The ID check uses the same `ANTHROPIC_API_KEY` as the [AI features](#ai-features-claude). Without one, IDs are
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
3. **Nobody free.** If everyone nearby declines, or is offline or booked, the
   booking waits. If no professional covers that address for the service at
   all, the customer is told so ("No professionals near you yet"). After
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

### AI features

Two features use an AI model, and you choose which one in `server/.env`:

| Provider | Setting | Cost | Notes |
|---|---|---|---|
| **Gemini** (Google) | `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-3.8-flash`) | Free tier with daily limits | Get a key at aistudio.google.com → Get API key. On the free tier Google may use what's sent to improve its products. |
| **Claude** (Anthropic) | `ANTHROPIC_API_KEY`, `AI_MODEL` (default `claude-haiku-5-5`), `AI_PARTS_MODEL` (default `claude-opus-5-5`) | Pay as you go | Also checks new professionals' ID photos. |
| **Basic mode** | none | Free | Keyword matching in English, Telugu, Hindi and Urdu, plus a price list of common parts. Can't read photos. |

With no setting, Gemini is used if its key is set, then Claude, else basic
mode. `AI_PROVIDER=gemini|claude|basic` forces one. Basic mode also answers
automatically whenever the AI is out of quota or unreachable, so the
features never break.

1. **Ask Servify AI** (`/ask`, and the shortcut on the home page). The customer
   types, speaks or photographs the problem. Typing and speaking work in
   English, Telugu, Hindi or Urdu, including Telugu written in English letters.
   Claude works out what's wrong and suggests the service and packages, using
   catalogue prices. It also gives a safety tip when there's a hazard and
   understands times like "repu morning" (tomorrow morning).
   **Add to cart & book** opens checkout with that time already picked, and with
   a note for the professional saying what's wrong and what to bring.
2. **Voice booking.** The mic button uses the browser's own speech recognition
   (Chrome, Edge, Safari) in Telugu, Hindi, Urdu or English. The browser turns
   the speech into text, so it's sent to the browser maker's speech service,
   not to Servify.
3. **Fair parts price.** During a job, the professional photographs a spare part
   and enters their price. Claude identifies the part and estimates the usual
   price in Telangana.
   - The customer sees both on their tracking page, marked "Fair price", "A
     little above" or "Well above", and approves or declines.
   - The job can't be closed while a part is waiting for an answer.
   - Approved parts are added to what the professional collects, including on
     jobs already paid online.

Notes:

- Photos are sent to the AI provider and never stored by Servify. Only the
  diagnosis text and the part's estimate are saved.
- Basic mode's part prices are in `server/src/data/part-prices.json`. They're
  rough typical prices, so edit them to match your area.
- Each account can make `AI_RATE_LIMIT` AI requests an hour (30 by default),
  because every request costs money. The catalogue part of the prompt is
  cached, which makes repeat requests cheaper.
- The prices are estimates. The customer always confirms before anything is
  booked or charged.
- The assistant chooses from `server/src/data/catalog.json`. After changing
  `client/src/data/services.js`, run `npm run catalog` in `client/` to
  regenerate it; a server test fails while the two disagree.

**Trying it:** `npm run ai-check` in `server/` sends 12 typical
requests through the assistant and reports, for each, whether the answer was
right, how long it took and roughly what it cost. They are in English, Telugu,
Hindi and Urdu, and include a safety case, a vague one and a trick one. Add a
folder of photos to try those too: `npm run ai-check -- C:\path\to\photos`.
Photos named `part…` go to the parts price check. It uses whichever provider
is set up. A run is free on Gemini's free tier and in basic mode, and costs a
few rupees on Claude Haiku.

API: `POST /api/ai/assist` (`{ text?, image? }`), `POST /api/pro/jobs/:id/parts`
(`{ image, quoted, note? }`) and `POST /api/bookings/:id/parts/:partId`
(`{ decision: "approve" | "decline" }`).

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

### Location search (Telangana)

The location picker in the navbar accepts places anywhere in Telangana and
starts at Hyderabad. Search, "Use current location", saved addresses and
professionals' service areas are all checked against the state's outline
(`telangana.json`, the same file in `client/src/lib/` and `server/src/lib/`).
It comes from the [DataMeet India maps](https://github.com/datameet/maps)
(CC BY 4.0) and is simplified, so it's accurate to a few km at the border.

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
