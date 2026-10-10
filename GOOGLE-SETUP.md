# Google sign-in for StudyTrack

StudyTrack uses the official Google Identity Services button and Better Auth. The server verifies the Google ID token, then creates a signed HttpOnly database session. No Google password or OAuth client secret is needed for this integration.

## Register the Vercel origin

1. Open [Google Auth Platform](https://console.cloud.google.com/auth/overview), select your StudyTrack project, then open **Clients**.
2. Open your existing **Web application** client; a new client ID is not necessary.
3. Under **Authorized JavaScript origins**, add your stable production origin, e.g. `https://your-studytrack.vercel.app`. Use the exact origin in Vercel's `APP_ORIGIN`, with no page path or trailing slash.
4. Save. Keep the old site's origin while that app is still in use. Google settings can take time to propagate.
5. In Vercel set `GOOGLE_CLIENT_ID` to the public client ID ending in `.apps.googleusercontent.com` and redeploy. Configure the database and session secret as documented in [VERCEL-SETUP.md](VERCEL-SETUP.md).

Only basic identity is requested (name, email, Google account identifier). No Gmail/Drive scopes are used. In **Audience**, follow Google's production requirements to allow student Google accounts. If a testing restriction applies, add test users while testing.

## Displaying StudyTrack in Google's popup

In **Branding**, set the app name to **StudyTrack**, add support/contact details, homepage and privacy URL (`YOUR_PRODUCTION_ORIGIN/privacy`), and complete any domain/branding verification Google requires. Publish the approved branding. Google may still show the actual website domain in parts of its sign-in interface, including FedCM UI.

Changing Authorized JavaScript origins controls which websites can use a client; it does not rename the consent screen. A new OAuth client ID also does not automatically change the displayed domain. An owned custom domain can provide a StudyTrack address, but must be purchased/owned and configured separately if desired.

## Security and existing accounts

Every protected endpoint requires a valid database session, verified email, and Google provider account. Hosting identity headers do not authenticate users on Vercel. The configured admin email is compared on the server. Email/password registration and unrelated authentication endpoints are disabled.

Old planner/payment identity links can be preserved when migrating records into Turso. A unique verified Gmail match can link to a previous account key; ambiguous matches are never merged automatically. The deployment does not itself migrate the old Sites database or receipt storage.

Official guidance: [Google client/origin setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [Google branding](https://support.google.com/cloud/answer/15549049?hl=en), [Better Auth Google button](https://better-auth.com/docs/plugins/one-tap).
