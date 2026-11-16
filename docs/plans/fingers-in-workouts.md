# Fingerboard work inside a full workout

Will, 2026-11-16: the fingerboarding part of a workout starts its timer from the workout view, and when finished the person can edit the completed part on the workout view, with the rest of the workout inline as normal.
This plan reverses the "grips and other exercises do not mix" rule from `workout-without-category.md` and keeps every hang session reader and every activity reader as they are.

## Today's model

- A workout is one `workouts` row; `items_json` is a list of `Item` (`exercise`, `doses`, `id`, `restAfterS`), and a hangboard item's `exercise` is a grip id.
- `kind` is stored and derived on save by `workoutKindOf` (`packages/core/src/hang/plan.ts`): `hangboard` when every item is a grip.
- Saving a workout that mixes grips with other exercises is refused by `workoutBody` and `save_workout`.
- Week changes (`item_week_changes`) are keyed by membership, week, dose and item id, so they follow an item wherever it moves.
- `workoutStart` opens the hang timer when `kind` is `hangboard`; any other workout with items opens the intervals, sets or checklist player, which finishes into the activity form (`/activity/new`).
- One run of a fingers workout writes one `hang_sessions` row, whatever its number of grips.
  Its `grip_id`, `protocol_json`, `edge_mm` and `load_kg` are the first grip's; `done_json` holds every grip's kept sets, each set with its own edge and load (`hangSessionOf` in `packages/features/src/workouts/hangReview.ts`).
- One run of any other workout writes one `activities` row of its kind, with every item's sets in `done_json`.
- Readers of a run as a log: `loggedSessions` and `doneBy` / `sessionsOf` (`packages/features/src/training/plan.ts`, `days.ts`), statistics (`statistics/workouts.ts`, `insights.ts`), the journal log, the training recap, the history list (`GET /v1/hang` and the history read in `packages/api/src/app.ts`), and Strava posting (`syncHangSessionToStrava`, `syncActivityToStrava`).
- Readers of hang sessions as grip history: the hang model, grip trends, max hang bests (`newBestBy`), last-used setups.

## Corrections to the brief

- One fingers run writes one hang session, not one per grip; per-grip edge and load live in its `done_json`.
- The workout view a part would sit in is the sets or checklist player; a workout whose items are all timed opens the intervals player instead, so a mix must always open the sets or checklist player.
- Strava gating differs by record: a hang session posts on `hang_settings.post_to_strava`, an activity on `strava_connections.post_training`.
- Two existing defects found while reading, both outside this plan's scope and worth fixing on their own:
  - `HangSessionForm` (mobile, the hang session edit) edits only item 0 (`hangSets`) and saves `done` from that item alone, so editing a multi-grip fingers session drops every other grip's sets.
  - Statistics count a hang session's minutes from the first grip's protocol only (`totalSeconds(h.protocol)` in `statistics/workouts.ts`), so multi-grip fingers sessions read short.

## Recommended model

Grips are ordinary items in the workout's one list.
A workout's fingerboard part is all of its grip items, in order; there is one part per workout by construction, shown where its first grip sits.
The stored list is the run order.
One pure function in `packages/core/src/hang/`, `gripsTogether(items, isGrip)`, moves every grip to the first grip's place, keeping their order and the order of everything else.
Both editors call it on every change, and `workoutBody` and `save_workout` call it on every save (the API already has `isGrip` from `kindLookup` in `lib/workoutKind.ts`), so a connector or older build save with scattered grips is stored together.
Moving items is safe for week changes, which follow item ids, not places.
Reading groups grips the same way, only so a mix saved before this lands still runs as one part.
In the editor a grip added to a workout that has grips lands after the last one, and dragging moves the grips as one block.

Nothing about the workout's storage changes: no column, no new item type, the same `workoutBody`, the same `save_workout` items.
Week changes, alternating doses and item ids keep working per grip, because every grip is still an item.

`workoutKindOf` changes in one rule: grips do not vote.
All grips is `hangboard`; otherwise the kind most of the non-grip items share, a tie going to the first non-grip item; none keeps the kind it had.
A mix is therefore never `hangboard`, so it logs as an activity, wears that kind's `KIND_LOOK` colour, and counts a planned day done through that kind.

### What one run of a mix writes

- One `activities` row: the run, of the workout's kind, with the non-grip items' sets in `done_json` (item indexes are the workout's), and `minutes` the whole run from Start to Finish.
- When the fingerboard part kept at least one set, one `hang_sessions` row for the part, written exactly as a fingers-only run writes it (first grip's `grip_id` and protocol, every grip's sets in `done_json`, indexes counted within the part).
- The part carries a new nullable `hang_sessions.activity_id` naming its run; a standalone hang session has none.
- A unique index on `(user_id, activity_id)` makes one part per run a database rule; SQLite leaves nulls distinct, so standalone sessions are unaffected.
- Both rows are written in one request and one D1 batch: `PUT /v1/activities/:id` takes an optional `fingerboard` body.
  Absent leaves the part's own fields untouched (so an older build editing the run never deletes it), `null` removes it, a body replaces them.
- The API owns everything the part shares with its run: `date`, `workout_id`, `membership_id`, `week`, `focus` and `rpe` are copied from the activity on every activity write, with or without a `fingerboard` field, so an older build moving the run's date moves the part with it.
  The `fingerboard` body therefore carries only the part's own fields: `gripId`, `edgeMm`, `loadKg`, `pct`, `misses`, `protocol`, `done`.
- Deleting the activity deletes its part in the same batch.

### The part's id and retries

The API owns the part's id.
It finds the part by `activity_id`; the first write inserts it with a new id, every later write updates that row in place and keeps its id (one `INSERT ... ON CONFLICT (user_id, activity_id) DO UPDATE`).
Replaying the same queued `PUT /v1/activities/:id` therefore writes the same two rows again, and two racing first writes still leave one part.
Clients never address a part by its own id: a part carries `activityId`, and the apps find a run's part by that, offline included.

### The other doors

- `PUT /v1/hang/sessions/:id` and `DELETE /v1/hang/sessions/:id` on a part answer 409 ("part of a workout; change it through the workout"), and `POST /v1/hang/sessions/:id/strava` likewise; the only way to change or remove a part is through its activity.
  No build can reach a part's id by these routes today, since parts are never listed in `sessions` or history; the refusal keeps it that way.
- Deleting a membership unlinks both rows (`removeMemberships` already sets `UNLINKED` on `activities` and `hang_sessions`), so they stay in step.
- The connector reads no hang sessions or activities today: `list_sessions`, `get_climbing_summary` and `update_session` read climbing sessions only, `get_plan` reads the plan tables only, and there is no log tool for training. Nothing double counts there; a future training log tool must read activities with their parts nested, as the apps do.
- `showsFirstRun` only asks whether any row exists, which a part does not change.

### Grip ids in a mix's items

Two API paths assume a non-fingers workout names only exercises, and a mix breaks that:
- `workoutExercises` (`lib/exercises.ts`) creates an exercise for every item of a non-hangboard workout, so it would create exercises named by grip ids; it skips items where `isGrip`.
- `renameEverywhere` (`lib/repo.ts`) rewrites matching item names in every non-hangboard workout; it skips grip items, so an exercise renamed to a grip id's text can never capture a grip.

### How the run counts once

The API decides, so no reader learns a special case.
`GET /v1/hang` returns parts in a new `parts` field beside `sessions`, and the history read leaves them out; `sessions` stays standalone hang sessions only.
Every log reader (`loggedSessions`, `doneBy`, `sessionsOf`, statistics, the journal, history, the recap's runs) keeps reading `sessions` and activities, so it sees the run once, as the activity.
Every grip reader (grip trends, max hang bests, last-used setups) reads `sessions` and `parts` together through one `hangsWithParts` in `packages/features/src/hang/model.ts`.
A part never posts to Strava on its own; the activity's post adds the part's protocol lines and loads to its description and runs on the activity's gate.

### Tables and API shapes touched

- `hang_sessions.activity_id text` nullable with a unique index on `(user_id, activity_id)`, added through Drizzle (`db:generate`); additive, no backfill.
- `activityBody` gains `fingerboard: fingerboardBody.nullable().optional()`, the part's own fields only.
- `HangData` gains `parts: (HangSessionRecord & { activityId: string })[]`.
- `workoutBody` and `save_workout` store items through `gripsTogether`.
- `workoutBody` and `save_workout` drop the mix refusal; `save_workout`'s description drops "A workout holds only grips or no grips" and says grips sit beside other exercises as the workout's fingerboard part.
- `repo.deleteUserData` is unchanged: it already deletes every `hang_sessions` row of the user.

## The questions

### 1. Model

- Grips as ordinary items (recommended): no storage change, week changes and doses per grip as today, `save_workout` unchanged but for the refusal.
- One "fingerboard" item carrying grips and a protocol: a new `Item` variant with nested items breaks `Item`, `withItemIds`, `sessionItems`, `item_week_changes` (keyed per item, so per-grip week changes need a nested key) and every dose reader; `save_workout` needs a second item shape. Rejected for what it does to the model.
- A reference to an existing fingers workout: the part's session count, week changes and setups would belong to another workout, an edit to that workout reaches every workout naming it, deleting it orphans them, and the hang session's `workout_id` would have to choose between the two. Rejected.

### 2. Records

As above: one activity, one part tied by `activity_id`, one request.
The planned day is done once, through the activity's `membership_id` or kind.
`sessionsOf` counts the run once, so alternating doses advance by one.
Session counts, done days and Strava count the activity only; the part's sets add to grip trends and max hang history.
Minutes and the training mix split the run (decision 1): one shared `runMinutes` in `packages/features/src/statistics/` gives a part's minutes to Fingers (`hangSessionSeconds` of the part, every grip counted) and the rest of the activity's minutes to its kind, and every minutes reader goes through it.

### Reading every grip of a hang session

The fix on `bug/multi-grip-hang-sessions` makes `hangSessionItems` and `hangSessionSeconds` (`packages/core/src/hang/session.ts`) the one way to read every grip of a hang session, and adds an optional per-grip dose as run to `done_json` items.
This plan uses them and adds no second reader: a part is a hang session, so its rows' targets, its minutes and its summary read through `hangSessionItems` and `hangSessionSeconds` like a standalone session's.
A part's `done` writes the per-grip dose as run in the shape that fix lands with, so a later grip's target never has to be guessed from its kept sets.
Kind and colour are the non-grip majority's.

### 3. The workout view

- A mix opens the sets or checklist player even when every item is timed; the part is one card in item order where its first grip sits, with Start.
- Not started: the grips, each with its dose and planned edge and load, and Start.
- Running: Start opens the hang timer on the part's grips only; the timer's minimise returns to the workout view with the part shown as running, and its live bar entry reopens the timer.
- Finished: the timer's finish returns to the workout view instead of the hang review; the card is always-editable set rows per grip, like any other exercise (Will, 2026-11-16: no Edit button): target hangs, hangs done, load per set and a set RPE (Will, 2026-11-16: no tick, 'x of y hangs' says whether it was done), with the edge on each grip's setup pill; the next item is live.
- Skipped: the card collapses like any skipped exercise; no part is written.
- Half done, minimised: the timer's run is still live, so the card offers Resume (`resumedTimer`, as today).
- Half done, minimised, shows its rows read-only: the timer still owns them until it ends, so two writers never race over one set.
- Half done, ended with End: the same editable rows as finished, filled from the timer's held sets (`setsHeld`); unreached sets and grips are empty; an ended run is never resumed.
- It can sit anywhere in the order, and a workout holds one part.

### 4. Editing the finished part

Before Finish, the part's sets edit in place on the workout view, with no Edit step, in the same set rows the activity review uses for grips (`ActivityForm` in hang mode: hangs per set, load per set, the setup pill for edge and load).
When the timer ends, the live run turns its held sets into the part's `done` (`ItemDone[]` with `reps`, `weightKg` and `edgeMm` per set), the same shape the sets player keeps for its own items, without its ticked list; edits write there, and Finish saves it through `hangResult`, which already keeps a set's own `weightKg` over the setup's load, with each grip's dose as run.
No model change: per-set load and hangs are `SetDone` fields today.

### Set RPE and no tick on hang rows

Will, 2026-11-16: the hangs count already says whether a set was done, and a set RPE is more useful than a tick.
Hang set rows in every place they appear drop the tick and take the shipped Set RPE column (header, box, keypad) in its place: the part on the workout view, the review after Finish, the standalone fingers timer's review, and the hang session edit, which all share `ActivityForm`'s hang mode, so there is one way for both.
- Storage: `SetDone.rpe` (1 to 10) exists since Set RPE and `doneBody` accepts it, so a rated hang set is `done_json[i].sets[j].rpe` in `hang_sessions`, exactly as in `activities`; no migration. The session's own `rpe` column stays the run's effort.
- Done signal: a hang set is kept when it held anything (hangs above 0, or a lone hang's cut seconds), which is the rule `setsHeld` already applies to the timer's sets; clearing a set's hangs drops it, and a dropped set is not missed, as today. The part's live state has no ticked list.
- Target: a grip dose can hold `targetRpe` (the type and `doseBody` allow it) but the editor does not offer it (`FINGERS_FIELDS` in `doseFields.ts` has no RPE field), so hang rows show the RPE box without a target until a grip dose offers one.
- Showing it: Set RPE deferred hang sets because `HangSummary` and `HangResultCard` would show a rating nowhere; they now show each set's RPE beside its hangs and load, for parts and standalone sessions alike, so no rating is entered and then hidden.
After Finish, the review and later edits are the activity's `ActivityForm`, which shows the part's grips inline with the other exercises in that same hang mode and saves both rows in one request.
There is one editor for grip sets, `ActivityForm`'s hang mode; `HangSessionForm` should move onto it too, which also fixes its first-grip-only defect.

### 5. Leaving and coming back

- One live run per user: the sets player's `RunState` gains `fingers?: { run: Run; setups: HangSetup[] } | { done: ItemDone[]; setups: HangSetup[] }` (the timer's run while it is live, the editable sets once it has ended), and the timer opened from the workout view reads and writes that, so closing the app mid-timer resumes the timer, and between parts resumes the workout view.
- Stopping after the part: Finish logs the activity with the part and every other item not done; the run still counts once.
- Discarding the live run is the one place a finished part can be lost: nothing is saved until Finish, so Discard throws away the held hangs with everything else.
  Its confirmation says so when the part has held sets: "Discard this workout? Its fingerboard part (21 hangs held) goes too."
- Offline: writes go through the existing offline queue as one `PUT /v1/activities/:id`, so the run and its part land together or not at all.

### 6. Building one

The picker's lock goes: All shows grips under the Fingers chip beside every other exercise.
In a mix, grip rows keep their hang dose fields (edge, hangs, on and off, sets, set rest) and other rows keep theirs; the dose fields follow the item, not the workout's kind.
A mix shows the minutes field like any non-fingers workout; the part's time counts into the estimate from its protocols.
The rest between exercises defaults as today by the derived kind; a grip's own `restAfterS` still applies inside the part.

### 7. Fingers-only workouts

Start goes straight to the timer as today and writes a standalone hang session.
Routing it through the workout view would make it a part of an activity, change its kind to something it is not, and change what older builds see; a single card and a Start is also one more tap for nothing.
The two paths share the timer, the grip set rows and the editor, so there is still one way to run a fingerboard part.

### 8. Older builds, migration, web

- Migration: one additive nullable column; no backfill, no data rewrite.
- Older builds never see a part: it is not in `sessions` or history; they see the run as an activity, whose `done_json` holds only the non-grip items, so it reads as a shorter workout and nothing double counts.
- An older build editing a mixed run sends no `fingerboard`, which leaves the part as it was.
- An older build cannot build a mix (its picker locks) and opens a mix it finds in the library in the sets or checklist player, where grip items show as exercises named by grip id; acceptable for the few weeks before an update, and the store build gate is not needed because everything is JavaScript.
- Web ships the same flow in its players (`app.workout.sets.tsx`, `app.workout.timer.tsx`) from shared logic in `packages/features`.

## Alternatives weighed for the records

- Everything in the activity (grip sets in its `done_json`, no hang session): grip trends, max hangs and setups would have to read activities too, and pct, misses and the protocol as run would have nowhere to live. Rejected.
- Two independent rows linked by the same id or by date and workout: every log reader would have to drop the part itself, older builds would double count the day and advance alternating doses twice, and Strava would post twice. Rejected.
- Saving the part when the timer ends: the run would exist half-written if the app dies before Finish, and the tie would point at an activity not yet saved. Rejected for the single write at Finish.

## Slices, in shipping order

1. API: `activity_id` column, `fingerboard` on `activityBody` in one batch, `parts` on `GET /v1/hang`, parts out of history, delete cascade, Strava description with the part, the mix refusal dropped from `workoutBody` and `save_workout`, `workoutKindOf` ignoring grips. Worker deploy and D1 migration; safe with every build.
2. Shared and apps: `hangsWithParts` for grip readers; `runMinutes` for the minutes readers and the training mix; `ActivityForm` hang mode for grip items in an activity; `HangSessionForm` onto it; the hang summary's grid and `HangResultCard` drawing every grip (through `hangSessionItems`) with each set's RPE, where today they draw the first grip only, a layout change drawn on the board. Mobile over the air, web on merge.
3. Apps: the picker and editor allow a mix; the run: a mix opens the workout view with the part card, the timer runs the part and returns, the live run holds the part, Finish saves both. Mobile over the air, web on merge.

Slices 2 and 3 can ship as one pull request after slice 1; slice 3 must not ship before 2, or a mix's part would be invisible to grip trends.

## Decisions (Will, 2026-11-16)

1. Training mix and minutes split the run: the part's minutes (`hangSessionSeconds`) count as Fingers, the rest under the run's kind, through one shared rule for the minutes readers (`statistics/workouts.ts`, `overview.ts`, `insights.ts` and the training mix).
   Not chosen: counting the whole run under the activity's kind, which would file a workout of five grips and one warm-up wholly under the warm-up's kind.
2. A mix posts to Strava on the training setting (`post_training`) only, one gate per record.
   Not chosen: posting when either the training or the fingerboard setting is on.
3. Fingers-only workouts keep going straight to the timer and log a standalone hang session.
   Not chosen: running them through the workout view.

## Open questions for Will

1. A target RPE on grip doses: the type and API allow one, the editor offers none, so hang rows show the RPE box with no target until Will chooses.
