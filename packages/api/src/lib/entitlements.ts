import type { AuthedUser } from "../auth";
import type { Env } from "../bindings";
import { INSIGHTS_FEATURE, STORE_ENTITLEMENT } from "../features";
import { captureUserEvent } from "./posthog";
import * as repo from "./repo";
import type { RevenueCatClient, StoreEntitlement } from "./revenuecat";

export type StoreMembership = {
  store: string;
  productId: string;
  expiresAt: string | null;
  willRenew: boolean;
};

export type Membership = {
  active: boolean;
  web: boolean;
  store: StoreMembership | null;
};

export type Entitlements = { membership: Membership };

/**
 * A renewal, a transfer and a plain refresh all re-send the entitlement the
 * user already had, so only the ones missing a moment ago are a conversion.
 */
export function newlyGranted(
  before: repo.StoreEntitlementRow[],
  after: StoreEntitlement[]
): StoreEntitlement[] {
  return after.filter(
    (row) =>
      row.entitlement === STORE_ENTITLEMENT &&
      !before.some((prior) => prior.entitlement === row.entitlement)
  );
}

export async function mirrorStoreEntitlements(
  env: Env,
  revenuecat: RevenueCatClient,
  userId: string
): Promise<void> {
  const subscriber = await revenuecat.fetchSubscriber(userId);
  await repo.ensureUser(env.DB, userId);
  const before = await repo.listStoreEntitlements(env.DB, userId);
  await repo.replaceStoreEntitlements(env.DB, userId, subscriber.entitlements);
  for (const row of newlyGranted(before, subscriber.entitlements)) {
    await captureUserEvent(env, userId, "membership_started", {
      channel: row.store,
      product_id: row.product_id,
    });
  }
}

function isLive(expiresAt: string | null, now: Date): boolean {
  return expiresAt === null || Date.parse(expiresAt) > now.getTime();
}

export async function resolveEntitlements(
  env: Env,
  user: AuthedUser,
  now = new Date()
): Promise<Entitlements> {
  const rows = await repo.listStoreEntitlements(env.DB, user.userId);
  const row = rows.find((r) => r.entitlement === STORE_ENTITLEMENT && isLive(r.expires_at, now));
  const web = user.hasFeature(INSIGHTS_FEATURE);
  const store =
    row === undefined
      ? null
      : {
          store: row.store,
          productId: row.product_id,
          expiresAt: row.expires_at,
          willRenew: row.will_renew === 1,
        };
  return { membership: { active: web || store !== null, web, store } };
}
