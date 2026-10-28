import type { ExerciseKind, ExerciseMeasure } from "@sendtally/core/hang";
import { t, type MessageKey } from "../i18n";
import type { BuiltInExercise } from "./types";

type Spec = { id: string; name: MessageKey; kind: ExerciseKind; measure: ExerciseMeasure };

const spec = (kind: ExerciseKind, measure: ExerciseMeasure, name: MessageKey): Spec => ({
  id: name.slice(name.lastIndexOf(".") + 1),
  name,
  kind,
  measure,
});

/** The starter exercises the picker offers. An id is never reused: the user's own exercises link to it. */
const BUILT_IN_EXERCISES: readonly Spec[] = [
  spec("climbing", "rounds", "workouts.exercise.fourByFours"),
  spec("climbing", "rounds", "workouts.exercise.limitBouldering"),
  spec("climbing", "rounds", "workouts.exercise.campusLadders"),
  spec("climbing", "seconds", "workouts.exercise.arc"),
  spec("strength", "repsWeight", "workouts.exercise.backSquat"),
  spec("strength", "repsWeight", "workouts.exercise.benchPress"),
  spec("strength", "repsWeight", "workouts.exercise.barbellRow"),
  spec("strength", "reps", "workouts.exercise.pushUps"),
  spec("strength", "repsWeight", "workouts.exercise.overheadPress"),
  spec("strength", "repsWeight", "workouts.exercise.dips"),
  spec("strength", "reps", "workouts.exercise.externalRotation"),
  spec("strength", "reps", "workouts.exercise.bandExtensions"),
  spec("strength", "repsWeight", "workouts.exercise.reverseWristCurls"),
  spec("strength", "seconds", "workouts.exercise.riceBucket"),
  spec("mobility", "reps", "workouts.item.ninetyNinety"),
  spec("mobility", "seconds", "workouts.item.couchStretch"),
  spec("mobility", "seconds", "workouts.item.frogStretch"),
  spec("mobility", "seconds", "workouts.item.pigeon"),
  spec("mobility", "seconds", "workouts.item.hipFlexorLunge"),
  spec("mobility", "seconds", "workouts.item.deepSquat"),
  spec("mobility", "reps", "workouts.item.sunSalutation"),
  spec("mobility", "seconds", "workouts.item.downwardDog"),
  spec("mobility", "seconds", "workouts.item.threadNeedle"),
  spec("mobility", "seconds", "workouts.item.lizard"),
  spec("mobility", "seconds", "workouts.item.childsPose"),
  spec("other", "seconds", "workouts.step.plank"),
  spec("other", "seconds", "workouts.step.hollowHold"),
  spec("other", "reps", "workouts.step.kneeRaises"),
];

/** The starter exercises, in the user's language. */
export const builtInExercises = (): BuiltInExercise[] =>
  BUILT_IN_EXERCISES.map((e) => ({ ...e, name: t(e.name) }));

/** An exercise as the user reads it: one picked from the built-ins in their language. */
export function exerciseLabel(e: { name: string; builtIn: string | null }): string {
  const builtIn = BUILT_IN_EXERCISES.find((b) => b.id === e.builtIn);
  return builtIn === undefined ? e.name : t(builtIn.name);
}
