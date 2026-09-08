import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { z } from "zod";
import type { AuthedUser, AuthWebhookEvent } from "./auth";
import type { Env } from "./bindings";
import { purgeAccount } from "./lib/account";
import { decryptSecret, encryptSecret } from "./lib/crypto";
import { buildManualSession, historySession, manualSessionBody } from "./lib/manual";
import { getPostHog } from "./lib/posthog";
import * as repo from "./lib/repo";
import { authorizeUrl, exchangeAuthCode, StravaUnauthorizedError } from "./lib/strava";
import { sessionTagsBody } from "./lib/tags";

export type AppDeps = {
  verifyUser: (req: Request, env: Env) => Promise<AuthedUser | null>;
  deleteAuthUser: (userId: string, env: Env) => Promise<void>;
  verifyAuthWebhook: (req: Request, env: Env) => Promise<AuthWebhookEvent>;
  fetchImpl?: typeof fetch;
};

type Vars = { userId: string; hasFeature: (feature: string) => boolean };

type AppEnv = { Bindings: Env; Variables: Vars };

const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;

export function createApp(deps: AppDeps): Hono<AppEnv> {
  const fetchImpl: typeof fetch = deps.fetchImpl ?? ((input, init) => fetch(input, init));
  const app = new Hono<AppEnv>();

  const captureEvent = async (
    env: Env,
    event: string,
    properties: Record<string, string | boolean>,
    distinctId?: string
  ) => {
    const posthog = getPostHog(env);
    if (posthog === null) return;
    posthog.capture(
      distinctId === undefined ? { event, properties } : { distinctId, event, properties }
    );
    await posthog.flush();
  };

  app.onError(async (error, c) => {
    console.error(error);
    const posthog = getPostHog(c.env);
    if (posthog !== null) {
      posthog.captureException(error, c.get("userId"));
      await posthog.flush();
    }
    return c.json({ error: "internal server error" }, 500);
  });

  app.get("/health", (c) => c.json({ ok: true }));

  app.get("/webhooks/strava", (c) => {
    if (c.req.query("hub.verify_token") !== c.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
      return c.json({ error: "bad verify token" }, 403);
    }
    return c.json({ "hub.challenge": c.req.query("hub.challenge") ?? "" });
  });

  app.post("/webhooks/strava", async (c) => {
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
  });

  app.post("/webhooks/clerk", async (c) => {
    let event: AuthWebhookEvent;
    try {
      event = await deps.verifyAuthWebhook(c.req.raw, c.env);
    } catch (err) {
      console.error(`clerk webhook rejected: ${err instanceof Error ? err.message : String(err)}`);
      return c.json({ error: "bad signature" }, 400);
    }
    // Covers deletions we did not initiate - Clerk's account portal and the
    // Clerk dashboard both land here, and they would otherwise orphan the
    // user's D1 rows and leave their Strava grant live.
    if (event.type === "user.deleted" && event.userId !== null) {
      await purgeAccount(c.env, event.userId, fetchImpl);
    }
    return c.json({ ok: true });
  });

  app.get("/connect/strava/callback", async (c) => {
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
        code,
        fetchImpl
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
    await captureEvent(c.env, "strava_connection_completed", {}, state.userId);
    return c.redirect(`${c.env.WEB_APP_URL}/connected/strava`);
  });

  app.use("/v1/*", (c, next) =>
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
  );
  app.use("/v1/*", async (c, next) => {
    const user = await deps.verifyUser(c.req.raw, c.env);
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
  });

  app.get("/v1/connect/strava/start", async (c) => {
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
    await captureEvent(c.env, "strava_connection_started", {});
    return c.json({ url });
  });

  app.get("/v1/sessions", async (c) => {
    const userId = c.get("userId");
    const includeClimbs = c.req.query("include") === "climbs";
    const [rows, tagsBySession] = await Promise.all([
      repo.listSessions(c.env.DB, userId, 200, includeClimbs),
      repo.tagsBySession(c.env.DB, userId),
    ]);
    const sessions = rows.map(({ climbs_json, ...rest }) => ({
      ...rest,
      inProgress: false,
      tags: tagsBySession.get(rest.fingerprint) ?? [],
      ...(includeClimbs ? { climbs: climbs_json == null ? [] : JSON.parse(climbs_json) } : {}),
    }));
    return c.json({ sessions });
  });

  app.get("/v1/tags", async (c) => {
    return c.json({ tags: await repo.listTags(c.env.DB, c.get("userId")) });
  });

  app.get("/v1/sessions/:fingerprint", async (c) => {
    const session = await sessionResponse(c, c.get("userId"), c.req.param("fingerprint"));
    if (session === null) return c.json({ error: "not found" }, 404);
    return c.json({ session });
  });

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

  const sessionResponse = async (c: { env: Env }, userId: string, fingerprint: string) => {
    const row = await repo.getSession(c.env.DB, userId, fingerprint);
    if (row === null) return null;
    const { climbs_json, ...rest } = row;
    return {
      ...rest,
      inProgress: false,
      tags: await repo.getSessionTags(c.env.DB, userId, fingerprint),
      climbs: climbs_json == null ? [] : JSON.parse(climbs_json),
    };
  };

  app.post("/v1/sessions", async (c) => {
    const parsed = manualSessionBody.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid request body" }, 400);
    const userId = c.get("userId");
    await repo.ensureUser(c.env.DB, userId);
    const fingerprint = `manual-${crypto.randomUUID()}`;
    const history = await manualScoringHistory(c.env.DB, userId);
    const input = buildManualSession(fingerprint, parsed.data, history);
    await repo.insertManualSession(c.env.DB, userId, input);
    if (parsed.data.tags !== undefined) {
      await repo.setSessionTags(c.env.DB, userId, fingerprint, parsed.data.tags);
    }
    await captureEvent(c.env, "manual_session_created", { session_source: "manual" });
    return c.json({ session: await sessionResponse(c, userId, fingerprint) }, 201);
  });

  app.put("/v1/sessions/:fingerprint", async (c) => {
    const parsed = manualSessionBody.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid request body" }, 400);
    const userId = c.get("userId");
    const fingerprint = c.req.param("fingerprint");
    const existing = await repo.getSession(c.env.DB, userId, fingerprint);
    if (existing === null) return c.json({ error: "not found" }, 404);
    if (existing.source !== "manual") {
      return c.json({ error: "only manually logged sessions can be edited" }, 409);
    }
    const history = await manualScoringHistory(c.env.DB, userId, fingerprint);
    const input = buildManualSession(fingerprint, parsed.data, history);
    await repo.updateManualSession(c.env.DB, userId, input);
    await repo.setSessionTags(c.env.DB, userId, fingerprint, parsed.data.tags ?? []);
    await captureEvent(c.env, "manual_session_updated", { session_source: "manual" });
    return c.json({ session: await sessionResponse(c, userId, fingerprint) });
  });

  // Tags live in their own tables, so legacy board sessions stay taggable
  // without writing to those read-only rows.
  app.put("/v1/sessions/:fingerprint/tags", async (c) => {
    const parsed = sessionTagsBody.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid request body" }, 400);
    const userId = c.get("userId");
    const fingerprint = c.req.param("fingerprint");
    if ((await repo.getSession(c.env.DB, userId, fingerprint)) === null) {
      return c.json({ error: "not found" }, 404);
    }
    const tags = await repo.setSessionTags(c.env.DB, userId, fingerprint, parsed.data.tags);
    await captureEvent(c.env, "session_tags_updated", { tag_count: String(tags.length) });
    return c.json({ tags });
  });

  app.delete("/v1/sessions/:fingerprint", async (c) => {
    const userId = c.get("userId");
    const fingerprint = c.req.param("fingerprint");
    const existing = await repo.getSession(c.env.DB, userId, fingerprint);
    if (existing === null) return c.json({ error: "not found" }, 404);
    if (existing.source !== "manual") {
      return c.json({ error: "only manually logged sessions can be deleted" }, 409);
    }
    await repo.deleteManualSession(c.env.DB, userId, fingerprint);
    await captureEvent(c.env, "manual_session_deleted", { session_source: "manual" });
    return c.json({ deleted: true });
  });

  app.get("/v1/status", async (c) => {
    const strava = await repo.getStravaConnection(c.env.DB, c.get("userId"));
    return c.json({
      strava: strava === null ? null : { athleteId: strava.athlete_id, status: strava.status },
    });
  });

  app.delete("/v1/account", async (c) => {
    const userId = c.get("userId");
    await purgeAccount(c.env, userId, fetchImpl);
    try {
      await deps.deleteAuthUser(userId, c.env);
    } catch (err) {
      console.error(
        `clerk user deletion failed: ${err instanceof Error ? err.message : String(err)}`
      );
      return c.json({ error: "account data deleted but sign-in could not be removed" }, 502);
    }
    return c.json({ deleted: true });
  });

  return app;
}
