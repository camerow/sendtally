// Clerk Billing feature slug on the web `member` plan.
export const INSIGHTS_FEATURE = "long_term_insights";

// RevenueCat entitlement identifier the store subscriptions unlock. Both grant
// the same thing; the two names live in two dashboards.
export const STORE_ENTITLEMENT = "sendtally_member";

// Every account gets this many days of everything members get, counted from
// sign-up or from TRIAL_FLOOR, whichever is later, so accounts older than the
// trial still get the full stretch once the member gates ship.
export const TRIAL_DAYS = 30;
export const TRIAL_FLOOR = "2026-12-01T00:00:00.000Z";
