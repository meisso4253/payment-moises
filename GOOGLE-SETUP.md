# Activate Google sign-in for StudyTrack

The integration is prepared. One app-specific Google client ID is still required. No Google password or OAuth client secret is needed for the Sign in with Google button used here.

1. Open [Google Cloud Console](https://console.cloud.google.com/) in your browser and sign in with the Google account that should manage StudyTrack.
2. Create a project named **StudyTrack** (or select an existing project you own).
3. Open **Google Auth Platform → Branding** and complete the app setup: app name **StudyTrack**, your support/contact email, and audience **External**. The project uses only basic Google identity (name, email, account identifier), not Gmail or Drive access. If Google asks for the privacy notice URL, use `https://studytrack-premium-emman.theostenmatrix.chatgpt.site/privacy`.
4. Open **Clients → Create client**. Select **Web application**, name it **StudyTrack Web**, and add this exact **Authorized JavaScript origin**:

   ```text
   https://studytrack-premium-emman.theostenmatrix.chatgpt.site
   ```

   Do not add `/study`, a hash, or a trailing slash. This popup button uses a server-verified ID token, so an authorized redirect URI is not required for this integration.
5. Create the client and copy its **Client ID**, ending in `.apps.googleusercontent.com`. Send that public client ID in this chat so it can be configured securely as `GOOGLE_CLIENT_ID` in the app’s runtime.
6. If the Google project remains in **Testing**, add your Gmail address and your student testers under **Audience → Test users**. For use by all students, publish the Google app to **In production**, following any requirements Google shows for your project. Do not request additional scopes.

Google setup instructions: [Get a Google API client ID](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [Better Auth Google button integration](https://better-auth.com/docs/plugins/one-tap).

## Activation and existing records

The runtime already has the authentication session secret and the fixed app origin. After setting `GOOGLE_CLIENT_ID`, deploy the prepared version so the new value applies. The main sign-in button then switches to Google automatically, and protected app endpoints accept verified Google sessions rather than ChatGPT-only identity headers.

Before activation, existing customers with planner-only records should sign in once using the current app so their old account ID/email mapping is recorded by this version. Google Gmail users with one matching old account or payment identity retain that account’s existing planner, receipt, and premium record keys. Ambiguous identities are never merged automatically. Existing payments and receipt files are not overwritten or recreated by switching authentication.

For local testing, use an ignored `.dev.vars` file and register the exact loopback origin if testing with a real Google client. Do not commit runtime secrets, production Google tokens, or session cookies.
