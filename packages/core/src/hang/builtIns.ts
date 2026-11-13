import type { ExerciseKind, ExerciseMeasure } from "./exercise";
import type { BuiltInGrip } from "./library";
import type { Dose, Focus, WorkoutKind } from "./plan";

/** A starter exercise, named in English. Apps translate it by id. */
export type BuiltInExerciseSpec = {
  id: string;
  name: string;
  kind: ExerciseKind;
  measure: ExerciseMeasure;
  /** What a workout item of it starts at, where its measure's start does not fit. */
  dose?: Dose;
};

/** The starter exercises the picker offers. An id is never reused: the user's own exercises link to it. */
export const BUILT_IN_EXERCISES = [
  { id: "fourByFours", name: "4x4s", kind: "climbing", measure: "reps" },
  {
    id: "limitBouldering",
    name: "Limit bouldering",
    kind: "climbing",
    measure: "reps",
    dose: { sets: 1 },
  },
  { id: "campusLadders", name: "Campus ladders", kind: "climbing", measure: "reps" },
  { id: "arc", name: "ARC", kind: "climbing", measure: "seconds" },
  { id: "boulderCircuits", name: "Boulder circuits", kind: "climbing", measure: "reps" },
  { id: "linkUps", name: "Linked boulders", kind: "climbing", measure: "reps" },
  { id: "onTheMinute", name: "On-the-minute boulders", kind: "climbing", measure: "reps" },
  { id: "projecting", name: "Projecting", kind: "climbing", measure: "reps" },
  { id: "routeLaps", name: "Route laps", kind: "climbing", measure: "reps" },
  { id: "campusBumps", name: "Campus bumps", kind: "climbing", measure: "reps" },
  { id: "campusDoubles", name: "Campus doubles", kind: "climbing", measure: "reps" },
  { id: "campusMaxReach", name: "Campus max reach", kind: "climbing", measure: "reps" },
  { id: "upDownUps", name: "Up-down-ups", kind: "climbing", measure: "reps" },
  { id: "thirtyOnThirtyOff", name: "30 on, 30 off", kind: "climbing", measure: "seconds" },
  { id: "silentFeet", name: "Silent feet", kind: "climbing", measure: "reps" },
  { id: "downclimbing", name: "Downclimbing", kind: "climbing", measure: "reps" },
  { id: "hoverHands", name: "Hover hands", kind: "climbing", measure: "reps" },
  { id: "circuitLaps", name: "Circuit laps", kind: "climbing", measure: "laps" },
  { id: "backSquat", name: "Back squat", kind: "strength", measure: "repsWeight" },
  { id: "benchPress", name: "Bench press", kind: "strength", measure: "repsWeight" },
  { id: "barbellRow", name: "Barbell row", kind: "strength", measure: "repsWeight" },
  { id: "pushUps", name: "Push-ups", kind: "strength", measure: "reps" },
  { id: "overheadPress", name: "Overhead press", kind: "strength", measure: "repsWeight" },
  { id: "dips", name: "Dips", kind: "strength", measure: "repsWeight" },
  { id: "externalRotation", name: "Band external rotation", kind: "strength", measure: "reps" },
  { id: "bandExtensions", name: "Band finger extensions", kind: "strength", measure: "reps" },
  {
    id: "reverseWristCurls",
    name: "Reverse wrist curls",
    kind: "strength",
    measure: "repsWeight",
    dose: { sets: 3 },
  },
  { id: "riceBucket", name: "Rice bucket", kind: "strength", measure: "seconds" },
  { id: "pullUps", name: "Pull-ups", kind: "strength", measure: "repsWeight" },
  { id: "chinUps", name: "Chin-ups", kind: "strength", measure: "repsWeight" },
  { id: "scapularPullUps", name: "Scapular pull-ups", kind: "strength", measure: "reps" },
  { id: "lockOffs", name: "Lock-offs", kind: "strength", measure: "secondsWeight" },
  { id: "frenchies", name: "Frenchies", kind: "strength", measure: "reps" },
  { id: "typewriters", name: "Typewriters", kind: "strength", measure: "reps" },
  { id: "offsetPullUps", name: "Offset pull-ups, each side", kind: "strength", measure: "reps" },
  {
    id: "oneArmNegatives",
    name: "One-arm negatives, each side",
    kind: "strength",
    measure: "reps",
  },
  { id: "latPulldown", name: "Lat pulldown", kind: "strength", measure: "repsWeight" },
  { id: "invertedRow", name: "Inverted row", kind: "strength", measure: "reps" },
  { id: "dumbbellRow", name: "Dumbbell row, each side", kind: "strength", measure: "repsWeight" },
  { id: "deadlift", name: "Deadlift", kind: "strength", measure: "repsWeight" },
  { id: "frontSquat", name: "Front squat", kind: "strength", measure: "repsWeight" },
  { id: "gobletSquat", name: "Goblet squat", kind: "strength", measure: "repsWeight" },
  {
    id: "splitSquat",
    name: "Bulgarian split squat, each side",
    kind: "strength",
    measure: "repsWeight",
  },
  { id: "pistolSquat", name: "Pistol squat, each side", kind: "strength", measure: "reps" },
  { id: "hipThrust", name: "Hip thrust", kind: "strength", measure: "repsWeight" },
  { id: "kettlebellSwing", name: "Kettlebell swing", kind: "strength", measure: "repsWeight" },
  { id: "dumbbellPress", name: "Dumbbell shoulder press", kind: "strength", measure: "repsWeight" },
  { id: "inclineBench", name: "Incline dumbbell press", kind: "strength", measure: "repsWeight" },
  { id: "lateralRaise", name: "Lateral raise", kind: "strength", measure: "repsWeight" },
  { id: "facePulls", name: "Face pulls", kind: "strength", measure: "repsWeight" },
  { id: "iYT", name: "I-Y-T", kind: "strength", measure: "repsWeight" },
  { id: "wristCurls", name: "Wrist curls", kind: "strength", measure: "repsWeight" },
  { id: "fingerRolls", name: "Finger rolls", kind: "strength", measure: "repsWeight" },
  {
    id: "forearmRotations",
    name: "Pronation and supination",
    kind: "strength",
    measure: "repsWeight",
  },
  { id: "farmersCarry", name: "Farmer's carry", kind: "strength", measure: "secondsWeight" },
  { id: "ninetyNinety", name: "90/90 switches", kind: "mobility", measure: "reps" },
  { id: "couchStretch", name: "Couch stretch, each side", kind: "mobility", measure: "seconds" },
  { id: "frogStretch", name: "Frog stretch", kind: "mobility", measure: "seconds" },
  { id: "pigeon", name: "Pigeon, each side", kind: "mobility", measure: "seconds" },
  {
    id: "hipFlexorLunge",
    name: "Hip flexor lunge, each side",
    kind: "mobility",
    measure: "seconds",
  },
  { id: "deepSquat", name: "Deep squat hold", kind: "mobility", measure: "seconds" },
  { id: "sunSalutation", name: "Sun salutation", kind: "mobility", measure: "reps" },
  { id: "downwardDog", name: "Downward dog", kind: "mobility", measure: "seconds" },
  {
    id: "threadNeedle",
    name: "Thread the needle, each side",
    kind: "mobility",
    measure: "seconds",
  },
  { id: "lizard", name: "Lizard, each side", kind: "mobility", measure: "seconds" },
  { id: "childsPose", name: "Child's pose", kind: "mobility", measure: "seconds" },
  { id: "plank", name: "Plank", kind: "other", measure: "seconds" },
  { id: "hollowHold", name: "Hollow hold", kind: "other", measure: "seconds" },
  { id: "kneeRaises", name: "Hanging knee raises", kind: "other", measure: "reps" },
  { id: "sidePlank", name: "Side plank, each side", kind: "other", measure: "seconds" },
  { id: "deadBug", name: "Dead bug", kind: "other", measure: "reps" },
  { id: "abWheel", name: "Ab wheel rollout", kind: "other", measure: "reps" },
  { id: "hangingLegRaises", name: "Hanging leg raises", kind: "other", measure: "reps" },
  { id: "toesToBar", name: "Toes to bar", kind: "other", measure: "reps" },
  { id: "windshieldWipers", name: "Windshield wipers", kind: "other", measure: "reps" },
  { id: "lSit", name: "L-sit", kind: "other", measure: "seconds" },
  { id: "frontLever", name: "Front lever hold", kind: "other", measure: "seconds" },
] as const satisfies readonly BuiltInExerciseSpec[];

export type BuiltInExerciseId = (typeof BUILT_IN_EXERCISES)[number]["id"];

/** Interval steps a built-in workout names that are not exercises of their own. */
export type BuiltInStep = "hard" | "easy";

/** A hangboard item names its grip; every other item a built-in exercise or an interval step. */
export type BuiltInItemSpec =
  | { grip: BuiltInGrip; doses: readonly Dose[] }
  | { exercise: BuiltInExerciseId; doses: readonly Dose[] }
  | { step: BuiltInStep; doses: readonly Dose[] };

/** A curated workout, named in English. Apps translate it by id. */
export type BuiltInWorkoutSpec = {
  id: string;
  name: string;
  kind: WorkoutKind;
  focus: Focus | null;
  minutes: number | null;
  targetRpe: number | null;
  items: readonly BuiltInItemSpec[];
};

/**
 * The curated starter library. An id is never reused: sessions and memberships
 * reference it. Edge depth and added weight are chosen per use, so hangboard
 * built-ins carry neither.
 */
export const BUILT_IN_WORKOUTS = [
  {
    id: "rep73",
    name: "Repeaters 7:3",
    kind: "hangboard",
    focus: "power_endurance",
    minutes: null,
    targetRpe: null,
    items: [{ grip: "half", doses: [{ sets: 6, reps: 6, onS: 7, offS: 3, setRestS: 180 }] }],
  },
  {
    id: "max10",
    name: "Max hangs",
    kind: "hangboard",
    focus: "strength",
    minutes: null,
    targetRpe: null,
    items: [{ grip: "half", doses: [{ sets: 5, reps: 1, onS: 10, setRestS: 180 }] }],
  },
  {
    id: "fingers-ab",
    name: "Fingers A/B",
    kind: "hangboard",
    focus: null,
    minutes: null,
    targetRpe: 8,
    items: [
      {
        grip: "half",
        doses: [
          { sets: 6, reps: 1, onS: 10, setRestS: 180 },
          { sets: 3, reps: 6, onS: 7, offS: 3, setRestS: 180 },
        ],
      },
    ],
  },
  {
    id: "block",
    name: "Block pulls",
    kind: "hangboard",
    focus: "strength",
    minutes: null,
    targetRpe: null,
    items: [{ grip: "pinch", doses: [{ sets: 5, reps: 5, setRestS: 120 }] }],
  },
  {
    id: "density",
    name: "Density hangs",
    kind: "hangboard",
    focus: null,
    minutes: null,
    targetRpe: null,
    items: [{ grip: "open", doses: [{ sets: 4, reps: 1, onS: 30, setRestS: 60 }] }],
  },
  {
    id: "assist",
    name: "Assisted one-arm",
    kind: "hangboard",
    focus: "strength",
    minutes: null,
    targetRpe: null,
    items: [{ grip: "half", doses: [{ sets: 6, reps: 1, onS: 10, setRestS: 120 }] }],
  },
  {
    id: "lowpull",
    name: "Light daily lifts",
    kind: "hangboard",
    focus: "recovery",
    minutes: null,
    targetRpe: null,
    items: [{ grip: "open", doses: [{ sets: 3, reps: 10, setRestS: 90 }] }],
  },
  {
    id: "min-edge",
    name: "Min edge hangs",
    kind: "hangboard",
    focus: "strength",
    minutes: null,
    targetRpe: null,
    items: [{ grip: "half", doses: [{ sets: 5, reps: 1, onS: 10, setRestS: 180 }] }],
  },
  {
    id: "seven-53",
    name: "7:53 hangs",
    kind: "hangboard",
    focus: "strength",
    minutes: null,
    targetRpe: null,
    items: [{ grip: "half", doses: [{ sets: 3, reps: 3, onS: 7, offS: 53, setRestS: 180 }] }],
  },
  {
    id: "climb-limit",
    name: "Limit bouldering",
    kind: "climbing",
    focus: "power",
    minutes: 90,
    targetRpe: 9,
    items: [{ exercise: "limitBouldering", doses: [{ sets: 5, setRestS: 180 }] }],
  },
  {
    id: "climb-4x4",
    name: "4x4s",
    kind: "climbing",
    focus: "power_endurance",
    minutes: 60,
    targetRpe: 8,
    items: [{ exercise: "fourByFours", doses: [{ sets: 4, reps: 4, setRestS: 240 }] }],
  },
  {
    id: "climb-arc",
    name: "ARC",
    kind: "climbing",
    focus: "endurance",
    minutes: 45,
    targetRpe: 4,
    items: [{ exercise: "arc", doses: [{ sets: 2, onS: 1200, setRestS: 600 }] }],
  },
  {
    id: "strength-squat",
    name: "Back squat, alternating",
    kind: "strength",
    focus: "strength",
    minutes: 45,
    targetRpe: 8,
    items: [
      {
        exercise: "backSquat",
        doses: [
          { sets: 5, reps: 5 },
          { sets: 3, reps: 10 },
        ],
      },
    ],
  },
  {
    id: "strength-5x5",
    name: "5x5 strength",
    kind: "strength",
    focus: "strength",
    minutes: 45,
    targetRpe: 8,
    items: [
      { exercise: "backSquat", doses: [{ sets: 5, reps: 5 }] },
      { exercise: "benchPress", doses: [{ sets: 5, reps: 5 }] },
      { exercise: "barbellRow", doses: [{ sets: 5, reps: 5 }] },
    ],
  },
  {
    id: "strength-antagonist",
    name: "Antagonist push",
    kind: "strength",
    focus: null,
    minutes: 30,
    targetRpe: 6,
    items: [
      { exercise: "pushUps", doses: [{ sets: 3, reps: 15 }] },
      { exercise: "overheadPress", doses: [{ sets: 3, reps: 8 }] },
      { exercise: "dips", doses: [{ sets: 3, reps: 10 }] },
      { exercise: "externalRotation", doses: [{ sets: 4, reps: 15 }] },
    ],
  },
  {
    id: "strength-extensors",
    name: "Finger extensor routine",
    kind: "strength",
    focus: null,
    minutes: 15,
    targetRpe: 4,
    items: [
      { exercise: "bandExtensions", doses: [{ sets: 3, reps: 20 }] },
      { exercise: "reverseWristCurls", doses: [{ sets: 3, reps: 15 }] },
      { exercise: "riceBucket", doses: [{ sets: 3, onS: 60 }] },
    ],
  },
  {
    id: "mobility-hips",
    name: "Hip mobility flow",
    kind: "mobility",
    focus: "recovery",
    minutes: 20,
    targetRpe: 3,
    items: [
      { exercise: "ninetyNinety", doses: [{ sets: 1, reps: 10 }] },
      { exercise: "couchStretch", doses: [{ sets: 1, onS: 60 }] },
      { exercise: "frogStretch", doses: [{ sets: 1, onS: 90 }] },
      { exercise: "pigeon", doses: [{ sets: 1, onS: 60 }] },
      { exercise: "hipFlexorLunge", doses: [{ sets: 1, onS: 60 }] },
      { exercise: "deepSquat", doses: [{ sets: 1, onS: 120 }] },
    ],
  },
  {
    id: "yoga-climbers",
    name: "Climber's yoga",
    kind: "mobility",
    focus: "recovery",
    minutes: 25,
    targetRpe: 2,
    items: [
      { exercise: "sunSalutation", doses: [{ sets: 1, reps: 5 }] },
      { exercise: "downwardDog", doses: [{ sets: 1, onS: 60 }] },
      { exercise: "threadNeedle", doses: [{ sets: 1, onS: 60 }] },
      { exercise: "lizard", doses: [{ sets: 1, onS: 60 }] },
      { exercise: "childsPose", doses: [{ sets: 1, onS: 120 }] },
    ],
  },
  {
    id: "run-tempo",
    name: "Tempo intervals",
    kind: "other",
    focus: "conditioning",
    minutes: 25,
    targetRpe: 7,
    items: [
      { step: "hard", doses: [{ sets: 5, onS: 180 }] },
      { step: "easy", doses: [{ sets: 5, onS: 120 }] },
    ],
  },
  {
    id: "other-core",
    name: "Core circuit",
    kind: "other",
    focus: "strength",
    minutes: 15,
    targetRpe: 6,
    items: [
      { exercise: "plank", doses: [{ sets: 3, onS: 45, offS: 15 }] },
      { exercise: "hollowHold", doses: [{ sets: 3, onS: 30, offS: 15 }] },
      { exercise: "kneeRaises", doses: [{ sets: 3, reps: 10, offS: 60 }] },
    ],
  },
] as const satisfies readonly BuiltInWorkoutSpec[];

export type BuiltInWorkoutId = (typeof BUILT_IN_WORKOUTS)[number]["id"];
