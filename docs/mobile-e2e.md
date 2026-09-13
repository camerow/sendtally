# Mobile end-to-end tests

Maestro flows under `apps/mobile/maestro/` drive a development build on an iOS simulator through the screens that only misbehave on a device: sign-in, the climb editor sheet with the keyboard up, drag to dismiss, and the draft surviving a trip out of the form.
They run locally on an iOS simulator against Metro, and in CI on an Android emulator.

## One-time setup

- Install Maestro: `curl -Ls https://get.maestro.mobile.dev | bash` (lands in `~/.maestro/bin`).
- Maestro needs a Java runtime and this machine has none on PATH; Android Studio's bundled one works: `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`.
- Build the development client onto a simulator once: `npx expo run:ios --device <udid> --no-bundler` from `apps/mobile` (about ten minutes; the watchman stub and Homebrew `pod` notes in `docs/mobile-release.md` apply).

## Running

1. Start the local API from `packages/sync-service` with `npx wrangler dev`.
2. Start Metro from `apps/mobile` pointed at the local API and the Clerk development instance:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:8787 \
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<pk_test key from apps/web/.dev.vars> \
   npx expo start --port 8081 --clear
   ```
   The flows deep-link the development client to `localhost:8081` themselves.
3. `pnpm --filter @sendtally/mobile e2e`, or `maestro test maestro/flows/<flow>.yaml` for one flow.

Failures leave screenshots and the UI hierarchy under `~/.maestro/tests/<timestamp>/`.

## In CI

`.github/workflows/mobile-e2e.yml` runs the same flows on every pull request that touches the app or a package it bundles.
Android only: the emulator runs on a Linux runner with KVM at the 1x minute rate, where an iOS simulator would need a macOS runner at 10x.
The job prebuilds the Android project, builds a release APK so the JavaScript is embedded (no Metro on the runner), and points it at `api-staging.sendtally.com` and the Clerk development instance, the same pair the mobile preview uses.
The PostHog source map upload hook is stripped from the generated Gradle file first, since it needs an EAS-only key and this build ships nowhere.
Flows get `DEV_CLIENT=false`, which skips the dev-client deep link and developer menu in `helpers/open-dev-client.yaml`.
A failed run uploads Maestro's screenshots and UI hierarchy as the `maestro-debug` artifact.
The AVD snapshot is cached between runs; a cold run is around twenty minutes, a warm one closer to twelve.

## The test account

Flows sign in as `maestro+clerk_test@sendtally.com`.
It is a Clerk test email on the development instance, so the one-time code is always `424242` and nothing is sent.
The sign-in helper creates the account the first time it is missing.
Never point the flows at production keys: the address does not exist there and the fixed code is not accepted.

## Writing flows

- `helpers/open-dev-client.yaml` and `helpers/ensure-signed-in.yaml` start every flow; add new flows to `config.yaml` so `executionOrder` stays explicit.
- Swipes differ by platform. On iOS only a bare `direction: DOWN` reaches React Native's responder system; coordinate and element swipes go through a press-and-drag RN never sees. On Android a coordinate swipe works and is the one that starts on the sheet rather than the scrim. Split with `runFlow: when: platform:`.
- `hideKeyboard` fails on these inputs. Press `Enter` on a single-line field, or tap a static label, before swiping.
- A climb ledger row is one accessible element, so match it by its accessibility text, for example `V3 Cascade.*`, not by the name alone.
- The log-session form is longer than the screen; `scrollUntilVisible` to `\+ ADD CLIMB` before tapping it, and back up to `← SESSIONS` to leave.
