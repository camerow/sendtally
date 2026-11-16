# First-run onboarding

Status: spec for direction D, Will's latest, agreed between onboarding-eng and onboarding-designer on 2026-11-14; directions A, B and C are superseded.
Slice 1 (both steps, mobile and web) is built on `feat/first-run-onboarding`; slices 2 to 4 wait for its review.
Design boards on the "First run onboarding" page (id `first-run`) of the canvas https://claude.ai/artifact/CNPnNQwgvzgvxk4ZAYTyto:

- "First run D" (`FirstRunD.dc.html`, x 0, y 0): the carousel and the two-step flow, with the web steps at 1280 and 375 in frames 10 to 15.
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
The only new building blocks are four carousel slides, one built-in "Climbing" workout, one flag on the account, per-source import steps, and the event that records the answers.

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
- Every `SlideArt` card is the same fixed height, the height of the log-and-pyramid card (303 on the board), so the art does not jump between slides (Will, 2026-11-14).
  The Max hangs chart and the block's week bars grow to fill the card, and the workout's exercise rows get more padding; the two box heights stay at 310 and 170.
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
- Continue saves one Ongoing membership of the built-in "Climbing" workout (`climb-session`) on those weekdays (`block_id` null, `weekdays_json`, start today) through the existing `PUT /v1/memberships/:id`.
- "Climbing" has no exercises, so its Start opens the live session linked to the plan (`workoutStart` in `packages/features/src/workouts/workoutStart.ts`), on the phone and now on the web too.
- Ending that live session marks the day done on Plan: today's card becomes the logged session with a check, and the week strip's dot fills (checked on both apps).
- With no days picked, nothing is saved and the reminder sheet does not show.

### Reminders

- Saving the days is the account's first plan, so the existing `ReminderPromptProvider` shows the unchanged `ReminderPromptSheet`: Remind me (the only route to the system notification dialog) or Not now.
- The web has no push, so on the web Continue goes straight to Plan.
- Reminders are the existing local scheduled notifications for planned days (`features/training/reminders`), saved through `PUT /v1/preferences/training-reminders`.

### End: Plan, once

- The week filled (`WeekStrip` dots), today's `OccurrenceCard` with Start when today is a climbing day, then the coming days.
- After an import, the existing result toast ("Added 5 sessions", View) shows on Plan; on the phone it waits until the reminder sheet is answered, and the Schedule button hides while it shows.
- From then on the app opens on Log, as for everyone.

### Later, and skipping

- Skip on step 1 ends the flow on Log; Later moves on to step 2; Skip on step 2 ends on Log; the flag is set when the flow ends.
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

| Piece                                                                                              | Where                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Four carousel slides with play-once art                                                            | `apps/mobile/features/onboarding/slides.ts` and `SlideArt.tsx`; Reduce Motion through `AccessibilityInfo.isReduceMotionEnabled`                                                                                                                                   |
| Built-in workout "Climbing" (`climb-session`, kind `climbing`), whose Start opens the live session | The built-in catalogue in `@sendtally/core` with no items; the "every built-in has items" rule now allows a climbing workout with none                                                                                                                            |
| `users.first_run_step`                                                                             | Drizzle column (integer: 0 none, 1 started, 2 answered, 3 done), one generated migration; `GET /v1/status` returns `firstRun`, and `PUT /v1/preferences/first-run` moves the step forward                                                                         |
| The two flow steps                                                                                 | Mobile: `apps/mobile/app/first-run.tsx` and `features/first-run/`, from `OptionRow`, `WeekdayChips` and `Button`. Web: `/app/start` (`apps/web/app/first-run/`), outside the app shell, from the `option-row` radio group, `WeekdayChips` and the design `Button` |
| Per-source import steps and links                                                                  | A steps view in `features/import`, direct links in `EXPORT_PAGES` (`packages/core/src/import/plan.ts`)                                                                                                                                                            |
| Sends and attempts on the review                                                                   | `planStats` in `packages/features/src/import/transforms.ts`                                                                                                                                                                                                       |
| Import exit                                                                                        | Mobile `ImportScreen` takes `then`; web `ImportFlow` takes `then` (`/app/import?then=/app/start`); from the flow both go back to step 2 with the result                                                                                                           |
| Wider file picker                                                                                  | `text/plain` and `text/comma-separated-values` beside `text/csv`                                                                                                                                                                                                  |

Everything else (Ongoing memberships, reminders, the import review, the live session, Plan) is used unchanged.

### When the flow shows

- The server decides it once: `GET /v1/status` returns `firstRun: true` to an account with no session, workout log, activity or plan, and once first run has started it stays true until it is done (`first_run_step` 3), so an import or the saved days do not end it halfway.
- Mobile: the tabs layout reads it through `useFirstRun` and sends the account to `/first-run`; a brand new account waits for that one request, everyone else has the status in the persisted cache.
- Web: the Log index loader (`app._index.tsx`) redirects to `/app/start`.
- A missing field, from an older API, reads as "do not show", so a new build never traps anyone; older builds ignore the column.
- The flag is set when the flow ends, on Plan; quitting mid-flow brings it back next launch, which is acceptable.
- It lives on the account, so it holds on the web too.

### Existing accounts

- Any account with a session, a workout log or a plan never sees the flow.
- An existing empty account sees it once after release; no backfill.
- Everyone signed out sees the new carousel.

### Web

- Everything ships on both (standing rule; mobile wins a divergence), so slice 1 carries the web steps at `/app/start`.
- No signed-out carousel on the web: people sign up from the marketing site, so the web gets the two steps and the end on Plan.
- No reminder sheet on the web (no web push).
- A picked option row now takes the phone's gold tint on the web everywhere (`.option-row[aria-checked="true"]`).

### Localisation

- New keys in `en`, `de`, `fr`, `es`: the two step titles, "{n} of {total}", Skip, "No, this is my first", "A spreadsheet", "Import from {source}", "Import a spreadsheet", Later, Continue (all `onboarding.firstRun.*`), and the "Climbing" built-in's name and blurb; later slices add the slides, the per-source steps and the sends and attempts tiles.
- App names and the services' own menu names ("Logbook Export (CSV)", "Export CSV", "Export My Sends", "Select logbook as CSV") stay as each service writes them.
- Labels are resolved in functions, never at module scope; the parity test in `i18n.test.ts` covers them.

### Trial and member gates

- The flow uses one built-in workout in an Ongoing week.
- A repeating Ongoing week of built-in workouts stays free after the trial (Will, 2026-11-14), as built-ins planned on single days already do; the trial's gates (#259) must treat an Ongoing membership of a built-in as free.
- The trial (#259), the locks (#258) and library blocks (#255) are not built, so today nothing in the flow is gated.

## 5. Events and privacy

Three new PostHog events, captured on the Worker so the Clerk user id and the internal cohort filter apply; properties are enum strings or counts only.
They make the funnel `account_created` -> `first_run_started` -> `first_run_log_answered` -> `first_run_finished` -> `manual_session_created`.
Each fires once per account: every move of `users.first_run_step` is a conditional update that only goes forward, so a repeat or concurrent call captures nothing.

| Event                    | Where                                                                                                                                                                                                                                                                                                                                                                         | Properties                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `first_run_started`      | Worker, `PUT /v1/preferences/first-run` with `step: "started"`, sent when step 1 shows                                                                                                                                                                                                                                                                                        | none                                                                                                    |
| `first_run_log_answered` | Worker, the same route with `step: "log_answered"`, sent on leaving step 1 to the import or the days; Skip on step 1 records it as `skipped` from `step: "finished"`                                                                                                                                                                                                          | `existing_log`: `kaya`, `8a`, `mountainProject`, `sendage`, `theCrag`, `spreadsheet`, `none`, `skipped` |
| `first_run_finished`     | Worker, the same route with `step: "finished"`                                                                                                                                                                                                                                                                                                                                | `climbing_days` (count); `ended_at`: `plan`, `skip_log`, `skip_days`                                    |
| `workout_logged`         | Worker (slice 4, `feat/workout-logged-event`), when a workout log is first saved: `PUT /v1/activities/:id` for an activity of a library workout or a planned one, `PUT /v1/hang/sessions/:id`, and `POST /v1/sessions` for a climbing session that completes a planned day; never on an edit or a delete, a free-form activity, a climbing session with no plan, or an import | `built_in`, `planned`: true or false                                                                    |

`existing_log` lives on `first_run_log_answered` and on the person, so `first_run_finished` never needs the pick that a web import, which reloads the page, forgets.
A relaunch mid-flow shows step 1 again and records nothing new until Skip or the days are saved: `first_run_started` and `first_run_log_answered` keep their first values.

The `log_answered` step also sets `existing_log` as a person property through `identifyUser`.
`onboarding_slide_viewed` and `workout_started` are dropped: the first would be the mobile app's first client-side event, and the second is not needed to see whether the planned week is used.
Existing events cover the rest: `training_reminders_updated` and `sessions_imported`.

What will show it worked, against section 2:

- Share of new accounts finishing the flow, and where the rest skip.
- Share with climbing days saved and with reminders on.
- Share logging a planned climbing day within 14 days (`workout_logged` with `planned`, from slice 4).
- Share with `manual_session_created` within 7 days (43% today).
- Import rate among those who named a source (1 of 23 imported today).
- Share active on days 8 to 14 (20% today).

`apps/web/app/routes/privacy.tsx`, in the "Usage" paragraph after the Areas sentence (added in slice 1):

> Your answers to the two questions when you first sign in are recorded once: which app you kept a log in, if any, how many days a week you climb, and whether you skipped a question.

Slice 4 adds: "Logging a workout is recorded as whether it was on your plan and whether it is one of sendtally’s built-in workouts, never what you logged."

## 6. Delivery slices

1. **The two steps, on mobile and web (built).** The "Climbing" built-in with no items, `users.first_run_step`, both steps with the import exit, the reminder sheet as is on the phone, the end on Plan with the import toast, the three first-run events, the privacy line, and Start on a web Climbing day opening the live session.
2. **Per-source import steps, both apps**: the steps view, direct links, sends and attempts on the review, the wider mobile picker, and on the web `/app/import?from=<source>` (Import board, frame 10).
3. **The carousel, mobile only**: four new slides replacing the current four, with play-once art and Reduce Motion; the web marketing landing stays as is.
4. **Measuring the planned week (built, `feat/workout-logged-event`)**: `workout_logged` with `built_in` and `planned`, on the Worker.

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
- The day-6 import email skips people who imported in the flow; that change belongs to the email work, not this plan.
  Slice 1 adds no `from` on `sessions_imported`, so the email reads it as a `sessions_imported` before `first_run_log_answered` with an `existing_log` source.
- The day-25 "trial ends" email is held until the trial (#259) lands.

## 9. Open decisions for Will

None: the web ships with slice 1 under the standing rule that everything ships on both.
