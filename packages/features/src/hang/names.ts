import type { BuiltInGrip, Grip } from "@sendtally/core/hang";
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

export function builtInGripName(id: BuiltInGrip): string {
  return t(GRIP_KEYS[id]);
}

export function gripName(id: string, custom: readonly Grip[]): string {
  if (isBuiltInGrip(id)) return builtInGripName(id);
  return custom.find((g) => g.id === id)?.name ?? id;
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
