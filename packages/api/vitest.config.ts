import path from "node:path";
import { defineWorkersConfig, readD1Migrations } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations(path.join(__dirname, "migrations"));
  return {
    test: {
      setupFiles: ["./test/apply-migrations.ts"],
      testTimeout: 20_000,
      // The connector's SDK imports ajv, whose CommonJS build requires JSON files the
      // Workers pool cannot load until Vite has bundled it.
      deps: {
        optimizer: {
          ssr: {
            enabled: true,
            include: ["@modelcontextprotocol/sdk > ajv", "@modelcontextprotocol/sdk > ajv-formats"],
          },
        },
      },
      poolOptions: {
        workers: {
          singleWorker: true,
          wrangler: { configPath: "./wrangler.jsonc" },
          miniflare: {
            bindings: {
              TEST_MIGRATIONS: migrations,
              TOKEN_KEY: "VGhpcyBpcyBhIDMyLWJ5dGUgdGVzdCBrZXkhISEhISE=",
              CLERK_SECRET_KEY: "test-clerk-secret",
              CLERK_PUBLISHABLE_KEY: "pk_test_Y2xlcmsuc2VuZHRhbGx5LnRlc3Qk",
              STRAVA_CLIENT_ID: "12345",
              STRAVA_CLIENT_SECRET: "test-strava-secret",
              STRAVA_WEBHOOK_VERIFY_TOKEN: "test-verify-token",
              REVENUECAT_SECRET_API_KEY: "test-revenuecat-secret",
              REVENUECAT_WEBHOOK_AUTH: "test-revenuecat-webhook-auth",
              WEB_APP_URL: "https://sendtally.test",
              PREVIEW_ORIGIN_SUFFIX: "-sendtally-web-staging.workers.test",
            },
          },
        },
      },
    },
  };
});
