import type { Activity } from "@sendtally/api-client";
import {
  clock,
  toUnit,
  type Dose,
  type Item,
  type ItemDone,
  type SessionItem,
  type SetDone,
  type WeightUnit,
} from "@sendtally/core/hang";
import { formatNumber, t } from "../i18n";
import { countText } from "../hang/format";
import { checklistTitle } from "../workouts/checklist";
import { climbingSetText } from "./climbing";

/** A set's time: "45s", or "20:00" past a minute. */
export const setSeconds = (seconds: number): string =>
  seconds > 60 ? clock(seconds, true) : t("hang.seconds", { n: seconds });

const MAX_SUGGESTIONS = 5;

/** A weight in the user's unit, an assisted one with a true minus: "−20". */
export const weightValue = (kg: number, unit: WeightUnit): string =>
  formatNumber(toUnit(kg, unit)).replace("-", "−");

/** "Checklist · 4 of 5" over every checklist the run held, or null when it held none. */
export function checklistsLine(done: readonly ItemDone[]): string | null {
  const lists = done.flatMap((d) => (d.checklist === undefined ? [] : [d.checklist]));
  if (lists.length === 0) return null;
  const ticked = lists.reduce((n, c) => n + c.checked.length, 0);
  return checklistTitle(
    ticked,
    lists.reduce((n, c) => n + c.lines.length, 0)
  );
}

/** "Checklist · 4 of 5 · 3 exercises · 9 sets", or null when nothing was done. */
export function doneSummary(done: readonly ItemDone[]): string | null {
  const items = done.filter((d) => d.sets.length > 0);
  const sets = items.reduce((n, d) => n + d.sets.length, 0);
  const counts =
    items.length === 0
      ? []
      : [
          t("activities.exerciseCount", { count: items.length }),
          t("activities.setCount", { count: sets }),
        ];
  const list = checklistsLine(done);
  const parts = [...(list === null ? [] : [list]), ...counts];
  return parts.length === 0 ? null : parts.join(" · ");
}

/** "5 × 100 kg · 30s", leaving out what the set does not have; a climbing set reads its climbs. */
export function setText(set: SetDone, unit: WeightUnit, repsMax?: number): string {
  if (set.climbs !== undefined) return climbingSetText(set);
  const load =
    set.weightKg === undefined
      ? undefined
      : t("hang.loadPlain", { value: weightValue(set.weightKg, unit), unit });
  const work = [set.reps === undefined ? undefined : countText(set.reps, repsMax), load]
    .filter((p) => p !== undefined)
    .join(" × ");
  return [work, set.onS === undefined ? "" : setSeconds(set.onS)]
    .filter((p) => p !== "")
    .join(" · ");
}

/** A finished exercise on one line, its sets with the top set's reps or time and load: "5 × 5 · 60 kg". */
export function foldedLine(sets: readonly SetDone[], unit: WeightUnit): string {
  const top = sets.reduce<SetDone | undefined>(
    (best, s) => (best === undefined || (s.weightKg ?? 0) > (best.weightKg ?? 0) ? s : best),
    undefined
  );
  const work = top?.reps ?? (top?.onS === undefined ? undefined : setSeconds(top.onS));
  const load =
    top?.weightKg === undefined
      ? undefined
      : t("hang.loadPlain", { value: weightValue(top.weightKg, unit), unit });
  return [
    work === undefined
      ? t("activities.setCount", { count: sets.length })
      : `${formatNumber(sets.length)} × ${typeof work === "number" ? formatNumber(work) : work}`,
    load,
  ]
    .filter((p) => p !== undefined)
    .join(" · ");
}

/** A set as a chip under its exercise, whose unit the card states once: "5 × 180", "8", "60s". */
export function setChip(set: SetDone, unit: WeightUnit, repsMax?: number): string {
  if (set.climbs !== undefined) return climbingSetText(set);
  const weight = set.weightKg ? weightValue(set.weightKg, unit) : undefined;
  const work = [set.reps === undefined ? undefined : countText(set.reps, repsMax), weight]
    .filter((p) => p !== undefined)
    .join(" × ");
  return [work, set.onS === undefined ? "" : setSeconds(set.onS)]
    .filter((p) => p !== "")
    .join(" · ");
}

/** One set of one item, as the review ticks it off: "0:2". */
export const setKeyOf = (item: number, set: number): string => `${item}:${set}`;

/**
 * What saves: the sets left ticked. An item with every set off goes; one that had none stays. A
 * checklist saves with a line ticked.
 */
export const keptSets = (done: readonly ItemDone[], off: readonly string[]): ItemDone[] =>
  done
    .map((d) => ({ ...d, sets: d.sets.filter((_, set) => !off.includes(setKeyOf(d.item, set))) }))
    .filter((d, i) =>
      d.checklist !== undefined
        ? d.checklist.checked.length > 0
        : d.sets.length > 0 || done[i]?.sets.length === 0
    );

/** A checklist's line ticked or unticked in the review. */
export const withLineToggled = (
  done: readonly ItemDone[],
  item: number,
  line: number
): ItemDone[] =>
  done.map((d) => {
    if (d.item !== item || d.checklist === undefined) return d;
    const { checked } = d.checklist;
    const next = checked.includes(line)
      ? checked.filter((n) => n !== line)
      : [...checked, line].sort((a, b) => a - b);
    return { ...d, checklist: { ...d.checklist, checked: next } };
  });

/** What an exercise's sets are: sets of reps, a hangboard's hangs, or a circuit's laps of moves. */
export type SetsOf = "sets" | "hangs" | "laps";

/** An exercise's count in the review: its sets or laps, or "Not started" when none is ticked. */
export const exerciseCountText = (
  d: Pick<ItemDone, "item" | "sets">,
  off: readonly string[],
  of: SetsOf
): string =>
  d.sets.every((_, s) => off.includes(setKeyOf(d.item, s)))
    ? t("activities.notStarted")
    : setsCountText(d.sets.length, of);

/** "2 sets", or "2 laps" for a circuit. */
export const setsCountText = (count: number, of: SetsOf = "sets"): string =>
  of === "laps" ? t("tally.lapCount", { count }) : t("activities.setCount", { count });

const SHORT = {
  sets: "activities.shortReps",
  hangs: "activities.shortHangs",
  laps: "activities.shortMoves",
} as const;

/** How far a set fell short of its dose, "4 of 6 hangs", "6 of 8 reps", "8 of 40 moves" or "0:30 of 0:45"; null when it did not. */
export function shortOf(
  set: SetDone,
  dose: SetDone | undefined,
  of: SetsOf = "sets"
): string | null {
  if (dose?.reps !== undefined && set.reps !== undefined && set.reps < dose.reps)
    return t(SHORT[of], { done: formatNumber(set.reps), of: formatNumber(dose.reps) });
  if (dose?.onS !== undefined && set.onS !== undefined && set.onS < dose.onS)
    return t("activities.partOf", { done: clock(set.onS, true), of: clock(dose.onS, true) });
  return null;
}

const withSets = (
  done: readonly ItemDone[],
  item: number,
  edit: (sets: SetDone[]) => SetDone[]
): ItemDone[] => done.map((d) => (d.item === item ? { ...d, sets: edit(d.sets) } : d));

export const changeSet = (
  done: readonly ItemDone[],
  item: number,
  set: number,
  value: SetDone
): ItemDone[] => withSets(done, item, (sets) => sets.map((s, i) => (i === set ? value : s)));

/** A set rated 1 to 10; zero clears its rating. */
export function withRpe(set: SetDone, rpe: number): SetDone {
  const { rpe: _, ...rest } = set;
  return rpe < 1 ? rest : { ...rest, rpe: Math.min(10, Math.round(rpe)) };
}

/** Another set like the last one, not yet rated. */
export const addSet = (done: readonly ItemDone[], item: number): ItemDone[] =>
  withSets(done, item, (sets) => {
    const { rpe: _, ...last } = sets[sets.length - 1] ?? {};
    return [...sets, last];
  });

/** Removing an item's last set removes the item. */
export function removeSet(done: readonly ItemDone[], item: number, set: number): ItemDone[] {
  return withSets(done, item, (sets) => sets.filter((_, i) => i !== set)).filter(
    (d) => d.item !== item || d.sets.length > 0
  );
}

/** What saves: named items only, trimmed. */
export function cleanDone(done: readonly ItemDone[]): ItemDone[] {
  return done.map((d) => ({ ...d, exercise: d.exercise.trim() })).filter((d) => d.exercise !== "");
}

/** Every exercise name the user logged, newest first, each once. */
export function exerciseNames(activities: readonly Pick<Activity, "done">[]): string[] {
  const seen = new Map<string, string>();
  for (const a of activities) {
    for (const d of a.done) {
      if (d.checklist !== undefined) continue;
      const key = d.exercise.toLowerCase();
      if (!seen.has(key)) seen.set(key, d.exercise);
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

/** The sets of an exercise from the newest activity that ran the workout and did it; empty when none did. */
export function previousSets(
  activities: readonly Pick<Activity, "workoutId" | "done">[],
  workoutId: string,
  exercise: string
): SetDone[] {
  for (const a of activities) {
    if (a.workoutId !== workoutId) continue;
    const sets = a.done.find((d) => d.exercise === exercise && d.sets.length > 0)?.sets;
    if (sets !== undefined) return sets;
  }
  return [];
}

/** The sets still off once one of an item's sets is removed: those after it move up one. */
export function offWithout(off: readonly string[], item: number, set: number): string[] {
  return off.flatMap((key) => {
    const [i, s] = key.split(":").map(Number);
    if (i !== item || s === undefined || s < set) return [key];
    return s === set ? [] : [setKeyOf(item, s - 1)];
  });
}

/**
 * What each logged exercise was asked, by its place in `done`: the workout's item at that place
 * when it is the same exercise, else the first that is, since a run logs in the order its
 * exercises ended and leaves a fingerboard part out; by place alone when none is (a hangboard
 * review names its sets by grip).
 */
export function plannedDoses(
  planned: readonly SessionItem[],
  done: readonly Pick<ItemDone, "item" | "exercise">[]
): (Dose | undefined)[] {
  const doses: (Dose | undefined)[] = [];
  for (const d of done) {
    const same = planned[d.item]?.exercise === d.exercise ? planned[d.item] : undefined;
    doses[d.item] = (same ?? planned.find((p) => p.exercise === d.exercise) ?? planned[d.item])
      ?.dose;
  }
  return doses;
}

/**
 * What was done as a workout to run again: a checklist whole, and each exercise's first set as
 * many times as it was done.
 */
export const workoutItemsOfDone = (done: readonly ItemDone[]): Item[] =>
  done.flatMap((d): Item[] => {
    if (d.checklist !== undefined)
      return [
        { exercise: d.exercise, doses: [{ sets: 1 }], checklist: { lines: d.checklist.lines } },
      ];
    const [first] = d.sets;
    return first === undefined
      ? []
      : [{ exercise: d.exercise, doses: [{ ...first, sets: d.sets.length }] }];
  });
