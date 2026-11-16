# Creating a workout without picking a category

Will, 2026-11-15: choosing Fingers, Climbing, Strength, Mobility or Other when creating a workout makes no sense, because a workout can hold anything and already carries a focus (Strength, Power, ...).
This plan removes the question and keeps everything the category drives working.

## Terms

The five categories are the workout's `kind` (`WORKOUT_KINDS` in `packages/core/src/hang/plan.ts`), labelled "Category" in the apps.
Strength, Power and the rest are the workout's `focus` (`FOCI`), which is unrelated to `kind` and stays as it is.
Exercises have their own category (`EXERCISE_KINDS`: climbing, strength, mobility, other); Fingers exercises are grips, a separate entity.

## Where the question is asked today

- Mobile: `apps/mobile/features/training/library/NewWorkoutSheet.tsx` with `making="workout"`, opened from `TrainScreen`, `WorkoutLibrary` and `AddWorkoutsSheet`.
- Mobile: the same sheet with `making="exercise"` from `TrainScreen` and from `ExercisePickerSheet` (New under All, grips left out).
- Web: `apps/web/app/training/editor/CategorySheet.tsx`, opened from `TrainPage`, `WorkoutLibrary` and `ExercisePicker` (exercise only, grips left out).
- The editors then open with `?kind=` (`apps/mobile/app/workout/edit.tsx`, `apps/web/app/routes/app.train.workouts.new.tsx`), which seeds `newWorkoutDraft(kind)`.

## What `kind` drives today

Every reader found, grouped by what it decides.

### What a run and a log become

- `workoutStart` (`packages/features/src/workouts/workoutStart.ts`): hangboard with items opens the hang timer on its first grip; climbing with no items opens the live climbing session; any other with no items opens the activity form; with items the player follows the doses (intervals, sets, checklist).
- `activityKindOf` (`packages/features/src/workouts/library.ts`), used by `workoutStart`, `startLibraryWorkout.ts` (mobile) and `logLink.ts` (web): a hangboard workout logs as a hang session, climbing as a climbing session, strength, mobility and other as an activity of that kind.
- Statistics (`packages/features/src/statistics/workouts.ts`, `overview.ts`, `insights.ts`) and the training mix group by the kind of the logged record, so they inherit `kind` at log time and never read the workout again.
- `doneBy` in `packages/features/src/training/plan.ts` and `recap.ts`: a planned day counts as done by an unlinked log of the same kind on that date.

### What the editor and picker show

- Both editors (`WorkoutEditorScreen`, `WorkoutEditorPage`) and `editorState.ts`: hangboard items are grips, there is no minutes field, doses carry edges, and `defaultExerciseRestS` is 3:00 instead of none.
- `ExercisePickerSheet` (mobile) and `ExercisePicker` (web): a hangboard workout picks grips only (`usePickerWorld(..., fingers)`, `pickerEntries`), any other picks everything but grips, and the category chips start on the workout's kind.

### What text and colour a workout wears

- `KIND_LOOK` and `KIND_COLORS` (`packages/features/src/training/kindLook.ts`, `kindColors.ts`): colour and mark in the library, Train, the week grid (`planGridRows.ts`, `days.ts`), the ladder, the load table and player headers.
- `workoutMinutes`, `estimatedMinutes`, `doseSummary`, `bodySummary`, `libraryLine`, `occurrenceText`, `planGridRows`: hangboard and climbing read their doses differently.
- `browseLibrary` search matches the kind's label and can filter by kind (`kinds` is only passed by the exercise picker today).

### The API and connector

- `workouts.kind` column, `text` enum, `NOT NULL DEFAULT 'other'` (`packages/api/src/db/schema.ts`).
- `workoutBody` in `packages/api/src/lib/plan.ts` requires `kind` and uses it for the default rest between exercises.
- `workoutExercises` and `exerciseKindOf` (`packages/api/src/lib/exercises.ts`): saving a workout creates any exercise its items name that does not exist yet, with the workout's kind as the new exercise's category; a hangboard workout's items are grip ids and create nothing.
- `save_workout` (`packages/api/src/mcp/saveWorkout.ts`) requires `kind` and uses it the same way.

## Corrections to the brief

- Train's shelves do not group by `kind`; Train's workout categories are by focus (`apps/mobile/app/workout/category.tsx` is a focus screen despite its name).
- The bigger job `kind` does is choosing what a log is filed as (hang session, climbing session, or activity of a kind), not only the player.
- The hang timer is chosen from `kind`, not from the items, and starts on the first grip.
- Both new-workout routes parse `kind` as optional, but with none and no `from` the editor has no draft (`initialDraft` returns null), so slice 3 makes no `kind` mean a new Other draft.
- Nothing on the API checks that a hangboard workout's items are grips.

## Recommended model

Keep `kind` as a stored column, stop asking for it, and derive it from the workout's exercises on every save.

- All items are grips: `hangboard`.
- Otherwise: the category most items share, a tie going to the first item's.
- No items: the kind it already had, `other` for a new workout.

Keeping an empty workout's kind matters because an empty climbing workout is how people plan a climbing day (it opens the live session), and older builds still create them.

Grips and other exercises do not mix in one workout.
Grips log as hang sessions (protocol, edge, grip trends) and everything else as activity sets, so a mix needs a new player and a split log, which is not worth it for this change.
The first exercise picked decides: once a grip is in, the picker offers grips only; once anything else is in, grips are hidden.
A new workout's picker starts on All, which now includes grips under a Fingers chip.
The editor switches to the hangboard layout when its first grip lands, and back when the last one goes.

The colour stays with the derived kind, not focus.
An empty workout wears Other's colour until it has an exercise.

Creating an exercise still asks its category: an exercise is one thing, and its category picks its measure and its shelf.

### Alternatives weighed

- Dropping `kind`: every reader above would need to derive it from items on every read, logs would need another way to pick their record, and older builds and `save_workout` would break. Far more code for no visible gain.
- Optional `kind`, no longer asked: leaves most new workouts as Other, so their logs file as Other activities and the training mix fills with Other. Derivation costs one shared function and gives the right answer.
- Colour by focus: most workouts have no focus (General), and the week grid would lose the discipline colour that tells a fingers day from a strength day at a glance.

### Costs of the recommendation

- A shared `workoutKindOf(items, categoryOf)` in `packages/core/src/hang/`, used by both editors and the API; it needs each item's exercise category, which the client library and the API both already hold.
- Editing a workout can change its kind, so later logs of it file under the new kind; earlier logs keep theirs.
- An unlinked log made before such an edit may stop counting a planned day as done; this needs a workout whose majority category was changed by an edit and an unlinked log, so it is acceptable.

## Older builds

Older mobile builds keep asking the question and send `kind`.
The API derives `kind` whenever a save has items, so what they send is overruled consistently; with no items it keeps what they sent.
They read `kind` back unchanged, so nothing they show breaks.
No migration: the column, its default and every stored value stay.
Existing workouts keep their kind until they are next saved, when it is derived.

## Connector

`save_workout` makes `kind` optional and derives it the same way; a `kind` given with no items is kept, so an agent can still plan an empty climbing day.
Its description drops "kind is one of ..." for one line saying kind is worked out from the items and only matters for a workout with none.
A hangboard workout is still any workout whose items are all grip ids.

## Slices, in shipping order

1. API: `workoutKindOf` in core, derived on save in `workoutBody` and `save_workout`, `kind` optional in both. New exercises named by items take their category from the built-in or user exercise of that name, else Other. Worker deploy; no app change, safe with every build.
2. Apps: the picker on All with a Fingers chip and the lock after the first pick; both editors derive `kind` live from items in `editorState.ts` so the layout follows. Mobile ships over the air (JavaScript only), web on merge.
3. Apps: remove the category question for workouts. Create > Workout and New in the library and add-workouts sheet open the editor directly. `NewWorkoutSheet` and `CategorySheet` keep only `making="exercise"` and become exercise-only (rename to `NewExerciseCategorySheet` or similar); `workouts.pickCategory` goes from all four catalogs (`workouts.createWorkout` stays: the Create menu on Train uses it). Over the air.

Slices 2 and 3 can ship as one pull request; slice 1 must merge first.

## Removed

- The category sheet in every create-workout flow, mobile and web.
- The `kind` search param on both new-workout routes.
- `workouts.pickCategory` in `en`, `de`, `fr`, `es`.
- `kind` as a required field on the API and on `save_workout`.

## Open questions for the lead (approver)

1. Mixed grips and exercises in one workout is out of scope; say if you want it planned separately (it needs a player that runs hangs and sets and a log split across both).
2. A climbing day with nothing in it: with the question gone, a new empty workout is Other and opens the activity form. Is "add a climbing exercise" (which then opens the sets player, not the live session) good enough, or should a workout whose items are all climbing exercises open the live session too?
3. Should the picker's New under All offer New grip alongside the four exercise categories?
