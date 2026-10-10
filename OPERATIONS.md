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

While `GOOGLE_CLIENT_ID` is missing, the original Sites ChatGPT sign-in remains available and records legacy user/email mappings. Once Google is configured, ChatGPT-only identity headers no longer authenticate the app. See `GOOGLE-SETUP.md` for the one-time owner setup and safe account migration. Receipt keys, grants, and planner rows stay unchanged; identity links point the Google user at their previous records when there is an unambiguous verified Gmail match.

D1 stores planners, payments, reviews, and premium grants. R2 stores receipt files behind an authorized API route. Receipt image URLs are not public assets. Planner import/reset cannot erase payment evidence or grant access.

Amounts are fixed server-side at 4900 centavos, access at 120 days, and references are normalized and unique. A partial unique index allows only one pending payment per customer. Approval and the grant use an atomic D1 batch. Planner writes use version checks to prevent overwriting changes from another window. Payment dates and reports use Asia/Manila; planner wall-clock dates follow the device timezone.

## Configuration

Runtime environment values are configured in Sites, separately from source:

- `ADMIN_EMAIL`: verified Google sign-in email allowed to review and export payments.
- `GCASH_NAME`: displayed recipient name.
- `GCASH_NUMBER`: Philippine mobile number in the format `09xxxxxxxxx`.
- `GOOGLE_CLIENT_ID`: public Google Web application client ID, with the published site registered as an authorized JavaScript origin.
- `BETTER_AUTH_SECRET`: secret used to sign app session cookies. Keep stable across deployments; rotating it signs users out.
- `APP_ORIGIN`: exact published site origin used for auth URLs and trusted origins.

Collection stays disabled unless all three are configured. Never put an admin email allowlist or secrets into the browser bundle. `ADMIN_EMAIL` is stored as a secret runtime value.

For local development, copy the key names into an ignored `.dev.vars` file. The starter's portable dev preview signs in as `seedy@sites.test`; use that as the **local-only** admin value. Production uses Google sign-in when configured and the verified Google administrator email. Local D1/R2 data is never included in deployment.

## Maintenance

Run `python scripts/prepare-planner.py` after changing `lib/premium-ui.js` or `lib/premium.css`. This generates `lib/planner.html` and the server planner validator from the retained original. Run `npm run db:generate` after schema changes, append migrations, and build with the Sites build helper. See the installed Sites skill for publication and source synchronization.

The `scripts/integration-check.mjs` check uses disposable local data and simulated identity headers against `http://127.0.0.1:8787`. It must never target production. It verifies account isolation, receipt storage, duplicate protection, approval, rejection, renewal, fixed amounts, premium authorization, and planner conflict checks.

## Verification

The initial version passed 29 API integration checks, JavaScript syntax and TypeScript checks, a production build, a browser receipt-submission/review walkthrough, and an evidence ZIP validation checking receipt paths, totals, and rejection exclusion. No real GCash transaction was performed by these checks.
