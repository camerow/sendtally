import { BUILT_IN_WORKOUTS } from "@sendtally/core/hang";
import { id } from "../lib/plan";
import * as repo from "../lib/repo";
import { owned } from "./saveExercise";
import type { ConnectorTool } from "./types";

const inputSchema = { id: id.describe("The workout's id, from get_training_library.") };

export const deleteWorkout: ConnectorTool<typeof inputSchema> = {
  name: "delete_workout",
  title: "Delete workout",
  description:
    "Deletes one of the user's own workouts from their library. It leaves every block and day it was planned on. Sessions that ran it keep what was done, and its exercises stay in the library. Built-in workouts cannot be deleted. Confirm with the user first; it cannot be undone.",
  inputSchema,
  annotations: { readOnlyHint: false, destructiveHint: true },
  run: async ({ id: workoutId }, { env, userId }) => {
    owned(true, "workout", workoutId, BUILT_IN_WORKOUTS);
    const deleted = await repo.deleteWorkout(env.DB, userId, workoutId);
    return { deleted: owned(deleted, "workout", workoutId) };
  },
};
