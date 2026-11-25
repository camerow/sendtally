import type { Entitlements } from "@sendtally/api-client";

const DAY = 24 * 60 * 60 * 1000;

/** An account in its trial, past it, and a member, for tests on either app. */
export const ENTITLEMENTS = {
  trial: {
    membership: { active: false, web: false, store: null },
    trial: { endsAt: new Date(Date.now() + 10 * DAY).toISOString() },
  },
  pastTrial: {
    membership: { active: false, web: false, store: null },
    trial: { endsAt: new Date(Date.now() - DAY).toISOString() },
  },
  member: {
    membership: { active: true, web: true, store: null },
    trial: { endsAt: new Date(Date.now() - DAY).toISOString() },
  },
} satisfies Record<string, Entitlements>;
