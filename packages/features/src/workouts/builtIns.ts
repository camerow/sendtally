import {
  defaultExerciseRestS,
  type BuiltInGrip,
  type Dose,
  type Focus,
  type Item,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { t, type MessageKey } from "../i18n";
import type { LibraryWorkout } from "./types";

/** A hangboard item names its grip by id; every other item names its exercise. */
type ItemSpec = { exercise: MessageKey; doses: Dose[] } | { grip: BuiltInGrip; doses: Dose[] };

type BuiltIn = {
  id: string;
  focus: Focus | null;
  kind: WorkoutKind;
  name: MessageKey;
  description: MessageKey;
  minutes: number | null;
  targetRpe: number | null;
  items: ItemSpec[];
};

const hang = (grip: BuiltInGrip, ...doses: Dose[]): ItemSpec => ({ grip, doses });

const lift = (exercise: MessageKey, ...doses: Dose[]): ItemSpec => ({ exercise, doses });

/**
 * The curated starter library. An id is never reused: sessions and memberships
 * reference it. Edge depth and added weight are chosen per use, so hangboard
 * built-ins carry neither.
 */
const BUILT_INS: readonly BuiltIn[] = [
  {
    id: "rep73",
    focus: "power_endurance",
    kind: "hangboard",
    name: "hang.workout.rep73.name",
    description: "hang.workout.rep73.blurb",
    minutes: null,
    targetRpe: null,
    items: [hang("half", { sets: 6, reps: 6, onS: 7, offS: 3, setRestS: 180 })],
  },
  {
    id: "max10",
    focus: "strength",
    kind: "hangboard",
    name: "hang.workout.max10.name",
    description: "hang.workout.max10.blurb",
    minutes: null,
    targetRpe: null,
    items: [hang("half", { sets: 5, reps: 1, onS: 10, setRestS: 180 })],
  },
  {
    id: "fingers-ab",
    focus: null,
    kind: "hangboard",
    name: "workouts.builtIn.fingersAb.name",
    description: "workouts.builtIn.fingersAb.blurb",
    minutes: null,
    targetRpe: 8,
    items: [
      hang(
        "half",
        { sets: 6, reps: 1, onS: 10, setRestS: 180 },
        { sets: 3, reps: 6, onS: 7, offS: 3, setRestS: 180 }
      ),
    ],
  },
  {
    id: "block",
    focus: "strength",
    kind: "hangboard",
    name: "hang.workout.block.name",
    description: "hang.workout.block.blurb",
    minutes: null,
    targetRpe: null,
    items: [hang("pinch", { sets: 5, reps: 5, setRestS: 120 })],
  },
  {
    id: "density",
    focus: null,
    kind: "hangboard",
    name: "hang.workout.density.name",
    description: "hang.workout.density.blurb",
    minutes: null,
    targetRpe: null,
    items: [hang("open", { sets: 4, reps: 1, onS: 30, setRestS: 60 })],
  },
  {
    id: "assist",
    focus: "strength",
    kind: "hangboard",
    name: "hang.workout.assist.name",
    description: "hang.workout.assist.blurb",
    minutes: null,
    targetRpe: null,
    items: [hang("half", { sets: 6, reps: 1, onS: 10, setRestS: 120 })],
  },
  {
    id: "lowpull",
    focus: "recovery",
    kind: "hangboard",
    name: "hang.workout.lowpull.name",
    description: "hang.workout.lowpull.blurb",
    minutes: null,
    targetRpe: null,
    items: [hang("open", { sets: 3, reps: 10, setRestS: 90 })],
  },
  {
    id: "climb-limit",
    focus: "power",
    kind: "climbing",
    name: "workouts.builtIn.limit.name",
    description: "workouts.builtIn.limit.blurb",
    minutes: 90,
    targetRpe: 9,
    items: [],
  },
  {
    id: "climb-4x4",
    focus: "power_endurance",
    kind: "climbing",
    name: "workouts.builtIn.fourByFour.name",
    description: "workouts.builtIn.fourByFour.blurb",
    minutes: 60,
    targetRpe: 8,
    items: [],
  },
  {
    id: "climb-arc",
    focus: "endurance",
    kind: "climbing",
    name: "workouts.builtIn.arc.name",
    description: "workouts.builtIn.arc.blurb",
    minutes: 45,
    targetRpe: 4,
    items: [],
  },
  {
    id: "strength-squat",
    focus: "strength",
    kind: "strength",
    name: "workouts.builtIn.squat.name",
    description: "workouts.builtIn.squat.blurb",
    minutes: 45,
    targetRpe: 8,
    items: [lift("workouts.exercise.backSquat", { sets: 5, reps: 5 }, { sets: 3, reps: 10 })],
  },
  {
    id: "strength-5x5",
    focus: "strength",
    kind: "strength",
    name: "workouts.builtIn.fiveByFive.name",
    description: "workouts.builtIn.fiveByFive.blurb",
    minutes: 45,
    targetRpe: 8,
    items: [
      lift("workouts.exercise.backSquat", { sets: 5, reps: 5 }),
      lift("workouts.exercise.benchPress", { sets: 5, reps: 5 }),
      lift("workouts.exercise.barbellRow", { sets: 5, reps: 5 }),
    ],
  },
  {
    id: "strength-antagonist",
    focus: null,
    kind: "strength",
    name: "workouts.builtIn.antagonist.name",
    description: "workouts.builtIn.antagonist.blurb",
    minutes: 30,
    targetRpe: 6,
    items: [
      lift("workouts.exercise.pushUps", { sets: 3, reps: 15 }),
      lift("workouts.exercise.overheadPress", { sets: 3, reps: 8 }),
      lift("workouts.exercise.dips", { sets: 3, reps: 10 }),
      lift("workouts.exercise.externalRotation", { sets: 4, reps: 15 }),
    ],
  },
  {
    id: "strength-extensors",
    focus: null,
    kind: "strength",
    name: "workouts.builtIn.extensors.name",
    description: "workouts.builtIn.extensors.blurb",
    minutes: 15,
    targetRpe: 4,
    items: [
      lift("workouts.exercise.bandExtensions", { sets: 3, reps: 20 }),
      lift("workouts.exercise.reverseWristCurls", { sets: 3, reps: 15 }),
      lift("workouts.exercise.riceBucket", { sets: 3, onS: 60 }),
    ],
  },
  {
    id: "mobility-hips",
    focus: "recovery",
    kind: "mobility",
    name: "workouts.builtIn.hips.name",
    description: "workouts.builtIn.hips.blurb",
    minutes: 20,
    targetRpe: 3,
    items: [
      lift("workouts.item.ninetyNinety", { sets: 1, reps: 10 }),
      lift("workouts.item.couchStretch", { sets: 1, onS: 60 }),
      lift("workouts.item.frogStretch", { sets: 1, onS: 90 }),
      lift("workouts.item.pigeon", { sets: 1, onS: 60 }),
      lift("workouts.item.hipFlexorLunge", { sets: 1, onS: 60 }),
      lift("workouts.item.deepSquat", { sets: 1, onS: 120 }),
    ],
  },
  {
    id: "yoga-climbers",
    focus: "recovery",
    kind: "mobility",
    name: "workouts.builtIn.yoga.name",
    description: "workouts.builtIn.yoga.blurb",
    minutes: 25,
    targetRpe: 2,
    items: [
      lift("workouts.item.sunSalutation", { sets: 1, reps: 5 }),
      lift("workouts.item.downwardDog", { sets: 1, onS: 60 }),
      lift("workouts.item.threadNeedle", { sets: 1, onS: 60 }),
      lift("workouts.item.lizard", { sets: 1, onS: 60 }),
      lift("workouts.item.childsPose", { sets: 1, onS: 120 }),
    ],
  },
  {
    id: "run-tempo",
    focus: "conditioning",
    kind: "other",
    name: "workouts.builtIn.tempo.name",
    description: "workouts.builtIn.tempo.blurb",
    minutes: 25,
    targetRpe: 7,
    items: [
      lift("workouts.step.hard", { sets: 5, onS: 180 }),
      lift("workouts.step.easy", { sets: 5, onS: 120 }),
    ],
  },
  {
    id: "other-core",
    focus: "strength",
    kind: "other",
    name: "workouts.builtIn.core.name",
    description: "workouts.builtIn.core.blurb",
    minutes: 15,
    targetRpe: 6,
    items: [
      lift("workouts.step.plank", { sets: 3, onS: 45, offS: 15 }),
      lift("workouts.step.hollowHold", { sets: 3, onS: 30, offS: 15 }),
      lift("workouts.step.kneeRaises", { sets: 3, reps: 10, offS: 60 }),
    ],
  },
];

const itemOf = (spec: ItemSpec): Item => ({
  exercise: "grip" in spec ? spec.grip : t(spec.exercise),
  doses: spec.doses,
});

export const BUILT_IN_WORKOUT_IDS: readonly string[] = BUILT_INS.map((w) => w.id);

/** The curated workouts, in the user's language. */
export function builtInWorkouts(): LibraryWorkout[] {
  return BUILT_INS.map((w) => ({
    id: w.id,
    source: "library",
    kind: w.kind,
    name: t(w.name),
    description: t(w.description),
    minutes: w.minutes,
    targetRpe: w.targetRpe,
    items: w.items.map(itemOf),
    exerciseRestS: defaultExerciseRestS(w.kind),
    focus: w.focus,
  }));
}
