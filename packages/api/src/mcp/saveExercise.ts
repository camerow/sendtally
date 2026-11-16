import type { BuiltInLibrary } from "@sendtally/core/hang";
import { exerciseBody, exerciseNameKey, type ExerciseInput } from "../lib/exercises";
import { id } from "../lib/plan";
import * as repo from "../lib/repo";
import { saveExercise as save } from "../training";
import type { ConnectorTool } from "./types";

/** The built-in exercise of this name, as the user's own exercise linked to it. */
export function builtInExercise(library: BuiltInLibrary, name: string): ExerciseInput | undefined {
  const b = library.exercises.find(
    (e) => e.status === "active" && exerciseNameKey(e.name) === exerciseNameKey(name)
  );
  return b && { name: b.name, kind: b.spec.kind, measure: b.spec.measure, builtIn: b.id };
}

export const retryKey = id
  .max(48)
  .optional()
  .describe(
    "Optional. Letters, digits, - or _. Send the same key when retrying a call so it saves once."
  );

export const editId = (thing: string): ReturnType<typeof id.optional> =>
  id
    .optional()
    .describe(
      `Optional. The id of the user's ${thing} to change in place, from a read tool. Left out, a new ${thing} is saved.`
    );

/** The user's own item under this id; a built-in or another user's id is refused. */
export function owned<T>(
  row: T | null | undefined | false,
  thing: string,
  itemId: string,
  builtIns: readonly { id: string }[] = []
): T {
  if (builtIns.some((b) => b.id === itemId)) {
    throw new Error(
      `"${itemId}" is a built-in ${thing}, which cannot be changed or deleted. Save a copy under a new name instead.`
    );
  }
  if (row === null || row === undefined || row === false)
    throw new Error(`The user has no ${thing} "${itemId}".`);
  return row;
}

const inputSchema = {
  key: retryKey,
  id: editId("exercise"),
  ...exerciseBody.pick({ name: true, kind: true, measure: true, eachSide: true, description: true })
    .shape,
};

export const saveExercise: ConnectorTool<typeof inputSchema> = {
  name: "save_exercise",
  title: "Save exercise",
  description:
    'Adds an exercise to the user\'s library, or with id changes that one, renaming it in every workout and log that names it. kind is climbing, strength, mobility or other (hangboard grips are not exercises). measure is how a set is logged: reps, repsWeight (reps with added kg), seconds, secondsWeight (a timed hold with added kg), rounds, or laps (climbing only); left out it follows the kind. eachSide marks an exercise done per side. description is optional plain text up to 2000 characters: a blank line starts a paragraph, a line starting "- " is a bullet and "1. " a numbered step, and https links are shown as links; left out on a change it keeps the one saved. A new exercise named like a built-in (see get_training_library) saves that built-in as it is; a built-in itself cannot be changed. If the user already has another exercise by this name, nothing is saved and that exercise comes back with existing: true. save_workout creates exercises its items name, so call this only for an exercise on its own.',
  inputSchema,
  annotations: { readOnlyHint: false, destructiveHint: false },
  run: async ({ key, id: editing, ...body }, { env, userId }) => {
    const library = await repo.library(env.DB, env.MEDIA_URL);
    if (editing !== undefined) {
      owned(
        await repo.getExercise(env.DB, userId, editing),
        "exercise",
        editing,
        library.exercises
      );
    }
    const { exercise, taken } = await save(
      env.DB,
      userId,
      editing ?? key ?? crypto.randomUUID(),
      (editing === undefined && builtInExercise(library, body.name)) || body
    );
    const { name, kind, measure, eachSide, description } = exercise;
    return {
      exercise: {
        id: exercise.id,
        name,
        kind,
        measure,
        eachSide,
        description: description || undefined,
        builtIn: exercise.builtIn !== null,
      },
      existing: taken,
    };
  },
};
