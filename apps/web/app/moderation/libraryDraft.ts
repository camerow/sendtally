import type { LibraryCreate } from "@sendtally/api-client";
import {
  EXERCISE_MEASURES,
  measuresFor,
  type BuiltInGrip,
  type BuiltInStep,
  type Dose,
  type ExerciseKind,
  type ExerciseMeasure,
  type Focus,
  type TranslatedLocale,
  type WorkoutKind,
} from "@sendtally/core/hang";

export type CreateType = "exercise" | "workout";

export type ItemRef = { grip: BuiltInGrip } | { exercise: string } | { step: BuiltInStep };

export type ItemDraft = { key: string; ref: ItemRef; doses: Dose[] };

export type ExerciseSpecDraft = { kind: ExerciseKind; measure: ExerciseMeasure; dose: Dose | null };

export type WorkoutSpecDraft = {
  kind: WorkoutKind;
  focus: Focus | null;
  minutes: number | null;
  targetRpe: number | null;
  items: ItemDraft[];
};

export type TextDraft = {
  name: string;
  description: string;
  names: Partial<Record<TranslatedLocale, string>>;
};

export const NEW_EXERCISE: ExerciseSpecDraft = {
  kind: "strength",
  measure: "repsWeight",
  dose: null,
};

export const NEW_WORKOUT: WorkoutSpecDraft = {
  kind: "strength",
  focus: null,
  minutes: null,
  targetRpe: null,
  items: [],
};

/** The measures a built-in exercise of this kind takes. */
export const exerciseMeasures = (kind: ExerciseKind): ExerciseMeasure[] =>
  EXERCISE_MEASURES.filter((m) => measuresFor(kind).includes(m));

/** A kind's first measure when the one picked does not fit it. */
export function withExerciseKind(draft: ExerciseSpecDraft, kind: ExerciseKind): ExerciseSpecDraft {
  const fits = exerciseMeasures(kind);
  return { kind, measure: fits.includes(draft.measure) ? draft.measure : fits[0]!, dose: null };
}

/** Grips and exercises do not mix, so moving in or out of hangboard empties the items. */
export function withWorkoutKind(draft: WorkoutSpecDraft, kind: WorkoutKind): WorkoutSpecDraft {
  const fingers = (k: WorkoutKind): boolean => k === "hangboard";
  return {
    ...draft,
    kind,
    items: fingers(kind) === fingers(draft.kind) ? draft.items : [],
    ...(fingers(kind) && { minutes: null, targetRpe: null }),
  };
}

/** Edge depth and added weight are chosen per use, so a hangboard built-in carries neither. */
function builtInDose(kind: WorkoutKind, dose: Dose): Dose {
  if (kind !== "hangboard") return dose;
  const { edgeMm: _edge, weightKg: _weight, ...rest } = dose;
  return rest;
}

/** The body the Worker takes for a new built-in. */
export function createBody(
  text: TextDraft,
  spec:
    { type: "exercise"; draft: ExerciseSpecDraft } | { type: "workout"; draft: WorkoutSpecDraft }
): LibraryCreate {
  const names = Object.fromEntries(
    Object.entries(text.names).flatMap(([l, n]) => (n.trim() === "" ? [] : [[l, n.trim()]]))
  );
  const base = { name: text.name.trim(), description: text.description.trim(), names };
  if (spec.type === "exercise") {
    const { kind, measure, dose } = spec.draft;
    return { ...base, spec: { kind, measure, ...(dose !== null && { dose }) } };
  }
  const { kind, focus, minutes, targetRpe, items } = spec.draft;
  const fingers = kind === "hangboard";
  return {
    ...base,
    spec: {
      kind,
      focus,
      minutes: fingers ? null : minutes,
      targetRpe: fingers ? null : targetRpe,
      items: items.map(({ ref, doses }) => ({
        ...ref,
        doses: doses.map((d) => builtInDose(kind, d)),
      })),
    },
  };
}
