# StudyTrack

Student planner with Google accounts, **PHP 49 premium access for 120 days**, manual GCash receipt review, and semester transaction reports.

**This repository is now a standard Next.js app ready to import into Vercel.** The Cloudflare runtime has been replaced with Turso (SQLite database) and private Vercel Blob receipt storage. Follow [VERCEL-SETUP.md](VERCEL-SETUP.md) to connect the services and enable sign-in/payments.

## Deploy

1. In [Vercel](https://vercel.com/new), import `meisso4253/payment-moises`. Use **Next.js**, root directory `./`, and the default build command `npm run build`.
2. Connect a **Turso database** and a **private Vercel Blob store**. Add the environment variables listed in [VERCEL-SETUP.md](VERCEL-SETUP.md).
3. Add the deployment's exact production origin to your existing Google client's **Authorized JavaScript origins**. Set `APP_ORIGIN` to that same origin.
4. Redeploy. Sign in with your configured administrator Google account to review payments and export semester evidence.

The first build can succeed without credentials, showing a setup/sign-in screen. Accounts require database/auth configuration, and GCash collection stays disabled until the private storage and receiving-account settings are present. Builds apply pending schema migrations automatically when the database is configured.

## Features

- Public landing page at `/` with planner preview, feature overview, and pricing.
- Light/dark appearance switch across the landing page, planner, sign-in, and privacy notice. Follows the system initially and remembers your choice locally.
- Subjects, deadlines, tasks, weekly study blocks, and cloud planner saves across devices.
- Google Identity Services with server-verified tokens and signed database sessions.
- PNG/JPEG transaction proof, customer name, date, and unique reference number.
- Admin-only receipt approval/rejection, premium grants, and payment history.
- Premium focus timer, subject insights, and progress CSV.
- Semester ZIP containing customer/amount tabulation and matching approved receipt images.

GCash transfers are manually checked against the receiving account. This is not an automatic payment gateway. Each approved payment grants 120 days; renewals extend existing access. Payment amounts are fixed on the server.

## Local development

Use Node 22.13+ (Node 24 recommended). Copy `.env.example` to the ignored `.env.local`, supply development service credentials, then run:

```sh
npm ci
npm run db:migrate
npm run dev
```

Use a separate development database and Blob store. Register `http://localhost:3000` in Google's allowed origins if testing real Google sign-in locally.

```sh
npm test
npm run build
npm run typecheck
```

Tests use a disposable local SQLite database, signed fixture sessions, and an in-memory receipt store. They never send GCash payments or write to production services. A real Google login and private Blob upload should be checked after configuring Vercel.

## Source and maintenance

The supplied planner is preserved at `lib/planner-original.html`. Update `lib/premium-ui.js` / `lib/premium.css`, then run `python scripts/prepare-planner.py` to regenerate the planner. Builds bundle the generated HTML using Node, so Vercel does not require Python. Database migrations are versioned under `drizzle/` and applied once using an atomic migration ledger.

See [OPERATIONS.md](OPERATIONS.md) for payment review and reporting, and [GOOGLE-SETUP.md](GOOGLE-SETUP.md) for Google branding.

Existing accounts, payment data, and receipts on the previous Sites deployment are **not copied by importing this repository**. Keep that app available until any required data has been separately exported and migrated. The repository contains source and schema migrations only.
