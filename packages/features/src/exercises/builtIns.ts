import type { Dose, ExerciseKind, ExerciseMeasure } from "@sendtally/core/hang";
import { t, type MessageKey } from "../i18n";
import type { BuiltInExercise } from "./types";

type Spec = {
  id: string;
  name: MessageKey;
  kind: ExerciseKind;
  measure: ExerciseMeasure;
  /** What a workout item of it starts at, where its measure's start does not fit. */
  dose?: Dose;
};

const spec = (
  kind: ExerciseKind,
  measure: ExerciseMeasure,
  name: MessageKey,
  dose?: Dose
): Spec => ({
  id: name.slice(name.lastIndexOf(".") + 1),
  name,
  kind,
  measure,
  ...(dose === undefined ? {} : { dose }),
});

/** The starter exercises the picker offers. An id is never reused: the user's own exercises link to it. */
const BUILT_IN_EXERCISES: readonly Spec[] = [
  spec("climbing", "reps", "workouts.exercise.fourByFours"),
  spec("climbing", "reps", "workouts.exercise.limitBouldering", { sets: 1 }),
  spec("climbing", "reps", "workouts.exercise.campusLadders"),
  spec("climbing", "seconds", "workouts.exercise.arc"),
  spec("climbing", "reps", "workouts.exercise.boulderCircuits"),
  spec("climbing", "reps", "workouts.exercise.linkUps"),
  spec("climbing", "reps", "workouts.exercise.onTheMinute"),
  spec("climbing", "reps", "workouts.exercise.projecting"),
  spec("climbing", "reps", "workouts.exercise.routeLaps"),
  spec("climbing", "reps", "workouts.exercise.campusBumps"),
  spec("climbing", "reps", "workouts.exercise.campusDoubles"),
  spec("climbing", "reps", "workouts.exercise.campusMaxReach"),
  spec("climbing", "reps", "workouts.exercise.upDownUps"),
  spec("climbing", "seconds", "workouts.exercise.thirtyOnThirtyOff"),
  spec("climbing", "reps", "workouts.exercise.silentFeet"),
  spec("climbing", "reps", "workouts.exercise.downclimbing"),
  spec("climbing", "reps", "workouts.exercise.hoverHands"),
  spec("climbing", "laps", "workouts.exercise.circuitLaps"),
  spec("strength", "repsWeight", "workouts.exercise.backSquat"),
  spec("strength", "repsWeight", "workouts.exercise.benchPress"),
  spec("strength", "repsWeight", "workouts.exercise.barbellRow"),
  spec("strength", "reps", "workouts.exercise.pushUps"),
  spec("strength", "repsWeight", "workouts.exercise.overheadPress"),
  spec("strength", "repsWeight", "workouts.exercise.dips"),
  spec("strength", "reps", "workouts.exercise.externalRotation"),
  spec("strength", "reps", "workouts.exercise.bandExtensions"),
  spec("strength", "repsWeight", "workouts.exercise.reverseWristCurls", { sets: 3 }),
  spec("strength", "seconds", "workouts.exercise.riceBucket"),
  spec("strength", "repsWeight", "workouts.exercise.pullUps"),
  spec("strength", "repsWeight", "workouts.exercise.chinUps"),
  spec("strength", "reps", "workouts.exercise.scapularPullUps"),
  spec("strength", "secondsWeight", "workouts.exercise.lockOffs"),
  spec("strength", "reps", "workouts.exercise.frenchies"),
  spec("strength", "reps", "workouts.exercise.typewriters"),
  spec("strength", "reps", "workouts.exercise.offsetPullUps"),
  spec("strength", "reps", "workouts.exercise.oneArmNegatives"),
  spec("strength", "repsWeight", "workouts.exercise.latPulldown"),
  spec("strength", "reps", "workouts.exercise.invertedRow"),
  spec("strength", "repsWeight", "workouts.exercise.dumbbellRow"),
  spec("strength", "repsWeight", "workouts.exercise.deadlift"),
  spec("strength", "repsWeight", "workouts.exercise.frontSquat"),
  spec("strength", "repsWeight", "workouts.exercise.gobletSquat"),
  spec("strength", "repsWeight", "workouts.exercise.splitSquat"),
  spec("strength", "reps", "workouts.exercise.pistolSquat"),
  spec("strength", "repsWeight", "workouts.exercise.hipThrust"),
  spec("strength", "repsWeight", "workouts.exercise.kettlebellSwing"),
  spec("strength", "repsWeight", "workouts.exercise.dumbbellPress"),
  spec("strength", "repsWeight", "workouts.exercise.inclineBench"),
  spec("strength", "repsWeight", "workouts.exercise.lateralRaise"),
  spec("strength", "repsWeight", "workouts.exercise.facePulls"),
  spec("strength", "repsWeight", "workouts.exercise.iYT"),
  spec("strength", "repsWeight", "workouts.exercise.wristCurls"),
  spec("strength", "repsWeight", "workouts.exercise.fingerRolls"),
  spec("strength", "repsWeight", "workouts.exercise.forearmRotations"),
  spec("strength", "secondsWeight", "workouts.exercise.farmersCarry"),
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
  spec("other", "seconds", "workouts.exercise.sidePlank"),
  spec("other", "reps", "workouts.exercise.deadBug"),
  spec("other", "reps", "workouts.exercise.abWheel"),
  spec("other", "reps", "workouts.exercise.hangingLegRaises"),
  spec("other", "reps", "workouts.exercise.toesToBar"),
  spec("other", "reps", "workouts.exercise.windshieldWipers"),
  spec("other", "seconds", "workouts.exercise.lSit"),
  spec("other", "seconds", "workouts.exercise.frontLever"),
];

/** The starter exercises, in the user's language. */
export const builtInExercises = (): BuiltInExercise[] =>
  BUILT_IN_EXERCISES.map((e) => ({ ...e, name: t(e.name) }));

/** What a workout item of an exercise picked from the built-ins starts at, when it says. */
export const builtInDose = (builtIn: string | null): Dose | undefined =>
  BUILT_IN_EXERCISES.find((b) => b.id === builtIn)?.dose;

/** An exercise as the user reads it: one picked from the built-ins in their language. */
export function exerciseLabel(e: { name: string; builtIn: string | null }): string {
  const builtIn = BUILT_IN_EXERCISES.find((b) => b.id === e.builtIn);
  return builtIn === undefined ? e.name : t(builtIn.name);
}
