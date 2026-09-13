# Mobile end-to-end tests

Maestro flows under `apps/mobile/maestro/` drive a development build on an iOS simulator through the screens that only misbehave on a device: sign-in, the climb editor sheet with the keyboard up, drag to dismiss, and the draft surviving a trip out of the form.
They run locally against Metro; there is no CI job yet.

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

## The test account

Flows sign in as `maestro+clerk_test@sendtally.com`.
It is a Clerk test email on the development instance, so the one-time code is always `424242` and nothing is sent.
The sign-in helper creates the account the first time it is missing.
Never point the flows at production keys: the address does not exist there and the fixed code is not accepted.

## Writing flows

- `helpers/open-dev-client.yaml` and `helpers/ensure-signed-in.yaml` start every flow; add new flows to `config.yaml` so `executionOrder` stays explicit.
- A swipe must be `direction: DOWN` (or another direction); a coordinate swipe never reaches React Native's responder system, so a drag-to-dismiss assertion passes only with the direction form.
- `hideKeyboard` fails on these inputs. Press `Enter` on a single-line field, or tap a static label, before swiping.
- A climb ledger row is one accessible element, so match it by its accessibility text, for example `V3 Cascade.*`, not by the name alone.
- The log-session form is longer than the screen; `scrollUntilVisible` to `\+ ADD CLIMB` before tapping it, and back up to `← SESSIONS` to leave.
