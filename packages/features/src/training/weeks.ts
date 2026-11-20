import {
  type DOSE_FIELDS,
  isRanged,
  RANGE_TOP,
  withTop,
  gripMeasureOf,
  fromUnit,
  toUnit,
  type Dose,
  type GripMeasure,
  type NumberLimits,
  type WeightUnit,
  type WorkoutKind,
  weightStep,
  stepOnGrid,
} from "@sendtally/core/hang";
import { countText, humanDuration } from "../hang/format";
import { RANGE_PLACEHOLDER } from "../workouts/doseFields";
import { formatNumber, t } from "../i18n";
import type { DoneCount } from "./recap";

/** A number a block week sets in a column of its own; a range's top shares its minimum's cell. */
export type WeekField = Exclude<(typeof DOSE_FIELDS)[number], "setsMax" | "repsMax">;

/** Timed work outside hangboarding: rounds of work and rest. */
const timed = (kind: WorkoutKind, dose: Dose): boolean =>
  kind !== "hangboard" && dose.onS !== undefined;

const HANGBOARD_FIELDS: Record<GripMeasure, WeekField[]> = {
  hang: ["sets", "reps", "onS", "offS", "edgeMm", "weightKg", "setRestS"],
  repsWeight: ["sets", "reps", "weightKg", "setRestS"],
  secondsWeight: ["sets", "onS", "weightKg", "setRestS"],
};

/** The fields a block week can change for an item, in the order they read. A ground pull has no edge. */
export function weekFields(kind: WorkoutKind, dose: Dose): WeekField[] {
  if (kind === "hangboard") return HANGBOARD_FIELDS[gripMeasureOf(dose)];
  if (timed(kind, dose)) return ["sets", "onS", "offS", "weightKg"];
  return ["sets", "reps", "weightKg", "targetRpe", "setRestS"];
}

/** What a field is called on an item of the kind. */
export function fieldLabel(kind: WorkoutKind, dose: Dose, field: WeekField): string {
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
    case "targetRpe":
      return t("workouts.dose.rpe");
  }
}

const STEP: Record<WeekField, number> = {
  sets: 1,
  reps: 1,
  weightKg: 2.5,
  onS: 1,
  offS: 1,
  edgeMm: 1,
  setRestS: 15,
  targetRpe: 1,
};

const MIN: Record<WeekField, number> = {
  sets: 1,
  reps: 0,
  weightKg: -200,
  onS: 0,
  offS: 0,
  edgeMm: 0,
  setRestS: 0,
  targetRpe: 1,
};

const round = (n: number): number => Math.round(n * 100) / 100;

const signed = (n: number): string => `${n > 0 ? "+" : "−"}${formatNumber(Math.abs(n))}`;

/** A field's value as its stepper shows it: weight in the user's unit. */
export function weekFieldValue(dose: Dose, field: WeekField, unit: WeightUnit): number {
  const value = dose[field] ?? 0;
  return field === "weightKg" ? round(toUnit(value, unit)) : value;
}

/** The dose with a field set to a value typed in the user's unit, or null when it is not one. */
export function withWeekField(
  dose: Dose,
  field: WeekField,
  typed: number,
  unit: WeightUnit
): Dose | null {
  if (!Number.isFinite(typed)) return null;
  const value = field === "weightKg" ? round(fromUnit(typed, unit)) : Math.round(typed);
  if (value < MIN[field] || (field === "targetRpe" && value > 10)) return null;
  return { ...dose, [field]: value };
}

/** How a field types and steps in the user's unit: weight by 2.5 kg or 5 lb, stepping below zero for assistance. */
export function weekFieldLimits(field: WeekField, unit: WeightUnit): NumberLimits {
  if (field === "weightKg")
    return {
      step: weightStep(unit),
      decimals: true,
      min: toUnit(MIN.weightKg, unit),
    };
  return { step: STEP[field], min: MIN[field], ...(field === "targetRpe" && { max: 10 }) };
}

/** Whether a week's cell types a range: sets and reps of strength and mobility, never timed work or a grip. */
export function weekRangeOf(
  kind: WorkoutKind,
  dose: Dose,
  field: WeekField
): { max?: number } | undefined {
  if (!isRanged(field) || (kind !== "strength" && kind !== "mobility") || timed(kind, dose))
    return undefined;
  const max = dose[RANGE_TOP[field]];
  return max !== undefined && max > (dose[field] ?? 0) ? { max } : {};
}

/** An empty cell that takes a range shows the editor's example range. */
export const weekPlaceholder = (
  kind: WorkoutKind,
  dose: Dose,
  field: WeekField
): string | undefined =>
  isRanged(field) && dose[field] === undefined && weekRangeOf(kind, dose, field) !== undefined
    ? RANGE_PLACEHOLDER[field]
    : undefined;

/**
 * The dose with a range typed into a cell. Dropping a top the workout has keeps it at the bottom,
 * which reads as one number, since a week only stores what it changes.
 */
export function withWeekRange(
  written: Dose,
  dose: Dose,
  field: WeekField,
  typed: number,
  max: number | undefined,
  unit: WeightUnit
): Dose | null {
  const next = withWeekField(dose, field, typed, unit);
  if (next === null || !isRanged(field)) return next;
  const ranged = withTop(next, field, max, 1000);
  const top = RANGE_TOP[field];
  return written[top] !== undefined && ranged[top] === undefined
    ? { ...ranged, [top]: ranged[field] }
    : ranged;
}

/** The dose one step up or down on a field: 2.5 kg or 5 lb of weight, 15 s of set rest, else 1. */
export function stepped(dose: Dose, field: WeekField, direction: 1 | -1, unit: WeightUnit): Dose {
  const { step } = weekFieldLimits(field, unit);
  return (
    withWeekField(
      dose,
      field,
      stepOnGrid(weekFieldValue(dose, field, unit), step, direction),
      unit
    ) ?? dose
  );
}

/** The rest fields, and on a hang its hangs per set: set by the dose, but kept out of the table. */
const quiet = (kind: WorkoutKind, dose: Dose, field: WeekField): boolean =>
  field === "offS" ||
  field === "setRestS" ||
  (kind === "hangboard" && gripMeasureOf(dose) === "hang" && field === "reps");

const LEAD: readonly WeekField[] = ["edgeMm", "weightKg", "sets", "onS"];

/**
 * The columns of an item's weekly load, edge first on a hang: the numbers its dose sets, a
 * hangboard's edge and load always, and any a week changes.
 */
export function loadColumns(
  kind: WorkoutKind,
  dose: Dose,
  changes: readonly Partial<Dose>[]
): WeekField[] {
  const fields = weekFields(kind, dose);
  const ordered =
    kind === "hangboard"
      ? [...LEAD.filter((f) => fields.includes(f)), ...fields.filter((f) => !LEAD.includes(f))]
      : fields;
  const always = (f: WeekField): boolean =>
    kind === "hangboard" && (f === "edgeMm" || f === "weightKg");
  return ordered.filter(
    (f) =>
      always(f) ||
      (dose[f] !== undefined && !quiet(kind, dose, f)) ||
      changes.some((c) => c[f] !== undefined)
  );
}

/** A weekly load column's heading: "Edge", "Load", "Sets". */
export function columnLabel(kind: WorkoutKind, dose: Dose, field: WeekField): string {
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
  field: WeekField,
  unit: WeightUnit
): string {
  if (dose[field] === undefined) return "–";
  const value = weekFieldValue(dose, field, unit);
  if (field === "onS" || field === "offS" || field === "setRestS") return humanDuration(value);
  if (field === "weightKg" && kind === "hangboard") return value === 0 ? "0" : signed(value);
  return countText(value, isRanged(field) ? dose[RANGE_TOP[field]] : undefined);
}

/** The fields a load table types as m:ss. */
export const isTimeField = (field: WeekField): boolean =>
  field === "onS" || field === "offS" || field === "setRestS";

/** The unit a load table shows beside a field: the user's for weight, mm for an edge. */
export const weekFieldUnit = (field: WeekField, unit: WeightUnit): string | null =>
  field === "weightKg" ? unit : field === "edgeMm" ? "mm" : null;

/** Whether a week's change differs from the workout as written in that field, drawn gold. */
export function weekFieldMarked(change: Partial<Dose>, written: Dose, field: WeekField): boolean {
  const differs = (f: keyof Dose): boolean => change[f] !== undefined && change[f] !== written[f];
  return differs(field) || (isRanged(field) && differs(RANGE_TOP[field]));
}

/** A week's runs as "2/3"; blank before it runs or with none planned. */
export const doneText = (ran: DoneCount | null): string =>
  ran === null || ran.planned === 0 ? "" : `${ran.done}/${ran.planned}`;

/** Every run of the week done, drawn fern. */
export const doneAll = (ran: DoneCount | null): boolean =>
  ran !== null && ran.planned > 0 && ran.done >= ran.planned;
