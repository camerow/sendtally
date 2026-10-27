import {
  DEFAULT_EXERCISE_REST_S,
  defaultPattern,
  type BuiltInGrip,
  type Dose,
  type Item,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { t, type MessageKey } from "../i18n";
import type { LibraryWorkout } from "./types";

/** A hangboard item names its grip by id; every other item names its exercise. */
type ItemSpec = { exercise: MessageKey; dose: Dose } | { grip: BuiltInGrip; dose: Dose };

type VariationSpec = { label: MessageKey | null; items: ItemSpec[] };

type BuiltIn = {
  id: string;
  kind: WorkoutKind;
  name: MessageKey;
  description: MessageKey;
  minutes: number | null;
  targetRpe: number | null;
  variations: VariationSpec[];
  pattern?: number[];
  exerciseRestS?: number;
};

const one = (...items: ItemSpec[]): VariationSpec[] => [{ label: null, items }];

const hang = (grip: BuiltInGrip, dose: Dose): ItemSpec => ({ grip, dose });

const lift = (exercise: MessageKey, dose: Dose): ItemSpec => ({ exercise, dose });

/**
 * The curated starter library. An id is never reused: sessions and memberships
 * reference it. Edge depth and added weight are chosen per use, so hangboard
 * built-ins carry neither.
 */
const BUILT_INS: readonly BuiltIn[] = [
  {
    id: "rep73",
    kind: "hangboard",
    name: "hang.workout.rep73.name",
    description: "hang.workout.rep73.blurb",
    minutes: null,
    targetRpe: null,
    variations: one(hang("half", { sets: 6, reps: 6, onS: 7, offS: 3, setRestS: 180 })),
  },
  {
    id: "max10",
    kind: "hangboard",
    name: "hang.workout.max10.name",
    description: "hang.workout.max10.blurb",
    minutes: null,
    targetRpe: null,
    variations: one(hang("half", { sets: 5, reps: 1, onS: 10, setRestS: 180 })),
  },
  {
    id: "fingers-ab",
    kind: "hangboard",
    name: "workouts.builtIn.fingersAb.name",
    description: "workouts.builtIn.fingersAb.blurb",
    minutes: null,
    targetRpe: 8,
    variations: [
      {
        label: "workouts.variation.maxHangs",
        items: [hang("half", { sets: 6, reps: 1, onS: 10, setRestS: 180 })],
      },
      {
        label: "workouts.variation.repeaters",
        items: [hang("half", { sets: 3, reps: 6, onS: 7, offS: 3, setRestS: 180 })],
      },
    ],
  },
  {
    id: "block",
    kind: "hangboard",
    name: "hang.workout.block.name",
    description: "hang.workout.block.blurb",
    minutes: null,
    targetRpe: null,
    variations: one(hang("pinch", { sets: 5, reps: 5, setRestS: 120 })),
  },
  {
    id: "density",
    kind: "hangboard",
    name: "hang.workout.density.name",
    description: "hang.workout.density.blurb",
    minutes: null,
    targetRpe: null,
    variations: one(hang("open", { sets: 4, reps: 1, onS: 30, setRestS: 60 })),
  },
  {
    id: "assist",
    kind: "hangboard",
    name: "hang.workout.assist.name",
    description: "hang.workout.assist.blurb",
    minutes: null,
    targetRpe: null,
    variations: one(hang("half", { sets: 6, reps: 1, onS: 10, setRestS: 120 })),
  },
  {
    id: "lowpull",
    kind: "hangboard",
    name: "hang.workout.lowpull.name",
    description: "hang.workout.lowpull.blurb",
    minutes: null,
    targetRpe: null,
    variations: one(hang("open", { sets: 3, reps: 10, setRestS: 90 })),
  },
  {
    id: "climb-limit",
    kind: "climbing",
    name: "workouts.builtIn.limit.name",
    description: "workouts.builtIn.limit.blurb",
    minutes: 90,
    targetRpe: 9,
    variations: one(),
  },
  {
    id: "climb-4x4",
    kind: "climbing",
    name: "workouts.builtIn.fourByFour.name",
    description: "workouts.builtIn.fourByFour.blurb",
    minutes: 60,
    targetRpe: 8,
    variations: one(),
  },
  {
    id: "climb-arc",
    kind: "climbing",
    name: "workouts.builtIn.arc.name",
    description: "workouts.builtIn.arc.blurb",
    minutes: 45,
    targetRpe: 4,
    variations: one(),
  },
  {
    id: "strength-squat",
    kind: "strength",
    name: "workouts.builtIn.squat.name",
    description: "workouts.builtIn.squat.blurb",
    minutes: 45,
    targetRpe: 8,
    variations: [
      {
        label: "workouts.variation.fiveByFive",
        items: [lift("workouts.exercise.backSquat", { sets: 5, reps: 5 })],
      },
      {
        label: "workouts.variation.threeByTen",
        items: [lift("workouts.exercise.backSquat", { sets: 3, reps: 10 })],
      },
    ],
  },
  {
    id: "strength-5x5",
    kind: "strength",
    name: "workouts.builtIn.fiveByFive.name",
    description: "workouts.builtIn.fiveByFive.blurb",
    minutes: 45,
    targetRpe: 8,
    variations: one(
      lift("workouts.exercise.backSquat", { sets: 5, reps: 5 }),
      lift("workouts.exercise.benchPress", { sets: 5, reps: 5 }),
      lift("workouts.exercise.barbellRow", { sets: 5, reps: 5 })
    ),
  },
  {
    id: "strength-antagonist",
    kind: "strength",
    name: "workouts.builtIn.antagonist.name",
    description: "workouts.builtIn.antagonist.blurb",
    minutes: 30,
    targetRpe: 6,
    variations: one(
      lift("workouts.exercise.pushUps", { sets: 3, reps: 15 }),
      lift("workouts.exercise.overheadPress", { sets: 3, reps: 8 }),
      lift("workouts.exercise.dips", { sets: 3, reps: 10 }),
      lift("workouts.exercise.externalRotation", { sets: 4, reps: 15 })
    ),
  },
  {
    id: "strength-extensors",
    kind: "strength",
    name: "workouts.builtIn.extensors.name",
    description: "workouts.builtIn.extensors.blurb",
    minutes: 15,
    targetRpe: 4,
    variations: one(
      lift("workouts.exercise.bandExtensions", { sets: 3, reps: 20 }),
      lift("workouts.exercise.reverseWristCurls", { sets: 3, reps: 15 }),
      lift("workouts.exercise.riceBucket", { sets: 3, onS: 60 })
    ),
  },
  {
    id: "mobility-hips",
    kind: "mobility",
    name: "workouts.builtIn.hips.name",
    description: "workouts.builtIn.hips.blurb",
    minutes: 20,
    targetRpe: 3,
    variations: one(
      lift("workouts.item.ninetyNinety", { sets: 1, reps: 10 }),
      lift("workouts.item.couchStretch", { sets: 1, onS: 60 }),
      lift("workouts.item.frogStretch", { sets: 1, onS: 90 }),
      lift("workouts.item.pigeon", { sets: 1, onS: 60 }),
      lift("workouts.item.hipFlexorLunge", { sets: 1, onS: 60 }),
      lift("workouts.item.deepSquat", { sets: 1, onS: 120 })
    ),
  },
  {
    id: "yoga-climbers",
    kind: "mobility",
    name: "workouts.builtIn.yoga.name",
    description: "workouts.builtIn.yoga.blurb",
    minutes: 25,
    targetRpe: 2,
    variations: one(
      lift("workouts.item.sunSalutation", { sets: 1, reps: 5 }),
      lift("workouts.item.downwardDog", { sets: 1, onS: 60 }),
      lift("workouts.item.threadNeedle", { sets: 1, onS: 60 }),
      lift("workouts.item.lizard", { sets: 1, onS: 60 }),
      lift("workouts.item.childsPose", { sets: 1, onS: 120 })
    ),
  },
  {
    id: "run-tempo",
    kind: "other",
    name: "workouts.builtIn.tempo.name",
    description: "workouts.builtIn.tempo.blurb",
    minutes: 25,
    targetRpe: 7,
    variations: one(
      lift("workouts.step.hard", { sets: 5, onS: 180 }),
      lift("workouts.step.easy", { sets: 5, onS: 120 })
    ),
  },
  {
    id: "other-core",
    kind: "other",
    name: "workouts.builtIn.core.name",
    description: "workouts.builtIn.core.blurb",
    minutes: 15,
    targetRpe: 6,
    variations: one(
      lift("workouts.step.plank", { sets: 3, onS: 45, offS: 15 }),
      lift("workouts.step.hollowHold", { sets: 3, onS: 30, offS: 15 }),
      lift("workouts.step.kneeRaises", { sets: 3, reps: 10, offS: 60 })
    ),
  },
];

const itemOf = (spec: ItemSpec): Item =>
  "grip" in spec
    ? { exercise: spec.grip, dose: spec.dose }
    : { exercise: t(spec.exercise), dose: spec.dose };

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
    variations: w.variations.map((v) => ({
      label: v.label === null ? "" : t(v.label),
      items: v.items.map(itemOf),
    })),
    pattern: w.pattern ?? defaultPattern(w.variations.length),
    exerciseRestS: w.exerciseRestS ?? DEFAULT_EXERCISE_REST_S,
  }));
}
