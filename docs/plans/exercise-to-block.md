# Exercise straight to a block

The design is the "Exercise straight to a block" page (`ExerciseToBlock.dc.html`, frames 1 to 15) of the design canvas.
A block's Add sheet lists exercises as well as workouts, and an exercise screen gets Add to block and Schedule.
Either way the exercise becomes a one-exercise workout named after it, which then behaves like any workout.

## The model

There is no new column.
A wrapper is a workout the user owns with exactly one item naming the exercise.
`wrapperOf` in `packages/features/src/workouts` finds it: of the user's one-item workouts of that exercise, it takes the one named after the exercise, else the first.
Adding an exercise reuses its wrapper when there is one, so repeated adds never pile up copies.
Otherwise it makes one from `newWorkoutDraft(kind)` and `withItemsAdded`, so it starts at the built-in's dose or the measure's starting dose.
A built-in the user has not made their own becomes theirs first, through `pickWith`.

Because the fact is derived from the workout itself, there is nothing to keep in step.
Older app builds, the connector's `save_workout` and `get_training_library`, and Duplicate all see an ordinary workout.
A wrapper edited into a multi-exercise workout simply stops being a wrapper.

Renaming an exercise renames the user's one-item workouts of it whose name was the old name, in the same `renameEverywhere` pass that already rewrites items.
Merging goes through the same pass, so a wrapper of the merged exercise takes the name of the one it merged into.
A wrapper the user renamed keeps its name.
Deleting an exercise archives it, because the wrapper's item counts as use, and the wrapper keeps working.

The trial check in #252 can use the same derivation: a wrapper whose exercise is a built-in stays free after the trial, as Will decided on 2026-11-15.

## Slices

Each slice ships alone, on mobile and web together, one commit each.

1. Copy: "Add to block" on a block, "Schedule" on the workout footer, the Schedule form without its Block row, and the rest of the board's copy audit, in all four locales.
2. Rename follows the exercise, in `renameEverywhere`.
3. The Add sheet's Workouts and Exercises switch, with exercises grouped by category, "In N workouts" on each row and "In block" when a workout in the block uses it.
4. Add to block and Schedule on the exercise screen and page; Schedule takes an exercise and makes the wrapper on Add, so backing out leaves nothing behind.
5. Train rows: "In N workouts" on Train > Exercises and "N exercises · dose" on workout rows.

## Not built

The trial lock itself, which is #252.
Option 3, "Make a workout from this".
Grip wrappers do not rename with their grip.
A wrapper lands on Train > Workouts' General shelf, because that list shelves by focus and an exercise has no focus; frame 6 draws it under Strength, which is Will's call.
