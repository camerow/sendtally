# Mobile end-to-end tests

Maestro flows under `apps/mobile/maestro/` drive a development build on an iOS simulator through the screens that only misbehave on a device: sign-in, the climb editor sheet with the keyboard up, drag to dismiss, and the draft surviving a trip out of the form.
They run locally on an iOS simulator against Metro, and in CI on an Android emulator.

Anything that is not about the device belongs in a component test instead.
`apps/mobile` runs Jest with `jest-expo` and React Native Testing Library, co-located as `<Component>.test.tsx`, from `pnpm mobile:test` (also part of `pnpm test`).
Those tests mock `Sheet`, Reanimated and Gorhom, render the real feature components over in-memory storage, and run in about a second, so screen logic such as the live session in `LiveClimbEditor.test.tsx` lives there.
Keep a Maestro flow only for what a mock hides: gestures, keyboards, nested native sheets, sign-in.
The test script lives in the root `package.json` for the same fingerprint reason as `mobile:e2e` below.

## One-time setup

- Install Maestro: `curl -Ls https://get.maestro.mobile.dev | bash` (lands in `~/.maestro/bin`).
- Maestro needs a Java runtime and this machine has none on PATH; Android Studio's bundled one works: `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`.
- Build the development client onto a simulator once: `npx expo run:ios --device <udid> --no-bundler` from `apps/mobile` (about ten minutes; the watchman stub and Homebrew `pod` notes in `docs/mobile-release.md` apply).
- To check a language, `infra/scripts/sim-language.sh de` (or `fr`, `es`, an explicit locale like `fr fr_CA`, or `reset`) sets the simulator language and reboots it; it takes the device from `SIM_UDID`, `--udid`, or the booted simulator. Relaunch the app afterwards.

## Running

1. Start the local API from `packages/api` with `npx wrangler dev`.
2. Start Metro from `apps/mobile` with `npx expo start --port 8081 --clear`.
   A debug bundle defaults to the local API (`localhost:8787`, or `10.0.2.2:8787` on the Android emulator) and the Clerk development instance; `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` still override both, for a physical phone or staging.
   The flows deep-link the development client to `localhost:8081` themselves.
3. `pnpm run mobile:e2e` from the repo root, or `maestro test maestro/flows/<flow>.yaml` from `apps/mobile` for one flow.
   Metro's port is the `METRO_PORT` Maestro variable, default 8081, so a second worktree's bundler is reachable without editing anything: start Metro on its own port and pass it through, `maestro test -e DEV_CLIENT=true -e METRO_PORT=8082 maestro/`.
   Only one simulator can be deep-linked at a time, so the run still takes the machine.
   The script lives in the root `package.json` on purpose: the `scripts` block of `apps/mobile/package.json` is one of the sources the Android fingerprint hashes, so a convenience script in there moves the runtime version and strands the branch from every build EAS holds (see In CI below).

Failures leave screenshots and the UI hierarchy under `~/.maestro/tests/<timestamp>/`.

## In CI

`.github/workflows/mobile-e2e.yml` runs the same flows on merges to `main` that touch the app or a package it bundles.
It is a health signal, not a merge gate: twenty minutes in front of every pull request bought too little to be worth the wait.
Before merging something risky, run the flows locally as above, or fire the workflow by hand from the Actions tab.
Android only: the emulator runs on a Linux runner with KVM at the 1x minute rate, where an iOS simulator would need a macOS runner at 10x.

### The app the flows run on

The job does not build the app.
`runtimeVersion` is a fingerprint, so the question the release pipeline asks - can this commit ship over the air? - answers "can this branch run on an APK EAS already built?" too:

```
eas fingerprint:generate --platform android --build-profile e2e
eas build:list --platform android --profile e2e --status finished \
  --distribution internal --fingerprint-hash <hash>
```

When a finished `e2e` build carries the hash, the job downloads its APK, publishes the branch as an EAS Update, and installs the two together.
That is the whole saving: the Gradle release build this replaced took sixteen of the job's twenty minutes.

The Gradle fallback is a way to get a run at all, not a trustworthy one: the APK it builds segfaults in Hermes on launch on the emulator, in two of three runs when this was last exercised (17 Sep 2026), which reads as flows failing on "Sign in|Climb" with the device on its home screen.
So when a branch moves the fingerprint, warm it with `eas build --profile e2e --platform android` from `apps/mobile` before trusting a red run.

The `e2e` build profile exists for this job alone: it extends `preview`, so it is the same staging API and development Clerk instance, but it ships on its own `e2e` channel.
That channel resolves to the `e2e` update branch, so every run publishes there and nothing the job does can land on a `preview` build someone is holding on a phone.
The publish is `--branch e2e --environment preview`, and the mismatch is deliberate: the branch is where the update lands, the environment is where the staging keys live, and there is no `e2e` EAS environment holding a second copy of them.
The profile inherits the rest of its `env` from `preview` too, so `EXPO_PUBLIC_E2E` is the only variable it declares.
That makes the update branch shared state, which is why the whole workflow takes a single `mobile-e2e` concurrency group rather than one per ref: two runs in flight would each be looking at the other's JavaScript.

`expo-updates` launches the bundle it already has and downloads the new one behind it, so the job opens the app once, waits for the update id to appear in logcat, force-stops it, and only then runs the flows.
The wait is a check, not a pause: a download that never lands fails the job, because the alternative is a green run against whatever JavaScript the APK happened to be built with.

The profile sets `EXPO_PUBLIC_E2E=true`, and `AnalyticsProvider` renders no `PostHogProvider` when it is set, so a flow run sends PostHog nothing at all.
Marking the person `$internal_or_test_user` instead does not work here: person-on-events keeps an event's person properties as they were at ingestion, so the anonymous events a run fires before it signs in stay product traffic however the person is marked afterwards.
Sending nothing also stops session replay recording twenty minutes of a robot on every run.
The workflow sets the same variable for itself, because `EXPO_PUBLIC_*` is inlined at bundle time and the update and the Gradle fallback both bundle on the runner.

The server half is the staging API Worker, which carries no `POSTHOG_PROJECT_TOKEN` for the same reason: the flows log real sessions against `api-staging.sendtally.com`, and `captureUserEvent` would put those in the one PostHog project next to real ones.
That was the only staging leak - `apps/web` has always declared its token on the production environment alone, so the staging site's browser has never sent anything, and a staging PostHog var missing anywhere is the design rather than an oversight.

What a run costs in visibility is PostHog replay. Maestro's screenshots and UI hierarchy and the logcat dump are what a failure leaves instead.

Nothing about the `e2e` profile carries a RevenueCat key.
The SDK refuses a test-store key in a release build and closes the app, and the flows never reach a paywall.

### When the fallback build fires

A run builds with Gradle when no finished `e2e` build carries the branch's fingerprint, and the job summary says so, because a native change is worth seeing.
Anything that changes the native layer does it: a new native dependency or config plugin, an `app.json` change, a version bump - and two that are easy to miss, since neither looks native at all:

- **`eas.json`.** The file is hashed whole, so editing any build profile moves the fingerprint for all of them.
- **The `scripts` block of `apps/mobile/package.json`.** Adding one line there moved this project's fingerprint from `13b109fe` to `01ffc80a`, which is why `pnpm run mobile:e2e` lives in the root `package.json`.

Warm the new fingerprint once and later runs on it go back to reusing the APK:

```
cd apps/mobile
eas build --profile e2e --platform android
```

Until that build finishes, every run on that fingerprint pays for Gradle again, so warm it as soon as the summary reports one rather than at the end of the branch.

### The rest of the run

The PostHog source map upload hook is stripped from the generated Gradle file on the fallback path, since it needs an EAS-only key and a build that ships nowhere.
Locally `pnpm run mobile:e2e` passes `DEV_CLIENT=true`, which makes `helpers/open-dev-client.yaml` deep-link the development build to Metro; CI passes `false` so the app just launches. The helper has no default of its own because a flow's `env` block is applied after `-e` and would win.
A failed run uploads Maestro's screenshots and UI hierarchy plus a logcat dump as the `maestro-debug` artifact; a flow that ends on the Android launcher means the app crashed, and logcat has the trace.
The AVD snapshot is cached between runs.

`android-emulator-runner` runs its `script` one line at a time, each through its own `sh -c` under dash.
So no `set -o pipefail`, and no `if` or `for` block either - which is why the update-loading sequence is `.github/scripts/load-e2e-update.sh`, called as a single line.

### What it costs

|                              | Reusing the APK | Building with Gradle |
| ---------------------------- | --------------- | -------------------- |
| Whole job                    | 6m38s           | 21m23s               |
| Deciding, and getting an app | 55s             | 16m43s               |
| Flows                        | 3m04s           | 3m04s                |

The reuse figure includes 1m33s creating the AVD snapshot, which a cache hit skips, so a run that finds one lands closer to five minutes.

## The test account

Flows sign in as `maestro+clerk_test@sendtally.com`.
It is a Clerk test email on the development instance, so the one-time code is always `424242` and nothing is sent.
The sign-in helper creates the account the first time it is missing.
Never point the flows at production keys: the address does not exist there and the fixed code is not accepted.

## Writing flows

- `helpers/open-dev-client.yaml` and `helpers/ensure-signed-in.yaml` start every flow; add new flows to `config.yaml` so `executionOrder` stays explicit.
- Swipes differ by platform. On iOS only a bare `direction: DOWN` reaches React Native's responder system; coordinate and element swipes go through a press-and-drag RN never sees. On Android a coordinate swipe works and is the one that starts on the sheet rather than the scrim. Split with `runFlow: when: platform:`.
- Keyboards differ by platform. On iOS `hideKeyboard` fails on these inputs; press `Enter` on a single-line field before swiping. On Android the keyboard covers the submit button and a tap on its stale position opens Gboard's settings, so run `helpers/hide-keyboard.yaml` after every `inputText`.
- A climb ledger row is one accessible element, so match it by its accessibility text, for example `V3 Cascade.*`, not by the name alone.
- The log-session form is longer than the screen; `scrollUntilVisible` to `\+ ADD CLIMB` before tapping it, and back up to `← LOG` to leave.
- Maestro matches a selector against the whole spoken string, so a row reads date-first and a tab reads `Projects, tab, 2 of 4` on iOS but just `Projects` on Android, so tap tabs with `Projects(, tab.*)?`; wrap the part you know in `.*`.
- A development build parks its floating menu button over the bottom-left corner, which is where the first chip of a grade rail sits. Tapping `index: 0` there opens the developer menu instead, and every later tap lands on it.
- A list that is still loading answers "no" to every `notVisible`, so a flow that creates its own fixture when one is missing has to wait for the screen to settle first or it makes a second one on every run.
- `project-opens` leaves its project on the test account on purpose and finds it again next run, scrolling for it because a row below the fold is not missing. `project-session-opens` deletes the session it logs.
