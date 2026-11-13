import { BUILT_IN_EXERCISES } from "@sendtally/core/hang";
import { exerciseBody, exerciseNameKey, type ExerciseInput } from "../lib/exercises";
import { id } from "../lib/plan";
import { saveExercise as save } from "../training";
import type { ConnectorTool } from "./types";

/** The built-in exercise of this name, as the user's own exercise linked to it. */
export function builtInExercise(name: string): ExerciseInput | undefined {
  const b = BUILT_IN_EXERCISES.find((e) => exerciseNameKey(e.name) === exerciseNameKey(name));
  return b && { name: b.name, kind: b.kind, measure: b.measure, builtIn: b.id };
}

export const retryKey = id
  .max(48)
  .optional()
  .describe(
    "Optional. Letters, digits, - or _. Send the same key when retrying a call so it saves once."
  );

const inputSchema = {
  key: retryKey,
  ...exerciseBody.pick({ name: true, kind: true, measure: true, eachSide: true }).shape,
};

export const saveExercise: ConnectorTool<typeof inputSchema> = {
  name: "save_exercise",
  title: "Save exercise",
  description:
    "Adds an exercise to the user's library. kind is climbing, strength, mobility or other (hangboard grips are not exercises). measure is how a set is logged: reps, repsWeight (reps with added kg), seconds, secondsWeight (a timed hold with added kg), rounds, or laps (climbing only); left out it follows the kind. eachSide marks an exercise done per side. A name matching a built-in exercise (see get_training_library) saves that built-in as it is. If the user already has an exercise by this name, nothing is saved and that exercise comes back with existing: true. save_workout creates exercises its items name, so call this only for an exercise on its own.",
  inputSchema,
  annotations: { readOnlyHint: false, destructiveHint: false },
  run: async ({ key, ...body }, { env, userId }) => {
    const { exercise, taken } = await save(
      env.DB,
      userId,
      key ?? crypto.randomUUID(),
      builtInExercise(body.name) ?? body
    );
    const { name, kind, measure, eachSide } = exercise;
    return {
      exercise: { name, kind, measure, eachSide, builtIn: exercise.builtIn !== null },
      existing: taken,
    };
  },
};
