# Holy Spirit Prayers

A Christian digital prayer marketplace where users stream Bible-centered prayers, purchase/download prayer audio files ($7 each), and request personalized custom prayers ($10 each).

Stack: **Express + Vite + React + TypeScript + Tailwind CSS + shadcn/ui + Drizzle ORM (SQLite, optional) + Recharts**.

---

## Quick Start (Local)

```bash
npm install
npm run dev      # starts Express + Vite on http://localhost:5000
```

## Production Build

```bash
npm run build    # → dist/index.cjs (server) + dist/public/ (client)
npm run start    # NODE_ENV=production node dist/index.cjs
```

The Express server in `server/index.ts` already binds to `0.0.0.0:${process.env.PORT || 5000}` and serves the built React bundle from `dist/public/`. **No changes are needed to deploy on Railway.**

---

## Railway Deployment

This project is Railway-ready out of the box.

### 1. Connect repository

- Push the project to GitHub (or your Railway-supported provider).
- In Railway: **New Project → Deploy from GitHub repo → select this repo**.

### 2. Build & Start commands

Railway autodetects Node.js. If you need to set them explicitly:

| Setting     | Value             |
| ----------- | ----------------- |
| Build       | `npm run build`   |
| Start       | `npm run start`   |
| Node version | 20.x or 22.x     |

The `package.json` `start` script already runs `NODE_ENV=production node dist/index.cjs`.

### 3. Environment Variables

Add the following in **Railway → Variables**. None of these are required for the prototype to boot — they only activate live integrations as you wire them in.

| Variable                  | Purpose                                                 | Required for prototype |
| ------------------------- | ------------------------------------------------------- | ---------------------- |
| `PORT`                    | Set automatically by Railway (server already reads it)  | Auto                   |
| `NODE_ENV`                | `production`                                            | Yes (set by Railway)   |
| `STRIPE_SECRET_KEY`       | Stripe server key (`sk_live_...` or `sk_test_...`)      | Yes for live payments  |
| `STRIPE_WEBHOOK_SECRET`   | Webhook signing secret for `/api/stripe/webhook`        | Yes for live payments  |
| `STRIPE_PUBLISHABLE_KEY`  | Stripe public key (frontend, prefix `VITE_`)            | Future                 |
| `STRIPE_MONTHLY_PRICE_ID` | Optional Price ID for the $27/month subscription        | Optional               |
| `STRIPE_PRAYER_PRICE_ID`  | Optional Price ID for the $7 one-time prayer purchase   | Optional               |
| `SITE_URL`                | Canonical origin for SEO (canonical, OG, sitemap, robots) — no trailing slash | Recommended            |
| `UPLOADS_DIR`             | Filesystem path for admin-uploaded MP3s + PDFs. Defaults to `./uploads`. Set to `/data/uploads` on Railway when using a mounted Volume so files persist across redeploys | Required on Railway   |
| `SESSION_SECRET`          | Reserved for future signed-cookie/JWT session work      | Optional               |
| `RESEND_API_KEY`          | Transactional email (or `SENDGRID_API_KEY`)             | Future                 |
| `EMAIL_FROM`              | e.g. `prayers@holyspiritprayers.app`                    | Future                 |
| `DATABASE_URL`            | Postgres URL (replace SQLite for production scale)      | Future                 |
| `S3_BUCKET`               | Audio file storage bucket                                | Future                 |
| `S3_REGION`               | e.g. `us-west-2`                                         | Future                 |
| `S3_ACCESS_KEY_ID`        | AWS access key                                           | Future                 |
| `S3_SECRET_ACCESS_KEY`    | AWS secret                                               | Future                 |
| `CLOUDFRONT_URL`          | Optional CDN for signed audio URLs                       | Future                 |

Frontend variables must be prefixed `VITE_` to be exposed to the browser (see Vite docs).

### 4. Post-deploy

Railway will assign a public URL. The client uses **hash-based routing**, so the home route is `https://<your-app>.up.railway.app/#/`.

### 5. Connect the custom domain `www.holyspiritprayers.com`

The app is configured to canonicalize on `https://www.holyspiritprayers.com`
(via the `SITE_URL` env var, which defaults to that origin). To wire it up:

1. **Add the domain in Railway.** In the project's *Settings → Domains* tab,
   click **Custom Domain** and add `www.holyspiritprayers.com`. Railway will
   show the target hostname for your DNS record (something like
   `<service>.up.railway.app`).
2. **Create the DNS record at your registrar.** Add a `CNAME` for `www`
   pointing at the Railway target hostname. If your DNS provider supports
   apex flattening (e.g. Cloudflare), you can also add a `CNAME`/`ALIAS`
   for the apex `holyspiritprayers.com` pointing at the same target;
   otherwise add an `A` record per Railway's instructions and forward the
   apex to `www` via your registrar.
3. **Enable HTTPS.** Railway provisions a TLS certificate automatically
   once the DNS record is verified — usually within a few minutes.
4. **Set `SITE_URL`.** In Railway → *Variables*, set
   `SITE_URL=https://www.holyspiritprayers.com` so canonical links,
   `<link rel="canonical">`, OG tags, `sitemap.xml`, and the
   `Sitemap:` directive in `robots.txt` all resolve to the live origin.
5. **Verify.** Browse to `https://www.holyspiritprayers.com/robots.txt`
   and `https://www.holyspiritprayers.com/sitemap.xml` — both should
   reflect the `www` origin.

### 6. Persist uploads with a Railway Volume

Admin-uploaded MP3s and companion PDFs are written to disk by the Express
server. Railway's default container filesystem is **ephemeral** — files are
lost on every redeploy or restart. To keep uploads across deploys, attach
a persistent Volume and point the server at it via `UPLOADS_DIR`:

1. **Create the Volume.** In Railway → your service → *Settings → Volumes*,
   click **Add Volume**. Choose a size (1–5 GB is plenty to start) and set
   the **Mount path** to `/data`.
2. **Set the env var.** In Railway → *Variables*, add
   `UPLOADS_DIR=/data/uploads`. The server creates the directory
   recursively at startup, so the `uploads/` subfolder under the mount
   does not need to exist yet.
3. **Redeploy / restart** the service so the new variable and volume
   mount take effect. Subsequent uploads via `/#/admin/uploads` are
   written under `/data/uploads/` and will survive future redeploys.
4. **Migrate existing uploads.** Files already saved to the previous
   ephemeral `uploads/` directory are **not** copied automatically. Either
   re-upload them through the admin console after the volume is in place,
   or (if you still have local copies) use `railway run` / `railway ssh`
   to copy the MP3/PDF files into `/data/uploads/` while preserving the
   randomized filenames recorded in the `uploaded_prayers` table.

Without `UPLOADS_DIR` set, the server falls back to `./uploads` under the
container's working directory — fine for local development, but those files
will be lost on the next Railway redeploy.

---

## Architecture

```
client/              React + Vite + Tailwind frontend
  src/
    App.tsx          Hash router (wouter useHashLocation), all routes
    pages/           home, library, prayer-detail, custom-prayer,
                     free-prayer, dashboard, auth, static-pages, admin
    components/
      brand/         Logo, Navbar, Footer, AudioPlayer, PrayerCard,
                     PrayerArt, SectionDivider, Scripture, PageShell
      ui/            shadcn/ui primitives
    lib/
      data.ts        24 prayer categories, 18 seeded prayers, mock
                     orders/users/requests, KPI series for charts
      app-context.tsx
                     ThemeProvider, AuthProvider, PlayerProvider
                     (in-memory only — no localStorage)
server/              Express
  index.ts           Boot, binds 0.0.0.0:${PORT||5000}
  routes.ts          API endpoints (newsletter, contact, custom-prayer,
                     free-prayer/unlock, prayers, categories, admin
                     dashboard, stripe webhook stub)
  storage.ts         Drizzle SQLite storage interface
  static.ts          Serves dist/public in production
  vite.ts            Dev-only Vite middleware
shared/
  schema.ts          Drizzle table definitions (extend as needed)
dist/                Build output (gitignored)
```

### Routes

User: `/#/`, `/#/library`, `/#/library/:category`, `/#/prayer/:slug`,
`/#/custom-prayer`, `/#/custom-prayer/success`, `/#/free-prayer`,
`/#/dashboard`, `/#/account`

Auth: `/#/login`, `/#/register`, `/#/forgot-password`, `/#/reset-password`

Static: `/#/about`, `/#/contact`, `/#/legal`

Admin: `/#/admin`, `/#/admin/prayers`, `/#/admin/categories`,
`/#/admin/custom-requests`, `/#/admin/orders`, `/#/admin/users`,
`/#/admin/analytics`, `/#/admin/settings`

The SPA navigates via the hash fragment for all in-app links (this preserves
the existing Stripe success/cancel redirects that target `/#/...`). For SEO,
the Express server **also** responds to the corresponding real paths
(`/`, `/library`, `/prayer/:id`, `/custom-prayer`, `/about`, `/contact`,
`/legal`, etc.) and serves `index.html` with route-specific meta tags
injected. When a real-path request hits the browser (e.g. a Google result
or a direct sitemap link), `client/src/main.tsx` translates the pathname
into the corresponding `#/...` hash and the SPA renders the right page.

### SEO

The server injects route-specific SEO before serving `index.html`:

- `<title>`, `<meta name="description">`, canonical link, OG/Twitter tags.
- `<meta name="robots">` — `index, follow` for public pages,
  `noindex, nofollow` for `/login`, `/register`, `/forgot-password`,
  `/reset-password`, `/account`, `/dashboard`, and `/admin/*`.
- `application/ld+json` Organization + WebSite schema on the homepage.
- `application/ld+json` Product + CreativeWork + BreadcrumbList schema on
  prayer detail pages, generated from the live `uploaded_prayers` row
  (price `$7.00 USD` unless `isFree` is set, in which case `$0.00`).

The canonical origin comes from `SITE_URL` (default
`https://www.holyspiritprayers.com`).

Server-rendered SEO endpoints (real plain text / XML, not the React app):

| Path           | Purpose                                                     |
| -------------- | ----------------------------------------------------------- |
| `/robots.txt`  | Allows public content, disallows admin/auth/account/api/    |
| `/sitemap.xml` | Static pages + every uploaded prayer detail URL             |
| `/health`      | Lightweight liveness check (alongside `/api/health`)        |

`gzip` compression is enabled via `compression` middleware, and hashed Vite
assets under `/assets/*` are served with `Cache-Control: public,
max-age=31536000, immutable`. Google Fonts already load with `display=swap`.

### API endpoints

| Method | Path                                           | Purpose                                       |
| ------ | ---------------------------------------------- | --------------------------------------------- |
| GET    | `/api/health`                                  | Liveness check                                |
| POST   | `/api/email/signup`                            | Newsletter signup                             |
| POST   | `/api/contact`                                 | Contact form                                  |
| POST   | `/api/custom-prayers`                          | Custom prayer order intake                    |
| POST   | `/api/free-prayer/unlock`                      | Email-gate the free prayer                    |
| GET    | `/api/prayers`                                 | Catalog (currently seed)                      |
| GET    | `/api/categories`                              | Categories (currently seed)                   |
| GET    | `/api/admin/dashboard`                         | Submission counts                             |
| GET    | `/api/uploaded-prayers`                        | List admin-uploaded MP3 prayers (audio URLs gated per user) |
| POST   | `/api/uploaded-prayers`                        | Admin MP3 upload (multipart/form-data)        |
| DELETE | `/api/uploaded-prayers/:id`                    | Delete an uploaded prayer                     |
| GET    | `/api/uploaded-prayers/:id/access`             | Per-user access status (auth/subscription/purchase) |
| GET    | `/api/uploaded-prayers/:id/stream`             | **Protected** audio stream (auth + entitlement required) |
| GET    | `/api/uploaded-prayers/:id/download`           | **Protected** MP3 download (auth + entitlement required) |
| GET    | `/api/uploaded-prayers/:id/pdf/download`       | **Protected** companion PDF download (same entitlement gate) |
| POST   | `/api/uploaded-prayers/:id/create-checkout-session` | Start a $7 Stripe Checkout for this prayer |
| GET    | `/api/me/purchases`                            | List the signed-in user's prayer purchases + subscription |
| POST   | `/api/create-subscription-checkout-session`    | Start a $27/month Stripe Checkout subscription|
| POST   | `/api/stripe/webhook`                          | Stripe webhook (signature-verified)           |
| POST   | `/api/auth/register`                           | Create an account (email + password) and start a session |
| POST   | `/api/auth/login`                              | Log in with email + password — sets `hsp_sid` httpOnly cookie |
| GET    | `/api/auth/me`                                 | Current logged-in user (or `null`)            |
| POST   | `/api/auth/logout`                             | Clear session cookie                          |
| POST   | `/api/admin/auth/login`                        | Admin sign-in (username + password) — sets `hsp_admin_sid` httpOnly cookie |
| GET    | `/api/admin/auth/me`                           | Current admin (or `null`)                     |
| POST   | `/api/admin/auth/logout`                       | Clear admin session cookie                    |
| GET    | `/api/me/prayers`                              | List the signed-in user's saved prayers       |
| POST   | `/api/me/prayers`                              | Save (or upsert) a prayer to the account      |
| PATCH  | `/api/me/prayers/:id`                          | Update rating / feedback                      |
| POST   | `/api/me/prayers/:id/download`                 | Record a download event                       |
| DELETE | `/api/me/prayers/:id`                          | Remove a saved prayer                         |

### Sign-in setup

Authentication is **email + password**, no third-party providers. On
`POST /api/auth/register` the server validates the email/password (min. 6
characters), salts and hashes the password with Node's built-in `scrypt`,
inserts a row in the `users` table, and sets an httpOnly session cookie
(`hsp_sid`). `POST /api/auth/login` looks up the user by email, verifies the
hash with `crypto.timingSafeEqual`, and issues the same cookie. There is no
external configuration required to enable sign-in — it works as soon as the
server is running.

The current session store is **in-memory**, so sessions reset whenever the
server process restarts (this is fine for a prototype). The cookie is
`HttpOnly`, `SameSite=Lax`, and is set with `Secure` automatically when the
request arrives over HTTPS (e.g. behind Railway's TLS).

> Demo tip: register with an email starting with `admin` (e.g.
> `admin@local.dev`) to get the admin role and reach `/#/admin` after sign-in.

### Admin upload access

The MP3 upload console at **`/#/admin/uploads`** is gated by a separate
username/password sign-in that is independent from the regular email-account
system. It guards both the upload UI and the underlying `POST` and `DELETE`
endpoints on `/api/uploaded-prayers`.

| Variable         | Required | Purpose                                                                                                           |
| ---------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `ADMIN_USERNAME` | No       | Admin console username. Defaults to `Caleb` (set in `server/admin-auth.ts`) when the env var is not provided.    |
| `ADMIN_PASSWORD` | No       | Admin console password. Defaults to `HeartNoah` for the prototype — override via env var in production.          |

Verification happens server-side; the password is **not** shipped in any
frontend bundle. On successful login the server sets an httpOnly admin cookie
(`hsp_admin_sid`, `SameSite=Lax`, `Secure` on HTTPS) with a 12-hour TTL.
Logging out clears the cookie and invalidates the in-memory admin session.

### Stripe subscription setup

The homepage exposes a "Subscribe Monthly · $27/month" CTA that posts to
`/api/create-subscription-checkout-session`. The server creates a Stripe Checkout
session in `subscription` mode and returns the redirect URL. When a logged-in
user starts the flow we attach `client_reference_id`, `metadata.userId`, and
`subscription_data.metadata.userId` so the webhook can mark the right account
as subscribed.

To enable it, set the following in your environment (Railway → Variables, or a
local `.env` based on `.env.example`):

| Variable                  | Required | Purpose                                                                                          |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `STRIPE_SECRET_KEY`       | Yes      | Stripe server key (`sk_live_...` or `sk_test_...`)                                               |
| `STRIPE_MONTHLY_PRICE_ID` | Optional | Price ID for the $27/month plan. If unset, the server uses inline `price_data` (USD 2700/month). |
| `STRIPE_PRAYER_PRICE_ID`  | Optional | Price ID for the $7 per-prayer purchase. If unset, the server uses inline `price_data` (USD 700).|
| `STRIPE_WEBHOOK_SECRET`   | Yes (prod) | Webhook signing secret. Required in production — the webhook handler fails closed without it. |
| `BASE_URL`                | Optional | Public origin used in `success_url` / `cancel_url`. Falls back to the request Origin/Host.       |

Never commit real secret keys — only `STRIPE_SECRET_KEY` is read from
`process.env`. The endpoint returns `503` with a clear error if it isn't set.

### Paid access to uploaded prayers

Admin-uploaded MP3 prayers are **never** served from a public path. The audio
file lives on disk under the configured uploads directory (`UPLOADS_DIR`, defaults
to `./uploads`) but is only reachable through the protected endpoints above
(`/api/uploaded-prayers/:id/stream` and `…/download`), which require:

1. a valid logged-in user session (`hsp_sid` cookie), AND
2. either an active monthly subscription, OR a recorded one-time purchase of
   that specific prayer (`prayer_purchases` row with `status = 'paid'`).

Admin sessions (`hsp_admin_sid`) also bypass the gate so the upload console
can preview new uploads. Without entitlement the endpoints return `402
Payment required` with `priceCents: 700`.

`GET /api/uploaded-prayers` therefore exposes only metadata (title, category,
description) plus `access`, `purchased`, `subscribed`, and `priceCents`
flags. `audioUrl` and `downloadUrl` are returned only to viewers who already
have access. The Library renders a **Buy for $7** button for everyone else,
which posts to `/api/uploaded-prayers/:id/create-checkout-session` and
forwards the user to Stripe Checkout.

### Companion PDF downloads

Each uploaded prayer can optionally include a downloadable PDF (transcript,
workbook, or printable companion). The admin upload form at `/#/admin/uploads`
exposes an optional **Companion PDF** input (`data-testid="input-upload-pdf"`)
alongside the MP3 input — only `application/pdf` files are accepted server-side
and the PDF is stored on disk under `UPLOADS_DIR` next to the MP3 with a
randomized filename, never exposed by a public path.

`GET /api/uploaded-prayers` includes `hasPdf`, `pdfOriginalName`, `pdfMimeType`,
`pdfSize`, and a `pdfDownloadUrl` (only populated when the viewer has access).
The download endpoint `/api/uploaded-prayers/:id/pdf/download` enforces the
**same entitlement rules as the MP3**: a logged-in session plus one of (a) the
prayer is marked free, (b) an active monthly subscription, (c) a paid
one-time purchase for that specific prayer, or (d) admin session. Anonymous
visitors get `401`; logged-in but unentitled users get `402 Payment required`.

After purchasing through the $7 Stripe Checkout (or for any subscriber/free
prayer), the Prayer Library card and the prayer detail page render a
**Download PDF** button (`data-testid="link-download-pdf-<id>"` and
`link-detail-pdf-download`). The Account portal also surfaces a
**Download PDF** action next to the MP3 download for any saved uploaded prayer
the user has access to (`data-testid="link-account-pdf-download-<id>"`).
When a PDF is attached but the visitor doesn't yet have access, the library
and detail pages show an **Includes PDF** indicator without exposing the URL.

### Stripe webhook setup

In the Stripe Dashboard, create a webhook endpoint pointing at
`https://<your-host>/api/stripe/webhook` and subscribe it to **at minimum**:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy the signing secret (`whsec_...`) into the `STRIPE_WEBHOOK_SECRET` env
variable. The handler verifies the `Stripe-Signature` header against the raw
request body (captured by `express.json`'s `verify` callback) using
HMAC-SHA-256 with a 5-minute timestamp tolerance. In production a missing
secret causes the route to respond `503` and reject the event; in development
a missing secret logs a warning and accepts the event so the dashboard's
**Send test event** button can drive the flow locally.

On `checkout.session.completed` for `mode=payment` we look up
`metadata.uploadedPrayerId` and `metadata.userId` (`client_reference_id` is
honoured as a fallback) and insert/upsert a `prayer_purchases` row with
`status = 'paid'`. For `mode=subscription` we upsert into
`user_subscriptions`. `customer.subscription.{updated,deleted}` flow into the
same table so cancellations revoke library access immediately.

### Stripe promotion codes

Both Stripe Checkout sessions are created with `allow_promotion_codes=true`,
so customers see a **Add promotion code** field in the Stripe-hosted Checkout
page for both:

- the $27/month subscription (`/api/create-subscription-checkout-session`)
- the $7 one-time prayer purchase
  (`/api/uploaded-prayers/:id/create-checkout-session`)

A live Stripe coupon and promotion code are already configured:

| Resource         | Value                                |
| ---------------- | ------------------------------------ |
| Coupon ID        | `XZZ7DYLz`                           |
| Promotion code   | `777` (active, 100% off, forever)    |
| Promotion ID     | `promo_1TURfn0UQQxbBLNItYrq0gEE`     |

Customers can enter `777` at the Stripe Checkout page to subscribe for free.
Manage / rotate the code from **Stripe Dashboard → Products → Coupons**.

---

## Demo Tips

- **Admin upload console:** sign in at `/#/admin/uploads` with the admin
  credentials (default `Caleb` / `HeartNoah`, override via `ADMIN_USERNAME` /
  `ADMIN_PASSWORD`). The Prayer Library and homepage render only what has
  been uploaded — there is no seed data shipped.
- **Free prayers:** the upload form has a *Free prayer* toggle. When enabled,
  any signed-in user can stream and download the prayer without paying or
  subscribing. Logged-out visitors are still asked to sign in — uploaded MP3s
  are never exposed by raw URL.
- **Promotion code 777:** active in Stripe (100% off the monthly
  subscription). Customers enter it at the Stripe Checkout page during
  subscription or one-time purchase.
- **Audio playback:** uses native `<audio>` elements pointed at the
  protected `/api/uploaded-prayers/:id/stream` endpoint — only entitled users
  receive a working URL.

---

## Storage & Persistence

- The template ships with **better-sqlite3 + Drizzle** (`server/storage.ts`, `shared/schema.ts`). Use this for newsletter signups, custom-prayer intake, and order records.
- For Railway, switch to **Postgres** by:
  1. Add a Postgres plugin in Railway → exposes `DATABASE_URL`
  2. Swap Drizzle's `better-sqlite3` driver for `postgres-js` or `node-postgres`
  3. Run `drizzle-kit push` to sync schema

The current `routes.ts` uses an **in-memory store** that resets on restart. That's intentional for a prototype. Move records into Drizzle before going live.

---

## What's Stubbed

| Feature                 | Status                                                              |
| ----------------------- | ------------------------------------------------------------------- |
| Stripe checkout         | Live — Checkout sessions for $7 prayers and $27/mo subs (promo 777) |
| Authentication          | Live — email + password (scrypt-hashed) with in-memory sessions      |
| Audio playback          | Live — native `<audio>` against gated `/api/uploaded-prayers/:id/stream` |
| Email delivery          | Logs to memory; wire Resend/SendGrid in `server/routes.ts`          |
| Auth persistence        | In-memory; reset on refresh (no storage allowed in iframe sandbox)  |
| File downloads          | UI flow only; no S3 signed URLs yet                                 |
| Admin charts data       | Generated from seed (`revenue30d`, `popularCategories`, etc.)       |

---

## Design System

- Palette: Gold `#111111`, Soft Blue `#6B7280`, Deep Navy `#050505`, Warm Cream `#FFFFFF`, Ink `#2D2D2D`
- Typography: **Cormorant Garamond** serif for headings + **Inter** for body
- Dark mode: first-class, toggled via React state seeded from `prefers-color-scheme` (no storage)
- Custom inline SVG logo + navy/gold favicon embedded in `client/index.html`

---

## Legal & Privacy

The site ships with template (not attorney-reviewed) legal pages and a
GDPR/CCPA-flavored privacy hub. All pages live under `client/src/pages/static-pages.tsx`
and render through `<LegalPage>` for `/legal/:section` plus dedicated
top-level routes:

| Route                       | What it serves                                            |
| --------------------------- | --------------------------------------------------------- |
| `/legal`                    | Index linking to every legal sub-page                     |
| `/legal/privacy`, `/privacy`, `/privacy-policy`         | Privacy Policy             |
| `/legal/terms`, `/terms`, `/terms-of-service`           | Terms of Service           |
| `/legal/cookies`, `/cookies`, `/cookie-policy`          | Cookie Policy              |
| `/legal/california`, `/california-privacy`, `/do-not-sell` | California / CCPA notice |
| `/legal/gdpr`, `/gdpr`      | GDPR & data rights                                         |
| `/legal/disclaimer`, `/disclaimer` | Faith & legal disclaimer                            |
| `/legal/refunds`, `/refunds` | Refund Policy                                             |
| `/privacy-choices`, `/your-privacy-choices` | DSAR / cookie preferences hub             |

Each page advertises an effective date of `May 7, 2026` and a contact
address of `support@holyspiritprayers.com`. Update both in
`client/src/pages/static-pages.tsx` (`EFFECTIVE_DATE`, `LEGAL_CONTACT_EMAIL`)
when content changes materially.

### Cookie consent

`client/src/components/brand/CookieConsent.tsx` mounts at the root and:

- Shows a first-visit banner with **Accept all**, **Reject non-essential**,
  and **Manage preferences** actions (data-testids `cookie-banner-accept`,
  `cookie-banner-reject`, `cookie-banner-manage`).
- Opens a Radix dialog with per-category Switches (`cookie-pref-essential`,
  `cookie-pref-analytics`, `cookie-pref-marketing`). Essential is on and
  disabled. Analytics and Marketing default off.
- Persists the decision in a first-party cookie called `hsp_consent`
  (`SameSite=Lax`, `Max-Age` of one year, `Secure` over HTTPS) via
  `client/src/lib/cookie-consent.ts`. Cookie reads/writes are wrapped in
  `try/catch` so a sandboxed environment cannot crash the app — the banner
  simply re-shows on the next visit.
- Exposes `openCookiePreferences()` so the footer **Cookie Settings**
  button and the in-page links on the Cookie Policy / Privacy Choices
  pages can re-open the modal.

The app does **not** load any analytics or marketing scripts today; the
Switch state is recorded for the future.

### DSAR / privacy requests

`/privacy-choices` lets users submit access, deletion, correction,
opt-out-of-sale/share, limit-sensitive-PI, and withdraw-consent requests.
Submissions POST to the existing `/api/contact` endpoint with a
descriptive subject prefix and are appended to the in-memory contact log
(`server/routes.ts` → `memory.contact`). Operationally, an admin still
needs to:

1. Stand up a real ticketing or email destination for `support@holyspiritprayers.com`.
2. Define the verification + fulfillment workflow (the form already
   captures account email + free-text details).
3. Persist requests beyond restart (the in-memory store is intentional
   for the prototype — see *Storage & Persistence* above).

### What still needs to happen externally

- DNS / Railway custom-domain wiring — see *Connect the custom domain*
  above.
- Have the legal copy reviewed by counsel before treating it as binding.
- Wire transactional email delivery so DSAR confirmations are sent.

---

## License

Prototype scaffold for the Holy Spirit Prayers project. Deploy and customize freely.
