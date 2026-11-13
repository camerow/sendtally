import { FOCI, WORKOUT_KINDS } from "@sendtally/core/hang";
import { exerciseKindOf } from "../lib/exercises";
import { workoutBody, workoutFields, workoutItems, workoutOf } from "../lib/plan";
import * as repo from "../lib/repo";
import { saveExercise } from "../training";
import { builtInExercise, retryKey } from "./saveExercise";
import type { ConnectorTool } from "./types";

const { exerciseRestS: _, ...fields } = workoutFields;

const inputSchema = { key: retryKey, ...fields, items: workoutItems };

// The user's exercise of that name, else the built-in, else a new one saveWorkout adds.
async function exerciseName(db: D1Database, userId: string, name: string): Promise<string> {
  const mine = await repo.findExerciseByName(db, userId, name);
  if (mine !== null) return mine.name;
  const builtIn = builtInExercise(name);
  if (builtIn === undefined) return name;
  return (await saveExercise(db, userId, crypto.randomUUID(), builtIn)).exercise.name;
}

export const saveWorkout: ConnectorTool<typeof inputSchema> = {
  name: "save_workout",
  title: "Save workout",
  description: `Adds a workout to the user's library. kind is one of ${WORKOUT_KINDS.join(", ")}. description is free text (may be ""), minutes the planned length or null, targetRpe the intended effort 1-10 or null, focus optional (${FOCI.join(", ")}). Each item names an exercise and gives one or more doses; extra doses are alternative versions (A, B) the user rotates between, so most items need one. A dose: sets (1-100), reps per set, weightKg added load (negative is assistance), onS seconds of work per rep (a hang or hold), offS rest seconds between reps, setRestS rest seconds between sets, edgeMm hangboard edge depth (0-60), name an optional label. Give only the fields that apply: 5x5 squats at 100 kg is {sets:5,reps:5,weightKg:100}; 7:3 repeaters is {sets:6,reps:6,onS:7,offS:3,setRestS:180,edgeMm:20}. In a hangboard workout each item's exercise is a grip id from get_training_library. Otherwise an item names the user's exercise of that name, else the built-in of that name, else a new exercise is created. Returns the saved workout; plan it with save_block.`,
  inputSchema,
  annotations: { readOnlyHint: false, destructiveHint: false },
  run: async ({ key, ...input }, { env, userId }) => {
    const body = workoutBody.parse(input);
    const items = [];
    for (const item of body.items) {
      const exercise =
        exerciseKindOf(body.kind) === null
          ? item.exercise
          : await exerciseName(env.DB, userId, item.exercise);
      items.push({ ...item, exercise });
    }
    await repo.ensureUser(env.DB, userId);
    const row = await repo.saveWorkout(env.DB, userId, {
      id: key ?? crypto.randomUUID(),
      ...body,
      items,
    });
    const { name, kind, focus, description, minutes, targetRpe } = workoutOf(row);
    return {
      workout: {
        name,
        kind,
        focus,
        description,
        minutes,
        targetRpe,
        items: items.map(({ exercise, doses }) => ({ exercise, doses })),
      },
    };
  },
};
