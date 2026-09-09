import type { AuthedUser } from "../auth";
import type { Env } from "../bindings";
import { INSIGHTS_FEATURE, STORE_ENTITLEMENT } from "../features";
import * as repo from "./repo";
import type { RevenueCatClient } from "./revenuecat";

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

export async function mirrorStoreEntitlements(
  env: Env,
  revenuecat: RevenueCatClient,
  userId: string
): Promise<void> {
  const subscriber = await revenuecat.fetchSubscriber(userId);
  await repo.ensureUser(env.DB, userId);
  await repo.replaceStoreEntitlements(env.DB, userId, subscriber.entitlements);
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
