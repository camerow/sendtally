import {
  BUILT_IN_EXERCISES,
  BUILT_IN_GRIP_NAMES,
  BUILT_IN_WORKOUTS,
  type BuiltInItemSpec,
} from "@sendtally/core/hang";
import * as repo from "../lib/repo";
import { exerciseNameKey, exerciseOf } from "../lib/exercises";
import { workoutOf } from "../lib/plan";
import type { ConnectorTool } from "./types";

const inputSchema = {};

const builtInName = new Map<string, string>(BUILT_IN_EXERCISES.map((e) => [e.id, e.name]));

// A hangboard item names its grip by id, as the user's own hangboard workouts do.
const builtInItem = (item: BuiltInItemSpec): { exercise: string; doses: unknown } => ({
  exercise:
    "grip" in item
      ? item.grip
      : "step" in item
        ? item.step
        : (builtInName.get(item.exercise) ?? ""),
  doses: item.doses,
});

export const trainingLibrary: ConnectorTool<typeof inputSchema> = {
  name: "get_training_library",
  title: "Get training library",
  description:
    "The user's own exercises (id, name, kind, how each is measured) and workouts (id, name, kind, target effort, minutes, and each item's exercise with its sets, reps, hang and rest times), then the built-in ones every user has, marked builtIn: true and identified by their built-in id, plus the hangboard grips the app knows (a hangboard item names its grip by id). Call this before suggesting or building workouts so you reuse these names instead of creating duplicates, and for the ids save_workout, save_exercise and the delete tools take.",
  inputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false },
  run: async (_args, { env, userId }) => {
    const [exerciseRows, workoutRows] = await Promise.all([
      repo.listExercises(env.DB, userId),
      repo.listWorkouts(env.DB, userId),
    ]);
    const mine = exerciseRows.map(exerciseOf).filter((e) => !e.archived);
    const named = new Set(mine.map((e) => exerciseNameKey(e.name)));
    return {
      exercises: [
        ...mine.map(({ id, name, kind, measure, eachSide }) => ({
          id,
          name,
          kind,
          measure,
          eachSide,
        })),
        ...BUILT_IN_EXERCISES.filter((e) => !named.has(exerciseNameKey(e.name))).map(
          ({ id, name, kind, measure }) => ({
            id,
            name,
            kind,
            measure,
            eachSide: false,
            builtIn: true,
          })
        ),
      ],
      workouts: [
        ...workoutRows.map(workoutOf).map((w) => ({
          id: w.id,
          name: w.name,
          kind: w.kind,
          focus: w.focus,
          description: w.description || undefined,
          minutes: w.minutes,
          targetRpe: w.targetRpe,
          items: w.items.map(({ exercise, doses }) => ({ exercise, doses })),
        })),
        ...BUILT_IN_WORKOUTS.map((w) => ({
          id: w.id,
          name: w.name,
          kind: w.kind,
          focus: w.focus,
          minutes: w.minutes,
          targetRpe: w.targetRpe,
          items: w.items.map(builtInItem),
          builtIn: true,
        })),
      ],
      hangboardGrips: Object.entries(BUILT_IN_GRIP_NAMES).map(([id, name]) => ({ id, name })),
    };
  },
};
