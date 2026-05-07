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
| `STRIPE_SECRET_KEY`       | Stripe server key (`sk_live_...` or `sk_test_...`)      | Future                 |
| `STRIPE_WEBHOOK_SECRET`   | Webhook signing secret for `/api/stripe/webhook`        | Future                 |
| `STRIPE_PUBLISHABLE_KEY`  | Stripe public key (frontend, prefix `VITE_`)            | Future                 |
| `GOOGLE_CLIENT_ID`        | OAuth client ID for Google sign-in                      | Future                 |
| `GOOGLE_CLIENT_SECRET`    | OAuth client secret                                     | Future                 |
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
`/#/custom-prayer`, `/#/custom-prayer/success`, `/#/free-prayer`, `/#/dashboard`

Auth: `/#/login`, `/#/register`, `/#/forgot-password`, `/#/reset-password`

Static: `/#/about`, `/#/contact`, `/#/legal`

Admin: `/#/admin`, `/#/admin/prayers`, `/#/admin/categories`,
`/#/admin/custom-requests`, `/#/admin/orders`, `/#/admin/users`,
`/#/admin/analytics`, `/#/admin/settings`

### API endpoints

| Method | Path                       | Purpose                      |
| ------ | -------------------------- | ---------------------------- |
| GET    | `/api/health`              | Liveness check               |
| POST   | `/api/email/signup`        | Newsletter signup            |
| POST   | `/api/contact`             | Contact form                 |
| POST   | `/api/custom-prayers`      | Custom prayer order intake   |
| POST   | `/api/free-prayer/unlock`  | Email-gate the free prayer   |
| GET    | `/api/prayers`             | Catalog (currently seed)     |
| GET    | `/api/categories`          | Categories (currently seed)  |
| GET    | `/api/admin/dashboard`     | Submission counts            |
| POST   | `/api/stripe/webhook`      | Stripe webhook stub          |

---

## Demo Tips

- **Admin access:** sign up with any email containing `admin` (e.g. `admin@local.dev`). The `AuthProvider` promotes that account to the admin role.
- **Free prayer:** the slug `morning-surrender-let-the-spirit-lead` is the seeded free prayer. Email-gated unlock simulates download.
- **Audio player:** simulated playback timer (no real audio file shipped). Wire to an `<audio>` element + S3 signed URLs when ready.
- **Purchases:** the "Purchase" button on a prayer detail mock-completes the order. Replace with Stripe Checkout in `client/src/pages/prayer-detail.tsx` and the corresponding server route.

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
| Stripe checkout         | Stub — purchase button mocks completion                             |
| Google OAuth            | Stub — button shows alert                                           |
| Audio playback          | Simulated 1-Hz progress timer                                       |
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
