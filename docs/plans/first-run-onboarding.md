# First-run onboarding

Status: spec for direction D, Will's latest, agreed between onboarding-eng and onboarding-designer on 2026-11-14; directions A, B and C are superseded.
Design boards on the "First run onboarding" page (id `first-run`) of the canvas https://claude.ai/artifact/CNPnNQwgvzgvxk4ZAYTyto:

- "First run D" (`FirstRunD.dc.html`, x 0, y 0): the carousel and the two-step flow.
- "First run: bringing in an existing log" (`FirstRunImport.dc.html`, x 0, y 2020): the nine import frames and a card per source.
- Superseded C, A and B below them under "Superseded: C, A and B" (y 4120, 6200, 8660).

## The question

A person who has never heard of Sendtally installs the app and signs up.
What gets them to log a first session, bring in their history, understand that exercises make up workouts and workouts make up blocks, make a first plan, and keep coming back?

Will, 2026-11-14: "people want an onboarding, let them schedule their usual climbing days, some lifting or hangboarding if they choose. they need to start creating right away."
He also wants to ask about importable logs or a personal spreadsheet, to get a basic recurring schedule with reminders in place, and to know what each person is interested in.

## Recommendation in short

The signed-out carousel explains the product before sign-up: what Sendtally is, then exercises, workouts and blocks, one slide each.
After sign-up a two-step flow runs once per account: whether you keep a log already (and importing it), then which days you usually climb.
The days are saved as an Ongoing Climbing workout, the existing reminder sheet follows, and the flow ends on a filled Plan once; from then on the app opens on Log.
The only new building blocks are four carousel slides, one built-in "Climbing" workout, one flag on the account, per-source import steps, and the events that record the answers.

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

## 3. Recommended direction

Agreed with the designer; the two boards draw every state named here.

### Before sign-up: the carousel

- The signed-out `/onboarding` screen keeps `OnboardingCarousel`, Create account and Sign in.
- Four new slides replace the current Log, Effort score, Strava and Stats slides (Will, 2026-11-14): What is sendtally? (the log, with the effort score folded into its copy), Exercises, Workouts, Blocks.
- Each slide's art plays once when the slide shows; under Reduce Motion it shows its last frame.
- Slide 1's art (Will, 2026-11-14): the log card keeps its date line with "Effort 8/10" on the right and its three climb rows, and under them the real `Pyramid` (`apps/mobile/components/Pyramid.tsx`) shows V7 0/2, V6 3/4, V5 5/7 and V4 6/7, sends in `azureInk` and attempts in `dataAzureSoft`; its bars grow in after the rows land. The note line is gone; the slide body still mentions notes.
- To fit it, `OnboardingCarousel`'s `ART_BOX_HEIGHT` goes from 250 to 310 and `TEXT_BOX_HEIGHT` from 200 to 170, so the dots still clear the buttons on a 390x844 phone.
- No red text (Will, 2026-11-14; red is for destructive actions only): the eyebrows and the sent grades in the slide art move from `colors.labelAccent` to `colors.gunmetal`. Today that colour is set in `OnboardingCarousel.tsx:93` (eyebrow), `SlideArt.tsx:57` (`ClimbRow` sent grade) and `SlideArt.tsx:184`; any of them that survive the new slides change.
- The Strava slide, and with it "a re-sync never posts twice", goes.
- This is where exercise, workout and block are explained, before the person needs them.

### Step 1 of 2: Do you keep a log already?

- Single-choice `OptionRow`s: Kaya, 8a.nu, Mountain Project, Sendage, theCrag, A spreadsheet (CSV), No, this is my first.
- With a source picked, the azure button reads "Import from {source}" and opens that source's steps, then the existing import screens (see below).
- After an import, a Skip, Later or No, the flow continues to step 2.
- No explanatory line under the question.
- Recorded as `existing_log`: `kaya`, `8a`, `mountainProject`, `sendage`, `theCrag`, `spreadsheet`, `none`.

### Importing an existing log, in detail

Checked against `origin/main` on 2026-11-14, including #418 (Sendage sends exports) and #419 (connector session tools).
The importer recognises a file by its header (`detectFormat` in `packages/core/src/import/plan.ts`), reads columns by name, and never fetches from any service: the person exports the file themselves.

| Answer               | Imports today                                                          | How the person gets the file                                                                                                                         | New work                                                                                                                                                                                                                                                                                                          |
| -------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kaya                 | Yes, pinned to a real export's layout (#379)                           | Not documented anywhere public                                                                                                                       | No steps (Will, 2026-11-14): the existing Google search link, as today. The day of a date-only climb follows the phone's time zone                                                                                                                                                                                |
| 8a.nu                | Yes                                                                    | On the 8a.nu website: My Logbook, the pencil under About, then "Logbook Export (CSV)" at the bottom (per Kaya's and theCrag's help, not 8a.nu's own) | Steps and a direct link; today the link is a Google search. `tries` is not a real count there, so every climb imports as one try                                                                                                                                                                                  |
| Mountain Project     | Yes                                                                    | On the website: your profile's Ticks page, "Export CSV"                                                                                              | Steps and a direct link to the Ticks page; today a Google search                                                                                                                                                                                                                                                  |
| Sendage              | Yes, both the preamble export and the sends export (#418)              | "Export My Sends"; free Sendage accounts can export once every 30 days and four times a year                                                         | Steps, a direct link, and saying the 30-day limit. The preamble layout comes from another project's test, the least certain format                                                                                                                                                                                |
| theCrag              | Yes                                                                    | Logged in, the dashboard's Action menu, "Select logbook as CSV"; it opens in the browser to save                                                     | Steps; the link (`exportlogbook` article) already exists                                                                                                                                                                                                                                                          |
| A spreadsheet (CSV)  | Only in the Sendtally CSV format; anything else shows "not recognized" | The person's own file                                                                                                                                | Mobile already has the conversion prompt (`NotRecognized`: `import.convertTitle`, `import.convertHelpMobile`, Share prompt); it lacks the web's column guide. The spreadsheet frame reuses that card and points to the web column guide and the web's "Connect an AI assistant" import (#419); nothing is rebuilt |
| No, this is my first | Nothing to import                                                      |                                                                                                                                                      | Goes on to the days step                                                                                                                                                                                                                                                                                          |

The rest of the flow reuses the import screens as they are:

- Choose file: `ImportScreen`'s `File.pickFileAsync({ mimeTypes: "text/csv" })`; there is no paste, and none is added.
- Review: `ImportReview` with the format named ("Kaya export"), sessions, climbs, top grade and rows skipped, the skipped rows with their reasons (`RowIssues`), and likely duplicates of sessions already in the log (`LikelyDuplicates`, with Import anyway).
- Not recognized: `NotRecognized` with Choose a different file and its conversion prompt.
- Result: today `ImportScreen` dismisses to `/profile` with `imported`, `skipped` and `likely`; from the flow it returns to the flow's days step with the existing result toast (`importResultText`, such as "Added 10 · 200 already there").
- Failure: `importAll` sends batches of 200, so a failure partway leaves the earlier batches saved and shows `import.failed` on the review screen; trying again is safe because the server skips any session already there by fingerprint and counts it as skipped.
- Not recognized also offers Skip for now. Skip for now and Later go on to the days step; afterwards import lives where it does today, in Log's empty state ("Import a log"), Settings and the account menu.

New work across all sources:

- A per-source steps screen between the answer and Choose file (four locales; menu names stay as each service writes them, in English).
- Sends and attempts counts on the review: today it shows sessions, climbs, top grade and rows skipped (`planStats`); adding the two counts is a small transform change.
- Direct export links for 8a.nu, Mountain Project and Sendage in `EXPORT_PAGES`.
- The picker accepts only `text/csv`; a file saved from a browser can arrive as `text/plain` and show greyed out, so widen it to `text/plain` and `text/comma-separated-values` as well.
- Most exports are website downloads, usually on a computer; the steps say so, and Later carries on to the days step if the file is not on the phone yet.

### Step 2 of 2: Which days do you usually climb?

- `WeekdayChips`, climbing only; no lifting or hangboard rows, no explanatory line.
- Continue saves one Ongoing membership of the built-in "Climbing" workout on those weekdays (`block_id` null, `weekdays_json`, start today) through the existing `PUT /v1/memberships/:id`.
- With no days picked, nothing is saved and the reminder sheet does not show.

### Reminders

- Saving the days is the account's first plan, so the existing `ReminderPromptProvider` shows the unchanged `ReminderPromptSheet`: Remind me (the only route to the system notification dialog) or Not now.
- Reminders are the existing local scheduled notifications for planned days (`features/training/reminders`), saved through `PUT /v1/preferences/training-reminders`.

### End: Plan, once

- The week filled (`WeekStrip` dots), today's `OccurrenceCard` with Start when today is a climbing day, then the coming days.
- From then on the app opens on Log, as for everyone.

### Later, and skipping

- Skip on either step moves on; the flag is set when the flow ends.
- The days live in Train > Blocks > Ongoing (`OngoingScreen`, unchanged), the way back to edit them.
- Someone who skips everything lands on Log, empty (`ClimbingEmpty`, unchanged), where import also lives, as in Settings and the account menu.
- Strava and gym stay the setup cards on Log.

### Removed from earlier directions

- The goals question ("What brings you here").
- The lifting and hangboard rows in the week.
- Explanatory lines under the questions.

### Rejected

- A (open on Log, an Import setup card, one Starter block), B (one start question with three doors) and C (three questions with a goals step): superseded by Will's direction D.
- A tour or coach marks inside the app: the carousel explains the model before sign-up instead.

## 4. How it is built from what exists

### New pieces

| Piece                                                                             | Where                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Four carousel slides with play-once art                                           | `apps/mobile/features/onboarding/slides.ts` and `SlideArt.tsx`; Reduce Motion through `AccessibilityInfo.isReduceMotionEnabled`                                                                                 |
| Built-in workout "Climbing" (kind `climbing`), whose Start opens the live session | The built-in catalogue in `@sendtally/core`, added through the `library-add` skill; it needs one item to satisfy the "a built-in workout always has items" rule, and how Log it behaves is decided in the build |
| `users.start_answered`                                                            | Drizzle column (integer, default 0), generated migration, read and written through the existing preferences route, like `training_reminder_prompt_seen`                                                         |
| The two flow steps                                                                | `apps/mobile/app/first-run.tsx` and `apps/mobile/features/first-run/`, from `OptionRow`, `WeekdayChips`, `Button` and the existing sheets                                                                       |
| Per-source import steps and links                                                 | A steps view in `features/import`, direct links in `EXPORT_PAGES` (`packages/core/src/import/plan.ts`)                                                                                                          |
| Sends and attempts on the review                                                  | `planStats` in `packages/features/src/import/transforms.ts`                                                                                                                                                     |
| Import exit                                                                       | `ImportScreen` takes where to return; from the flow it goes back to step 2 instead of `/profile` (`features/import/ImportScreen.tsx:69`)                                                                        |
| Wider file picker                                                                 | `text/plain` and `text/comma-separated-values` beside `text/csv`                                                                                                                                                |

Everything else (Ongoing memberships, reminders, the import review, the live session, Plan) is used unchanged.

### When the flow shows

- Signed in, `start_answered` is 0, and the account has nothing logged and nothing planned.
- `app/index.tsx` decides it from the persisted query cache (`lib/QueryProvider.tsx`) and the preferences query; a brand new account waits for that one request.
- The flag is set when the flow ends, on Plan; quitting mid-flow brings it back next launch, which is acceptable.
- It lives on the account, so it holds on the web too.

### Existing accounts

- Any account with a session, a workout log or a plan never sees the flow.
- An existing empty account sees it once after release; no backfill.
- Everyone signed out sees the new carousel.

### Web

- Web signups are a small share (3 `signup_started` against 23 accounts), so the first release is mobile only and the web keeps today's Log.
- A web version later reuses both steps and the flag, without the reminder sheet (no web push).

### Localisation

- New keys in `en`, `de`, `fr`, `es`: the four slides' eyebrow, title and body and their art labels, the two step titles, "{n} of {total}", "No, this is my first", "A spreadsheet (CSV)", "Import from {source}", Later, the per-source steps, the sends and attempts tiles, and the "Climbing" built-in name.
- App names and the services' own menu names ("Logbook Export (CSV)", "Export CSV", "Export My Sends", "Select logbook as CSV") stay as each service writes them.
- Labels are resolved in functions, never at module scope; the parity test in `i18n.test.ts` covers them.

### Trial and member gates

- The flow uses one built-in workout in an Ongoing week.
- A repeating Ongoing week of built-in workouts stays free after the trial (Will, 2026-11-14), as built-ins planned on single days already do; the trial's gates (#259) must treat an Ongoing membership of a built-in as free.
- The trial (#259), the locks (#258) and library blocks (#255) are not built, so today nothing in the flow is gated.

## 5. Events and privacy

New PostHog events, properties as enum strings or counts only:

| Event                     | Where              | Properties                                                              |
| ------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `onboarding_slide_viewed` | Client, signed out | `slide`: `log`, `exercises`, `workouts`, `blocks` and the existing ones |
| `first_run_started`       | Client             | none                                                                    |
| `first_run_log_answered`  | Client             | `existing_log` enum; also set as a person property                      |
| `first_run_days_saved`    | Client             | `climbing_days` (count)                                                 |
| `first_run_finished`      | Client             | `ended_at`: `plan`, `skip_log`, `skip_days`                             |
| `workout_started`         | Client, any player | `built_in`, `planned`: true or false                                    |
| `workout_logged`          | Worker             | `built_in`, `planned`: true or false                                    |

Existing events cover the rest: `training_reminders_updated` and `sessions_imported`, which gains `from`: `first_run` or `import_screen`.

What will show it worked, against section 2:

- Share of new accounts finishing the flow, and where the rest skip.
- Share with climbing days saved and with reminders on.
- Share starting or logging a planned climbing day within 14 days (unmeasurable today).
- Share with `manual_session_created` within 7 days (43% today).
- Import rate among those who named a source (1 of 23 imported today).
- Share active on days 8 to 14 (20% today).

`apps/web/app/routes/privacy.tsx`, in the "Usage" paragraph after the Areas sentence:

> When you start, which app you kept a log in and how many days you plan to climb are recorded against your account, and which introduction screens you saw before signing up; starting or logging a workout is recorded as whether it was planned and built in, never what you logged.

## 6. Delivery slices

1. **The two-step mobile flow (smallest useful slice).** The "Climbing" built-in, `users.start_answered`, both steps with the import exit and the wider picker, the reminder sheet as is, the end on Plan, the `first_run_*` events, `sessions_imported.from`, and the privacy line.
2. **Per-source import steps**: the steps view, direct links, sends and attempts on the review.
3. **The carousel**: four new slides replacing the current four, with play-once art, Reduce Motion, and `onboarding_slide_viewed`.
4. **Measuring the planned week**: `workout_started` and `workout_logged`.
5. **Web flow**, if web signups grow.

## 7. Left out on purpose

- Goals, lifting and hangboard in the flow.
- Strava, gym and projects in the flow.
- Ready-made library blocks.
- Push notifications other than the existing plan reminders.
- Paste in the import; files only.
- Changes to the email series (branch `feat/onboarding-email-journey`) or to PostHog.

## 8. Decisions

Will, 2026-11-14:

- Kaya gets no export steps; it keeps the Google search link the other sources had. Steps and direct links stay for 8a.nu, Mountain Project, Sendage and theCrag.
- The four new slides replace the current Log, Effort score, Strava and Stats slides; effort is folded into the first slide's copy.
- A repeating Ongoing week of built-in workouts stays free after the trial.
- The day-6 import email skips people who imported in the flow (`sessions_imported` with `from = first_run`); that change belongs to the email work, not this plan.
- The day-25 "trial ends" email is held until the trial (#259) lands.

## 9. Open decisions for Will

- Web flow now or later (spec: later).
