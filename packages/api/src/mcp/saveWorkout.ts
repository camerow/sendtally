import { FOCI, WORKOUT_KINDS, isChecklist, type BuiltInLibrary } from "@sendtally/core/hang";
import type { Env } from "../bindings";
import { customWorkout, requireConnectorAccess } from "../lib/entitlements";
import { exerciseKindOf } from "../lib/exercises";
import { withDerivedKind } from "../lib/workoutKind";
import { workoutBody, workoutFields, workoutItems, workoutOf } from "../lib/plan";
import * as repo from "../lib/repo";
import { saveExercise } from "../training";
import { builtInExercise, editId, owned, retryKey } from "./saveExercise";
import type { ConnectorTool } from "./types";

const { exerciseRestS: _, ...fields } = workoutFields;

const inputSchema = { key: retryKey, id: editId("workout"), ...fields, items: workoutItems };

// The user's exercise of that name, else the built-in, else a new one saveWorkout adds.
async function exerciseName(
  env: Env,
  userId: string,
  library: BuiltInLibrary,
  name: string
): Promise<string> {
  const mine = await repo.findExerciseByName(env.DB, userId, name);
  if (mine !== null) return mine.name;
  const builtIn = builtInExercise(library, name);
  if (builtIn === undefined) return name;
  const access = (): Promise<void> => requireConnectorAccess(env, userId);
  return (await saveExercise(env.DB, userId, crypto.randomUUID(), builtIn, library, access))
    .exercise.name;
}

export const saveWorkout: ConnectorTool<typeof inputSchema> = {
  name: "save_workout",
  title: "Save workout",
  description: `Adds a workout to the user's library, or with id replaces that workout, keeping its place in every block. A built-in workout cannot be changed; save a copy under a new name. kind (${WORKOUT_KINDS.join(", ")}) is worked out from the items: hangboard when all are grips, else the kind most of the other exercises share; give it only for a workout with no items, such as an empty climbing workout that opens a live climbing session, or to say what a name no exercise has yet counts as: such a name counts as kind when given, else as the workout's saved kind, else other, and the new exercise it creates is filed under the kind the workout comes out as. Grip ids can sit beside other exercises: a workout's grips are its fingerboard part, run together in the hang timer, so they are saved together at the first grip's place. description is plain text up to 2000 characters (may be ""): a blank line starts a paragraph, a line starting "- " is a bullet and "1. " a numbered step, and https links are shown as links; minutes the planned length or null, targetRpe the intended effort 1-10 or null, focus optional (${FOCI.join(", ")}). Each item names an exercise and gives one or more doses; extra doses are alternative versions (A, B) the user rotates between, so most items need one. A dose: sets (1-100), reps per set, weightKg added load (negative is assistance), onS seconds of work per rep (a hang or hold), offS rest seconds between reps, setRestS rest seconds between sets, edgeMm hangboard edge depth (0-60), targetRpe the exercise's own intended effort 1-10, setsMax and repsMax the top of a range whose bottom is sets and reps (sets past the minimum are optional extras), name an optional label. Give only the fields that apply: 5x5 squats at 100 kg is {sets:5,reps:5,weightKg:100}; 3-5 sets of 8-12 bench at RPE 8 is {sets:3,setsMax:5,reps:8,repsMax:12,targetRpe:8}; 7:3 repeaters is {sets:6,reps:6,onS:7,offS:3,setRestS:180,edgeMm:20}. An item's restAfterS is the rest in seconds before the next item; leave it out to keep the workout's rest between exercises. When replacing a workout, send back each item's restAfterS as get_training_library returned it. A grip item's exercise is a grip id from get_training_library. A checklist is typed lines ticked off in any order, such as a warm-up, and never an exercise in the library, its history or statistics: {exercise:"Checklist",doses:[{sets:1}],checklist:{lines:["Jog 5 min","Arm circles x20"]}}, 1-30 lines of up to 120 characters; a workout of only a checklist runs it as its body. A superset is two or more neighbouring items done in rotation, one set each a round: give every member the same group {id (any short text), rounds (1-100), restBetweenS (seconds between members; 0 for none), restRoundS (seconds after each round)}; the first member's values rule, every member's sets become the rounds, and a grip or a checklist never joins one. A group of one, or one whose members are not neighbours, is saved ungrouped. Any other item names the user's exercise of that name, else the built-in of that name, else a new exercise is created. Returns the saved workout; plan it with save_block.`,
  inputSchema,
  annotations: { readOnlyHint: false, destructiveHint: false },
  run: async ({ key, id: editing, ...input }, { env, userId }) => {
    const library = await repo.library(env.DB, env.MEDIA_URL);
    const old =
      editing === undefined
        ? undefined
        : owned(
            await repo.getWorkout(env.DB, userId, editing),
            "workout",
            editing,
            library.workouts
          );
    const { workout: body, isGrip } = await withDerivedKind(
      env.DB,
      userId,
      workoutBody.parse({ ...input, exerciseRestS: old?.exercise_rest_s ?? undefined }),
      old?.kind
    );
    if (await customWorkout(env.DB, userId, body.items, old, library))
      await requireConnectorAccess(env, userId);
    const items = [];
    for (const item of body.items) {
      const exercise =
        exerciseKindOf(body.kind) === null || isGrip(item.exercise) || isChecklist(item)
          ? item.exercise
          : await exerciseName(env, userId, library, item.exercise);
      items.push({ ...item, exercise });
    }
    await repo.ensureUser(env.DB, userId);
    const row = await repo.saveWorkout(
      env.DB,
      userId,
      {
        id: editing ?? key ?? crypto.randomUUID(),
        ...body,
        items,
      },
      isGrip,
      library
    );
    const { id, name, kind, focus, description, minutes, targetRpe } = workoutOf(row);
    return {
      workout: {
        id,
        name,
        kind,
        focus,
        description,
        minutes,
        targetRpe,
        items: items.map(({ exercise, doses, restAfterS, checklist, group }) => ({
          exercise,
          doses,
          restAfterS,
          checklist,
          group,
        })),
      },
    };
  },
};
