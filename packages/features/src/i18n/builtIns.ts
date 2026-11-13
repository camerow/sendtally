import {
  BUILT_IN_EXERCISES,
  BUILT_IN_STEP_NAMES,
  BUILT_IN_WORKOUTS,
  type BuiltInExerciseId,
  type BuiltInStep,
  type BuiltInWorkoutId,
} from "@sendtally/core/hang";

/** Where each built-in workout's name and blurb sit in the catalogs. */
export const WORKOUT_KEYS = {
  rep73: "hang.workout.rep73",
  max10: "hang.workout.max10",
  "fingers-ab": "workouts.builtIn.fingersAb",
  block: "hang.workout.block",
  density: "hang.workout.density",
  assist: "hang.workout.assist",
  lowpull: "hang.workout.lowpull",
  "min-edge": "workouts.builtIn.minEdge",
  "seven-53": "workouts.builtIn.sevenFiftyThree",
  "climb-limit": "workouts.builtIn.limit",
  "climb-4x4": "workouts.builtIn.fourByFour",
  "climb-arc": "workouts.builtIn.arc",
  "strength-squat": "workouts.builtIn.squat",
  "strength-5x5": "workouts.builtIn.fiveByFive",
  "strength-antagonist": "workouts.builtIn.antagonist",
  "strength-extensors": "workouts.builtIn.extensors",
  "mobility-hips": "workouts.builtIn.hips",
  "yoga-climbers": "workouts.builtIn.yoga",
  "run-tempo": "workouts.builtIn.tempo",
  "other-core": "workouts.builtIn.core",
} as const satisfies Record<BuiltInWorkoutId, string>;

type BuiltInNameKey =
  | `workouts.exercise.${BuiltInExerciseId}`
  | `workouts.step.${BuiltInStep}`
  | `${(typeof WORKOUT_KEYS)[BuiltInWorkoutId]}.name`;

/** The English names of the built-ins, which core holds so the Worker can read them too. */
export const builtInNames = Object.fromEntries([
  ...BUILT_IN_EXERCISES.map((e) => [`workouts.exercise.${e.id}`, e.name]),
  ...Object.entries(BUILT_IN_STEP_NAMES).map(([id, name]) => [`workouts.step.${id}`, name]),
  ...BUILT_IN_WORKOUTS.map((w) => [`${WORKOUT_KEYS[w.id]}.name`, w.name]),
]) as Record<BuiltInNameKey, string>;
