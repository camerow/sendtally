import type { HangKind, TimeField, Workout } from "@sendtally/core/hang";
import type { MessageKey } from "@sendtally/features/i18n";

export type NumberKey = TimeField | "reps" | "sets" | "edgeMm";

type Spec = {
  label: MessageKey;
  min: number;
  max: number;
  hint?: (w: Pick<Workout, "reps">) => MessageKey | null;
};

export type FieldSpec =
  | (Spec & { time: true; key: TimeField })
  | (Spec & { time: false; key: Exclude<NumberKey, TimeField> });

const time = (key: TimeField, label: MessageKey, min: number): FieldSpec => ({
  key,
  label,
  min,
  max: 3600,
  time: true,
});

const SETS: FieldSpec = { key: "sets", label: "hang.fieldSets", min: 1, max: 50, time: false };

/** The builder's fields and their ranges, per kind. */
export const FIELDS: Record<HangKind, readonly FieldSpec[]> = {
  hang: [
    time("hangS", "hang.fieldHang", 1),
    {
      ...time("restS", "hang.fieldRest", 0),
      hint: (w) => (w.reps > 1 ? null : "hang.fieldRestHint"),
    },
    { key: "reps", label: "hang.fieldReps", min: 1, max: 50, time: false },
    SETS,
    time("setRestS", "hang.fieldSetRest", 0),
    { key: "edgeMm", label: "hang.fieldEdge", min: 4, max: 60, time: false },
  ],
  pull: [
    { key: "reps", label: "hang.fieldLifts", min: 1, max: 100, time: false },
    SETS,
    time("setRestS", "hang.fieldSetRest", 0),
  ],
};
