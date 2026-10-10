# StudyTrack

Student planner with Google accounts, optional **PHP 49 premium access for 120 days**, manual GCash payment review, and semester transaction reports.

## Features

- Subjects, tasks, deadlines, weekly study blocks, and a planner saved across devices.
- Google sign-in with server-verified identity tokens and signed database sessions.
- GCash receipt submission with customer name, transaction reference, date, and proof image.
- Protected administrator panel to approve or reject payments.
- Premium focus timer, subject insights, and progress export.
- Semester evidence ZIP containing the customer/amount tabulation and approved transaction proofs.

GCash payments are manual transfers reviewed by the administrator. This is not an automatic payment gateway.

## Deployment status

**This source currently targets Cloudflare Workers through the Sites/Vinext starter. It is not yet a Vercel-compatible Next.js project.** Importing this repository into Vercel alone will not move the existing accounts, payment records, or receipt storage.

Before deploying to Vercel:

1. Convert the build and server runtime to a Vercel-supported framework/runtime.
2. Replace the Cloudflare D1 bindings with a compatible database and adapt the queries, migrations, and atomic payment approvals.
3. Replace the R2 receipt binding with private file storage, preserving customer/admin authorization.
4. Configure the environment variables below in the deployment dashboard.
5. Register the new production origin in the existing Google OAuth client's Authorized JavaScript origins.
6. Migrate existing database records and receipt files separately if they are needed. This repository contains source and schema migrations only.

A Vercel domain does not by itself change Google's consent-screen name. Configure StudyTrack in Google Auth Platform Branding, complete Google's verification requirements, and publish the approved branding.

## Runtime configuration

| Variable | Purpose |
| --- | --- |
| `APP_ORIGIN` | Exact production origin, including `https://`, without a path. |
| `GOOGLE_CLIENT_ID` | Google Web application OAuth client ID. |
| `BETTER_AUTH_SECRET` | Strong random session-signing secret; keep it stable and private. |
| `ADMIN_EMAIL` | Verified Google email allowed to review payments and export reports. |
| `GCASH_NAME` | Receiving GCash account name. |
| `GCASH_NUMBER` | Receiving Philippine mobile number. |

The current Cloudflare runtime also requires a D1 binding named `DB` and an R2 binding named `BUCKET`. Apply all migrations in `drizzle/` to the database before running the app. The checked-in hosting file contains binding declarations, with no existing Site identity or production credentials.

Store real configuration in ignored local `.dev.vars` files or the hosting platform's environment settings. Never commit secrets, session cookies, real receipts, or database dumps. A placeholder local configuration is provided in `.dev.vars.example`.

## Source layout

- `lib/planner-original.html`: retained original planner.
- `lib/premium-ui.js` and `lib/premium.css`: account, payment, and premium interface.
- `lib/planner.html`: generated planner served at `/study`.
- `app/api/`: authenticated planner, receipt, payment review, and Google sign-in routes.
- `lib/auth.ts` and `lib/study-user.ts`: sessions and identity mapping.
- `db/` and `drizzle/`: database schema and migrations.
- `scripts/prepare-planner.py`: regenerates the planner and server validator after UI changes.

See [OPERATIONS.md](OPERATIONS.md) for payment review and reporting, and [GOOGLE-SETUP.md](GOOGLE-SETUP.md) for Google setup. Those documents also describe the original Sites hosting workflow.

## Development

Use Node.js 22.13 or later. Install dependencies with `npm ci`. The current preview uses `npm run dev` and Cloudflare's local bindings. Check TypeScript with `npx tsc --noEmit`.

The local API check scripts use disposable test fixtures and must never target production. Successful local checks do not represent real GCash transactions or a completed Google login.
