// The Worker's globals (D1Database, ExportedHandler, workerd's crypto and URL
// extensions) travel with this file, so any package that imports AppType for
// the typed client resolves them without its own tsconfig entry.
/// <reference types="@cloudflare/workers-types" />

export type Env = {
  DB: D1Database;
  TOKEN_KEY: string;
  CLERK_SECRET_KEY: string;
  CLERK_WEBHOOK_SIGNING_SECRET: string;
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
  STRAVA_WEBHOOK_VERIFY_TOKEN: string;
  REVENUECAT_SECRET_API_KEY: string;
  REVENUECAT_WEBHOOK_AUTH: string;
  WEB_APP_URL: string;
  PREVIEW_ORIGIN_SUFFIX?: string;
  POSTHOG_PROJECT_TOKEN?: string;
  POSTHOG_HOST?: string;
};
