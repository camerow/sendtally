# Climbing volume score

Status: volume score approved by Will and built (2026-11-14); the Progress dropdown is drawn and waiting on approval.
Board: page "Climbing volume score" on https://claude.ai/artifact/CNPnNQwgvzgvxk4ZAYTyto, frames `ClimbingVolumeScore.dc.html` and `ProgressDropdown.dc.html`.
Everything ships on both apps/web and apps/mobile with the same behaviour; the logic lives in `packages/features`.

## The ask

A fifth Progress choice for climbing exercises, Total volume score, so a capacity session can show both average grade and total volume rising over time.
Will's formula is total volume = sum of weight times reps; for climbing the weight is the grade and the reps are the sends.

## Formula

A session's score for one exercise is the sum, over every graded send in the session's dominant discipline, of that send's rank plus one.
The rank is the number `gradeOf` already averages: `climbRank`, the V grade for boulders and the route ladder index for routes (5.5 and 4a are 0, 5.10a and 5c are 5, 7a and 5.11d are 12).
Attempts, ungraded climbs and climbs of the other discipline score nothing, exactly as they drop out of the average grade today.

Worked example: sends of V3, V4, V2, V4 and V5 score 4 + 5 + 3 + 5 + 6 = 23.
The average grade is V3.6, so the score is (3.6 + 1) x 5 = 23.
A sixth send of V4 next time makes it 28; the same five sends one grade harder make it 28 too.

The plus one is the one open choice (see Open questions).
Without it the score is exactly average x sends, but a V0 or any route up to 5.5 adds nothing, so a session of easy mileage scores 0.

## Model change

- `EXERCISE_PROGRESS` in `packages/core/src/hang/exercise.ts` gains `"volume"`, between `topGrade` and `none`, and its doc comment says so.
- `ExerciseMetric` in `packages/features/src/statistics/exercises.ts` gains `"volume"`.
  It counts as a climbing metric (`isClimbingMetric`), not a grade metric, because its value is a plain number.
- A `volumeOf(sets, discipline)` next to `gradeOf` returns the sum of rank plus one over the same filtered sends, or undefined when there are none.
- `ExerciseSession` gains an optional `averageGrade` for a volume series, so the second figure reads from the session rather than recomputing in each app.
  `volumeKg` stays the strength figure; the name is in kilograms and does not fit a grade sum, so the score lives in `value` as every other metric's does.
- `ExerciseSeries.grades` is set for a volume series too, so the average reads in the climber's scale.

## Readers that change

- `exerciseSeries` (`statistics/exercises.ts`): `progress === "volume"` picks the volume metric; `sessionOf` fills `value` from `volumeOf` and `averageGrade` from `gradeOf`.
- `metricText` and `headlineLabel` (`exercises/exerciseText.ts`): a volume value is `formatNumber(value)`; the headline is a new `trends.volumeScore` key, "Total volume score".
- `changeText` (`activities/summaryText.ts`): a volume change reads as a signed number, "+2" or "−3", through `formatNumber`.
- `ExerciseTrendCard`, mobile and web: an `AIR` entry for volume (2), and one mono line under the number, "Average V3.6 · 5 sent", for a volume series.
- `OverTime`, mobile and web: the header reads Total volume score; the headline is the score; the line under it reads "Average V3.6 · top V5" in place of the top send alone, reusing `sessions.topSend`.
- `ProgressChips` (mobile) and `ExerciseFields` (web) need no code: they map over `EXERCISE_PROGRESS`.
- New catalog keys in all four locales: `workouts.progress.volume` ("Total volume score"), `trends.volumeScore` ("Total volume score"), `trends.averageIs` ("Average {grade}").

## Progress dropdown (Will, 2026-11-14)

Will asked for the Progress setting to be a dropdown where every choice has a second line saying what it tracks.
Mobile: `SelectRow` shows the current choice and opens its sheet of `OptionRow`s; `OptionRow` gains an optional second line under its label (its `detail` stays the right-aligned mono text other sheets use).
Web: the `MoreMenu` pattern, a menu anchored to the field on desktop and a bottom sheet at 375, with a field-styled trigger, `menuitemradio` items, a check on the chosen one, and the name and hint anatomy `LogMenu` items already use.
The second lines, as new `workouts.progressHint.<choice>` keys in all four catalogs:

- Climbs completed: "How many climbs you finish each session."
- Average grade: "The average grade you send each session."
- Highest grade: "The hardest grade you send each session."
- Total volume score: "Your sends' grades added up, so more climbs or harder ones raise it."
- None: "Keeps the log, shows no trend."

Removed: `ProgressChips` on mobile and the setup-chips radio group on web, plus the Advanced disclosure and its `workouts.progressIs` summary line on both, since one row has nothing left to hide.
Not built until Will approves the `ProgressDropdown.dc.html` frame.

## Found while verifying

The exercise screen's history rows (`exerciseItems`, shared by web and mobile) showed a climbing session's best set only, so every row read "3 climbs · 3 sent · top V4" whatever the session did.
They now read the climbs over every set of the session, as the summary card does ("6 climbs · 5 sent · top V5").

## Readers that stay as they are

- Stats: `trainingInsightsVM` builds exercise groups for strength, mobility and other only and calls `exerciseSeries` without the Progress setting, so climbing exercises never reach it.
- The workout summary's exercise card (`exerciseResults`) counts sends whatever the setting says, as it already does for Average grade and Highest grade.
  That is an existing gap, deferred on the board, not something this change makes worse.
- The Train shelf line (`shelfCards.ts`) shows "Best V5" only for grade metrics and "Climbs" otherwise; volume reads "Climbs", like Climbs completed.
- Block recaps use the set-level `setChange`, which never sees climbing progress.

## Database

`progress` is a Drizzle `text(..., { enum })` column; `0025_training.sql` created it as plain `text` with no CHECK constraint.
The enum is a TypeScript type only, so `db:generate` emits no migration.
The API's Zod body (`exerciseBody` in `packages/api/src/lib/exercises.ts`) reads `z.enum(EXERCISE_PROGRESS)`, so it accepts `volume` once the core list has it.

## Old builds

An installed build that predates this reads `volume` from `GET` exercises without a runtime parse, so nothing throws.
Its `exerciseSeries` treats an unknown progress as Climbs completed, so the trend shows sends.
Its Progress chips show no chip selected, and saving the editor sends `volume` back unchanged unless the climber picks another chip.
A new build talking to an API that is not yet deployed would have `volume` refused by Zod; the API deploys on merge, before the update reaches phones.

## Connector

`save_exercise` takes name, kind, measure and eachSide only; it neither sets nor returns Progress, and `get_training_library` does not show it.
Nothing changes there; letting the connector set Progress is deferred.

## Shipping

Pure JavaScript and catalog strings, no native module or config change, so the mobile side ships over the air on the `production` channel.
The API and web ship with the merge deploy.

## Tests

- `exercises.test.ts`: a volume series scores the worked example (23), ignores attempts and the other discipline, and carries the average.
- `exerciseText.test.ts`: `metricText` and `headlineLabel` for volume; `changeText` for a volume change.
- The i18n parity test covers the new keys.

## Open questions for Will

1. What a V0 scores: Will approved the board as drawn, rank plus one.
2. The Progress dropdown frame, including dropping the Advanced disclosure.
3. Whether the summary's exercise card should follow the Progress setting for every option; deferred unless asked.
