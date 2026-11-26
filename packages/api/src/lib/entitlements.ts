import { wrapsBuiltIn, type BuiltInLibrary } from "@sendtally/core/hang";
import type { Context } from "hono";
import { auth, type AuthedUser } from "../auth";
import type { Env } from "../bindings";
import type { AppEnv } from "../context";
import { INSIGHTS_FEATURE, LOCKS_RELEASED_AT, STORE_ENTITLEMENT, TRIAL_DAYS } from "../features";
import { builtInNamed, type ExerciseInput } from "./exercises";
import { workoutOf } from "./plan";
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

export type Trial = { endsAt: string };

export type Entitlements = { membership: Membership; trial: Trial };

const DAY_MS = 24 * 60 * 60 * 1000;

export function trialEndsAt(createdAt: string): string {
  const from = Math.max(Date.parse(createdAt) || 0, Date.parse(LOCKS_RELEASED_AT));
  return new Date(from + TRIAL_DAYS * DAY_MS).toISOString();
}

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
  const [rows, account] = await Promise.all([
    repo.listStoreEntitlements(env.DB, user.userId),
    repo.getUser(env.DB, user.userId),
  ]);
  if (account === null) await repo.ensureUser(env.DB, user.userId);
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
  return {
    membership: { active: web || store !== null, web, store },
    trial: { endsAt: trialEndsAt(account?.created_at ?? now.toISOString()) },
  };
}

export class MembersOnly extends Error {
  readonly code = "members_only";

  constructor() {
    super(
      "Custom workouts, custom exercises and training blocks need a sendtally membership now that the 14-day free trial is over. Nothing you made is deleted. Logging climbs and workouts, built-in workouts and posting to Strava stay free. You can become a member from Membership in the sendtally app's Settings."
    );
  }
}

async function refuseWithoutAccess(
  env: Env,
  userId: string,
  webMember: () => boolean | Promise<boolean>
): Promise<void> {
  const now = new Date();
  const { membership, trial } = await resolveEntitlements(
    env,
    { userId, hasFeature: () => false },
    now
  );
  if (membership.active || Date.parse(trial.endsAt) > now.getTime() || (await webMember())) return;
  throw new MembersOnly();
}

export const requireAccess = (c: Context<AppEnv>): Promise<void> =>
  refuseWithoutAccess(c.env, c.get("userId"), () => c.get("hasFeature")(INSIGHTS_FEATURE));

export const requireConnectorAccess = (env: Env, userId: string): Promise<void> =>
  refuseWithoutAccess(env, userId, () => auth.webFeature(userId, INSIGHTS_FEATURE, env));

type Exercises = Pick<BuiltInLibrary, "exercises">;

/** The user's exercise of the name decides; with none, the name is a built-in's when the library has it. */
async function customItems(
  db: D1Database,
  userId: string,
  items: readonly { exercise: string }[],
  library?: Exercises
): Promise<boolean> {
  const [only] = items;
  if (only === undefined || items.length > 1) return true;
  const mine = await repo.findExerciseByName(db, userId, only.exercise);
  const builtIn =
    mine === null
      ? builtInNamed(library ?? (await repo.library(db, "")), only.exercise) !== undefined
      : mine.built_in !== null;
  return !wrapsBuiltIn(items, () => builtIn);
}

/** A workout the user made, as sent or as saved: an edit cannot turn one into a built-in's wrapper. */
export async function customWorkout(
  db: D1Database,
  userId: string,
  items: readonly { exercise: string }[],
  saved: repo.WorkoutRow | undefined,
  library: Exercises
): Promise<boolean> {
  return (
    (await customItems(db, userId, items, library)) ||
    (saved !== undefined && (await customItems(db, userId, workoutOf(saved).items, library)))
  );
}

export async function plansCustomWork(
  db: D1Database,
  userId: string,
  blockId: string | null,
  workoutId: string
): Promise<boolean> {
  if (blockId !== null) return true;
  const workout = await repo.getWorkout(db, userId, workoutId);
  return workout !== undefined && (await customItems(db, userId, workoutOf(workout).items));
}

/**
 * An exercise the user made, as saved or as it will be after this save, `restored` being the
 * archived one the save brings back: only a genuine built-in of its name, linked to it, is free.
 */
export function customExercise(
  library: Exercises,
  body: Pick<ExerciseInput, "name" | "builtIn">,
  saved: repo.ExerciseRow | null,
  restored: repo.ExerciseRow | null
): boolean {
  const link =
    restored?.built_in ?? (body.builtIn === undefined ? (saved?.built_in ?? null) : body.builtIn);
  const own = restored === null && saved?.built_in === null;
  return own || link === null || link !== builtInNamed(library, body.name)?.id;
}
