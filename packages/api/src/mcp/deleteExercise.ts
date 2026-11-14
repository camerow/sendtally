import { BUILT_IN_EXERCISES } from "@sendtally/core/hang";
import { id } from "../lib/plan";
import { deleteExercise as remove } from "../training";
import { owned } from "./saveExercise";
import type { ConnectorTool } from "./types";

const inputSchema = { id: id.describe("The exercise's id, from get_training_library.") };

export const deleteExercise: ConnectorTool<typeof inputSchema> = {
  name: "delete_exercise",
  title: "Delete exercise",
  description:
    'Removes one of the user\'s own exercises from their library. One that a workout or a logged session names is archived instead of deleted: it leaves the lists but keeps its history, and saving an exercise of that name brings it back. Returns removed: "deleted" or "archived". Built-in exercises cannot be deleted. Confirm with the user first.',
  inputSchema,
  annotations: { readOnlyHint: false, destructiveHint: true },
  run: async ({ id: exerciseId }, { env, userId }) => {
    owned(true, "exercise", exerciseId, BUILT_IN_EXERCISES);
    return { removed: owned(await remove(env.DB, userId, exerciseId), "exercise", exerciseId) };
  },
};
