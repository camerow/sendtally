# Mobile release runbook

How a commit on `main` becomes a build in TestFlight and Play internal testing, and the one-time console setup that has to happen first.

## The pipeline

`.github/workflows/mobile-release.yml` runs on a push to `main` that touches `apps/mobile/**` or any package the app consumes, and on `workflow_dispatch`.
It reuses `checks.yml`, so a release cannot ship past failing types, tests, or formatting.
Then it runs one command:

```
eas build --platform <platforms> --profile production --auto-submit --non-interactive
```

`--auto-submit` hands each finished build to EAS Submit using the matching `submit.production` profile in `apps/mobile/eas.json`.
Version codes and build numbers come from EAS remote versioning (`appVersionSource: "remote"` plus `autoIncrement` on the production profile), so no file in the repo is bumped per release.
The job deliberately waits for EAS rather than passing `--no-wait`: a failed build or a rejected upload has to fail the run.

`apps/mobile/app.json` `version` is the user-visible marketing version.
Bump it by hand when a release deserves a new number.

### Platform selection

The `MOBILE_PLATFORMS` repo variable picks what gets built, defaulting to `android`.
Set it to `all` once Apple Developer enrollment completes and the App Store Connect record exists.
A manual run can override it with the `platform` input.

### Promotion to public release

The pipeline stops at TestFlight and the Play internal track.
Promoting to App Store review or Play production stays a manual decision in each console.

## Secrets and variables

GitHub repo secrets:

| Name                         | Where it comes from                                       |
| ---------------------------- | --------------------------------------------------------- |
| `EXPO_TOKEN`                 | expo.dev, Account settings, Access tokens                 |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Play Console service account JSON, whole file contents    |
| `ASC_API_KEY`                | App Store Connect API key `.p8` file, whole file contents |
| `ASC_API_KEY_ID`             | App Store Connect, Users and Access, Integrations         |
| `ASC_API_KEY_ISSUER_ID`      | Same page as the key id                                   |
| `ASC_APP_ID`                 | App Store Connect, App Information, the numeric Apple ID  |

Repo variable: `MOBILE_PLATFORMS`, one of `android`, `ios`, `all`.

The workflow writes the two file-shaped credentials to disk in `apps/mobile` because EAS Submit reads them from a path.
Both paths are gitignored, and the runner is discarded after the job.

## One-time setup

1. **Expo.** Run `eas init` from `apps/mobile`, not the repo root: eas-cli finds the project by walking up for `app.json`, so the root has neither a project nor an `eas.json`. It writes `owner` and `extra.eas.projectId` into `app.json`. Commit that.
2. **Google Play.** Create the app in Play Console, complete the store listing from `apps/mobile/store/listing.md`, upload the rendered assets, and fill the data safety form. Then create a service account with the Release Manager role and download its JSON key. EAS Submit can perform the first upload; no manual bundle upload is needed. The account is an organization, so the 12-testers-for-14-days requirement that gates production access for personal accounts does not apply.
3. **Apple.** Register the `com.sendtally.app` bundle id, create the App Store Connect record, and generate an App Store Connect API key with the App Manager role.
4. **App Review demo account.** Reviewers cannot read our one-time codes, and Google's sign-in-details form asks for "reusable sign in details that don't expire", so the reviewer account signs in with a password while everyone else keeps the code flow.
   In the Clerk **Production** instance: Configure, User & authentication, Password tab, turn on **Add password to account** only. Leave **Sign-up with password** off; that one would demand a password from every new sign-up, and neither app collects one.
   Then create the reviewer user in the Clerk dashboard (a mailbox you own, e.g. `play-review@sendtally.com`), set a strong password on it there, grant it the `long_term_insights` feature, and log a few sessions on it so the trends screens are not empty.
   The mobile sign-in screen reads `supportedFirstFactors` after `signIn.create`; Clerk lists `password` only for accounts that have one, so only this user ever sees the password field.
   Put the email and password in the store's sign-in-details form (Play: App content, App access) and in 1Password, nowhere else.

## Store assets

Every store image is generated from artboards vendored out of the Sendtally Marketing Kit design canvas.

```
pnpm --filter @sendtally/mobile store:render
```

The script drives headless Chrome through `puppeteer-core`, waits for the webfonts, verifies each output is exactly the size its artboard declares, and strips the alpha channel from anything that must be opaque, since App Store Connect rejects an icon that carries one.

- `apps/mobile/store/artboards/` holds the sources. They are vendored design output, so they are excluded from Prettier: reformatting them breaks the size parsing.
- `apps/mobile/assets/` holds the three build inputs (`icon.png`, `adaptive-icon.png`, `splash-mark.png`). These are committed because `app.json` points at them.
- `apps/mobile/store/out/` holds the upload-only images (screenshots, feature graphic, Play icon) and is gitignored.

Store copy lives in `apps/mobile/store/listing.md`.

When a screen changes in the app, the matching artboard has to change with it, in the design canvas as well as here, or the screenshots stop representing the app.

## Billing on mobile

Membership can be bought two ways, and the Worker is the only thing that knows about both.

- On the web, Clerk Billing sells the `member` plan, which carries the `long_term_insights` feature.
- In the app, RevenueCat sells the `sendtally_member` entitlement through Google Play, and through the App Store once the iOS app exists.

The app never asks Clerk about billing.
It asks `GET /v1/entitlements`, which unions the Clerk feature with the `store_entitlements` rows in D1 and answers with one `membership` object.
The web app asks the same endpoint, so a Play subscriber sees the trends on sendtally.com too.

The D1 rows are a mirror of RevenueCat, written two ways:

1. `POST /webhooks/revenuecat`: every event re-reads the subscriber from RevenueCat's REST API and replaces the user's rows, so retries and out-of-order delivery converge on the same state.
   The route checks the `Authorization` header against `REVENUECAT_WEBHOOK_AUTH` and answers 500 when the read fails, which makes RevenueCat retry.
2. `POST /v1/entitlements/refresh`: the app calls it right after a purchase or restore, so the answer does not wait on the webhook.

The RevenueCat app user id is the Clerk user id (`Purchases.configure({ appUserID })` on sign-in), so no identity mapping exists anywhere.
Account deletion deletes the RevenueCat subscriber along with the D1 rows.

### RevenueCat project setup (one time)

Project `Sendtally` at app.revenuecat.com, id `f2a60af6`.

1. **Apps.** `sendtally Android`, package `com.sendtally.app`.
   Upload a Play service account JSON with the Play Console permissions RevenueCat needs (View financial data, Manage orders and subscriptions); RevenueCat validates every transaction with it.
   Set up Google real-time developer notifications from the same page so cancellations reach RevenueCat within seconds.
2. **Products.** Create the subscription in Play Console first (product `member_monthly`, base plan `monthly`, priced to match the web plan), then add it in RevenueCat under Products for the Android app.
3. **Entitlement.** `sendtally_member`, with `member_monthly` attached.
   This identifier is `STORE_ENTITLEMENT` in `packages/sync-service/src/features.ts`; changing one means changing the other.
4. **Offering.** `default`, with the monthly package pointing at `member_monthly`.
   The app renders one button per package in the current offering, so keep the offering to the packages you mean to sell.
5. **Webhook.** Integrations, Webhooks: URL `https://api.sendtally.com/webhooks/revenuecat`, Authorization header value equal to `REVENUECAT_WEBHOOK_AUTH` in Doppler (a long random string), all events.
6. **API keys.** The Android public SDK key (`goog_…`) goes in `apps/mobile/eas.json` as `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`; it is a public key, like the Clerk publishable key.
   The secret key (`sk_…`) goes to Doppler as `REVENUECAT_SECRET_API_KEY`, then `infra/scripts/push-secrets.sh production`.

The project also carries RevenueCat's Test Store app, with test products attached to the same entitlement and offering.
A development build with the `test_…` key in `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` runs the whole purchase flow without Play, which is how to check the paywall before the store credentials are in place.
Never ship a production build with the test key.

### Testing on a device

Play Billing only works in a build installed through Play (the internal testing track) on a device whose Google account is a licence tester (Play Console, Setup, Licence testing).
A sideloaded APK fails the purchase with "item not available".

### Store guidelines

- Restore purchases is on the paywall and under Settings.
- The paywall states the price, the period, that it auto-renews, and links to the terms and privacy pages.
- Nothing in the app links out to web checkout (guideline 3.1.1 on iOS). The web membership page tells store subscribers to manage the subscription in the store instead of showing Clerk's pricing table.
- Play data safety: RevenueCat's SDK collects purchase history, so the form declares Purchase history under Financial info, tied to the user, not shared.
