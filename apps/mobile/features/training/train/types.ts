import type { WorkoutKind } from "@sendtally/core/hang";

/** One exercise on its category's shelf; one with nothing to show yet does not open. */
export type ShelfCard = {
  key: string;
  kind: WorkoutKind;
  name: string;
  meta: string;
  open?: () => void;
};
