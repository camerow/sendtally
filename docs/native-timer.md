# Native timer: Live Activity and ongoing notification

While a training timer runs and the app is minimised or the phone is locked, the timer stays visible in the operating system, and tapping it returns to the running session.
iOS shows it as a Live Activity on the Lock Screen and in the Dynamic Island.
Android shows it as an ongoing notification with a native countdown chronometer in the status bar and the notification shade, promoted to a Live Update chip on Android 16 and later.
While a timed run is counting, the screen does not auto-lock.

## How the timer holds state today

The run is wall-clock data, not a ticking counter.
`Run` in `packages/core/src/hang/timer.ts` stores `phaseStartedAt`, `pausedAt` and `startedAt` as epoch milliseconds, and every transition takes `now` as an argument.
`useRun` (`features/training/timer/useRun.ts`) ticks a 100 millisecond `setInterval` that calls `tick(run, Date.now())`, which advances past every phase that has run out and carries the overflow into the next.
So a run that sat in the background catches up exactly on the first tick after the app returns.
Every change is persisted through `writeLiveRun` into `liveRunStorage` (a per-user draft file), which is what the live bar, `RestStrip` and resume-after-kill read.
The sets player keeps its own clocks the same way: `Rest.endsAt` (`features/training/rest/restCountdown.ts`) and `Hold.zeroAt` (`features/training/hold/holdClock.ts`) are absolute timestamps stored on the same `LiveRun`.
Sounds are played from JavaScript: `useTimerSounds` for the open timer, and `useRestTone` and `useLiveHold` at the root for rests and holds, each scheduled with `setTimeout`.

What this means for backgrounding:

- The state is correct after any amount of background time; nothing needs fixing there.
- JavaScript does not run while the app is suspended. iOS suspends the process a few seconds after it leaves the foreground, and React Native on Android pauses its timers when the activity pauses. So today the phase never visibly changes and no cue plays while minimised, even though the run is right when it comes back.
- Therefore the operating system surface cannot be driven by per-second or per-phase calls from JavaScript. JavaScript hands native code the upcoming schedule as absolute timestamps, and native code renders and advances it.

## Decisions

### iOS: local Expo module plus a SwiftUI widget extension, not a library

- `expo-widgets` (stable since SDK 56) was the first candidate because it is first party. It is rejected for this surface: its widget runtime only exposes `@expo/ui/swift-ui` components, and its docs describe no operating-system-rendered countdown (`Text(timerInterval:)`, `ProgressView(timerInterval:)`). Without that the countdown would need an update every second, which the system throttles and which cannot happen while the app is suspended. It is also iOS only and gives no stale date on update.
- Third-party templated Live Activity libraries are rejected for the same reason plus fixed layouts.
- Chosen: a local Expo module `modules/native-timer` (Swift for ActivityKit, Kotlin for Android) and a hand-written SwiftUI widget extension target `NativeTimerWidget`.
- The extension target is added at prebuild by `@bacons/apple-targets`, which generates the Xcode target and registers it with EAS credentials. Writing our own Xcode project mutation would be several hundred lines of `pbxproj` editing for no gain. This is the only new dependency.
- The Swift `ActivityAttributes` type is shared by the module and the extension through a single source file the plugin adds to both targets.

### Android: foreground service with a chronometer notification

- A notification with `setUsesChronometer(true)` and `setChronometerCountDown(true)` renders the countdown natively with no updates, which covers the visible half alone.
- It does not cover the phase changes and cues, because the JavaScript timers stop in the background. A foreground service ("a service the user can see", which Android keeps alive) owns the schedule and, at each phase boundary, updates the notification and plays the cue.
- Service type `specialUse` with subtype "workout interval timer". `mediaPlayback` would be dishonest with sound muted, `health` requires a body-sensor or activity-recognition permission we do not need, and `shortService` dies after three minutes.
- The notification uses a standard template (`BigTextStyle`, or `ProgressStyle` on Android 16+), never custom `RemoteViews`, so it qualifies for promotion to a Live Update status bar chip with `setRequestPromotedOngoing(true)`.
- Notifee was considered and rejected: it is a large dependency for roughly 200 lines of Kotlin, and its maintenance has slowed.

### iOS background execution: the cue audio keeps the run alive

ActivityKit has no way to schedule future content changes locally, so after the app is suspended the Live Activity cannot move to the next phase.
The alternatives considered:

- Server pushes over the Apple Push Notification service (APNs), from a Worker with Durable Object alarms. Rejected: hangs and rests of 3 to 10 seconds need an update every few seconds, which exceeds the push budget, and delivery latency of a second or more makes the phase visibly late. It also adds an APNs key, a new Worker binding and server state for a purely local feature.
- AlarmKit (iOS 26). Rejected: every phase end becomes a full alarm alert the user must dismiss.
- Chosen: the module plays the run's cues natively from an `AVAudioEngine` that stays running for the whole schedule, with background mode `audio`. The engine keeps the process alive, so a native `DispatchSourceTimer` updates the Live Activity at each boundary and plays each cue on time.
- This is honest background audio: the cues are the feature ("your timer keeps calling hang and rest with the phone locked"), the session mixes with the user's music as today, and the App Review notes say so.
- When the user has muted the timer, nothing plays, so the process is suspended as it is today. The Live Activity still counts the current phase to zero with `Text(timerInterval:)`, carries `staleDate` = end of that phase, and the stale layout says what came next and invites a tap. The run itself stays correct, and the activity is corrected the moment the app is foregrounded.
- If App Review rejects the audio mode, the fallback is to ship without it: the muted behaviour above becomes the behaviour for everyone, and nothing else in this design changes.

### One owner for cues

Native code plays every scheduled cue (the 3-2-1 ticks, phase-change tones, the finish, the end of a rest, the hold count-in and side changes), foreground and background alike.
`useTimerSounds` keeps only the tap feedback (`lift`, `miss`), and `useRestTone` and the cue part of `useLiveHold` are deleted.
Two owners would double-play on every transition around backgrounding, and the JavaScript ones never played while minimised anyway.
The audio session stays `playback` with `mixWithOthers`, so it still plays through the silent switch and alongside music; the module and `expo-audio` must set identical options or the last one to activate wins.

### Controls on the system surface: none in v1

Decided against pause, skip and next set on the Lock Screen, Dynamic Island and notification for now.

- Every control turns a one-way render into a two-way state channel: the action happens in native code while JavaScript may be suspended or dead, so it has to be queued with its timestamp, applied to the persisted `Run` on the next launch, and reconciled with whatever the app did meanwhile. That reconciliation is where this feature's bugs would live.
- Skip and next set are corrections a climber makes while looking at the full timer; on a Lock Screen in a chalk bag they are pocket taps waiting to happen.
- Pause is the only one with a real use (a longer rest without unlocking), and it is one tap plus Face ID away through the deep link.
- If we add one later, it is Pause/Resume only: an iOS `LiveActivityIntent` button and an Android notification action, both writing a `{action, at}` record that JavaScript applies with `togglePause(run, at)`. The pure, timestamp-taking core makes that exact. Nothing in v1 blocks it.

### Screen kept awake while a timed run counts

`useKeepAwake()` already runs inside `useTimer`, so the open timer and intervals screens never lock.
It does not cover the sets player's rests and holds, or a run left counting while the climber browses another tab.
Move it to the root sync hook: keep the screen awake whenever the live run is counting (a timer run that is not paused and not waiting on a tap, an unfinished rest, or a running hold), and release it otherwise, using `activateKeepAwakeAsync` / `deactivateKeepAwake` with a fixed tag.
Remove it from `useTimer` so there is one owner.
It only applies while sendtally is on screen; if the climber locks the phone themselves, the Live Activity or notification takes over.
No setting for it in v1: a paused or tap-waiting run already releases it, which covers the case where someone walks away.

## The payload

JavaScript builds the schedule; native code only renders and steps through it.
All strings are localised in JavaScript with `t()` before they cross the bridge, so neither the extension nor the service carries catalogues.

```ts
type NativeTimer = {
  /** `startedAt` of the live run; a new id is a new run. */
  runId: string;
  title: string;
  /** Kind label shown under the title: "Hangboard", "Intervals", "Strength". */
  meta: string;
  muted: boolean;
  /** Upcoming steps in order, the current one first. */
  steps: Step[];
  /** Set while paused: the current step frozen with this many seconds left. */
  pausedLeftS: number | null;
  /** Set while paused: 0 to 1 through the paused step, for the frozen bar. */
  pausedShare: number | null;
  /** The word before the next step's label, "Next". */
  nextText: string;
  /** The stale line, "Open sendtally"; always sent, since the app is suspended by the time it shows. */
  openHint: string;
};

type Step = {
  look: "work" | "rest" | "ready" | "done";
  /** "Hang", "Rest", "Set rest", "Lift", "Get ready", "Rest 1:30 · then Pull-ups". */
  label: string;
  /** "Set 2 of 6", "Lap 3 of 5", "Ring row · Set 1 of 3". */
  setLine: string;
  startsAt: number;
  /** Null for a step that waits for the user (a tapped lift); the schedule stops there. */
  endsAt: number | null;
  /** "Tap to log" on a tapped step, "Open to save" on done, else null. */
  hint: string | null;
  /** 0 to 1 through the whole run at the start of this step, for a run-level bar. */
  runShare: number;
  /** Cues at absolute times inside this step. */
  cues: { at: number; sound: "tick" | "work" | "rest" | "finish" }[];
};
```

- The schedule runs from now to the first step that needs the user (a tapped phase), the finish, or 64 steps, whichever comes first. Paused runs send only the current step.
- The pure part lives in core: `upcomingPhases(run, now)` in `packages/core/src/hang/schedule.ts` returns the phases with absolute `startsAt` / `endsAt`, built by repeatedly applying the same rules as `tick`, so the native schedule cannot disagree with what the app shows on return.
- The mobile side, `nativeTimerOf(liveRun, now)` in `features/live-session/nativeTimer.ts`, adds labels, looks and cues for all three sources: a timer run (`state.player === "timer"`), a rest (`Rest.endsAt`), and a hold (the existing `cues(hold)` list from `useLiveHold`). It returns `null` when nothing is counting.
- iOS `ContentState` carries only the current step plus the next step's label (well under the 4 KB limit); the full schedule stays in the module's memory and in `UserDefaults` for relaunch.
- Android keeps the schedule in the service and in `SharedPreferences`.

## Lifecycle

One root hook, `useNativeTimer()` in `features/live-session/useNativeTimer.ts`, mounted in `app/_layout.tsx` next to `useLiveHold`, subscribes to `useLiveRun()` and calls the module.
Every player already writes every change to the live run, so no player code changes for the surface; the root hook is the single sync point.

| Event                                             | JavaScript                                        | iOS                                                                                                                                       | Android                                                                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start (first live run write, app in foreground)   | `NativeTimer.sync(payload)`                       | `Activity.request`, start audio engine and step timer                                                                                     | `startForegroundService`, post notification                                                                                                                                |
| Phase change, skip, restart, previous or next set | `sync(payload)` with the new schedule             | Replace schedule; update activity; reschedule cues                                                                                        | Replace schedule; `notify`; reschedule cues                                                                                                                                |
| Boundary reached with the app suspended           | nothing                                           | Step timer updates the activity to the next step                                                                                          | Service updates the notification to the next step                                                                                                                          |
| Pause                                             | `sync` with `pausedLeftS`                         | `Text(timerInterval:pauseTime:)` frozen; engine stops, so the app may suspend                                                             | Chronometer off, static "Paused · 0:41"; cues cancelled                                                                                                                    |
| Resume                                            | `sync` with a fresh schedule                      | As phase change; engine restarts                                                                                                          | As phase change                                                                                                                                                            |
| Schedule reaches a tapped step                    | nothing                                           | Shows "Lift · tap to log" with no countdown; engine stops after the last cue                                                              | Same text; service demotes itself (`stopForeground(STOP_FOREGROUND_DETACH)`) and stops, leaving an ordinary ongoing notification                                           |
| Run finishes in the background                    | nothing                                           | Finish cue; activity shows "Done · open to save"                                                                                          | Finish cue; same text; service demotes and stops                                                                                                                           |
| Run saved or discarded (`clearLiveRun`)           | `sync(null)`                                      | `end(dismissalPolicy: .immediate)`                                                                                                        | Cancel notification, stop service                                                                                                                                          |
| User dismisses the surface                        | nothing                                           | Activity state `.dismissed`; module remembers the `runId` and does not restart it for that run; cues continue while sound is on           | A promoted or foreground notification cannot be swiped on Android 14+ except by the user turning it off; if the channel is disabled the service still steps and plays cues |
| App killed (swiped away or by the system)         | gone                                              | Process dies, so updates and cues stop; activity survives and goes stale at the current step's `staleDate`                                | Service keeps running (`stopWithTask="false"`), so the notification and cues continue to the end of the schedule; force-stop kills both                                    |
| Relaunch                                          | `sync(payload or null)` once the live run is read | `null` ends every activity of this type (stale activity from a run that was saved elsewhere or lost); otherwise reuse by `runId` or start | Same reconciliation                                                                                                                                                        |
| iOS system limit (8 hours active)                 | nothing                                           | System ends it; next foreground `sync` starts a new one                                                                                   | not applicable                                                                                                                                                             |

`sync` is idempotent: the same payload twice is a no-op, so the hook can call it on every live run change and on every foreground (`AppState` "active") without diffing in JavaScript.
An activity can only be requested while the app is in the foreground, which always holds for the start because a run is started by a tap.

## Deep link back to the session

- Every surface opens `sendtally://live`.
- Route `app/live.tsx` renders `LiveLink` from `features/live-session/LiveLink.tsx` (a test under `app/` would be bundled as a route), which reads `readLiveRun()` and redirects to `liveRunHref(run)`; with a live climbing session it redirects to `/session/live`; with neither (a stale surface whose run is gone) it redirects to `/`.
- A fixed URL beats encoding the player route and params into the activity: the run may have moved on, been saved on another screen, or been replaced, and the route resolves whatever is live at tap time.
- `+native-intent.ts` already passes `sendtally:` links through untouched, and the scheme is already registered from `app.json`.
- iOS: `.widgetURL(URL(string: "sendtally://live"))` on the Lock Screen view and every Dynamic Island region.
- Android: `contentIntent` is an immutable `PendingIntent` for `ACTION_VIEW sendtally://live` targeted at our package, so it lands on the existing single-task main activity.

## Sound and haptics in the background

- Cues: native, as described under "One owner for cues". Sound files stay in `assets/sounds/` as the one source: iOS reaches them through the `Sounds` symlink in the module's `ios/` folder (a pod resource bundle), Android through a Gradle assets `srcDir`. No copy step.
- Android plays cues with `SoundPool` and `AudioAttributes.USAGE_ASSISTANCE_SONIFICATION`, without requesting audio focus, matching "mix with music".
- Muted state is part of the payload; toggling mute in the app is a `sync`.
- Haptics: the app has none today (`expo-haptics` is not installed). Not added in v1; the cue sound is the signal. If wanted later, Android can vibrate from the service at work starts; iOS cannot vibrate from the background outside a notification.

## Permissions

- iOS: `NSSupportsLiveActivities = YES` and `UIBackgroundModes = [audio]` in `Info.plist`, both from the config plugin. Live Activities need no runtime prompt; the user can turn them off per app, so the module exposes `areActivitiesEnabled` and the app simply skips the activity when it is off. No notification permission is needed.
- Android, declared in the module's own `AndroidManifest.xml` and merged at build: `POST_NOTIFICATIONS` (13+, runtime), `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE`, and `POST_PROMOTED_NOTIFICATIONS` (16+, install time), plus the `<service android:foregroundServiceType="specialUse">` with its `PROPERTY_SPECIAL_USE_FGS_SUBTYPE` property.
- The notification permission is requested the first time a timer starts, through the existing `requestNotifications()` path, not at app launch. Declined is fine: the service still runs and plays cues, the notification is simply hidden.
- New notification channel `timer`, importance `LOW` (updates never buzz; the cues are our own audio), name from `t()`. Not `MIN`, which would block promotion.

## Testing

Unit (Jest, colocated):

- `packages/core/src/hang/schedule.test.ts`: table-driven `upcomingPhases` cases mirroring `hang.test.ts`: fresh run, mid-phase, paused, stops at a tapped phase, finished, after `skip` / `nextSet` / `restartPhase`, and an invariant that walking `tick` across every returned boundary lands on the next returned phase.
- `features/live-session/nativeTimer.test.ts`: payload for a timer run, an intervals run with laps, a rest, a hold with sides, paused, and `null` when nothing counts; labels come from the catalogue.
- `features/live-session/useNativeTimer.test.tsx`: with the module mocked in `jest.setup.ts`, a live run write calls `sync(payload)`, a clear calls `sync(null)`, foregrounding resyncs, keep-awake follows "counting".
- `features/live-session/LiveLink.test.tsx`: redirects to the timer, the live session, and home.
- Existing `useTimerSounds` / `useRestTone` / `useLiveHold` tests are updated to the reduced JavaScript sound set.

Maestro: not in this pull request (Will's call); end-to-end coverage beyond Jest is a later pull request.
The flows worth writing then: `sendtally://live` opens the running timer and falls back to home once the run is gone, and on Android the shade notification opens the run.

Manual device pass (both platforms, release build):

- An iPhone with a Dynamic Island and one without; an Android 16 phone (Live Update chip) and an Android 13 or 14 phone.
- Lock during a repeaters set and watch three phase changes and their cues; the same muted (iOS goes stale at the first boundary and corrects on unlock).
- Pause, lock, unlock, resume; start a run with music playing.
- Reach a tapped lift while locked; finish a run while locked and open it from the surface.
- Swipe the app away mid-run and relaunch from the surface; discard the run elsewhere and confirm a stale surface disappears on next launch.
- Long rests in the sets player and a two-sided hold while minimised.
- Notification permission declined on Android; Live Activities turned off on iOS.
- Screen stays on through a rest on the sets screen, turns off once paused.

## Release impact

- Native code, two new targets and new entitlements: the fingerprint moves, so this ships as a store build on both platforms, never an EAS Update (`docs/mobile-release.md`).
- iOS: a new bundle id `com.sendtally.app.NativeTimerWidget` needs its own provisioning profile; EAS creates it on the first build once `@bacons/apple-targets` has registered the extension. App Review notes explain the background audio.
- Android: Play Console foreground service declaration for `specialUse`, with a short video of the timer notification; expect review to take longer than a normal release.
- The development build must be rebuilt (`eas build:dev`) before anyone can run this branch; PR mobile previews of it will report a moved fingerprint and publish nothing, as designed.
- Minimum versions: Live Activities need iOS 16.2, `Text(timerInterval:)` with `pauseTime` needs 16.2; both are below the SDK 57 floor. Android Live Update promotion is 16+ and degrades to an ordinary ongoing notification below.

## Files

Create:

- `apps/mobile/modules/native-timer/` local Expo module: `expo-module.config.json`, `index.ts` (`sync`, `areActivitiesEnabled`), `ios/NativeTimerModule.swift`, `ios/CueEngine.swift`, `ios/NativeTimerAttributes.swift` (shared with the extension), `android/.../NativeTimerModule.kt`, `android/.../NativeTimerService.kt`.
- `apps/mobile/targets/native-timer-widget/` for `@bacons/apple-targets`: `expo-target.config.js`, `NativeTimerWidget.swift` (Lock Screen and Dynamic Island views), `Info.plist`.
- `apps/mobile/plugins/with-native-timer.js`: `Info.plist` keys (`NSSupportsLiveActivities`, `UIBackgroundModes` audio). Android permissions and the service live in the module's manifest.
- `packages/core/src/hang/schedule.ts` and `schedule.test.ts`.
- `apps/mobile/features/live-session/nativeTimer.ts`, `nativeTimer.test.ts`, `useNativeTimer.ts`, `useNativeTimer.test.tsx`.
- `apps/mobile/app/live.tsx`, `apps/mobile/features/live-session/LiveLink.tsx`, `LiveLink.test.tsx`.

Change:

- `apps/mobile/app.json`: add `@bacons/apple-targets` and `./plugins/with-native-timer.js`.
- `apps/mobile/package.json`: `@bacons/apple-targets`.
- `apps/mobile/app/_layout.tsx`: mount `useNativeTimer`; drop `useRestTone`.
- `apps/mobile/features/training/timer/useTimer.ts`: drop `useKeepAwake` (moves to the root hook).
- `apps/mobile/features/training/timer/useTimerSounds.ts`: keep only `lift` / `miss`.
- `apps/mobile/features/training/hold/useLiveHold.ts`: keep the recording, drop the cue playback; export `cues` for `nativeTimer.ts`.
- `apps/mobile/features/training/rest/useRestTone.ts` and its test: delete.
- `apps/mobile/features/training/reminders/notifications.ts`: add the `timer` channel beside `reminders`.
- `apps/mobile/jest.setup.ts`: mock `native-timer`.
- `packages/core/src/hang/index.ts`: export `upcomingPhases`.
- `packages/features/src/i18n/locales/{en,de,fr,es}/`: `training.timerChannel`, `hang.openToSave`, `hang.tapToLog`, `hang.openSendtally` (reuse `hang.tapAfterLift` if its wording fits the surface).
- `apps/web/app/routes/privacy.tsx` needs no change (nothing leaves the device); `docs/mobile-release.md` gets a line on the Play declaration and the extension's profile.

## Constraints for UI designer

Design both surfaces with the real tokens and `phaseLook` colours (`HANG_ON_DARK` / `dataAzureSoft` for work, `REST_ON_DARK` / `dataFernSoft` for rest, white or `ON_DARK_SOFT` for get ready), the same way the in-app timer does.

### Data available to every layout

- `title` (workout name, can be long), `meta` (kind label).
- Current step: `look` (work, rest, ready, done), `label` ("Hang", "Set rest", "Lift"), `setLine` ("Set 2 of 6", "Lap 3 of 5"), countdown to `endsAt` or none for a tapped step, paused flag with frozen seconds left.
- Next step's `label` (for "then Pull-ups" and for the stale state).
- `runShare` 0 to 1 for a whole-run bar, plus the current step's own progress as an operating-system-drawn bar.
- Nothing else: no rep dots, no load, no grip name, no notes. Ask if a field is needed; each is a payload change.

### iOS Lock Screen (and the banner on a notification-less iPhone)

- Full width minus system margins (about 343 to 390 points), maximum height 160 points; anything taller is clipped.
- Background is our tint (`activityBackgroundTint`); text must pass contrast on it, and the Always-On display dims and desaturates it.
- The countdown must be `Text(timerInterval:countsDown:)` and any bar `ProgressView(timerInterval:)`: the system draws them every second without us. We cannot format them freely (system `m:ss` or `h:mm:ss`, monospaced digits available), and `Text(timerInterval:)` reserves width for its longest value, so give it a fixed frame rather than centring it in flexible space.
- Content changes only at phase boundaries, as one update. Allowed motion is the system transition between two updates (`contentTransition(.numericText())`, opacity); no custom animation, no per-second redraw of anything except the two timer views above.
- Custom fonts are allowed if bundled in the extension; IBM Plex Mono and Bricolage are available, but each font file adds to the extension size, so use at most two weights.
- One tap target: the whole surface opens the session. No buttons in v1.
- Needs four states beyond the normal one: paused (frozen time), waiting for a tap ("Lift · tap to log", no countdown), stale (app suspended with sound muted, the phase on screen has ended: show what came next and "Open sendtally"), and done ("Done · open to save").
- Strings for those states come from the payload: `Step.hint` ("Tap to log", "Open to save") and `openHint` ("Open sendtally").
- Compact and minimal Island: a circular `ProgressView(timerInterval:countsDown:)` tinted with the phase mark colour, label hidden; the system draws its stroke width, so it will not match `TimerRing` exactly. Compact trailing shows the countdown, or `label` when there is none ("Lift", "Done"), or nothing beside a muted ring when stale. Fallback if the ring does not advance on device: a static tinted dot that changes at phase boundaries.
- Android `ProgressStyle`: progress is `runShare`, one segment tinted by the current step's look. No per-set segments in v1.

### iOS Dynamic Island

- Background is always black; use the on-dark colours.
- Compact (one activity running): leading and trailing slots either side of the camera, about 52 by 37 points each. Realistically a phase glyph or tinted dot on the left and the countdown on the right, 4 to 5 characters ("2:41").
- Minimal (another app's activity is also running): one circular slot about 37 points; a tinted progress ring with or without a glyph, no readable countdown fits.
- Expanded (long press): leading, trailing, center and bottom regions, up to about 160 points tall; roughly the Lock Screen content condensed, with the bottom region full width.
- Every region opens the same deep link.

### Android notification

- Standard template only (title, text, `BigTextStyle` expanded text, or `ProgressStyle` on Android 16+). No custom layouts: a custom `RemoteViews` disqualifies the Live Update chip and is limited to 64 dp collapsed / 256 dp expanded anyway.
- The countdown is the system chronometer in the header slot: we choose when it ends, not its font, size or colour.
- Small icon: the existing monochrome `notification-icon.png`; the accent `setColor` (today `#403f4c`) tints the icon and app name only. No colorised background (it blocks promotion).
- Collapsed: title (about 40 characters before ellipsis) and one line of text. Expanded: a few lines of text.
- `ProgressStyle` (16+) can draw the run as coloured segments (sets) and points (current position), which is the one place we get our phase colours; below 16 it falls back to a plain single-colour progress bar.
- Live Update status bar chip (16+): app icon plus either the chronometer or text up to 96 dp wide (about 7 characters, "Rest 1:30" may truncate). The system decides when to show it; the user can demote it.
- Up to three text action buttons are possible; none in v1.
- Updates happen only at phase boundaries; Android drops bursts faster than a few per second, which we never approach.
- Tap target: the whole notification opens the session.
