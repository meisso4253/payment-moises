# StudyTrack

Student planner with shared accounts, GCash premium access (PHP 49 for 120 days), and semester transaction evidence exports. The original supplied HTML planner is retained in `lib/planner-original.html`; its updated interface is served at `/study`.

## Using the app

1. Open the published link and sign in with Google once Google authentication is configured. Free users can manage subjects, tasks, deadlines, and study blocks and save their planner across devices.
2. Open **Premium**, send PHP 49 to the displayed GCash recipient in the GCash app, and submit a PNG/JPEG receipt, reference, full customer name, and payment date. This is a manual transfer, not a payment gateway or automatic debit.
3. The configured administrator signs in, opens **Payments**, checks the receipt against the receiving GCash account, and approves or rejects it with a review note.
4. Approval starts 120 days of premium access. Renewals extend from the later of the current expiry or approval time. Rejection grants no access. Each payment can grant access once.
5. Premium adds an adjustable focus timer, subject workload/completion insights, and a progress CSV export. The timer works while the page is open.
6. For semester submission, open **Payments**, set the payment date range, and download **Report + proof files (.zip)**. Unzip the entire folder, open `Semester-report.html`, and print/save it if needed. The package also includes `Tabulation.csv` and all matching receipt image files. Only approved payments within the date range count; the search and status filter do not change exports.

## Access and storage

Google sign-in uses Google Identity Services and Better Auth. The server verifies Google's signed identity token for the configured client ID, then stores a database session in a signed HttpOnly cookie. The Google provider subject owns the provider account. Every protected API checks the session and verified email; administrative routes compare the authenticated email with `ADMIN_EMAIL`. Browser state cannot grant premium or administrator access. Only Google sign-in is exposed; email/password registration and other authentication endpoints are disabled.

Only Google sessions authenticate customers. Missing configuration shows the setup screen; there is no hosting-header fallback. See `GOOGLE-SETUP.md` for allowed origins and branding. Existing account records need separate migration from the old hosting database.

Turso stores planners, accounts, payments, reviews, and premium grants. Private Vercel Blob stores receipt files behind an authorized API route. Planner import/reset cannot erase payment evidence or grant access.

Amounts are fixed server-side at 4900 centavos, access at 120 days, and references are normalized and unique. A partial unique index allows only one pending payment per customer. Approval and the grant use an atomic Turso write transaction. Planner writes use version checks to prevent overwriting changes from another window. Payment dates and reports use Asia/Manila; planner wall-clock dates follow the device timezone.

## Configuration and maintenance

Follow [VERCEL-SETUP.md](VERCEL-SETUP.md). Environment variables belong in Vercel or the ignored `.env.local`; do not commit credentials. Collection requires the receiving-account settings, admin email, and private Blob credentials. Accounts require database and Google auth configuration.

Run `python scripts/prepare-planner.py` after changing the premium UI or CSS. This regenerates the planner and server validator. `npm run build` bundles the HTML, applies unapplied schema migrations when configured, and compiles Next.js. Append schema changes with `npm run db:generate`; never edit an already-applied migration.

## Verification

`npm test` uses a disposable SQLite database, signed local Google-session fixtures, and in-memory receipt storage. Checks include customer/admin isolation, receipt ownership, fixed amounts, duplicate references, concurrent approval, rejection, renewal, planner conflicts, transaction rollback, forged tokens, and sign-out. No real GCash transfer is made, and no production storage is accessed. Test a real Google sign-in and private Blob upload after owner configuration.
