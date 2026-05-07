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
file lives on disk in `uploads/` but is only reachable through the protected
endpoints above (`/api/uploaded-prayers/:id/stream` and `…/download`), which
require:

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

## License

Prototype scaffold for the Holy Spirit Prayers project. Deploy and customize freely.
