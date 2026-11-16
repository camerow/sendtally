# Exercise targets, per-gap rests, set and rep ranges

Status: plan, waiting on Will's approval of the designer board (canvas page "Exercise targets and rests").
Written 2026-11-14 on branch `feat/exercise-targets-and-rests`.
RPE means rate of perceived exertion, the 1 to 10 effort scale the app already uses.

## What Will decided

1. An RPE target per exercise, target only; nothing new is logged per exercise, and the workout target stays.
2. A rest between each pair of exercises, each editable on its own.
3. Set ranges such as 3-5: sets past the minimum are optional extras the player offers after the minimum.
4. Rep ranges such as 8-12, the same pattern.
5. Timed players (hang timer, intervals) keep single numbers; ranges are for strength and checklist style workouts.

## Data model

Everything lives in `items_json` on `workouts` and `change_json` on `week_changes`, so there is no D1 migration.
There is no native code either, so every app slice ships over the air.

`Dose` in `packages/core/src/hang/plan.ts` gains three optional fields:

- `targetRpe?: number` - the exercise's effort target, 1 to 10 whole numbers.
- `setsMax?: number` - the most sets; only stored when greater than `sets`.
- `repsMax?: number` - the most reps per set; only stored when greater than `reps`, and only with `reps`.

They sit on the dose, not the item, because a block week changes doses: `WeekChange.change` is `Partial<Dose>`, so a week can change the target or either range with no new week-change shape.
An item that alternates doses (A, B) gets a target and range per dose, which follows from the same rule.
All three go into `DOSE_FIELDS`, so `changeFrom` (what a week stores) carries them, and every `Record<WeekField, ...>` in `packages/features/src/training/weeks.ts` must name them, which the compiler enforces.

`sets` and `reps` stay the minimum, and everything that counts keeps reading them: completion, planned duration, `doneAsPrescribed`, `intervalsOf`, the hang timer protocol, and the library minutes.

`Item` gains `restAfterS?: number`: the rest after this exercise, before the next one.
None means the workout's `exerciseRestS`, which stays as the rest every gap starts at.
The last item's is ignored, and the editor never shows or writes one for it.
`SessionItem` gets the same field, copied in `sessionItem`, so it reaches the players through the existing `items` JSON route param with no new param.

The rest is per item, not per dose, so a block week cannot change it.
Will asked only for the RPE target to vary by week; a rest that varies by week would need the rest on the dose and is deferred.

## Corrections to the lead's model

- The checklist player ticks one line per exercise, not per set (`useChecklistPlayer`), so it has no sets to extend.
  A range there is text only ("3-5 × 8-12"); optional extra sets exist only in the sets player.
- The sets player opens for any item with reps or weight; mobility and plain lines open the checklist; all-timed items open the intervals player.
  The intervals player rests from each dose's `offS` / `setRestS`, never from `exerciseRestS`, so it gets no per-gap rest.
- The hang timer does read the workout rest (`workoutPhases` in `packages/core/src/hang/workoutRun.ts`, via `useTimerPlayers`), so per-gap rests reach it.
- `SetDone` is `Omit<Dose, "sets" | "name">` and `doneAsPrescribed` spreads the dose into every logged set, so without a change the three new fields would be logged on every set.
  Both the type and the API's `setDone` schema must leave them out.
- `runParams` already carries the run's items as JSON, so per-gap rests need no route param, provided they ride on `SessionItem`.
- The connector's `save_workout` and `get_training_library` rebuild items as `{ exercise, doses }` on output, which drops `restAfterS`.
  A model that reads a workout and saves it back would wipe its per-gap rests unless the output carries the field.
- The sets player needs no new counter for extra sets: its persisted state already holds `done`, the sets of each item.
  "Add set" appends with the existing `addSet` from `packages/features/src/activities/done.ts`, and `allSets` / `itemDone` read each item's set count from `done` instead of `dose.sets`.
  A resumed run keeps its extra sets for free.
- No D1 migration and no native change: confirmed.

## Validation and the API

`packages/api/src/lib/plan.ts`:

- `dose` gains `targetRpe: rpe.optional()`, `setsMax: z.number().int().min(1).max(100).optional()`, `repsMax: z.number().int().min(0).max(1000).optional()`.
- `item` gains `restAfterS: seconds.optional()`.
- A dose whose `setsMax` is not above `sets`, or whose `repsMax` is not above `reps` or has no `reps`, has that maximum dropped, never rejected.
  That is what an older build produces when it raises `sets` past a range it cannot see.
- `setDone` omits the three new fields; Zod strips unknown keys, so sets logged by older builds that spread the dose lose them silently.
- `weekChangeBody` uses `dose.partial()`, so it accepts the new fields with no edit.
- `save_workout` and `get_training_library` return `restAfterS` on items, and the `save_workout` description names `targetRpe`, `setsMax`, `repsMax` and `restAfterS` with one example ("3-5 × 8-12 at RPE 8").

## Every reader that changes

Core (`packages/core/src/hang`):

- `plan.ts`: `Dose`, `DOSE_FIELDS`, `Item`, `SessionItem`, `sessionItem`, `SetDone`, `doneAsPrescribed`, and `hangboardSeconds`, which sums each gap's rest instead of `(n - 1) × exerciseRestS`.
- `workoutRun.ts`: `workoutPhases` / `startWorkoutRun` take one rest per gap.

Features (`packages/features/src`):

- `workouts/setsRun.ts`: `restAfterTick` uses the finished item's `restAfterS ?? exerciseRestS`; `allSets` and `itemDone` count from `done`.
- `workouts/useSetsPlayer.ts`: offers Add set while an item's done sets are below `setsMax` and its minimum is ticked.
- `workouts/useChecklistPlayer.ts`: the rest after a line uses that line's rest.
- `workouts/finishedRun.ts`: the rest it reports uses the gap's rest.
- `workouts/useTimerPlayers.ts`: passes each item's rest into the timer.
- `workouts/library.ts`: planned minutes sum each gap's rest.
- `workouts/doseFields.ts`: the range on the sets and reps fields, and the target field; `withField` keeps a maximum above its minimum and drops it when it falls to the minimum.
- `workouts/editorState.ts`: one helper for an item's rest; reorders carry an item's rest with it.
- `training/weeks.ts`: `STEP`, `MIN`, `fieldLabel`, `weekFields`, `loadColumns` and `cellText` for the new fields.
- A dose text helper for "3-5 × 8-12" that the library list, the players and the connector all use.
- i18n: the new labels in `en`, `de`, `fr` and `es`.

Mobile (`apps/mobile/features/training`) and web (`apps/web/app/training`), each:

- Workout editor (`workout-editor/WorkoutEditorScreen`, web `editor/WorkoutEditorPage`): range and target on each exercise's dose, a rest row in each gap, and the single "rest between exercises" field removed.
- Library detail (`library-detail/BodyPreview` and `RestDivider`, `LibraryIntro`): range text, per-exercise target, each gap's own rest.
- Sets player (`sets/SetsScreen`, `SetsCard`, `SetRow`, web `players/SetsPage`, `SetsCard`, `RestPreview`): the exercise's target, the range, Add set, the gap's rest.
- Checklist player (`checklist/ChecklistScreen`, web `players/ChecklistPage`): range text, target, the gap's rest.
- Hang timer (`timer`, web `players/timer/TimerPage`): the gap's rest only.
- Block week table (`planning/LoadTable`, web `blocks/LoadTable`): the new columns and cells.
- Summary (`summary/ActivitySummary`, `HangSummary`): unchanged; the effort tile compares the logged session RPE with the workout target, and per-exercise targets have nothing logged to compare with.

## What each player does

- Sets player: shows the minimum sets as today; once they are ticked, an Add set row offers one more set like the last, until `setsMax`.
  The exercise counts as done at the minimum, so the rest to the next exercise starts after the minimum's last tick, as today; adding a set clears it and the set rest runs instead.
  Reps prefill at the minimum and the set's reps field shows the range as its hint.
  The exercise's target shows beside its name; the workout target stays in the header.
  The rest after each exercise is that gap's rest.
- Checklist player: each line reads its range and target; the rest after each line is that gap's rest.
- Hang timer: single numbers as today; the rest before each grip is that gap's rest.
- Intervals player: unchanged.

## Older builds and the connector

An older build reading a workout ignores the new fields: it runs the minimum sets and reps, shows only the workout target, and rests `exerciseRestS` in every gap.
Its sets player spreads the dose into logged sets, and the API strips the new fields from them.

An older build that edits and saves a workout keeps the new fields, because every editor change spreads the item and the dose (`withDose`, `withItem`, `withField`, `withSetRest`).
The exceptions are where it rebuilds a dose: swapping a grip to one measured another way, or a new item, which never had the fields anyway.
If it raises `sets` past a range it cannot see, the API drops the stale maximum.
If it edits the workout-level rest, gaps with their own rest keep theirs, so the edit looks like it did nothing on those gaps.

An older build that edits a block week cell replaces that week's change for that dose with what its `changeFrom` knows, which drops any week change to `targetRpe`, `setsMax` or `repsMax` for that dose and week.
This matters only for someone editing the same block on two devices on different versions, and over-the-air updates close the window within a launch or two, so it is accepted.

The connector reads and writes through the same schemas, so it gets the dose fields with no code change; only its item output and its description need the edits above.

## Slices, in shipping order

1. **Model and API.** Core types, `DOSE_FIELDS`, `SetDone`, API schemas and normalisation, connector output and description, tests.
   Ships with the Worker deploy on merge. It goes first so no app saves a field the API would strip.
2. **Per-exercise RPE target.** Editor field, library detail, sets and checklist players, block week column.
   Web on merge, mobile over the air.
3. **Per-gap rests.** Editor rest rows, library detail dividers, `restAfterTick`, checklist, hang timer, planned minutes.
   Web on merge, mobile over the air.
4. **Set and rep ranges.** Editor range control, dose text, block week cells, sets player Add set, checklist text.
   Web on merge, mobile over the air.

Slices 2 to 4 are independent of each other once slice 1 is live, so they can ship in any order or together.

## Range entry: the board's two options

- Option A (recommended): the count keypad gains a To key in place of 00, so "3, To, 5" types 3-5 into the existing Sets or Reps box.
  `Keypad` commits one number today, so this needs a range entry in `packages/core/src/hang/entry.ts`, a pair commit through `KeypadField`, and the step keys stepping the end being typed.
  That is three or four files plus tests, no native code, over the air.
  The web `NumberField` is a text input with its own parser and counts are unsigned, so it takes "3-5" typed with a hyphen.
- Option B: a Ranges switch on the card adds "up to" boxes, which reuses `NumberField` as it is and costs nothing new, at one more row and two more boxes per card.

## Open questions for Will

1. Option A or option B for typing a range?
2. When an exercise moves in the editor, does its rest move with it (the rest belongs to the exercise before the gap) or stay in the gap? The plan moves it with the exercise.
3. Should the rest between exercises be changeable by block week? The plan says no, since only the target was asked for.
4. Should the sets player prefill reps at the bottom of the range, or leave them empty for the climber to type? The plan prefills the minimum.
5. Is the per-exercise target one number, or a range too (RPE 7-8)? The plan keeps one number.
