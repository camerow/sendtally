import type { BuiltInItemSpec, BuiltInLibrary } from "@sendtally/core/hang";
import * as repo from "../lib/repo";
import { exerciseNameKey, exerciseOf } from "../lib/exercises";
import { workoutOf } from "../lib/plan";
import type { ConnectorTool } from "./types";

const inputSchema = {};

// A hangboard item names its grip by id, as the user's own hangboard workouts do.
const builtInItem = (
  library: BuiltInLibrary,
  item: BuiltInItemSpec
): { exercise: string; doses: unknown } => ({
  exercise:
    "grip" in item
      ? item.grip
      : "step" in item
        ? item.step
        : (library.exercises.find((e) => e.id === item.exercise)?.name ?? ""),
  doses: item.doses,
});

export const trainingLibrary: ConnectorTool<typeof inputSchema> = {
  name: "get_training_library",
  title: "Get training library",
  description:
    "The user's own exercises (id, name, kind, how each is measured, description) and workouts (id, name, kind, target effort, minutes, and each item's exercise with its sets, reps, hang and rest times, its own target effort and set and rep ranges, and restAfterS, its rest before the next item; a checklist item carries checklist.lines, its typed lines, and a superset member its group: rounds and the two rests), then the built-in ones every user has with their descriptions, marked builtIn: true and identified by their built-in id, plus the hangboard grips the app knows (a hangboard item names its grip by id). Call this before suggesting or building workouts so you reuse these names instead of creating duplicates, and for the ids save_workout, save_exercise and the delete tools take.",
  inputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false },
  run: async (_args, { env, userId }) => {
    const [exerciseRows, workoutRows, library] = await Promise.all([
      repo.listExercises(env.DB, userId),
      repo.listWorkouts(env.DB, userId),
      repo.library(env.DB, env.MEDIA_URL),
    ]);
    const active = <T extends { status: string }>(entries: T[]): T[] =>
      entries.filter((e) => e.status === "active");
    const mine = exerciseRows.map(exerciseOf).filter((e) => !e.archived);
    const named = new Set(mine.map((e) => exerciseNameKey(e.name)));
    return {
      exercises: [
        ...mine.map(({ id, name, kind, measure, eachSide, description }) => ({
          id,
          name,
          kind,
          measure,
          eachSide,
          description: description || undefined,
        })),
        ...active(library.exercises)
          .filter((e) => !named.has(exerciseNameKey(e.name)))
          .map(({ id, name, spec, description }) => ({
            id,
            name,
            kind: spec.kind,
            measure: spec.measure,
            eachSide: false,
            description: description || undefined,
            builtIn: true,
          })),
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
          items: w.items.map(({ exercise, doses, restAfterS, checklist, group }) => ({
            exercise,
            doses,
            restAfterS,
            checklist,
            group,
          })),
        })),
        ...active(library.workouts).map(({ id, name, description, spec }) => ({
          id,
          name,
          kind: spec.kind,
          focus: spec.focus,
          description: description || undefined,
          minutes: spec.minutes,
          targetRpe: spec.targetRpe,
          items: spec.items.map((item) => builtInItem(library, item)),
          builtIn: true,
        })),
      ],
      hangboardGrips: active(library.grips).map(({ id, name, description }) => ({
        id,
        name,
        description: description || undefined,
      })),
    };
  },
};
