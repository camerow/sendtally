import type {
  Activity,
  ActivityDetail,
  ActivityKind,
  PlanTemplate,
  SetMeasure,
} from "@sendtally/api-client";
import { toUnit, type WeightUnit } from "@sendtally/core/hang";
import { formatNumber, t, type MessageKey } from "../i18n";

export type SetsDetail = Extract<ActivityDetail, { kind: "sets" }>;

export type ChecklistDetail = Extract<ActivityDetail, { kind: "checklist" }>;

export type Exercise = SetsDetail["exercises"][number];

export type ExerciseSet = Exercise["sets"][number];

export type ChecklistItem = ChecklistDetail["items"][number];

export type DetailKind = ActivityDetail["kind"];

export type SetTarget = Omit<ExerciseSet, "done">;

export type Side = NonNullable<ExerciseSet["side"]>;

export const SET_MEASURES = [
  "reps",
  "loadKg",
  "seconds",
  "side",
] as const satisfies readonly SetMeasure[];

const MAX_SUGGESTIONS = 5;

export function defaultMeasures(kind: ActivityKind): SetMeasure[] {
  return kind === "strength" || kind === "other" ? ["reps", "loadKg"] : ["seconds", "side"];
}

export function newExercise(kind: ActivityKind): Exercise {
  return { name: "", measures: defaultMeasures(kind), sets: [{ done: false }] };
}

export const newChecklistItem = (): ChecklistItem => ({ text: "", dose: "", done: false });

export function emptyDetail(kind: DetailKind, activityKind: ActivityKind): ActivityDetail {
  return kind === "sets"
    ? { kind, exercises: [newExercise(activityKind)] }
    : { kind, items: [newChecklistItem()] };
}

/** A new set repeats the last one, on the other side when it has one, not yet done. */
export function nextSet(sets: readonly ExerciseSet[]): ExerciseSet {
  const last = sets.at(-1);
  if (last === undefined) return { done: false };
  const side: Pick<ExerciseSet, "side"> =
    last.side === undefined ? {} : { side: last.side === "L" ? "R" : "L" };
  return { ...last, ...side, done: false };
}

const onlyMeasured = <S extends SetTarget>(set: S, measures: readonly SetMeasure[]): S => {
  const kept = { ...set };
  for (const m of SET_MEASURES) if (!measures.includes(m)) delete kept[m];
  return kept;
};

/** Turns a measure on or off, dropping its values; the last one stays on. */
export function toggleMeasure(exercise: Exercise, measure: SetMeasure): Exercise {
  const on = exercise.measures.includes(measure);
  if (on && exercise.measures.length === 1) return exercise;
  const measures = SET_MEASURES.filter((m) =>
    m === measure ? !on : exercise.measures.includes(m)
  );
  return { ...exercise, measures, sets: exercise.sets.map((s) => onlyMeasured(s, measures)) };
}

/** What saves: named exercises and items only, trimmed, or null when nothing is left. */
export function cleanDetail(detail: ActivityDetail | null): ActivityDetail | null {
  if (detail === null) return null;
  if (detail.kind === "sets") {
    const exercises = detail.exercises
      .map((e) => ({
        ...e,
        name: e.name.trim(),
        sets: e.sets.map((s) => onlyMeasured(s, e.measures)),
      }))
      .filter((e) => e.name !== "");
    return exercises.length === 0 ? null : { kind: "sets", exercises };
  }
  const items = detail.items
    .map((i) => ({ ...i, text: i.text.trim(), dose: i.dose.trim() }))
    .filter((i) => i.text !== "");
  return items.length === 0 ? null : { kind: "checklist", items };
}

const withoutDone = <T extends { done: boolean }>({ done: _, ...rest }: T): Omit<T, "done"> => rest;

/** The template a plan item keeps from the form's body: what to do, not what was done. */
export function templateOf(detail: ActivityDetail | null): PlanTemplate | null {
  const clean = cleanDetail(detail);
  if (clean === null) return null;
  return clean.kind === "sets"
    ? {
        kind: "sets",
        exercises: clean.exercises.map((e) => ({ ...e, sets: e.sets.map(withoutDone) })),
      }
    : { kind: "checklist", items: clean.items.map(withoutDone) };
}

/** A plan's template as a body to log against: every set and item still to do. */
export function detailFromTemplate(template: PlanTemplate | null): ActivityDetail | null {
  if (template === null) return null;
  return template.kind === "sets"
    ? {
        kind: "sets",
        exercises: template.exercises.map((e) => ({
          ...e,
          sets: e.sets.map((s) => ({ ...s, done: false })),
        })),
      }
    : { kind: "checklist", items: template.items.map((i) => ({ ...i, done: false })) };
}

/** "3 exercises · 9 sets" or "4 of 6 done". */
export function detailSummary(detail: ActivityDetail | null): string | null {
  if (detail === null) return null;
  if (detail.kind === "checklist") {
    return t("activities.checklistDone", {
      done: detail.items.filter((i) => i.done).length,
      total: detail.items.length,
    });
  }
  const sets = detail.exercises.reduce((n, e) => n + e.sets.length, 0);
  return [
    t("activities.exerciseCount", { count: detail.exercises.length }),
    t("activities.setCount", { count: sets }),
  ].join(" · ");
}

const MEASURE_LABELS: Record<SetMeasure, MessageKey> = {
  reps: "activities.measureReps",
  loadKg: "activities.measureLoad",
  seconds: "activities.measureSeconds",
  side: "activities.measureSide",
};

export function measureLabel(measure: SetMeasure): string {
  return t(MEASURE_LABELS[measure]);
}

export function sideLabel(side: Side): string {
  return side === "L" ? t("activities.sideLeft") : t("activities.sideRight");
}

/** "5 × 100 kg", "30s · L", leaving out what the set does not have. */
export function setText(set: SetTarget, unit: WeightUnit): string {
  const load =
    set.loadKg === undefined
      ? undefined
      : t("hang.loadPlain", { value: formatNumber(toUnit(set.loadKg, unit)), unit });
  const work = [set.reps === undefined ? undefined : formatNumber(set.reps), load]
    .filter((p) => p !== undefined)
    .join(" × ");
  return [
    work,
    set.seconds === undefined ? "" : `${formatNumber(set.seconds)}s`,
    set.side === undefined ? "" : sideLabel(set.side),
  ]
    .filter((p) => p !== "")
    .join(" · ");
}

/** The target for one set of an exercise, matched by name, from a plan's template. */
export function setTargetFor(
  template: PlanTemplate | null,
  name: string,
  index: number
): SetTarget | null {
  if (template?.kind !== "sets") return null;
  const key = name.trim().toLowerCase();
  const exercise = template.exercises.find((e) => e.name.toLowerCase() === key);
  return exercise?.sets[index] ?? null;
}

/** Every exercise name in the user's own bodies, newest first, each once. */
export function exerciseNames(activities: readonly Pick<Activity, "detail">[]): string[] {
  const seen = new Map<string, string>();
  for (const a of activities) {
    if (a.detail?.kind !== "sets") continue;
    for (const e of a.detail.exercises) {
      const key = e.name.toLowerCase();
      if (!seen.has(key)) seen.set(key, e.name);
    }
  }
  return [...seen.values()];
}

/** Recent names for an empty field, else names containing what was typed. */
export function exerciseSuggestions(names: readonly string[], typed: string): string[] {
  const query = typed.trim().toLowerCase();
  return names
    .filter((n) => n.toLowerCase().includes(query) && n.toLowerCase() !== query)
    .slice(0, MAX_SUGGESTIONS);
}
