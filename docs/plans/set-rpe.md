# Set RPE

Status: plan, waiting on Will's approval of the designer board (canvas page "Set RPE").
Written 2026-11-15 on branch `feat/set-rpe`, stacked on `feat/exercise-targets-and-rests` (#426, not merged yet).
RPE means rate of perceived exertion, the 1 to 10 effort scale the app already uses.

## What Will asked

Log the actual RPE on each set, so the workout summary can compare actual effort to the exercise's RPE target that #426 added.
It is optional and out of the way: a person who never enters a set RPE sees players and summaries exactly as today, and logging a set stays one tap.

## Corrections to the lead's reading

The lead's reading is right on the core: `setOf` deletes every `PRESCRIPTION_ONLY` key, `targetRpe` included, and `SetDone` has no RPE.
Four things it did not say:

- `ItemDone` stores no prescription, so a logged session cannot tell what target its exercise had.
  Reading the workout's current dose at summary time is wrong after an edit, an alternating dose, or a block week that changes the target.
- The checklist player has no per-set entry: it ticks whole lines and its sets come from `doneAsPrescribed`.
  It reaches set entry only through the review (`DoneDetails`) it ends in.
- The hang timer and intervals players also end in `DoneDetails`, and `hang_sessions.done_json` holds the same set shape as `training_activities.done_json`.
- The connector (the MCP tools in `packages/api/src/mcp/`) never reads or writes logged training sets; it only saves workouts, whose doses already carry `targetRpe`.

## Data model

Logged sets live in `done_json` on `training_activities` and `hang_sessions`, so there is no D1 migration.
There is no native code either, so every app slice ships over the air.

- `SetDone` in `packages/core/src/hang/plan.ts` gains `rpe?: number`, whole numbers 1 to 10, the same range as the workout's own `rpe`.
  It goes on `SetDone`, not `Dose`: a dose never prescribes an actual, and keeping it off `Dose` keeps it out of `DOSE_FIELDS`, week changes and the workout editor.
- `ItemDone` gains `targetRpe?: number`, the target of the dose that session ran, recorded when the run starts.
  `doneAsPrescribed` copies it from `SessionItem.dose`; `keptSets` and `cleanDone` already spread the item, so it survives the review.
  A session logged by hand with no workout has none.
- The API's `setDone` schema in `packages/api/src/lib/plan.ts` gains `rpe: rpe.optional()` (the existing `rpe` schema), and `doneBody`'s item gains `targetRpe: rpe.optional()`.
  Without this the default Zod strip drops both silently.
- `doneOf` parses the stored JSON as is, so reads need no change.

## Readers that change

- `addSet` in `packages/features/src/activities/done.ts` copies the last set; it must leave out `rpe`, so another set starts unrated.
- `measureOf` in `packages/core/src/hang/exercise.ts`, `metricOf` / `bestOf` / `valueOf` in `statistics/exercises.ts`, `withPrevious` and `holdShort` in `setsRun.ts`, `timerView.ts` and `hangResult.ts` read named fields only, so `rpe` passes through them untouched.
  No change, but a test pins that a set with only an `rpe` does not change its measure or metric.
- `setText` / `setChip` stay as they are: the RPE is drawn as its own value, never folded into the set's chip, so last time's line and the summary chips read as today.
- `exerciseResults` in `activities/summary.ts` gains `effort: { actual: number; target: number | null } | null` per exercise: the mean of the sets that carry an `rpe`, rounded to one decimal, against the item's `targetRpe`.
  It is null when no set carries one, which is what keeps the summary unchanged for someone who never rates a set.
- `setLine` in `packages/api/src/lib/training-activity.ts` (the Strava description) stays as it is; open question below.

## What each player does

- Sets player (`SetsScreen` / `SetsPage`): the set row gets a small RPE value, entered with the in-app `Keypad` on mobile as every other number in the row is, and the web's own number input on the web.
  Ticking stays one tap; the RPE is never required and never blocks the tick or the rest.
  Where it sits and when it is entered is the board's choice (see Options).
- Checklist player: no live entry, because it has no set rows; its review takes it.
- Hang timer and intervals: no live entry, the timer screen has no room and a hand is on the board.
  Their review takes it, since it is the same `DoneDetails`.
- Review (`DoneDetails` + `ReviewSetRow`, mobile and web): each set row takes an RPE the same way as the sets player, so sets can be rated after the fact and on any player's run.
  The edit form (`ActivityForm`) is the same component, so editing a saved session can add, change or clear one.
- Summary (`ActivitySummary` + `ExerciseResultCard`, mobile and web): an exercise with rated sets shows one line, "RPE 7.5 · target 8", or "RPE 7.5" with no target.
  The workout's own RPE tile stays as it is, against the workout's `targetRpe`; set RPE neither fills nor replaces it.
- Stats exercise trend: unchanged; set RPE is Deferred (`OverTime` plots one metric, a second series is not cheap).

## Options

Entry timing, which the board draws side by side:

1. On the set row: tap the row's RPE value, the `Keypad` opens on it like the reps and weight fields; it can be done before or after the tick, or never.
2. In the rest row that follows a tick: one prompt beside the countdown.
   It misses every set with no `setRestS`, the last set of each exercise, and the checklist and timed players, so it cannot be the only way in.
3. Only in the review after the run.

Eng recommendation: 1, which also covers 3 for free because the review uses the same row; 2 adds a second entry point for a subset of sets and is not worth its code.
Layout cost: `SET_COLUMNS` is Set, Target, Done, tick, and on a phone the Done cell already holds reps and weight, so a fifth full column is tight at 375 points wide; the RPE has to sit small inside the Done cell or under the row.

## Old builds

- An older build never shows a set RPE; its players and summaries read as today.
- An edit and save on an older build keeps the set RPE: `SetDoneFields` changes a field with `{ ...set, reps }`, so unknown keys ride along, and `ItemDone` is spread the same way.
- An older build's `addSet` copies the last set's `rpe` onto the new one; that set then shows the same rating on a new build until it is changed.
  Acceptable, noted.
- The API accepts both fields from merge onwards; apps sending them before the API deploy would be stripped, so the API slice ships first or with the app slice in one pull request.

## Connector

No change.
It reads and writes workouts (doses already carry `targetRpe`) and climbing sessions, never logged training sets.
If Will wants Claude to see set RPE later, that is a new read of training activities, which the connector does not have today.

## Slices in shipping order

1. Core and API: `SetDone.rpe`, `ItemDone.targetRpe`, the Zod fields, `doneAsPrescribed` recording the target, `addSet` dropping `rpe`, tests.
   API deploys on merge; no migration; apps unchanged.
2. Set row entry on the sets player and the review, mobile and web, shared logic in `packages/features`.
   Over the air.
3. Summary line on `ExerciseResultCard`, mobile and web.
   Over the air.

Slices 1 to 3 are small enough for one pull request once #426 merges; they are split here so each can be checked on its own.

Deferred: set RPE in the Stats exercise trend; set RPE in the Strava description; a live prompt in the rest row.

## Open questions for Will

1. Should the Strava description carry set RPE (for example "Squat 5×100 kg @8")? Eng default: no, the first line already carries the workout's RPE.
2. Should rated sets suggest the workout's own effort when it is still empty at the end? Eng default: no, the two stay independent.
3. Whole numbers only, or halves (RPE 7.5 is common in strength training)? Eng default: whole numbers, matching the workout's RPE and the exercise target.
