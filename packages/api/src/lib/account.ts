import type { Env } from "../bindings";
import { decryptSecret } from "./crypto";
import * as repo from "./repo";
import { RevenueCatClient } from "./revenuecat";
import { StravaClient } from "./strava";

// Revoking Strava and forgetting the RevenueCat subscriber are best effort: a
// lapsed grant or a vendor outage must never leave the user's data behind. Safe
// to run twice - the webhook fires after our own endpoint has already purged,
// and every step no-ops on missing rows.
export async function purgeAccount(env: Env, userId: string): Promise<void> {
  const strava = await repo.getStravaConnection(env.DB, userId);
  if (strava !== null) {
    const client = new StravaClient(
      { clientId: env.STRAVA_CLIENT_ID, clientSecret: env.STRAVA_CLIENT_SECRET },
      {
        accessToken: await decryptSecret(strava.access_token_ciphertext, env.TOKEN_KEY),
        refreshToken: await decryptSecret(strava.refresh_token_ciphertext, env.TOKEN_KEY),
        expiresAt: strava.expires_at,
      }
    );
    try {
      await client.deauthorize();
    } catch (err) {
      console.error(
        `strava deauthorize failed during account deletion: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  try {
    await new RevenueCatClient(env.REVENUECAT_SECRET_API_KEY).deleteSubscriber(userId);
  } catch (err) {
    console.error(
      `revenuecat subscriber delete failed during account deletion: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  await repo.deleteUserData(env.DB, userId);
}
