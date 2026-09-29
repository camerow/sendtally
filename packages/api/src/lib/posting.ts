import { BUILT_IN_GRIP_NAMES, isBuiltInGrip } from "@sendtally/core/hang";
import type { Env } from "../bindings";
import { decryptSecret, encryptSecret } from "./crypto";
import { hangSessionOf, settingsOf } from "./hang";
import { hangActivity } from "./hang-activity";
import * as repo from "./repo";
import {
  StravaClient,
  StravaRateLimitedError,
  StravaUnauthorizedError,
  type StravaActivity,
} from "./strava";

export type PostOutcome = "posted" | "updated" | "skipped" | "failed";

export type PostResult = { outcome: PostOutcome; reason?: string };

async function clientFor(env: Env, connection: repo.StravaConnectionRow): Promise<StravaClient> {
  return new StravaClient(
    { clientId: env.STRAVA_CLIENT_ID, clientSecret: env.STRAVA_CLIENT_SECRET },
    {
      accessToken: await decryptSecret(connection.access_token_ciphertext, env.TOKEN_KEY),
      refreshToken: await decryptSecret(connection.refresh_token_ciphertext, env.TOKEN_KEY),
      expiresAt: connection.expires_at,
    }
  );
}

async function persistTokens(env: Env, userId: string, client: StravaClient): Promise<void> {
  if (!client.wasRefreshed()) return;
  const tokens = client.currentTokens();
  await repo.updateStravaTokens(
    env.DB,
    userId,
    await encryptSecret(tokens.accessToken, env.TOKEN_KEY),
    await encryptSecret(tokens.refreshToken, env.TOKEN_KEY),
    tokens.expiresAt
  );
}

function elapsedSeconds(startAt: string, endAt: string): number {
  const seconds = Math.round((Date.parse(endAt) - Date.parse(startAt)) / 1000);
  return seconds > 0 ? seconds : 0;
}

function describe(err: unknown): string {
  if (err instanceof StravaRateLimitedError) return "strava rate limit hit, not posted yet";
  if (err instanceof StravaUnauthorizedError) return "strava rejected the stored token";
  return err instanceof Error ? err.message : String(err);
}

const skipped = (reason: string): PostResult => ({ outcome: "skipped", reason });

/** The user's Strava connection when it can post, or why it cannot. */
async function postableConnection(
  env: Env,
  userId: string
): Promise<repo.StravaConnectionRow | string> {
  const connection = await repo.getStravaConnection(env.DB, userId);
  if (connection === null) return "strava not connected";
  if (connection.status !== "active") return "strava connection is dead";
  return connection;
}

/** One session's side of a post: its activity, if it has one, and where the outcome is recorded. */
type Postable = {
  activityId: number | null;
  activity: StravaActivity;
  markPending: () => Promise<void>;
  markPosted: (activityId: number) => Promise<void>;
  markFailed: (error: string) => Promise<void>;
};

async function post(
  env: Env,
  connection: repo.StravaConnectionRow,
  p: Postable
): Promise<PostResult> {
  const userId = connection.user_id;
  if (p.activityId === null) await p.markPending();
  const client = await clientFor(env, connection);
  try {
    if (p.activityId !== null) {
      await client.updateActivity(p.activityId, {
        name: p.activity.name,
        description: p.activity.description,
      });
      await persistTokens(env, userId, client);
      return { outcome: "updated" };
    }

    const activityId = await client.createActivity(p.activity);
    // Once Strava holds the activity, a retry must find the id and never create
    // a second one.
    await p.markPosted(activityId);
    await persistTokens(env, userId, client);
    return { outcome: "posted" };
  } catch (err) {
    if (err instanceof StravaUnauthorizedError) {
      await repo.markStravaConnectionDeadByAthlete(env.DB, connection.athlete_id);
    }
    await persistTokens(env, userId, client);
    await p.markFailed(describe(err));
    return { outcome: "failed", reason: describe(err) };
  }
}

// `explicit` is a user asking for this one session from the session page, which
// is allowed past the posting_enabled and post_since gates. Those gates exist to
// stop automatic posting, not to stop someone posting a session on purpose.
export async function syncSessionToStrava(
  env: Env,
  userId: string,
  fingerprint: string,
  explicit = false
): Promise<PostResult> {
  const session = await repo.getSessionForPosting(env.DB, userId, fingerprint);
  if (session === null) return skipped("session not found");
  if (session.source !== "manual") return skipped("not a manual session");
  if (session.rpe_source === "none" && !explicit) return skipped("session is unscored");

  const connection = await postableConnection(env, userId);
  if (typeof connection === "string") return skipped(connection);
  if (!explicit) {
    if (connection.posting_enabled !== 1) return skipped("posting is off");
    if (connection.post_since !== null && session.start_at < connection.post_since) {
      return skipped("session predates post_since");
    }
  }

  return post(env, connection, {
    activityId: session.strava_activity_id,
    activity: {
      name: session.title,
      description: session.summary,
      sportType: "RockClimbing",
      startDateLocal: new Date(session.start_at),
      elapsedSeconds: elapsedSeconds(session.start_at, session.end_at),
    },
    markPending: () => repo.markSessionPostPending(env.DB, userId, fingerprint),
    markPosted: (id) => repo.markSessionPosted(env.DB, userId, fingerprint, id),
    markFailed: (error) => repo.markSessionPostFailed(env.DB, userId, fingerprint, error),
  });
}

async function gripName(db: D1Database, userId: string, gripId: string): Promise<string> {
  if (isBuiltInGrip(gripId)) return BUILT_IN_GRIP_NAMES[gripId];
  return (await repo.getHangGrip(db, userId, gripId))?.name ?? "Custom grip";
}

// hangtally's postToStrava setting only decides whether a new session posts on
// its own. An activity already on Strava always follows its session's edits.
export async function syncHangSessionToStrava(
  env: Env,
  userId: string,
  id: string,
  explicit = false
): Promise<PostResult> {
  const row = await repo.getHangSession(env.DB, userId, id);
  if (row === null) return skipped("session not found");

  const connection = await postableConnection(env, userId);
  if (typeof connection === "string") return skipped(connection);
  const settings = settingsOf(await repo.getHangSettings(env.DB, userId));
  if (!explicit && row.strava_activity_id === null && !settings.postToStrava) {
    return skipped("posting is off");
  }

  return post(env, connection, {
    activityId: row.strava_activity_id,
    activity: hangActivity(
      hangSessionOf(row),
      await gripName(env.DB, userId, row.grip_id),
      settings.units
    ),
    markPending: () => repo.markHangPostPending(env.DB, userId, id),
    markPosted: (activityId) => repo.markHangPosted(env.DB, userId, id, activityId),
    markFailed: (error) => repo.markHangPostFailed(env.DB, userId, id, error),
  });
}
