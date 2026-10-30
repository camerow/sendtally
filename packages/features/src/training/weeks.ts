import {
  type DOSE_FIELDS,
  gripMeasureOf,
  fromUnit,
  toUnit,
  type Dose,
  type GripMeasure,
  type NumberLimits,
  type WeightUnit,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { humanDuration } from "../hang/format";
import { formatNumber, t } from "../i18n";

export type DoseField = (typeof DOSE_FIELDS)[number];

/** Timed work outside hangboarding: rounds of work and rest. */
const timed = (kind: WorkoutKind, dose: Dose): boolean =>
  kind !== "hangboard" && dose.onS !== undefined;

const HANGBOARD_FIELDS: Record<GripMeasure, DoseField[]> = {
  hang: ["sets", "reps", "onS", "offS", "edgeMm", "weightKg", "setRestS"],
  repsWeight: ["sets", "reps", "weightKg", "setRestS"],
  secondsWeight: ["sets", "onS", "weightKg", "setRestS"],
};

/** The fields a block week can change for an item, in the order they read. A ground pull has no edge. */
export function weekFields(kind: WorkoutKind, dose: Dose): DoseField[] {
  if (kind === "hangboard") return HANGBOARD_FIELDS[gripMeasureOf(dose)];
  if (timed(kind, dose)) return ["sets", "onS", "offS", "weightKg"];
  return ["sets", "reps", "weightKg", "setRestS"];
}

/** What a field is called on an item of the kind. */
export function fieldLabel(kind: WorkoutKind, dose: Dose, field: DoseField): string {
  const hang = kind === "hangboard";
  switch (field) {
    case "sets":
      return timed(kind, dose) ? t("plan.fieldRounds") : t("hang.fieldSets");
    case "reps":
      return hang ? t("hang.fieldReps") : t("activities.doReps");
    case "weightKg":
      return hang ? t("hang.addedWeight") : t("hang.weight");
    case "onS":
      return hang ? t("hang.fieldHang") : t("plan.fieldWork");
    case "offS":
      return hang ? t("hang.fieldRest") : t("hang.rest");
    case "edgeMm":
      return t("hang.edgeDepth");
    case "setRestS":
      return t("hang.fieldSetRest");
  }
}

const STEP: Record<DoseField, number> = {
  sets: 1,
  reps: 1,
  weightKg: 2.5,
  onS: 1,
  offS: 1,
  edgeMm: 1,
  setRestS: 15,
};

const MIN: Record<DoseField, number> = {
  sets: 1,
  reps: 0,
  weightKg: -200,
  onS: 0,
  offS: 0,
  edgeMm: 0,
  setRestS: 0,
};

const round = (n: number): number => Math.round(n * 100) / 100;

const signed = (n: number): string => `${n > 0 ? "+" : "−"}${formatNumber(Math.abs(n))}`;

/** A field's value as its stepper shows it: weight in the user's unit. */
export function fieldValue(dose: Dose, field: DoseField, unit: WeightUnit): number {
  const value = dose[field] ?? 0;
  return field === "weightKg" ? round(toUnit(value, unit)) : value;
}

/** The dose with a field set to a value typed in the user's unit, or null when it is not one. */
export function withField(
  dose: Dose,
  field: DoseField,
  typed: number,
  unit: WeightUnit
): Dose | null {
  if (!Number.isFinite(typed)) return null;
  const value = field === "weightKg" ? round(fromUnit(typed, unit)) : Math.round(typed);
  if (value < MIN[field]) return null;
  return { ...dose, [field]: value };
}

/** How a field types and steps in the user's unit: weight by 2.5 kg or 5 lb, stepping below zero for assistance. */
export function fieldLimits(field: DoseField, unit: WeightUnit): NumberLimits {
  if (field === "weightKg")
    return {
      step: unit === "lb" ? 5 : STEP.weightKg,
      decimals: true,
      min: toUnit(MIN.weightKg, unit),
    };
  return { step: STEP[field], min: MIN[field] };
}

/** The dose one step up or down on a field: 2.5 kg or 5 lb of weight, 15 s of set rest, else 1. */
export function stepped(dose: Dose, field: DoseField, direction: 1 | -1, unit: WeightUnit): Dose {
  const { step } = fieldLimits(field, unit);
  return withField(dose, field, fieldValue(dose, field, unit) + direction * step, unit) ?? dose;
}

/** The rest fields, and on a hang its hangs per set: set by the dose, but left to + Column. */
const quiet = (kind: WorkoutKind, dose: Dose, field: DoseField): boolean =>
  field === "offS" ||
  field === "setRestS" ||
  (kind === "hangboard" && gripMeasureOf(dose) === "hang" && field === "reps");

const LEAD: readonly DoseField[] = ["edgeMm", "weightKg", "sets", "onS"];

/**
 * The columns of an item's weekly load, edge first on a hang: the numbers its dose sets, a
 * hangboard's edge and load always, and any a week changes or the user added.
 */
export function loadColumns(
  kind: WorkoutKind,
  dose: Dose,
  changes: readonly Partial<Dose>[],
  added: readonly DoseField[] = []
): DoseField[] {
  const fields = weekFields(kind, dose);
  const ordered =
    kind === "hangboard"
      ? [...LEAD.filter((f) => fields.includes(f)), ...fields.filter((f) => !LEAD.includes(f))]
      : fields;
  const always = (f: DoseField): boolean =>
    kind === "hangboard" && (f === "edgeMm" || f === "weightKg");
  return ordered.filter(
    (f) =>
      always(f) ||
      (dose[f] !== undefined && !quiet(kind, dose, f)) ||
      added.includes(f) ||
      changes.some((c) => c[f] !== undefined)
  );
}

/** A weekly load column's heading: "Edge", "Load", "Sets". */
export function columnLabel(kind: WorkoutKind, dose: Dose, field: DoseField): string {
  const hang = kind === "hangboard";
  switch (field) {
    case "edgeMm":
      return t("plan.colEdge");
    case "weightKg":
      return hang ? t("hang.load") : t("hang.weight");
    case "reps":
      return hang ? t("plan.colHangs") : t("plan.colReps");
    case "offS":
      return t("plan.colRest");
    case "setRestS":
      return t("plan.colSetRest");
    default:
      return fieldLabel(kind, dose, field);
  }
}

/** A weekly load cell: "+8" of added weight on a hang, "20", "7s"; "–" for a number not set. */
export function cellText(
  kind: WorkoutKind,
  dose: Dose,
  field: DoseField,
  unit: WeightUnit
): string {
  if (dose[field] === undefined) return "–";
  const value = fieldValue(dose, field, unit);
  if (field === "onS" || field === "offS" || field === "setRestS") return humanDuration(value);
  if (field === "weightKg" && kind === "hangboard") return value === 0 ? "0" : signed(value);
  return formatNumber(value);
}
