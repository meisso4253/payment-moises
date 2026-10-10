# Deploy StudyTrack on Vercel

## 1. Import the GitHub repository

Open https://vercel.com/new, sign in with GitHub, and import **meisso4253/payment-moises**. If the repo is missing, allow Vercel's GitHub app access to it.

- Project name: `studytrack` (choose another available name if needed).
- Framework preset: **Next.js**.
- Root directory: `./` (leave the default).
- Build command: `npm run build` (default).
- Install command: `npm ci` or Vercel's default npm install.
- Output directory: leave the Next.js default; do not enter `dist` or `public`.
- Node.js: **24.x**.

Click **Deploy**. This initial deployment can show the sign-in setup screen while you connect services. Copy the stable production URL displayed by Vercel; use it below, not a changing preview URL.

## 2. Connect database and private receipt storage

### Turso database

Create a Turso database through Vercel **Storage / Marketplace** if available, or at https://app.turso.tech/. Copy its database URL (`libsql://...`) and authentication token into the project's environment settings as **TURSO_DATABASE_URL** and **TURSO_AUTH_TOKEN**. If the integration injects different variable names, add these two names using the provided values.

This SQLite-compatible database holds accounts, sessions, planners, payments, reviews, and premium grants. Credentials stay in Vercel's environment settings, never in GitHub.

### Private Vercel Blob store

In the Vercel project, open **Storage → Create Database / Store → Blob**. Choose **Private** access and connect it to the project and Production environment. A public store will not work with this app.

A connected store provides `BLOB_STORE_ID` and Vercel's managed OIDC credentials, or a `BLOB_READ_WRITE_TOKEN`. The SDK handles the credentials automatically. Receipt URLs are never returned to browsers; the authorized `/api/proof/:id` route serves files only to their customer or administrator.

Check each service's displayed plan and limits before activating it. No service purchase or paid plan is needed merely to import the source; storage/database usage is subject to the selected service plan.

## 3. Set environment variables

Open **Project → Settings → Environment Variables**. Set these for **Production**:

| Name | Value |
| --- | --- |
| `TURSO_DATABASE_URL` | Turso's `libsql://...` database URL |
| `TURSO_AUTH_TOKEN` | Turso database authentication token (Secret) |
| `APP_ORIGIN` | Exact stable production origin, e.g. `https://your-studytrack.vercel.app`; no trailing slash or `/study` |
| `GOOGLE_CLIENT_ID` | Your existing public Google Web application client ID |
| `BETTER_AUTH_SECRET` | Strong random secret, at least 32 characters (Secret); keep stable across redeployments |
| `ADMIN_EMAIL` | The verified Google email allowed to review payments (Secret) |
| `GCASH_NAME` | Receiving GCash account name |
| `GCASH_NUMBER` | Receiving mobile number, `09xxxxxxxxx` |
| `BLOB_STORE_ID` / `BLOB_READ_WRITE_TOKEN` | Usually supplied automatically when connecting the private Blob store; token is a Secret |

Generate a session secret locally, then paste the result directly into Vercel (do not commit it or send it to other people):

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Use separate databases, Blob stores, session secrets, and allowed origins for Preview/Development. Avoid giving preview deployments production payment data. If Preview credentials are left unset, previews build and show the setup screen.

## 4. Configure Google and redeploy

Open **Google Auth Platform → Clients → your existing Web client**. Under **Authorized JavaScript origins**, add the exact stable Vercel production origin from `APP_ORIGIN`, without `/google-sign-in` or `/study`. Keep the old origin while the original app is still in use. This button-based ID-token flow does not require a redirect URI or OAuth client secret.

For all students to use the app, follow Google's **Audience** settings and production requirements. See [GOOGLE-SETUP.md](GOOGLE-SETUP.md).

In Vercel **Deployments**, redeploy the latest production deployment after saving variables. The build applies the three schema migrations once before compiling Next.js. A failed migration fails the build. A blank database is initialized; existing records are never seeded, deleted, or overwritten by the migration runner.

## 5. Check the published app

1. Visit `/study`, sign in with Google, and save a subject/task. Reload to check persistence.
2. Sign in using the configured admin email. **Payments** should appear; a normal customer must not see that panel.
3. Check that the Premium page displays the intended recipient and **PHP 49 / 120 days**.
4. For an actual payment, submit its PNG/JPEG proof (2 MB maximum). Confirm another account cannot open the customer's proof.
5. Verify the transaction in the receiving GCash account before approving it. Pending/rejected submissions do not grant premium.
6. Export a semester evidence ZIP from Payments and inspect the customer name, proof file, and amount tabulation.

Do not approve fabricated receipts in production to test premium. Automated checks already cover approval, rejection, renewal, and duplicate prevention using disposable fixtures.

## Existing data and branding

The old Sites database and receipt files are separate from the new Turso/Blob stores. Importing GitHub does not transfer users, planners, payments, or premium access. Preserve the old app until any required migration is completed with backups. Do not import customer records or receipt images into a public repository.

A Vercel URL changes the browser address. Google's sign-in UI follows Google's branding and domain rules; naming the Vercel project or OAuth client `StudyTrack` alone does not guarantee the popup displays that name. See [GOOGLE-SETUP.md](GOOGLE-SETUP.md).

Official references: [Vercel GitHub integration](https://vercel.com/docs/git/vercel-for-github), [private Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk), [Turso TypeScript SDK](https://docs.turso.tech/sdk/ts/reference).
