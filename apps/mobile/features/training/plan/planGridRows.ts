import type { Plan } from "@sendtally/api-client";
import type {
  Dose,
  Membership,
  WeekChange,
  WeightUnit,
  Workout,
  WorkoutKind,
} from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import type { OccurrenceStatus, WorkoutLookup } from "@sendtally/features/training";
import { durationLabel } from "@sendtally/features/sessions";
import { humanDuration, loadLabel, type HangModel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { bodySummary, workoutMinutes } from "@sendtally/features/workouts";
import { openMembership } from "./openMembership";

/** How a dated day went for a row: an occurrence's status, or moved in from another day. */
export type CellMark = OccurrenceStatus | "movedIn";

/** Part of a line under a row's name, gold when its week changes it from as written. */
export type GridPart = { text: string; changed?: boolean };

export type PlanGridRow = {
  key: string;
  kind: WorkoutKind;
  name: string;
  /** What it holds, a line each, read as its parts joined. */
  lines: readonly (readonly GridPart[])[];
  days: readonly number[];
  /** On a dated week, how each day it lands went, Monday first; null where it does not land. */
  marks?: readonly (CellMark | null)[];
  open: () => void;
  /** A dated day's cell, when it opens that day's sheet. */
  press?: (day: number) => (() => void) | undefined;
  /** Sets or clears a weekday; a day it gives nothing for reads its mark instead. */
  toggle?: (day: number) => (() => void) | undefined;
  /** Ringed in gold where a week's day is set apart from the first week. */
  rings?: readonly boolean[];
};

/** What a grid shows of its rows beyond the workouts: a week's numbers, a dated week, days to tap. */
export type GridOptions = {
  /** What back says on the screen a row opens: the screen the grid is on. */
  back?: string;
  /** A block week past the first, its changes read in gold. */
  week?: { n: number; changes: readonly WeekChange[]; unit: WeightUnit };
  marks?: (m: Membership) => readonly (CellMark | null)[];
  press?: (m: Membership, day: number) => (() => void) | undefined;
  toggle?: (m: Membership, day: number) => (() => void) | undefined;
  rings?: (m: Membership) => readonly boolean[];
};

/** How grips read: their names, and the grip a one-grip workout was set to. */
export type GripNames = Pick<HangModel, "gripName" | "defaultGrip" | "workout">;

/** Fingers: its grip and edge, or how many grips. Else what it holds and how long it takes. */
export function workoutLines(w: Workout, grips: GripNames): string[] {
  if (w.kind === "hangboard") {
    const used = [...new Set(w.items.map((i) => i.exercise))];
    const [grip] = used;
    if (grip === undefined) return [kindLabel(w.kind)];
    if (used.length > 1) return [t("hang.gripCount", { count: used.length })];
    const edges = new Set(w.items.flatMap((i) => i.doses.map((d) => d.edgeMm ?? 0)));
    const [edge] = edges;
    const one = edges.size === 1 && edge ? [t("hang.edgeMm", { n: edge })] : [];
    const hang = grips.workout(w.id);
    return [grips.gripName(hang === undefined ? grip : grips.defaultGrip(hang)), ...one];
  }
  const minutes = workoutMinutes(w);
  const lines = [bodySummary(w), minutes === null ? null : durationLabel(minutes)];
  const kept = [...new Set(lines.filter((l) => l !== null))];
  return kept.length === 0 ? [kindLabel(w.kind)] : kept;
}

/**
 * A row's lines in one block week: a one-dose hang's edge and load, else how many of its
 * exercises the week changes, gold where they differ from as written.
 */
export function weekLines(
  w: Workout,
  changes: readonly Partial<Dose>[],
  grips: GripNames,
  unit: WeightUnit
): GridPart[][] {
  const [first = "", second] = workoutLines(w, grips);
  // Edge and load read for one hang with one dose; anything more counts its changes instead.
  const [only] = w.items;
  const dose = w.items.length === 1 && only?.doses.length === 1 ? only.doses[0] : undefined;
  if (w.kind === "hangboard" && dose !== undefined) {
    const c = changes[0] ?? {};
    const edge = c.edgeMm ?? dose.edgeMm;
    const parts: GridPart[] = [
      ...(edge ? [{ text: t("hang.edgeMm", { n: edge }), changed: c.edgeMm !== undefined }] : []),
      {
        text: loadLabel("hang", c.weightKg ?? dose.weightKg ?? 0, unit),
        changed: c.weightKg !== undefined,
      },
      ...(c.sets === undefined
        ? []
        : [{ text: t("activities.setCount", { count: c.sets }), changed: true }]),
      ...(c.onS === undefined ? [] : [{ text: humanDuration(c.onS), changed: true }]),
    ];
    return [[{ text: first }], parts];
  }
  const count = changes.filter((c) => Object.keys(c).length > 0).length;
  const rest =
    count > 0
      ? [{ text: t("plan.changedCount", { count }), changed: true }]
      : second === undefined
        ? []
        : [{ text: second }];
  return [[{ text: first }], ...(rest.length > 0 ? [rest] : [])];
}

/** One row per membership for the week grid, with what its workout holds and where it opens. */
export function planGridRows(
  members: readonly Membership[],
  workout: WorkoutLookup,
  grips: GripNames,
  options: GridOptions = {}
): PlanGridRow[] {
  const { back, week, marks, toggle, press, rings } = options;
  return members.flatMap((m): PlanGridRow[] => {
    const w = workout(m.workoutId);
    if (w === undefined) return [];
    const changes = (n: number): Partial<Dose>[] =>
      w.items.map(
        (_, item) =>
          week?.changes.find(
            (c) => c.membershipId === m.id && c.week === n && c.dose === 0 && c.item === item
          )?.change ?? {}
      );
    return [
      {
        key: m.id,
        kind: w.kind,
        name: w.name,
        lines:
          week === undefined
            ? workoutLines(w, grips).map((text) => [{ text }])
            : weekLines(w, changes(week.n), grips, week.unit),
        days: m.weekdays,
        ...(marks !== undefined && { marks: marks(m) }),
        open: () => openMembership(m, back),
        ...(toggle !== undefined && { toggle: (day: number) => toggle(m, day) }),
        ...(rings !== undefined && { rings: rings(m) }),
        ...(press !== undefined && { press: (day: number) => press(m, day) }),
      },
    ];
  });
}

/** The memberships still to come: weekly ones and block plans, and one-offs from today. */
export const liveMembers = (plan: Plan, today: string): Membership[] =>
  plan.memberships.filter((m) => m.weekdays.length > 0 || m.blockId !== null || m.start >= today);
