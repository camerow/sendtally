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
4. **App Review demo account.** Create a Clerk user with the `long_term_insights` feature granted and a few logged sessions, and give App Review its credentials. Without it a reviewer sees the gated state rather than the trends screens the screenshots advertise.

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

Clerk Billing has no native checkout: its documented support on React Native is the data APIs and `has()` only.
So the app gates the trends screens on the `long_term_insights` feature and offers no purchase path at all.
`UpgradeCard` deliberately carries no button and no URL, because a link out to web checkout is a guideline 3.1.1 violation on every storefront except the United States.
Members subscribe on sendtally.com and the entitlement shows up in the app on the next token refresh.

Real in-app purchase is separate work: store billing through RevenueCat or `expo-iap`, a store webhook into the Worker, and a single entitlement endpoint that unions Clerk Billing subscriptions with store subscriptions so the app asks one question instead of two.
