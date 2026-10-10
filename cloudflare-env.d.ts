declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    GOOGLE_CLIENT_ID?: string;
    BETTER_AUTH_SECRET?: string;
    APP_ORIGIN?: string;
  }
}
