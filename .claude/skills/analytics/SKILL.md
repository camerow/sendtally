---
name: analytics
description: PostHog and Google Analytics rules for sendtally - distinct ids, identify with email, the conversion event names, and Firebase install attribution. Use before adding, renaming, or removing an analytics event, an identify call, or a tracking SDK.
---

# Analytics

PostHog is the product analytics tool (project "Sendtally", proxied through `v.sendtally.com` on web).
Google Analytics still runs on the marketing pages for aggregate traffic; PostHog is what answers product questions.

- **The distinct id is always the Clerk user id.**
  The browser sets it with `identify()` in `apps/web/app/root.tsx`; the Worker sets it in `captureEvent`, which defaults to the signed-in `userId`.
  A capture without one lands on a throwaway anonymous person, which is what the whole event history looked like before this rule.
- **Identify carries the email.**
  The project's "Internal / Test users" cohort matches `cameron.will@gmail.com` and `@chalkandcircuits.com` on the person, and every insight filters that cohort out by default, so our own use is excluded only when the email is on the person.
  `user.created` on the Clerk webhook is the exactly-once identify that covers mobile and Google sign-up too.
- **Conversion events.**
  Account creation: `signup_started` / `auth_code_sent` / `signup_completed` on the web form, and `account_created` from the Clerk webhook as the canonical, all-channel one.
  Membership: `membership_started` with `channel` = `web` (the Clerk checkout redirect) or the store (a new RevenueCat entitlement, never a renewal).
- The logbook itself never goes to PostHog - event properties stay counts and enum-ish strings.
- Google Analytics for Firebase runs in the mobile app only so Google Ads can attribute installs (`first_open`) and the in-app `account_created` and `membership_started`, named after their PostHog twins.
  It is not a second product analytics tool: no user id, no email, no other events of ours, and on iOS no IDFA, so no tracking prompt.
  Runbook: `docs/mobile-release.md`, "Install attribution for Google Ads".
- Anything added here has to be reflected in `apps/web/app/routes/privacy.tsx`.
