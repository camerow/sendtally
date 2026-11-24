# Checking mobile changes on a cloud simulator

Agents building or fixing mobile screens check their work on an Expo cloud simulator (EAS Simulator) rather than on the iOS simulator on Will's machine.
The cloud simulator runs on Expo's servers, so it takes no memory or processor time here and needs no simulator lock.
Use the local simulator only for the cases listed at the end.

The `expo:eas-simulator` skill is the reference for the commands; load it first.
This page records what is specific to sendtally.

## What runs where

- The simulator runs in Expo's cloud and is driven with `agent-device` through `eas simulator:exec`.
- The app is a development build, which loads its JavaScript from a Metro server in your worktree through an Expo tunnel, so an edit shows on the device without a rebuild.
- The app talks to the staging API (`https://api-staging.sendtally.com`), because a cloud simulator cannot reach `localhost:8787`.
  Staging uses the Clerk development instance, the same one local development uses.

## Steps

Run everything from `apps/mobile` in your worktree.

1. Check access: `npx --yes eas-cli@latest simulator:availability --json`.
2. Find a development build whose native code matches your branch.
   A local one is at `~/Library/Developer/Xcode/DerivedData/sendtally-*/Build/Products/Debug-iphonesimulator/sendtally.app`; take the newest and make sure no commit since it was built changed native code (`git log --since=<its date> -- apps/mobile/package.json apps/mobile/app.json apps/mobile/plugins`).
   If none matches, ask Will: either he builds one (`npx expo run:ios --no-bundler`) or he approves an EAS build with the `development` profile.
   An agent does not start an EAS build on its own.
3. Start Metro on a free port of your own, never 8081:
   `EXPO_PUBLIC_API_URL=https://api-staging.sendtally.com EXPO_UNSTABLE_TUNNEL_V2=1 npx expo start --dev-client --tunnel --port 8083`.
   Read the tunnel host from the manifest: `curl -s -H "expo-platform: ios" localhost:8083/`, field `extra.expoClient.hostUri`.
4. Start one session, always with a time cap and a name that says what it is for:
   `npx --yes eas-cli@latest simulator:start --platform ios --type agent-device --non-interactive --max-duration-minutes 45 --name "<what you are checking>"`.
5. Install and open the app:
   `simulator:exec npx agent-device@latest install com.sendtally.app <path to sendtally.app> --platform ios`, then
   `simulator:exec npx agent-device@latest open com.sendtally.app "sendtally://expo-development-client/?url=https://<tunnel host>" --platform ios --relaunch` with the three `-EXDevMenu...` launch arguments from the skill, then `alert accept 2500`.
   Wait for the `iOS Bundled` line in Metro's output before taking a screenshot.
6. Sign in with the Maestro test account, whose address and code are in `apps/mobile/maestro/helpers/ensure-signed-in.yaml`.
   Read them from that file in the command; do not print them in chat.
   Never sign in with a real account.
7. Drive the app and take screenshots with `snapshot -i`, `press`, `fill` and `screenshot`.
8. Stop the session as soon as you are done, also when the check failed:
   `npx --yes eas-cli@latest simulator:stop`, then `printf '# managed by eas-cli\n' > .env.eas-simulator`, then stop your Metro process.

## Things that cost time the first run

- `press` and `fill` are reliable with element references (`@e9`) from the latest `snapshot -i`, and a reference expires after any action, so take a new snapshot before each one.
  `fill` with a label selector reported success once without typing anything.
- A label must match exactly, and a row's label includes its subtitle, so use the reference for list rows.
- A tick box is not in the snapshot; press it by its coordinates from the screenshot.
- With the keyboard up, the snapshot lists every key; filter out `[key]` lines.
- The return key on a text field is labelled `next`.
- An App Store rating prompt can cover the Log right after sign-in; press `Not Now`.

## Rules

- One session per agent, and every session has `--max-duration-minutes`.
  Sessions are billed by the minute.
- The test account's data on staging is shared by every agent and by the Maestro flows.
  Name anything you create so it is recognisable, and do not delete what you did not create.
- `.env.eas-simulator` holds a session token; it is gitignored and stays that way.
- Report which build you installed and that the check ran against staging.

## When the local simulator is still the right tool

- The change needs the local API or a seeded local D1 database, such as a migration or an API change that is not on staging yet.
- Maestro flows (`docs/mobile-e2e.md`), which run against a local simulator.
- A device language check with `infra/scripts/sim-language.sh`.

In those cases the usual locks apply: take `~/.sendtally-sim-lock` first, then `~/.sendtally-dev-lock`, and release both when done.
