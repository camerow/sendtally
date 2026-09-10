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
It is `all` now that the App Store Connect record and the iOS signing credentials exist.
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

Repo variable: `MOBILE_PLATFORMS`, one of `android`, `ios`, `all`.

The workflow writes the two file-shaped credentials to disk in `apps/mobile` because EAS Submit reads them from a path.
Both paths are gitignored, and the runner is discarded after the job.

The App Store Connect app id is inline in `eas.json` rather than an environment variable.
EAS validates `ascAppId` against a digits-only pattern before it interpolates `$VAR`, so a variable there fails the submit with "Invalid Apple App Store Connect App ID" even when the variable is set.
The path-shaped fields around it interpolate normally, which is why Android never hit this.
The id is public anyway - it is the number in the App Store URL.

## One-time setup

1. **Expo.** Run `eas init` from `apps/mobile`, not the repo root: eas-cli finds the project by walking up for `app.json`, so the root has neither a project nor an `eas.json`. It writes `owner` and `extra.eas.projectId` into `app.json`. Commit that.
2. **Google Play.** Create the app in Play Console, complete the store listing from `apps/mobile/store/listing.md`, upload the rendered assets, and fill the data safety form. Then create a service account with the Release Manager role and download its JSON key. EAS Submit can perform the first upload; no manual bundle upload is needed. The account is an organization, so the 12-testers-for-14-days requirement that gates production access for personal accounts does not apply.
3. **Apple.** Done, September 2026. The team is `GUMXLRF3B6` (Chalk and Circuits, organization enrollment), the bundle id `com.sendtally.app` is registered, and the App Store Connect record is Apple ID `6810779919`, name "sendtally".
   The App Store Connect API key is a **team key with the Admin role**, not App Manager: only Admin carries access to Certificates, Identifiers & Profiles, which is what lets EAS create the signing certificate.
   With `EXPO_ASC_API_KEY_PATH`, `EXPO_ASC_KEY_ID`, `EXPO_ASC_ISSUER_ID`, `EXPO_APPLE_TEAM_ID` and `EXPO_APPLE_TEAM_TYPE` in the environment, `eas credentials:configure-build --platform ios --profile production` runs without asking anything about Apple, which is how the distribution certificate and provisioning profile were generated.
   The `.p8` downloads once; it lives in 1Password and at `~/.appstoreconnect/private_keys/`.
   The App Store Connect record, its screenshots, the subscription group and both subscription products were all created through the App Store Connect REST API with that key rather than by hand.
4. **App Review demo account.** Reviewers cannot read our one-time codes, and Google's sign-in-details form asks for "reusable sign in details that don't expire", so the reviewer account signs in with a password while everyone else keeps the code flow.
   In the Clerk **Production** instance: Configure, User & authentication, Password tab, turn on **Add password to account** only. Leave **Sign-up with password** off; that one would demand a password from every new sign-up, and neither app collects one.
   Also turn off **Device Trust** under Configure, Protect, Rules: it applies only to password sign-ins and demands an emailed code from any new device, which a reviewer cannot read. It protects nothing here, because the reviewer is the only account with a password.
   Then create the reviewer user in the Clerk dashboard (a mailbox you own; the live one is `play-review@sendtally.com`, `user_3J6IbL7355cfoBB5sb35gfjMF1l`), set a strong password on it there, and log a few sessions on it so the trends screens are not empty.
   Clerk's dashboard cannot comp a paid plan, so the entitlement is a RevenueCat promotional grant: `POST /v1/subscribers/<clerk user id>/entitlements/sendtally_member/promotional` with `{"duration":"lifetime"}` and the secret key (run it under `doppler run`). The Worker mirrors it like any store entitlement on the next webhook or refresh.
   The mobile sign-in screen reads `supportedFirstFactors` after `signIn.create`; Clerk lists `password` only for accounts that have one, so only this user ever sees the password field.
   Put the email and password in the store's sign-in-details form (Play: App content, App access) and in 1Password, nowhere else.

## Analytics on mobile

PostHog runs in the app through `posthog-react-native` plus its `posthog-react-native/expo` config plugin, wired in `apps/mobile/features/analytics/AnalyticsProvider.tsx`.
The distinct id is the Clerk user id and the identify call carries the email, same rule as the web app, so the internal-users cohort excludes our own sessions.

Unlike the Clerk and RevenueCat public keys, the PostHog values are **not** in `apps/mobile/eas.json`.
They are EAS project environment variables, because one of them is a secret and splitting the set across two places is how they drift apart.
Check them with `eas env:list --scope project --environment production`:

| Name                          | Visibility | Value                                     |
| ----------------------------- | ---------- | ----------------------------------------- |
| `EXPO_PUBLIC_POSTHOG_API_KEY` | plaintext  | the `phc_…` project token, public         |
| `EXPO_PUBLIC_POSTHOG_HOST`    | plaintext  | `https://us.i.posthog.com`                |
| `POSTHOG_CLI_HOST`            | plaintext  | `https://us.posthog.com`                  |
| `POSTHOG_CLI_PROJECT_ID`      | plaintext  | `594324`                                  |
| `POSTHOG_CLI_API_KEY`         | secret     | a personal API key, for source-map upload |

The two hosts differ and both are right: the SDK ingests at `us.i.posthog.com`, while the CLI talks to the API at `us.posthog.com`.
Pointing the SDK at the app host is the easy mistake, and `npx posthog-cli` writes exactly that value into `.env.local` when it sets the project up.

`POSTHOG_CLI_API_KEY` comes from [User API keys](https://us.posthog.com/settings/user-api-keys) with the error-tracking symbol-set write scope:

```
eas env:set --scope project --name POSTHOG_CLI_API_KEY --value <phx_…> \
  --visibility secret --environment production --environment preview --environment development
```

Without it in the build environment the plugin skips the upload silently and stack traces in Error tracking stay minified.
It is deliberately not in Doppler: Doppler feeds `push-secrets.sh`, which only pushes to the two Workers, so a mobile-only build secret there would have no consumer.

Locally the same five values sit in `apps/mobile/.env.local`, which is gitignored.

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

### The App Store products

Subscription group `Sendtally Membership` (`22375103`) on app `6810779919`, holding both products at group level 1 so Apple treats monthly-to-yearly as a plan change rather than a second subscription, the same way the single Play subscription with two base plans does.

| Product id           | Period  | Apple id     | USA price |
| -------------------- | ------- | ------------ | --------- |
| `membership_monthly` | 1 month | `6810791319` | $2.99     |
| `membership_yearly`  | 1 year  | `6810791477` | $23.99    |

The ids match the RevenueCat test-store products, so one name means one thing everywhere.

Pricing is not free-form: Apple sells from a fixed ladder of price points, and $23.88 - the figure that would have made the yearly card read exactly $1.99 a month - is not on it.
$23.99 is, and it divides to $2.00, which is also what Play charges.
That matters because the annual plan card headlines `pricePerMonthString` rather than the yearly total, with the total on the line beneath it.

The price point ids returned by `GET /v1/subscriptions/<id>/pricePoints` are per subscription and per territory, and `customerPrice` is a bare-decimal string (`"3.0"`, not `"3.00"`), so compare it as a number.
Setting the monthly price through `POST /v1/subscriptionPrices` worked and equalized itself across 175 territories; the same call for the yearly product returned `409 ENTITY_ERROR.RELATIONSHIP.INVALID` against a price point id that decodes to exactly that subscription, and it was set in the console instead.

Each product also carries two assets that the app screenshot set does not cover, both rendered from artboards by `store:render`:

- a 1024x1024 promotional image (`subscriptionImages`), flattened RGB with square corners, used if the purchase is ever promoted on the product page or redeemed through an offer code
- a review-only screenshot (`appStoreReviewScreenshot`) at 1290x2796, which mirrors the real paywall so a reviewer sees what the app renders

A subscription sitting at `MISSING_METADATA` once it has a localization, a price and a review screenshot is usually not missing metadata at all - it is the Paid Applications Agreement. Both products flipped to `READY_TO_SUBMIT` the moment that agreement went active.

### RevenueCat project setup (one time)

Project `Sendtally` at app.revenuecat.com, id `f2a60af6`.

1. **Apps.** `sendtally Android`, package `com.sendtally.app`.
   Upload a Play service account JSON with the Play Console permissions RevenueCat needs (View financial data, Manage orders and subscriptions); RevenueCat validates every transaction with it.
   Set up Google real-time developer notifications from the same page so cancellations reach RevenueCat within seconds.
   That flow needs the service account to hold **Pub/Sub Admin** on the GCP project (`sendtally`); Pub/Sub Editor cannot set the topic's IAM policy and RevenueCat reports error 7627.
   RevenueCat creates the topic `projects/sendtally/topics/Play-Store-Notifications` and its own subscription, but it did not grant Google's publisher, so add `google-play-developer-notifications@system.gserviceaccount.com` as **Pub/Sub Publisher** on the topic yourself.
   That grant is blocked by the org policy `iam.allowedPolicyMemberDomains` (Domain restricted sharing), which new Workspace organisations enforce by default; the console then hangs on "Updating policy" without an error.
   The project `sendtally` carries an override of that policy (Replace parent, Allow All) for this reason; keep it scoped to that project.
   Finally, Play Console, Monetize with Play, Monetization setup: enable real-time notifications, paste the topic name, Send test notification, Save.
2. **Products.** One Play subscription `membership` with two base plans, `monthly` at $3.00 and `yearly` at $24.00 ($2 a month billed yearly); keeping both plans inside one subscription is what lets Play handle a monthly-to-yearly switch as a plan change rather than a second subscription.
   Play Console refuses to create subscriptions until a build that declares the `BILLING` permission is on a track, and `react-native-purchases` is what adds it, so the first billing build has to ship before the products can exist.
   In RevenueCat the products are `membership:monthly` and `membership:yearly` under the Android app.
3. **Entitlement.** `sendtally_member`, with both products attached.
   This identifier is `STORE_ENTITLEMENT` in `packages/sync-service/src/features.ts`; changing one means changing the other.
4. **Offering.** `default`, with the monthly package pointing at `membership:monthly` and the annual package at `membership:yearly`.
   The app renders one plan card per package in the current offering and one purchase button for the selected card, so keep the offering to the packages you mean to sell.
5. **Webhook.** Integrations, Webhooks: URL `https://api.sendtally.com/webhooks/revenuecat`, Authorization header value equal to `REVENUECAT_WEBHOOK_AUTH` in Doppler (a long random string), all events.
6. **API keys.** The Android public SDK key (`goog_…`) goes in `apps/mobile/eas.json` as `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`; it is a public key, like the Clerk publishable key.
   The secret key (`sk_…`) goes to Doppler as `REVENUECAT_SECRET_API_KEY`, then `infra/scripts/push-secrets.sh production`.

iOS billing is not set up yet.
`EXPO_PUBLIC_REVENUECAT_IOS_KEY` is unset, so `storeBillingAvailable` is false on iOS and the app simply shows no purchase option - it does not crash, and nothing links out to web checkout.
The order is the same one Play forced: ship a build first, because App Store Connect will not accept in-app purchase products for an app with no build, then add the `sendtally iOS` app to the RevenueCat project, create the subscription products, attach them to `sendtally_member`, add them to the `default` offering, and put the `appl_…` key in `eas.json`.
The App Store also needs the paid applications agreement signed and banking details filled in before it will sell anything.

The project also carries RevenueCat's Test Store app, with test products attached to the same entitlement and offering.
Its products are `membership_monthly` at $3.00 and `membership_yearly` at $24.00, mirroring the Play prices; RevenueCat's auto-created `monthly`, `yearly` and `lifetime` test products are inactive.
A test product's price cannot be edited after creation, so a price change means a new test product, attaching it to `sendtally_member`, and repointing the package in the `default` offering.
A development build with the `test_…` key in `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` runs the whole purchase flow without Play, which is how to check the paywall before the store credentials are in place.
Never ship a production build with the test key.

### Testing on a device

Play Billing only works in a build installed through Play (the internal testing track) on a device whose Google account is a licence tester (Play Console, Setup, Licence testing).
A sideloaded APK fails the purchase with "item not available".

### Store guidelines

- Restore purchases is on the paywall and on the membership screen, which Settings links to.
- The membership screen (Settings, Manage membership) shows the current plan and renewal date, opens the store's subscription management page, and sells the store plans to anyone without a store subscription, web members included, with a note to cancel the web plan afterwards.
- The paywall states the price, the period, that it auto-renews, and links to the terms and privacy pages.
- Nothing in the app links out to web checkout (guideline 3.1.1 on iOS). The web membership page tells store subscribers to manage the subscription in the store instead of showing Clerk's pricing table.
- Play data safety: RevenueCat's SDK collects purchase history, so the form declares Purchase history under Financial info, tied to the user, not shared.
