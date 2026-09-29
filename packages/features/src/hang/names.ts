import type { BuiltInGrip, Grip, Workout } from "@sendtally/core/hang";
import { isBuiltInGrip } from "@sendtally/core/hang";
import { t, type MessageKey } from "../i18n";

const GRIP_KEYS: Record<BuiltInGrip, MessageKey> = {
  half: "hang.grip.half",
  full: "hang.grip.full",
  open: "hang.grip.open",
  drag: "hang.grip.drag",
  sloper: "hang.grip.sloper",
  pinch: "hang.grip.pinch",
  front2: "hang.grip.front2",
  back2: "hang.grip.back2",
};

const LIBRARY_KEYS: Record<string, { name: MessageKey; blurb: MessageKey }> = {
  rep73: { name: "hang.workout.rep73.name", blurb: "hang.workout.rep73.blurb" },
  max10: { name: "hang.workout.max10.name", blurb: "hang.workout.max10.blurb" },
  block: { name: "hang.workout.block.name", blurb: "hang.workout.block.blurb" },
  density: { name: "hang.workout.density.name", blurb: "hang.workout.density.blurb" },
  assist: { name: "hang.workout.assist.name", blurb: "hang.workout.assist.blurb" },
  lowpull: { name: "hang.workout.lowpull.name", blurb: "hang.workout.lowpull.blurb" },
};

export function builtInGripName(id: BuiltInGrip): string {
  return t(GRIP_KEYS[id]);
}

export function gripName(id: string, custom: readonly Grip[]): string {
  if (isBuiltInGrip(id)) return builtInGripName(id);
  return custom.find((g) => g.id === id)?.name ?? id;
}

export function workoutName(w: Pick<Workout, "id" | "source" | "name">): string {
  const keys = w.source === "library" ? LIBRARY_KEYS[w.id] : undefined;
  return keys === undefined ? w.name : t(keys.name);
}

export function workoutBlurb(w: Pick<Workout, "id" | "source">): string {
  const keys = w.source === "library" ? LIBRARY_KEYS[w.id] : undefined;
  return keys === undefined ? t("hang.workout.mineBlurb") : t(keys.blurb);
}

const EFFORT_KEYS: readonly MessageKey[] = [
  "hang.effort1",
  "hang.effort2",
  "hang.effort3",
  "hang.effort4",
  "hang.effort5",
  "hang.effort6",
  "hang.effort7",
  "hang.effort8",
  "hang.effort9",
  "hang.effort10",
];

export function effortWord(rpe: number): string {
  return t(EFFORT_KEYS[rpe - 1] ?? "hang.effort1");
}
