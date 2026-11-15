# First-run onboarding

Status: spec for direction A, agreed between onboarding-eng and onboarding-designer on 2026-11-14; Will found A had not simplified enough and is choosing between A and B, and this document is rewritten for his pick.
Design boards, on the "First run onboarding" page (id `first-run`) of the canvas https://claude.ai/artifact/CNPnNQwgvzgvxk4ZAYTyto: A "First run: open on Log, one starter block, no tour" (`FirstRun.dc.html`, x 0, y 0), which this document describes, and B "First run B: one question, then straight into the first real thing" (`FirstRunB.dc.html`, x 0, y 2460).

> **Correction, 2026-11-14:** Will made Log the first tab and the screen the app opens on, for every account (tab order Log, Plan, Train, Stats; agent log-first is building it on `feat/log-tab-first`).
> Everything below that says mobile opens on Plan describes the app before that change.
> Direction A's landing rule (section 3.A, the `app/index.tsx` part of section 4 and of slice 1) is therefore covered by that branch and drops out of this plan.
> Will has since asked for a short onboarding flow instead of A or B; this document is being rewritten for it.

## The question

A person who has never heard of Sendtally installs the app and signs up.
What is the smallest change that gets them to log a first session, bring in their history, understand that exercises make up workouts and workouts make up blocks, make a first plan, and track a project?

## Recommendation in short

No onboarding flow and no new checklist.
A new account lands on Log, whose empty state already offers a first session and an import.
The existing setup cards become the one first-run list, gaining an Import card ahead of Strava and Gym, in the same order as the getting-started emails.
One ready-made Starter block (four weeks, built-in workouts only) explains exercise, workout and block by being one, and gives a first plan with a single Schedule tap.
Projects get one faded example row in the climbing empty state, nothing more.

## 1. What a new account sees today

### Signed out (mobile)

- `app/index.tsx` sends a signed-out person to `/onboarding`: a four-slide carousel (`OnboardingCarousel`, slides Log, Effort score, Strava, Stats) with Create account (gold) and Sign in, and the footer "Free to log · no card on file".
- The Strava slide says "Sessions are fingerprinted, so a re-sync never posts twice." (`onboarding.strava.body`), which talks about syncing and breaks the copy rule in `CLAUDE.md`.

### After sign-up, mobile

`app/index.tsx` redirects every signed-in person to `/(tabs)/today`, so the first screen is Plan.

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

- Mobile opens on the emptiest screen in the product, an empty week, before anything is logged.
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

Agreed with the designer.
The board draws every state named here.

### A. Land on Log until something exists

- A signed-in account with no session, no workout log and nothing planned opens on Log > Climbing, on mobile as on web.
- Once any of those exists, mobile opens on Plan as today.
- Web already lands on Log and keeps doing so.

### B. The setup cards are the first-run list

- `SetupStack` gains an Import card first, then Strava, then Gym, the order of the emails.
- Import card: eyebrow "Import", title "Bring in your climbing history", body "A spreadsheet or another app's export. Your stats start from all of it.", action "Import a log", opens `/import` (web `/app/import`).
- The body follows the existing gym and Strava cards, which carry one too.
- The stack carries a "Set up 0/3" count.
- Each card is done when its thing exists (any imported session, a Strava connection, a gym) or when Not now is tapped, using the existing dismissal.
- When all three are done the stack is gone; nothing replaces it.

### C. One ready-made Starter block

- A four-week block of built-in workouts: Max hangs Monday and Thursday, Limit bouldering Tuesday and Saturday, Antagonist push Wednesday.
- Drawn with the existing `PlanCard` and `PlanGrid`: the card is the block, its rows are workouts, and tapping a row opens the existing workout screen that lists its exercises.
  That is the whole explanation of exercise, workout and block; no explanatory copy is added.
- Shown on Plan above the days while the account has no block and no Ongoing workouts.
- Shown on Train > Blocks under a new "Ready-made" section, which replaces the `plan.empty` dashed panel and stays there for good, as the way back to it later and the home of future library blocks (#255).
- Its gold Schedule button opens the existing block start (start date in the sheet), then the existing toast 'Scheduled "Starter block"' with View.

### D. Projects

- `ClimbingEmpty`'s second example row ("Saturday at the crag") becomes a climb logged on its own, "The arete" V6, with the gold-on-gunmetal Project pill.
- Replacing a row rather than adding one keeps the empty state to one screen.
- Nothing else: 2 of 23 accounts marked one, and no email covers it.

### E. Someone who skips everything

- Not now on each setup card; Log is today's empty state.
- Plan keeps the Starter block until something is planned.
- Ready-made stays on Train > Blocks.

### F. Carousel

- Rewrite only `onboarding.strava.body` to drop "re-sync"; the slides otherwise stay.

### Rejected

- A multi-screen onboarding flow: more screens and concepts, against Will's "less is more", and the empty states already hold the actions.
- A new five-item first-run checklist: a new concept when first session, plan and project already have homes.
- Explaining the model in copy or a diagram: Will rejects explanatory lines; one real block shows it.
- A blank-builder prompt for the first plan: a ready-made block is one tap.
- Interactive tours and coach marks: fragile across two platforms and four locales, and they explain instead of showing.

## 4. How it is built from what exists

### State, and where it lives

No new table and no new column.

| Need                           | Source                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Is the account empty (landing) | Sessions list and training log already fetched by the apps; empty means no session, no workout log, no block and no Ongoing membership                 |
| Import card done               | A successful import sets the card's existing dismissal key on that device; imported sessions are stored as manual, so there is no server field to read |
| Strava card done               | Existing Strava connection state                                                                                                                       |
| Gym card done                  | Existing gyms list                                                                                                                                     |
| Card dismissed                 | Existing `useSetupDismissed` (mobile, AsyncStorage) and `useDismissed` (web, localStorage), key `import`                                               |
| Show the Starter block on Plan | `plan.blocks` and Ongoing members both empty                                                                                                           |
| Starter block itself           | A code catalogue next to the built-in workouts, in `@sendtally/core`, one entry for now                                                                |

Dismissals stay per device, as the gym and Strava cards do today.
A person who dismisses on the phone sees the card once more on the web; that matches current behaviour and is cheaper than a server setting.
If Will wants one dismissal everywhere, the precedent is `users.training_reminder_prompt_seen`, generalised to a `setup_dismissed` JSON column.

### Landing on mobile

- `app/index.tsx` decides between `/(tabs)/sessions` and `/(tabs)/today` from the persisted query cache, which `lib/QueryProvider.tsx` already restores on launch.
- An empty cache (a fresh install or a new account) goes to Log; a cache that holds any session or plan goes to Plan.
- No new request blocks the first screen.

### The Starter block

- Catalogue: `packages/core/src/hang/libraryBlocks.ts` with id `starter`, name key, weeks 4, and members as built-in workout ids (`max10`, `climb-limit`, `strength-antagonist`) with weekdays.
- Schedule: a new `POST /v1/blocks/library/:key/schedule` taking `{ id, start }`, the client-chosen id making replays safe like `/:id/copy`; it writes `training_blocks` and memberships through `repo.ts`.
- The copy is an ordinary user block from then on; editing it never changes the catalogue.
- Shared hook in `packages/features/src/training` so mobile and web render the same rows.

### Existing accounts

- An account that has logged or planned anything lands on Plan as today and never sees the Starter block on Plan, because it has a plan; it does see "Ready-made" on Train > Blocks.
- The Import card shows to existing accounts with no import that have not dismissed it.
  Accepted: it is one dismissible card, and import is new to them too.

### Localisation

- New keys in all four catalogs (`en`, `de`, `fr`, `es`): the Import card eyebrow, title and body (the action reuses `climbs.importLog`), "Set up {done}/{total}", the "Ready-made" section heading, the Starter block name, the example project row's title and meta, as the other example rows are keys, and the rewritten `onboarding.strava.body`.
- The Starter block name is a catalog key resolved in a function, never at module scope.
- The parity test in `i18n.test.ts` covers them.

### Trial and member gates

- During the 30-day trial everyone can schedule the Starter block.
- After the trial a non-member sees it muted with the lock from the #258 paywall board (`PaywallLocks`, not built yet) and no Schedule button; tapping it opens the paywall, and the Worker refuses the schedule call, as #255 specifies for library blocks.
- A Starter block scheduled during the trial locks with the user's other blocks after it (#253); nothing is deleted.
- Until #259 ships there is no trial, so slice 2 ships with the block open to everyone and picks up the gate when #255 lands.

## 5. Events and privacy

New PostHog events, properties as enum strings only:

| Event                     | Where                          | Properties                                |
| ------------------------- | ------------------------------ | ----------------------------------------- |
| `setup_card_tapped`       | Client, Log                    | `key`: import, strava, gym                |
| `setup_card_dismissed`    | Client, Log                    | `key`                                     |
| `import_started`          | Client, import screen opened   | `from`: setup_card, empty_state, settings |
| `starter_block_scheduled` | Worker, library schedule route | `key`: starter                            |
| `block_created`           | Worker                         | `from`: blank, copy, library              |
| `workout_started`         | Client, any player             | `built_in`: true or false                 |
| `workout_logged`          | Worker                         | `built_in`, `planned`: true or false      |

What will show it worked, against the baseline in section 2:

- Share of new accounts with `manual_session_created` within 7 days (43% today).
- Share with `sessions_imported` (1 of 23 today).
- Share with `starter_block_scheduled` or any `block_created` within 14 days (unmeasurable today).
- Share active on days 8 to 14 (20% today).

`apps/web/app/routes/privacy.tsx`, in the "Usage" paragraph after the Areas sentence:

> Setting up and training are recorded too, such as a setup card tapped or dismissed, an import started, a block scheduled or a workout started or logged, carrying only the kind of action and labels such as whether a workout is built in, never what you logged.

## 6. Delivery slices

1. **Land on Log and the Import card (smallest useful slice).** Mobile `app/index.tsx` landing rule, the Import card first in `SetupStack` on mobile and web, the 0/3 count, `setup_card_*` and `import_started` events, the privacy line, and the carousel string fix. No new data.
2. **The Starter block.** Library block catalogue, the schedule route, Plan and Train > Blocks "Ready-made" on mobile and web, `starter_block_scheduled`, `block_created`, `workout_started`, `workout_logged`.
3. **The project example row** in `ClimbingEmpty`, mobile and web.
4. **Gate the Starter block** with #255 once #259 lands.

## 7. Left out on purpose

- Any onboarding flow, tour, coach marks or video.
- A server-side first-run state or "onboarding completed" flag.
- More than one library block; #255 grows the catalogue later.
- Push notifications or in-app nudges for week two; the email series covers that.
- Projects in the setup cards or in the emails.
- Changes to the email series (branch `feat/onboarding-email-journey`) or to PostHog.

## 8. Open decisions for Will

- The day-25 "trial ends" email assumes the trial in #259; the trial should ship before that email is switched on, or the email held.
- Whether Starter block's contents are right for a newcomer (two hangboard days a week is heavy for someone new to fingers training); a lighter mix is a catalogue change only.
- Whether setup dismissals should follow the account across devices (one JSON column) or stay per device as today.
- Whether "Ready-made" on Train > Blocks should show to members only after the trial, or always with the lock (spec: always, locked).
