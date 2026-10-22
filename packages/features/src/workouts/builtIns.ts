import type { PlanTemplate, SetMeasure } from "@sendtally/api-client";
import { t, type MessageKey } from "../i18n";
import type { LibraryBody, LibraryWorkout, WorkoutCategory } from "./types";

type SetsSpec = {
  name: MessageKey;
  measures: SetMeasure[];
  sets: number;
  reps?: number;
  seconds?: number;
};

type ChecklistSpec = { text: MessageKey; dose: string };

type StepSpec = {
  label: MessageKey;
  seconds?: number;
  count?: number;
  restAfter: number;
};

type BodySpec =
  | { kind: "sets"; exercises: SetsSpec[] }
  | { kind: "checklist"; items: ChecklistSpec[] }
  | { kind: "intervals"; rounds: number; steps: StepSpec[] }
  | Extract<LibraryBody, { kind: "climb" }>;

type BuiltIn = {
  id: string;
  category: Exclude<WorkoutCategory, "hang">;
  name: MessageKey;
  blurb: MessageKey;
  tags: MessageKey[];
  minutes: number;
  targetRpe: number;
  body: BodySpec;
};

const fiveByFive = (name: MessageKey): SetsSpec => ({
  name,
  measures: ["reps", "loadKg"],
  sets: 5,
  reps: 5,
});

/** The curated workouts beside the hangboard library. An id is never reused. */
const BUILT_INS: readonly BuiltIn[] = [
  {
    id: "strength-5x5",
    category: "strength",
    name: "workouts.builtIn.fiveByFive.name",
    blurb: "workouts.builtIn.fiveByFive.blurb",
    tags: ["workouts.tag.strength"],
    minutes: 45,
    targetRpe: 8,
    body: {
      kind: "sets",
      exercises: [
        fiveByFive("workouts.exercise.backSquat"),
        fiveByFive("workouts.exercise.benchPress"),
        fiveByFive("workouts.exercise.barbellRow"),
      ],
    },
  },
  {
    id: "strength-antagonist",
    category: "strength",
    name: "workouts.builtIn.antagonist.name",
    blurb: "workouts.builtIn.antagonist.blurb",
    tags: ["workouts.tag.antagonist"],
    minutes: 30,
    targetRpe: 6,
    body: {
      kind: "sets",
      exercises: [
        { name: "workouts.exercise.pushUps", measures: ["reps"], sets: 3, reps: 15 },
        { name: "workouts.exercise.overheadPress", measures: ["reps", "loadKg"], sets: 3, reps: 8 },
        { name: "workouts.exercise.dips", measures: ["reps"], sets: 3, reps: 10 },
        {
          name: "workouts.exercise.externalRotation",
          measures: ["reps", "side"],
          sets: 4,
          reps: 15,
        },
      ],
    },
  },
  {
    id: "strength-extensors",
    category: "strength",
    name: "workouts.builtIn.extensors.name",
    blurb: "workouts.builtIn.extensors.blurb",
    tags: ["workouts.tag.prehab", "workouts.tag.fingers"],
    minutes: 15,
    targetRpe: 4,
    body: {
      kind: "sets",
      exercises: [
        { name: "workouts.exercise.bandExtensions", measures: ["reps"], sets: 3, reps: 20 },
        {
          name: "workouts.exercise.reverseWristCurls",
          measures: ["reps", "loadKg"],
          sets: 3,
          reps: 15,
        },
        { name: "workouts.exercise.riceBucket", measures: ["seconds"], sets: 3, seconds: 60 },
      ],
    },
  },
  {
    id: "mobility-hips",
    category: "mobility",
    name: "workouts.builtIn.hips.name",
    blurb: "workouts.builtIn.hips.blurb",
    tags: ["workouts.tag.stretching"],
    minutes: 20,
    targetRpe: 3,
    body: {
      kind: "checklist",
      items: [
        { text: "workouts.item.ninetyNinety", dose: "× 10" },
        { text: "workouts.item.couchStretch", dose: "1 min" },
        { text: "workouts.item.frogStretch", dose: "90s" },
        { text: "workouts.item.pigeon", dose: "1 min" },
        { text: "workouts.item.hipFlexorLunge", dose: "1 min" },
        { text: "workouts.item.deepSquat", dose: "2 min" },
      ],
    },
  },
  {
    id: "yoga-climbers",
    category: "yoga",
    name: "workouts.builtIn.yoga.name",
    blurb: "workouts.builtIn.yoga.blurb",
    tags: ["workouts.tag.stretching", "workouts.tag.recovery"],
    minutes: 25,
    targetRpe: 2,
    body: {
      kind: "checklist",
      items: [
        { text: "workouts.item.sunSalutation", dose: "× 5" },
        { text: "workouts.item.downwardDog", dose: "1 min" },
        { text: "workouts.item.threadNeedle", dose: "1 min" },
        { text: "workouts.item.lizard", dose: "1 min" },
        { text: "workouts.item.childsPose", dose: "2 min" },
      ],
    },
  },
  {
    id: "run-tempo",
    category: "run",
    name: "workouts.builtIn.tempo.name",
    blurb: "workouts.builtIn.tempo.blurb",
    tags: ["workouts.tag.aerobic"],
    minutes: 25,
    targetRpe: 7,
    body: {
      kind: "intervals",
      rounds: 5,
      steps: [
        { label: "workouts.step.hard", seconds: 180, restAfter: 0 },
        { label: "workouts.step.easy", seconds: 120, restAfter: 0 },
      ],
    },
  },
  {
    id: "other-core",
    category: "other",
    name: "workouts.builtIn.core.name",
    blurb: "workouts.builtIn.core.blurb",
    tags: ["workouts.tag.core"],
    minutes: 15,
    targetRpe: 6,
    body: {
      kind: "intervals",
      rounds: 3,
      steps: [
        { label: "workouts.step.plank", seconds: 45, restAfter: 15 },
        { label: "workouts.step.hollowHold", seconds: 30, restAfter: 15 },
        { label: "workouts.step.kneeRaises", count: 10, restAfter: 60 },
      ],
    },
  },
  {
    id: "climb-limit",
    category: "climb",
    name: "workouts.builtIn.limit.name",
    blurb: "workouts.builtIn.limit.blurb",
    tags: ["workouts.tag.power"],
    minutes: 90,
    targetRpe: 9,
    body: { kind: "climb", focus: "limit", projectId: null },
  },
  {
    id: "climb-4x4",
    category: "climb",
    name: "workouts.builtIn.fourByFour.name",
    blurb: "workouts.builtIn.fourByFour.blurb",
    tags: ["workouts.tag.powerEndurance"],
    minutes: 60,
    targetRpe: 8,
    body: { kind: "climb", focus: "endurance", projectId: null },
  },
  {
    id: "climb-arc",
    category: "climb",
    name: "workouts.builtIn.arc.name",
    blurb: "workouts.builtIn.arc.blurb",
    tags: ["workouts.tag.aerobic"],
    minutes: 45,
    targetRpe: 4,
    body: { kind: "climb", focus: "endurance", projectId: null },
  },
];

function bodyOf(spec: BodySpec): Exclude<LibraryBody, { kind: "hang" }> {
  switch (spec.kind) {
    case "sets":
      return {
        kind: "sets",
        exercises: spec.exercises.map((e) => ({
          name: t(e.name),
          measures: e.measures,
          sets: Array.from({ length: e.sets }, (_, i) => ({
            ...(e.reps === undefined ? {} : { reps: e.reps }),
            ...(e.seconds === undefined ? {} : { seconds: e.seconds }),
            ...(e.measures.includes("side")
              ? { side: i % 2 === 0 ? ("L" as const) : ("R" as const) }
              : {}),
          })),
        })),
      } satisfies PlanTemplate;
    case "checklist":
      return {
        kind: "checklist",
        items: spec.items.map((i) => ({ text: t(i.text), dose: i.dose })),
      };
    case "intervals":
      return {
        kind: "intervals",
        rounds: spec.rounds,
        steps: spec.steps.map((s) => ({
          label: t(s.label),
          restAfter: s.restAfter,
          ...(s.count === undefined
            ? { measure: "time" as const, seconds: s.seconds }
            : { measure: "count" as const, count: s.count }),
        })),
      };
    case "climb":
      return spec;
  }
}

export const BUILT_IN_WORKOUT_IDS: readonly string[] = BUILT_INS.map((w) => w.id);

/** The curated workouts other than hangboard ones, in the user's language. */
export function builtInWorkouts(): LibraryWorkout[] {
  return BUILT_INS.map((w) => ({
    id: w.id,
    source: "library",
    category: w.category,
    name: t(w.name),
    description: t(w.blurb),
    tags: w.tags.map((tag) => t(tag)),
    minutes: w.minutes,
    targetRpe: w.targetRpe,
    body: bodyOf(w.body),
  }));
}
