import { zValidator } from "@hono/zod-validator";
import { type Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { z } from "zod";
import { auth } from "./auth";
import type { Env } from "./bindings";
import { purgeAccount } from "./lib/account";
import { applyProjectFlags, climbCatalogue } from "./lib/climbs";
import { decryptSecret, encryptSecret } from "./lib/crypto";
import { mirrorStoreEntitlements, resolveEntitlements } from "./lib/entitlements";
import {
  buildManualSession,
  historySession,
  manualSessionBody,
  normalisedNote,
  parseClimbs,
  sessionNotesBody,
} from "./lib/manual";
import { captureUserEvent, getPostHog, identifyUser } from "./lib/posthog";
import { syncSessionToStrava } from "./lib/posting";
import * as repo from "./lib/repo";
import { RevenueCatClient, webhookBody, webhookUserIds } from "./lib/revenuecat";
import { authorizeUrl, exchangeAuthCode, StravaUnauthorizedError } from "./lib/strava";
import { sessionTagsBody } from "./lib/tags";

type Vars = { userId: string; hasFeature: (feature: string) => boolean };

type AppEnv = { Bindings: Env; Variables: Vars };

const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;

// workerd's constant-time compare. lib.dom does not declare it, and the apps
// typecheck this file for the client's response types, so it is narrowed here
// rather than declared globally.
const timingSafeEqual = (a: ArrayBufferView, b: ArrayBufferView): boolean =>
  (
    crypto.subtle as unknown as { timingSafeEqual(x: ArrayBufferView, y: ArrayBufferView): boolean }
  ).timingSafeEqual(a, b);

function sameSecret(presented: string | undefined, expected: string): boolean {
  if (presented === undefined || expected === "") return false;
  const a = new TextEncoder().encode(presented);
  const b = new TextEncoder().encode(expected);
  return a.byteLength === b.byteLength && timingSafeEqual(a, b);
}

const revenuecat = (env: Env): RevenueCatClient =>
  new RevenueCatClient(env.REVENUECAT_SECRET_API_KEY);

// Without a distinct id posthog-node invents a random one per call, so every
// event lands on its own anonymous person. The signed-in user id is the same
// key the browser identifies with, which is what joins the two streams.
const captureEvent = async (
  c: Context<AppEnv>,
  event: string,
  properties: Record<string, string | boolean> = {},
  distinctId: string | undefined = c.get("userId")
): Promise<void> => {
  if (distinctId === undefined) return;
  await captureUserEvent(c.env, distinctId, event, properties);
};

const manualScoringHistory = async (
  db: D1Database,
  userId: string,
  excludeFingerprint?: string
) => {
  const rows = await repo.listSessions(db, userId, 200, true);
  return rows
    .filter((r) => r.fingerprint !== excludeFingerprint)
    .map(historySession)
    .filter((s): s is NonNullable<typeof s> => s !== null);
};

// Posting is two Strava calls plus a possible token refresh, so it runs after the
// response rather than making the user wait for it. Failures land in post_state,
// which the retry endpoint reads.
const postAfterResponse = (c: Context<AppEnv>, userId: string, fingerprint: string): void => {
  let ctx: Context<AppEnv>["executionCtx"];
  try {
    ctx = c.executionCtx;
  } catch {
    // No execution context means no background work: never start a promise that
    // would outlive the request and write after it.
    return;
  }
  ctx.waitUntil(
    syncSessionToStrava(c.env, userId, fingerprint).then(
      (result) => {
        if (result.outcome === "failed") {
          console.error(`strava post failed for ${fingerprint}: ${result.reason}`);
        }
      },
      (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`strava post threw for ${fingerprint}: ${message}`);
      }
    )
  );
};

const sessionResponse = async (env: Env, userId: string, fingerprint: string) => {
  const row = await repo.getSession(env.DB, userId, fingerprint);
  if (row === null) return null;
  const { climbs_json, ...rest } = row;
  return {
    ...rest,
    tags: await repo.getSessionTags(env.DB, userId, fingerprint),
    climbs: parseClimbs(climbs_json),
  };
};

// Every validated body answers the same way, so the shape a client sees for a
// rejected request does not depend on which endpoint rejected it.
const invalidBody: Parameters<typeof zValidator>[2] = (result, c) =>
  result.success ? undefined : c.json({ error: "invalid request body" }, 400);

const stravaPostingBody = z.object({
  enabled: z.boolean(),
  since: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
});

const app = new Hono<AppEnv>()
  .get("/health", (c) => c.json({ ok: true }))

  .get("/webhooks/strava", (c) => {
    if (c.req.query("hub.verify_token") !== c.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
      return c.json({ error: "bad verify token" }, 403);
    }
    return c.json({ "hub.challenge": c.req.query("hub.challenge") ?? "" });
  })

  .post("/webhooks/strava", async (c) => {
    const event = (await c.req.json()) as {
      object_type?: string;
      object_id?: number;
      aspect_type?: string;
      updates?: Record<string, string>;
    };
    if (
      event.object_type === "athlete" &&
      event.aspect_type === "update" &&
      event.updates?.["authorized"] === "false" &&
      typeof event.object_id === "number"
    ) {
      await repo.markStravaConnectionDeadByAthlete(c.env.DB, event.object_id);
    }
    return c.json({ ok: true });
  })

  .post("/webhooks/clerk", async (c) => {
    let event;
    try {
      event = await auth.verifyWebhook(c.req.raw, c.env);
    } catch (err) {
      console.error(`clerk webhook rejected: ${err instanceof Error ? err.message : String(err)}`);
      return c.json({ error: "bad signature" }, 400);
    }
    // Covers deletions we did not initiate - Clerk's account portal and the
    // Clerk dashboard both land here, and they would otherwise orphan the
    // user's D1 rows and leave their Strava grant live.
    if (event.type === "user.deleted" && event.userId !== null) {
      await purgeAccount(c.env, event.userId);
    }
    // Clerk owns account creation on both web and mobile, so its webhook is the
    // one place that sees every signup exactly once, with the email attached.
    if (event.type === "user.created" && event.userId !== null) {
      if (event.email !== null) {
        await identifyUser(c.env, event.userId, { email: event.email });
      }
      await captureEvent(c, "account_created", {}, event.userId);
    }
    return c.json({ ok: true });
  })

  // Every event re-reads the subscriber from RevenueCat instead of trusting
  // the event body, so retries and out-of-order delivery converge on the same
  // rows. A failed mirror returns 500 on purpose: RevenueCat retries those.
  // Parsed by hand rather than through zValidator: nothing types this route, and
  // zValidator would start requiring a JSON Content-Type from a third party whose
  // headers we do not control. The secret is still checked before the body is read.
  .post("/webhooks/revenuecat", async (c) => {
    if (!sameSecret(c.req.header("Authorization"), c.env.REVENUECAT_WEBHOOK_AUTH)) {
      return c.json({ error: "unauthorized" }, 401);
    }
    const parsed = webhookBody.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid request body" }, 400);
    for (const userId of webhookUserIds(parsed.data.event)) {
      await mirrorStoreEntitlements(c.env, revenuecat(c.env), userId);
    }
    return c.json({ ok: true });
  })

  .get("/connect/strava/callback", async (c) => {
    const code = c.req.query("code");
    const stateRaw = c.req.query("state");
    if (code === undefined || stateRaw === undefined) {
      return c.json({ error: "missing code or state" }, 400);
    }
    let state: { userId: string; nonce: string; exp: number };
    try {
      state = JSON.parse(await decryptSecret(stateRaw, c.env.TOKEN_KEY)) as typeof state;
    } catch {
      return c.json({ error: "bad state" }, 400);
    }
    if (Date.now() > state.exp) return c.json({ error: "state expired" }, 400);
    c.set("userId", state.userId);
    // Soft browser binding: the web flow carries the nonce cookie and must match;
    // the mobile flow authorizes in the system browser, which never saw the cookie.
    const cookieNonce = getCookie(c, "st_oauth");
    if (cookieNonce !== undefined && cookieNonce !== state.nonce) {
      return c.json({ error: "bad state" }, 400);
    }
    deleteCookie(c, "st_oauth", { path: "/connect/strava" });

    let exchanged;
    try {
      exchanged = await exchangeAuthCode(
        { clientId: c.env.STRAVA_CLIENT_ID, clientSecret: c.env.STRAVA_CLIENT_SECRET },
        code
      );
    } catch (err) {
      if (err instanceof StravaUnauthorizedError) {
        return c.json({ error: "strava rejected the authorization code" }, 422);
      }
      throw err;
    }
    await repo.ensureUser(c.env.DB, state.userId);
    await repo.upsertStravaConnection(c.env.DB, {
      user_id: state.userId,
      athlete_id: exchanged.athleteId,
      access_token_ciphertext: await encryptSecret(exchanged.tokens.accessToken, c.env.TOKEN_KEY),
      refresh_token_ciphertext: await encryptSecret(exchanged.tokens.refreshToken, c.env.TOKEN_KEY),
      expires_at: exchanged.tokens.expiresAt,
    });
    await captureEvent(c, "strava_connection_completed", {}, state.userId);
    return c.redirect(`${c.env.WEB_APP_URL}/connected/strava`);
  })

  .use("/v1/*", (c, next) =>
    cors({
      origin: c.env.WEB_APP_URL,
      allowHeaders: [
        "Authorization",
        "Content-Type",
        "X-POSTHOG-DISTINCT-ID",
        "X-POSTHOG-SESSION-ID",
      ],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })(c, next)
  )

  .use("/v1/*", async (c, next) => {
    const user = await auth.verifyUser(c.req.raw, c.env);
    if (user === null) return c.json({ error: "unauthorized" }, 401);
    c.set("userId", user.userId);
    c.set("hasFeature", user.hasFeature);

    const posthog = getPostHog(c.env);
    if (posthog === null) return next();

    return posthog.withContext(
      {
        distinctId: user.userId,
        sessionId: c.req.header("X-POSTHOG-SESSION-ID"),
      },
      next
    );
  })

  .get("/v1/connect/strava/start", async (c) => {
    const userId = c.get("userId");
    const nonce = crypto.randomUUID();
    setCookie(c, "st_oauth", nonce, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: OAUTH_STATE_TTL_MS / 1000,
      path: "/connect/strava",
    });
    const state = await encryptSecret(
      JSON.stringify({ userId, nonce, exp: Date.now() + OAUTH_STATE_TTL_MS }),
      c.env.TOKEN_KEY
    );
    const redirectUri = new URL("/connect/strava/callback", c.req.url).toString();
    const url = authorizeUrl(
      { clientId: c.env.STRAVA_CLIENT_ID, clientSecret: c.env.STRAVA_CLIENT_SECRET },
      redirectUri,
      state
    );
    await captureEvent(c, "strava_connection_started", {});
    return c.json({ url });
  })

  .get("/v1/sessions", async (c) => {
    const userId = c.get("userId");
    const includeClimbs = c.req.query("include") === "climbs";
    const [rows, tagsBySession] = await Promise.all([
      repo.listSessions(c.env.DB, userId, 200, includeClimbs),
      repo.tagsBySession(c.env.DB, userId),
    ]);
    const sessions = rows.map(({ climbs_json, ...rest }) => ({
      ...rest,
      tags: tagsBySession.get(rest.fingerprint) ?? [],
      climbs: includeClimbs ? parseClimbs(climbs_json) : undefined,
    }));
    return c.json({ sessions });
  })

  .get("/v1/tags", async (c) => {
    return c.json({ tags: await repo.listTags(c.env.DB, c.get("userId")) });
  })

  // Every named climb the user has logged, with a project flag. Stats come
  // from the session rows on read, so edits and deletions never leave a
  // project count stale.
  .get("/v1/climbs", async (c) => {
    const userId = c.get("userId");
    const [rows, projects] = await Promise.all([
      repo.listSessions(c.env.DB, userId, 5000, true),
      repo.listProjects(c.env.DB, userId),
    ]);
    return c.json({ climbs: climbCatalogue(rows, projects) });
  })

  .delete("/v1/projects/:slug", async (c) => {
    const deleted = await repo.deleteProject(c.env.DB, c.get("userId"), c.req.param("slug"));
    if (!deleted) return c.json({ error: "not found" }, 404);
    await captureEvent(c, "project_unmarked", {});
    return c.json({ deleted: true });
  })

  .get("/v1/sessions/:fingerprint", async (c) => {
    const session = await sessionResponse(c.env, c.get("userId"), c.req.param("fingerprint"));
    if (session === null) return c.json({ error: "not found" }, 404);
    return c.json({ session });
  })

  .post("/v1/sessions", zValidator("json", manualSessionBody, invalidBody), async (c) => {
    const form = c.req.valid("json");
    const userId = c.get("userId");
    await repo.ensureUser(c.env.DB, userId);
    const fingerprint = `manual-${crypto.randomUUID()}`;
    const history = await manualScoringHistory(c.env.DB, userId);
    const input = buildManualSession(fingerprint, form, history);
    await repo.insertManualSession(c.env.DB, userId, input);
    if (form.tags !== undefined) {
      await repo.setSessionTags(c.env.DB, userId, fingerprint, form.tags);
    }
    await applyProjectFlags(c.env.DB, userId, form.climbs);
    await captureEvent(c, "manual_session_created", { session_source: "manual" });
    const body = { session: await sessionResponse(c.env, userId, fingerprint) };
    postAfterResponse(c, userId, fingerprint);
    return c.json(body, 201);
  })

  .put(
    "/v1/sessions/:fingerprint",
    zValidator("json", manualSessionBody, invalidBody),
    async (c) => {
      const form = c.req.valid("json");
      const userId = c.get("userId");
      const fingerprint = c.req.param("fingerprint");
      const existing = await repo.getSession(c.env.DB, userId, fingerprint);
      if (existing === null) return c.json({ error: "not found" }, 404);
      if (existing.source !== "manual") {
        return c.json({ error: "only manually logged sessions can be edited" }, 409);
      }
      const history = await manualScoringHistory(c.env.DB, userId, fingerprint);
      const input = buildManualSession(fingerprint, form, history);
      await repo.updateManualSession(c.env.DB, userId, input);
      await repo.setSessionTags(c.env.DB, userId, fingerprint, form.tags ?? []);
      await applyProjectFlags(c.env.DB, userId, form.climbs);
      await captureEvent(c, "manual_session_updated", { session_source: "manual" });
      const body = { session: await sessionResponse(c.env, userId, fingerprint) };
      // Already posted sessions get the activity patched, never a second one.
      postAfterResponse(c, userId, fingerprint);
      return c.json(body);
    }
  )

  .post("/v1/sessions/:fingerprint/strava", async (c) => {
    const userId = c.get("userId");
    const fingerprint = c.req.param("fingerprint");
    if ((await repo.getSession(c.env.DB, userId, fingerprint)) === null) {
      return c.json({ error: "not found" }, 404);
    }
    const result = await syncSessionToStrava(c.env, userId, fingerprint, true);
    if (result.outcome === "failed") {
      return c.json({ outcome: result.outcome, reason: result.reason }, 502);
    }
    await captureEvent(c, "strava_post_retried", { outcome: result.outcome });
    return c.json({
      outcome: result.outcome,
      reason: result.reason,
      session: await sessionResponse(c.env, userId, fingerprint),
    });
  })

  // A note is the user's own writing about their session, so every session they
  // own takes one, legacy board rows included. Nothing is re-scored or reposted.
  .put(
    "/v1/sessions/:fingerprint/notes",
    zValidator("json", sessionNotesBody, invalidBody),
    async (c) => {
      const notes = normalisedNote(c.req.valid("json").notes);
      const saved = await repo.setSessionNotes(
        c.env.DB,
        c.get("userId"),
        c.req.param("fingerprint"),
        notes
      );
      if (!saved) return c.json({ error: "not found" }, 404);
      await captureEvent(c, "session_notes_updated", { cleared: String(notes === null) });
      return c.json({ notes });
    }
  )

  // Tags live in their own tables, so legacy board sessions stay taggable
  // without writing to those read-only rows.
  .put(
    "/v1/sessions/:fingerprint/tags",
    zValidator("json", sessionTagsBody, invalidBody),
    async (c) => {
      const userId = c.get("userId");
      const fingerprint = c.req.param("fingerprint");
      if ((await repo.getSession(c.env.DB, userId, fingerprint)) === null) {
        return c.json({ error: "not found" }, 404);
      }
      const tags = await repo.setSessionTags(
        c.env.DB,
        userId,
        fingerprint,
        c.req.valid("json").tags
      );
      await captureEvent(c, "session_tags_updated", { tag_count: String(tags.length) });
      return c.json({ tags });
    }
  )

  .delete("/v1/sessions/:fingerprint", async (c) => {
    const userId = c.get("userId");
    const fingerprint = c.req.param("fingerprint");
    const existing = await repo.getSession(c.env.DB, userId, fingerprint);
    if (existing === null) return c.json({ error: "not found" }, 404);
    await repo.deleteSession(c.env.DB, userId, fingerprint);
    await captureEvent(c, "manual_session_deleted", { session_source: existing.source });
    return c.json({ deleted: true });
  })

  .get("/v1/status", async (c) => {
    const strava = await repo.getStravaConnection(c.env.DB, c.get("userId"));
    return c.json({
      strava:
        strava === null
          ? null
          : {
              athleteId: strava.athlete_id,
              status: strava.status,
              postingEnabled: strava.posting_enabled === 1,
              postSince: strava.post_since,
            },
    });
  })

  .get("/v1/entitlements", async (c) => {
    const user = { userId: c.get("userId"), hasFeature: c.get("hasFeature") };
    return c.json(await resolveEntitlements(c.env, user));
  })

  // Called by the app right after a purchase or restore, so the answer does not
  // wait on the webhook.
  .post("/v1/entitlements/refresh", async (c) => {
    const user = { userId: c.get("userId"), hasFeature: c.get("hasFeature") };
    await mirrorStoreEntitlements(c.env, revenuecat(c.env), user.userId);
    await captureEvent(c, "entitlements_refreshed", {});
    return c.json(await resolveEntitlements(c.env, user));
  })

  .put(
    "/v1/connections/strava/posting",
    zValidator("json", stravaPostingBody, invalidBody),
    async (c) => {
      const form = c.req.valid("json");
      const userId = c.get("userId");
      const strava = await repo.getStravaConnection(c.env.DB, userId);
      if (strava === null) return c.json({ error: "strava not connected" }, 409);
      const since =
        form.since === undefined || form.since === null ? null : `${form.since}T00:00:00Z`;
      await repo.setStravaPosting(c.env.DB, userId, form.enabled, since);
      await captureEvent(c, "strava_posting_updated", { enabled: form.enabled });
      return c.json({ postingEnabled: form.enabled, postSince: since });
    }
  )

  .delete("/v1/account", async (c) => {
    const userId = c.get("userId");
    await purgeAccount(c.env, userId);
    try {
      await auth.deleteUser(userId, c.env);
    } catch (err) {
      console.error(
        `clerk user deletion failed: ${err instanceof Error ? err.message : String(err)}`
      );
      return c.json({ error: "account data deleted but sign-in could not be removed" }, 502);
    }
    return c.json({ deleted: true });
  });

app.onError(async (error, c) => {
  // zValidator throws this for a body it cannot parse at all. Without this the
  // catch-all below would answer 500 and log a false exception for what is a
  // malformed request, and RevenueCat would retry a payload that can never work.
  if (error instanceof HTTPException) {
    return c.json(
      { error: error.status === 400 ? "invalid request body" : error.message },
      error.status
    );
  }
  console.error(error);
  const posthog = getPostHog(c.env);
  if (posthog !== null) {
    posthog.captureException(error, c.get("userId"));
    await posthog.flush();
  }
  return c.json({ error: "internal server error" }, 500);
});

export type AppType = typeof app;

export type { LogClimbInput, LogSessionInput } from "./lib/manual";

export { app };
