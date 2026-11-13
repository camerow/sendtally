import { BUILT_IN_GRIP_NAMES } from "@sendtally/core/hang";
import * as repo from "../lib/repo";
import { exerciseOf } from "../lib/exercises";
import { workoutOf } from "../lib/plan";
import type { ConnectorTool } from "./types";

const inputSchema = {};

export const trainingLibrary: ConnectorTool<typeof inputSchema> = {
  name: "get_training_library",
  title: "Get training library",
  description:
    "The user's own exercises (name, kind, how each is measured) and workouts (name, kind, target effort, minutes, and each item's exercise with its sets, reps, hang and rest times), plus the hangboard grips the app knows (a hangboard item names its grip by id). Call this before suggesting or building workouts so you reuse the user's exercise names.",
  inputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false },
  run: async (_args, { env, userId }) => {
    const [exerciseRows, workoutRows] = await Promise.all([
      repo.listExercises(env.DB, userId),
      repo.listWorkouts(env.DB, userId),
    ]);
    return {
      exercises: exerciseRows
        .map(exerciseOf)
        .filter((e) => !e.archived)
        .map(({ name, kind, measure, eachSide }) => ({ name, kind, measure, eachSide })),
      workouts: workoutRows.map(workoutOf).map((w) => ({
        name: w.name,
        kind: w.kind,
        focus: w.focus,
        description: w.description || undefined,
        minutes: w.minutes,
        targetRpe: w.targetRpe,
        items: w.items.map(({ exercise, doses }) => ({ exercise, doses })),
      })),
      hangboardGrips: Object.entries(BUILT_IN_GRIP_NAMES).map(([id, name]) => ({ id, name })),
    };
  },
};
