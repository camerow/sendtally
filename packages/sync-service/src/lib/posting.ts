import type { Env } from "../bindings";
import { decryptSecret, encryptSecret } from "./crypto";
import * as repo from "./repo";
import { StravaClient, StravaRateLimitedError, StravaUnauthorizedError } from "./strava";

export type PostOutcome = "posted" | "updated" | "skipped" | "failed";

export type PostResult = { outcome: PostOutcome; reason?: string };

async function clientFor(
  env: Env,
  connection: repo.StravaConnectionRow,
  fetchImpl: typeof fetch
): Promise<StravaClient> {
  return new StravaClient(
    { clientId: env.STRAVA_CLIENT_ID, clientSecret: env.STRAVA_CLIENT_SECRET },
    {
      accessToken: await decryptSecret(connection.access_token_ciphertext, env.TOKEN_KEY),
      refreshToken: await decryptSecret(connection.refresh_token_ciphertext, env.TOKEN_KEY),
      expiresAt: connection.expires_at,
    },
    fetchImpl
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

export async function syncSessionToStrava(
  env: Env,
  userId: string,
  fingerprint: string,
  fetchImpl: typeof fetch
): Promise<PostResult> {
  const session = await repo.getSessionForPosting(env.DB, userId, fingerprint);
  if (session === null) return { outcome: "skipped", reason: "session not found" };
  if (session.source !== "manual") return { outcome: "skipped", reason: "not a manual session" };

  const connection = await repo.getStravaConnection(env.DB, userId);
  if (connection === null) return { outcome: "skipped", reason: "strava not connected" };
  if (connection.status !== "active") {
    return { outcome: "skipped", reason: "strava connection is dead" };
  }
  if (connection.posting_enabled !== 1) return { outcome: "skipped", reason: "posting is off" };
  if (connection.post_since !== null && session.start_at < connection.post_since) {
    return { outcome: "skipped", reason: "session predates post_since" };
  }

  const client = await clientFor(env, connection, fetchImpl);
  try {
    if (session.strava_activity_id !== null) {
      await client.updateActivity(session.strava_activity_id, {
        name: session.title,
        description: session.summary,
        perceivedExertion: session.rpe,
      });
      await persistTokens(env, userId, client);
      return { outcome: "updated" };
    }

    const activityId = await client.createActivity({
      name: session.title,
      description: session.summary,
      startDateLocal: new Date(session.start_at),
      elapsedSeconds: elapsedSeconds(session.start_at, session.end_at),
      perceivedExertion: session.rpe,
    });
    // Written before the exertion patch: once Strava holds the activity, a retry
    // must find the id and never create a second one.
    await repo.markSessionPosted(env.DB, userId, fingerprint, activityId);
    await persistTokens(env, userId, client);

    // Strava's create endpoint ignores perceived_exertion, so it takes its own call.
    // A failure here leaves a posted activity with no RPE, which a retry patches.
    try {
      await client.setPerceivedExertion(activityId, session.rpe);
      await persistTokens(env, userId, client);
    } catch (err) {
      await repo.setSessionPostError(env.DB, userId, fingerprint, describe(err));
    }
    return { outcome: "posted" };
  } catch (err) {
    if (err instanceof StravaUnauthorizedError) {
      await repo.markStravaConnectionDeadByAthlete(env.DB, connection.athlete_id);
    }
    await persistTokens(env, userId, client);
    await repo.markSessionPostFailed(env.DB, userId, fingerprint, describe(err));
    return { outcome: "failed", reason: describe(err) };
  }
}
