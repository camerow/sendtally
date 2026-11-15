# First-run onboarding

Status: spec for direction C, agreed between onboarding-eng and onboarding-designer on 2026-11-14 after Will asked for an onboarding flow; directions A and B are superseded.
Design board: "First run C: three questions, then a week that is already planned" (`FirstRunC.dc.html`, x 0, y 0) on the "First run onboarding" page (id `first-run`) of the canvas https://claude.ai/artifact/CNPnNQwgvzgvxk4ZAYTyto.
The superseded boards A and B sit below it under "Superseded: A and B" (y 2380 and y 4840).

## The question

A person who has never heard of Sendtally installs the app and signs up.
What gets them to log a first session, bring in their history, understand that exercises make up workouts and workouts make up blocks, make a first plan, and keep coming back?

Will, 2026-11-14: "people want an onboarding, let them schedule their usual climbing days, some lifting or hangboarding if they choose. they need to start creating right away."
He also wants to ask about importable logs or a personal spreadsheet, to get a basic recurring schedule with reminders in place, and to know what each person is interested in.

## Recommendation in short

A short flow, once per account, right after sign-up: what brings you here, your usual week, reminders, and whether you keep a log already.
The week is saved as the existing Ongoing plan, so the person ends on a Plan that is already filled, with reminders on their days and an import under way if they keep a log.
The only new building blocks are one built-in "Climbing" workout, one flag on the account, and the events that record the answers.

## 1. What a new account sees today

### Signed out (mobile)

- `app/index.tsx` sends a signed-out person to `/onboarding`: a four-slide carousel (`OnboardingCarousel`, slides Log, Effort score, Strava, Stats) with Create account (gold) and Sign in, and the footer "Free to log · no card on file".
- The Strava slide says "Sessions are fingerprinted, so a re-sync never posts twice." (`onboarding.strava.body`), which talks about syncing and breaks the copy rule in `CLAUDE.md`.

### After sign-up, mobile

`app/index.tsx` redirects every signed-in person to `/(tabs)/today`, so the first screen is Plan.
Will has since made Log the first tab and the screen the app opens on (tabs Log, Plan, Train, Stats), built on `feat/log-tab-first`; the table below is the app before that change.

| Tab                 | What an empty account sees                                                                                                                                                                                              | Code                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Plan (first screen) | Today's date, the week strip, seven day rows where only Today is full size, "Rest day" with "Nothing planned. Tendons adapt between sessions, not during them.", and the Schedule floating button                       | `features/training/today/TodayScreen.tsx`, `DaySection.tsx`              |
| Log, Climbing       | `SetupStack` (Add your gym, Strava optional, each dismissible), then `ClimbingEmpty`: two faded example rows, "First session", gold Live session, then Log session, Add climb, Import a log                             | `features/sessions/SessionsLog.tsx`, `features/climbs/ClimbingEmpty.tsx` |
| Log, Training       | `TrainingEmpty`: two faded example rows, "First workout", gold Start a workout (opens Train > Workouts), Log a workout, Journal, Injury                                                                                 | `features/sessions/TrainingEmpty.tsx`                                    |
| Train               | Opens on Blocks: one `DashedPanel` "Nothing planned yet. Put climbing, hangboard and the rest of your training on your week." Workouts and Exercises show the built-in library. Create opens block, workout or exercise | `features/training/train/TrainScreen.tsx`, `BlocksList.tsx`              |
| Stats               | Empty ranges                                                                                                                                                                                                            | `features/stats/StatsScreen.tsx`                                         |

Seeded for every account: the built-in workouts (`packages/features/src/workouts/builtIns.ts`) and exercises (`packages/core/src/hang/builtIns.ts`).
Not seeded: no blocks, no plan, no ready-made library blocks (they do not exist in code; #255 depends on them).
The 30-day trial does not exist yet either (#259 is open): there is no trial clock, banner or lock, so today a new account sees no trial at all.

### After sign-up, web

- Sign-up, the email code and Google all finish on `/app`, which is Log (`apps/web/app/routes/app._index.tsx`, `LogPage.tsx`).
- Log shows the same `SetupStack` (gym, Strava) and the same `ClimbingEmpty` and `TrainingEmpty` as mobile.
- `/app/setup` (the Strava explainer) is only reachable from the Strava card, Settings and the Strava callback.
- Plan, Train and Stats show the same empty states as mobile; there is no welcome, checklist or trial UI.
- The carousel keys are unused on web.

### What a newcomer does not understand

- Mobile opened on the emptiest screen in the product, an empty week, before anything was logged (fixed by Log first).
- Nobody is asked what they came for, so the app cannot start them on it, and we cannot tell who wants training, logging, progress or hangboarding.
- A recurring week needs Train > Create > block or Plan > Schedule, which a newcomer has no reason to find.
- Nothing shows what a block is: Train > Blocks is a dashed panel, and the only way to see one is to build one from blank.
- Import is the last of four rows on Log, below the fold of the setup cards.
- Projects appear nowhere until a climb exists and its page is opened.

## 2. Evidence

PostHog, project 594324, accounts created 2026-09-15 to 2026-11-14, internal cohort excluded, counts only.
These are one-off queries, not saved definitions.

| Measure                                               | Accounts |
| ----------------------------------------------------- | -------- |
| Accounts created (`account_created`)                  | 23       |
| Opened the mobile app                                 | 19       |
| Logged a session (`manual_session_created`)           | 10 (43%) |
| Logged two or more sessions                           | 5        |
| Added a gym (`gym_created`)                           | 7        |
| Started connecting Strava                             | 5        |
| Marked a project (`project_marked`)                   | 2        |
| Imported a log (`sessions_imported`)                  | 1        |
| Started a membership                                  | 2        |
| Seen on one day only                                  | 14 of 23 |
| Active on days 8 to 14, of the 15 accounts old enough | 3 (20%)  |

What it says: Will's hypothesis holds.
More than half never log anything, most are seen once, and one in five comes back in week two.
The sample is small, so read it as direction, not rate.

What cannot be answered, because the events do not exist:

- Nothing is captured for creating an exercise, workout or block, for scheduling, or for starting or logging a workout, so "made a first plan" and "understood the training model" are unmeasurable today.
- Nothing is captured for empty-state or setup-card taps, or for opening the import screen, so we cannot see where people stop, only that they do.
- Imported sessions are stored as `source = "manual"` and only `sessions_imported` marks them.

## 3. Recommended direction: the flow

Agreed with the designer; the board draws every state named here.
Every question step has Skip at top right; Skip ends the flow, keeps the answers already given and sets the flag.

### Step 1: What brings you here

- Header "1 of 3".
- Four `OptionRow`s used as checkboxes (gold tint and check when on): Track my climbing, Follow a training plan, Hangboard workouts, See my progress.
- Azure Continue.
- Recorded as `goals`: `track_climbing`, `follow_training`, `hangboard`, `progress`.

### Step 2: Your usual week

- Header "2 of 3".
- `PlanGrid` with editing on; tap cells to set days.
- The Climbing row always shows; 5x5 strength shows only if Follow a training plan was picked, Max hangs only if Hangboard workouts was picked.
- Continue saves one Ongoing membership per row with days set (`block_id` null, `weekdays_json`, start today), through the existing `PUT /v1/memberships/:id`.
- With no days set, nothing is saved and the reminder step is skipped.

### Step 3: Reminders

- Only when a day was set.
- Saving the week is the account's first plan, so the existing `ReminderPromptProvider` asks with the unchanged `ReminderPromptSheet` over step 2: Remind me (the only route to the system notification dialog) or Not now.
- Reminders are the existing local scheduled notifications for planned days (`features/training/reminders`), saved through `PUT /v1/preferences/training-reminders`; there is no new trigger.

### Step 4: Do you keep a log already?

- Header "3 of 3".
- Single-choice `OptionRow`s: Kaya, 8a.nu, Mountain Project, Sendage, theCrag, A spreadsheet (CSV), No, this is my first.
- With a source picked the azure button reads "Import from Kaya" (and so on) and opens the existing `ImportScreen`; the spreadsheet opens the same screen.
- A Later link, or No, goes to Plan.
- Recorded as `existing_log`: `kaya`, `8a`, `mountainProject`, `sendage`, `theCrag`, `spreadsheet`, `none`.

### Step 4 in detail: importing an existing log

Checked against `origin/main` on 2026-11-14, including #418 (Sendage sends exports) and #419 (connector session tools).
The importer recognises a file by its header (`detectFormat` in `packages/core/src/import/plan.ts`), reads columns by name, and never fetches from any service: the person exports the file themselves.

| Answer               | Imports today                                                          | How the person gets the file                                                                                                                         | New work                                                                                                                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kaya                 | Yes, pinned to a real export's layout (#379)                           | Not documented anywhere public; Kaya's help covers importing into Kaya only                                                                          | The in-app steps; Will has exported one, so the menu path comes from him. The day of a date-only climb follows the phone's time zone                                                                                                                                  |
| 8a.nu                | Yes                                                                    | On the 8a.nu website: My Logbook, the pencil under About, then "Logbook Export (CSV)" at the bottom (per Kaya's and theCrag's help, not 8a.nu's own) | Steps and a direct link; today the link is a Google search. `tries` is not a real count there, so every climb imports as one try                                                                                                                                      |
| Mountain Project     | Yes                                                                    | On the website: your profile's Ticks page, "Export CSV"                                                                                              | Steps and a direct link to the Ticks page; today a Google search                                                                                                                                                                                                      |
| Sendage              | Yes, both the preamble export and the sends export (#418)              | "Export My Sends"; free Sendage accounts can export once every 30 days and four times a year                                                         | Steps, a direct link, and saying the 30-day limit. The preamble layout comes from another project's test, the least certain format                                                                                                                                    |
| theCrag              | Yes                                                                    | Logged in, the dashboard's Action menu, "Select logbook as CSV"; it opens in the browser to save                                                     | Steps; the link (`exportlogbook` article) already exists                                                                                                                                                                                                              |
| A spreadsheet (CSV)  | Only in the Sendtally CSV format; anything else shows "not recognized" | The person's own file                                                                                                                                | Mobile has neither the column guide nor the conversion prompt the web import has; the web's "Connect an AI assistant" page can also import a spreadsheet through Claude or ChatGPT (#419). Spec: on mobile, point to both on the web rather than rebuilding the guide |
| No, this is my first | Nothing to import                                                      |                                                                                                                                                      | Goes straight to Plan                                                                                                                                                                                                                                                 |

The rest of the flow reuses the import screens as they are:

- Choose file: `ImportScreen`'s `File.pickFileAsync({ mimeTypes: "text/csv" })`; there is no paste, and none is added.
- Review: `ImportReview` with the format named ("Kaya export"), sessions, climbs, top grade and rows skipped, the skipped rows with their reasons (`RowIssues`), and likely duplicates of sessions already in the log (`LikelyDuplicates`, with Import anyway).
- Not recognized: `NotRecognized` with Choose a different file.
- Result: today `ImportScreen` dismisses to `/profile` with `imported`, `skipped` and `likely`; from the flow it returns to Plan with the same counts in the toast.
- Failure: `importAll` sends batches of 200, so a failure partway leaves the earlier batches saved and shows `import.failed` on the review screen; trying again is safe because the server skips any session already there by fingerprint and counts it as skipped.
- Skip for now and Later go straight to Plan; afterwards import lives where it does today, in Log's empty state ("Import a log"), Settings and the account menu.

New work across all sources:

- A per-source steps screen between the answer and Choose file (four locales; menu names stay as each service writes them, in English).
- Sends and attempts counts on the review: today it shows sessions, climbs, top grade and rows skipped (`planStats`); adding the two counts is a small transform change.
- Direct export links for 8a.nu, Mountain Project and Sendage in `EXPORT_PAGES`.
- The picker accepts only `text/csv`; a file saved from a browser can arrive as `text/plain` and show greyed out, so widen it to `text/plain` and `text/comma-separated-values` as well.
- Most exports are website downloads, usually on a computer; the steps say so, and the flow carries on to Plan if the file is not on the phone yet.

### Step 5: Plan, once

- The week filled (`WeekStrip` dots), today's `OccurrenceCard` with Start, then the coming days.
- After an import, the existing import result toast ("Imported N sessions", View).
- From then on the app opens on Log, as for everyone.

### Later, and skipping

- The same week lives in Train > Blocks > Ongoing (`OngoingScreen`, unchanged), which is the way back to edit it.
- Someone who skips everything lands on Log, empty (`ClimbingEmpty`, unchanged).
- Strava and gym stay the setup cards on Log; they are not in the flow.

### How it answers the brief

- First session: a climbing day planned for today shows Start on Plan, which opens the live session; Log's empty state is unchanged for everyone else.
- Import: asked once, at the moment someone is most willing, and routed straight into the existing screen.
- Exercise, workout, block: the week is drawn as the block grid with workouts as rows, and a row opens the workout with its exercises; no copy explains it.
- First plan: made in the flow, a recurring week rather than a blank builder.
- Projects: not in the flow; 2 of 23 accounts marked one and no email covers it.

### Rejected

- Direction A (open on Log, an Import setup card, one Starter block): Will found it had not simplified or clarified much.
- Direction B (one start question with three doors): replaced by asking the questions that let us build the person's week.
- A tour, coach marks or explanatory screens: they explain instead of starting the person on real work.
- A ready-made multi-week block as the first plan: a person's own usual days are simpler and need no library blocks, which do not exist yet (#255).

## 4. How it is built from what exists

### New pieces

| Piece                                                                             | Where                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Built-in workout "Climbing" (kind `climbing`), whose Start opens the live session | The built-in catalogue in `@sendtally/core`, added through the `library-add` skill; it needs one item to satisfy the "a built-in workout always has items" rule, and how Log it behaves is decided in the build |
| `users.start_answered`                                                            | Drizzle column (integer, default 0), generated migration, read and written through the existing preferences route, the same way as `training_reminder_prompt_seen`                                              |
| The flow screens                                                                  | `apps/mobile/app/first-run.tsx` and `apps/mobile/features/first-run/`, built from `OptionRow`, `PlanGrid`, `Button` and the existing sheets                                                                     |
| Import exit                                                                       | `ImportScreen` takes where to return; from the flow it dismisses to Plan instead of `/profile` (`features/import/ImportScreen.tsx:69`)                                                                          |

Everything else (Ongoing memberships, reminders, import, the live session, Plan) is used unchanged.

### When the flow shows

- Signed in, `start_answered` is 0, and the account has nothing logged and nothing planned.
- `app/index.tsx` decides it, reading the persisted query cache (`lib/QueryProvider.tsx`) and the preferences query; a brand new account has an empty cache, so it waits for that one request.
- The flag is set when the flow ends: on reaching Plan, on Later or No, or on any Skip.
- Quitting the app mid-flow brings it back on the next launch, which is acceptable.
- Because it lives on the account, an answer given on the phone holds on the web too.

### Existing accounts

- Any account with a session, a workout log or a plan never sees it.
- An existing empty account sees it once on its next launch after release; no backfill.

### Web

- Web signups are a small share (3 `signup_started` against 23 accounts), so the first release is mobile only and the web keeps today's Log.
- A web version later reuses steps 1, 2 and 4 and the same flag; web has no push notifications, so it has no reminder step.

### Localisation

- New keys in `en`, `de`, `fr`, `es`: the step titles, "{n} of {total}", the four goals, "No, this is my first", "A spreadsheet (CSV)", "Import from {source}", Later, and the "Climbing" built-in name.
- App names (Kaya, 8a.nu, Mountain Project, Sendage, theCrag) are literals, as in `IMPORT_SERVICES`.
- Labels are resolved in functions, never at module scope; the parity test in `i18n.test.ts` covers them.

### Trial and member gates

- The flow uses only built-in workouts and an Ongoing week.
- `billing-training-gates` keeps built-ins planned on single days free after the trial; whether a repeating Ongoing week of built-ins stays free is open for Will, and this plan makes no claim either way.
- The trial (#259), the locks (#258) and library blocks (#255) are not built, so today nothing in the flow is gated.

## 5. Events and privacy

New PostHog events, properties as enum strings or counts only:

| Event                      | Where              | Properties                                                           |
| -------------------------- | ------------------ | -------------------------------------------------------------------- |
| `first_run_started`        | Client             | none                                                                 |
| `first_run_goals_answered` | Client             | `goals`: comma list of the four enums; also set as a person property |
| `first_run_week_saved`     | Client             | `climbing_days`, `strength_days`, `hangboard_days` (counts)          |
| `first_run_log_answered`   | Client             | `existing_log` enum; also set as a person property                   |
| `first_run_finished`       | Client             | `ended_at`: `plan`, `skip_goals`, `skip_week`, `skip_log`            |
| `workout_started`          | Client, any player | `built_in`, `planned`: true or false                                 |
| `workout_logged`           | Worker             | `built_in`, `planned`: true or false                                 |

Existing events cover the rest: `training_reminders_updated` (reminders on or off) and `sessions_imported`, which gains `from`: `first_run` or `import_screen`.

What will show it worked, against section 2:

- Share of new accounts finishing the flow, and where the rest skip.
- Share with a week saved and with reminders on.
- Share starting or logging a planned workout within 14 days (unmeasurable today).
- Share with `manual_session_created` within 7 days (43% today).
- Import rate among those who named a source (1 of 23 imported today).
- Share active on days 8 to 14 (20% today).

`apps/web/app/routes/privacy.tsx`, in the "Usage" paragraph after the Areas sentence:

> When you start, the answers you give about what you want from sendtally and which app you kept a log in are recorded against your account, along with the number of days you planned; starting or logging a workout is recorded as whether it was planned and built in, never what you logged.

## 6. Delivery slices

1. **The mobile flow (smallest useful slice).** The "Climbing" built-in, `users.start_answered`, steps 1 to 5, the import exit to Plan, the `first_run_*` events, `sessions_imported.from`, and the privacy line.
2. **Measuring the planned week.** `workout_started` and `workout_logged`.
3. **Web flow**, steps 1, 2 and 4, if web signups grow.
4. **Spreadsheet column guide on mobile**, which the web import already has.
5. **Carousel copy**: rewrite `onboarding.strava.body` to drop "re-sync", which breaks the no-sync copy rule; small enough to ride with slice 1.

## 7. Left out on purpose

- Strava, gym and projects in the flow; they keep their homes on Log and the climb page.
- Ready-made library blocks and any explanation of blocks in copy.
- Push notifications other than the existing plan reminders.
- Storing the answers in D1: only PostHog needs them now; the flow keeps them in memory while it runs.
- Changes to the email series (branch `feat/onboarding-email-journey`) or to PostHog.

## 8. Open decisions for Will

- Whether a repeating Ongoing week of built-in workouts stays free after the trial (the free tier keeps built-ins planned on single days).
- The email series no longer matches the in-app order: the flow plans the week and asks about imports on day 0, while emails cover the first session on day 2, import on day 6 and training on day 18. The day 6 and day 18 emails could skip people who already imported or saved a week (`sessions_imported`, `first_run_week_saved`).
- The day-25 "trial ends" email assumes the trial in #259, which is not built; ship the trial first or hold that email.
- Step 2 carries the line "Change them any time in Train > Blocks > Ongoing.", which is the kind of explanatory line Will usually removes; keep it or drop it.
- Web flow now or later (spec: later).
