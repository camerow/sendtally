import type { Activity } from "@sendtally/api-client";
import { clock, toUnit, type ItemDone, type SetDone, type WeightUnit } from "@sendtally/core/hang";
import { formatNumber, t } from "../i18n";
import { climbingSetText } from "./climbing";

const MAX_SUGGESTIONS = 5;

/** A weight in the user's unit, an assisted one with a true minus: "−20". */
export const weightValue = (kg: number, unit: WeightUnit): string =>
  formatNumber(toUnit(kg, unit)).replace("-", "−");

/** "3 exercises · 9 sets", or null when nothing was done. */
export function doneSummary(done: readonly ItemDone[]): string | null {
  const items = done.filter((d) => d.sets.length > 0);
  if (items.length === 0) return null;
  const sets = items.reduce((n, d) => n + d.sets.length, 0);
  return [
    t("activities.exerciseCount", { count: items.length }),
    t("activities.setCount", { count: sets }),
  ].join(" · ");
}

/** "5 × 100 kg · 30s", leaving out what the set does not have; a climbing set reads its climbs. */
export function setText(set: SetDone, unit: WeightUnit): string {
  if (set.climbs !== undefined) return climbingSetText(set);
  const load =
    set.weightKg === undefined
      ? undefined
      : t("hang.loadPlain", { value: weightValue(set.weightKg, unit), unit });
  const work = [set.reps === undefined ? undefined : formatNumber(set.reps), load]
    .filter((p) => p !== undefined)
    .join(" × ");
  return [work, set.onS === undefined ? "" : t("hang.seconds", { n: set.onS })]
    .filter((p) => p !== "")
    .join(" · ");
}

/** A set as a chip under its exercise, whose unit the card states once: "5 × 180", "8", "60s". */
export function setChip(set: SetDone, unit: WeightUnit): string {
  if (set.climbs !== undefined) return climbingSetText(set);
  const weight = set.weightKg ? weightValue(set.weightKg, unit) : undefined;
  const work = [set.reps === undefined ? undefined : formatNumber(set.reps), weight]
    .filter((p) => p !== undefined)
    .join(" × ");
  return [work, set.onS === undefined ? "" : t("hang.seconds", { n: set.onS })]
    .filter((p) => p !== "")
    .join(" · ");
}

/** One set of one item, as the review ticks it off: "0:2". */
export const setKeyOf = (item: number, set: number): string => `${item}:${set}`;

/** What saves: the sets left ticked. An item with every set off goes; one that had none stays. */
export const keptSets = (done: readonly ItemDone[], off: readonly string[]): ItemDone[] =>
  done
    .map((d) => ({ ...d, sets: d.sets.filter((_, set) => !off.includes(setKeyOf(d.item, set))) }))
    .filter((d, i) => d.sets.length > 0 || done[i]?.sets.length === 0);

/** How far a set fell short of its dose, "4 of 6" or "0:30 of 0:45"; null when it did not. */
export function shortOf(set: SetDone, dose: SetDone | undefined): string | null {
  if (dose?.reps !== undefined && set.reps !== undefined && set.reps < dose.reps)
    return t("activities.partOf", { done: formatNumber(set.reps), of: formatNumber(dose.reps) });
  if (dose?.onS !== undefined && set.onS !== undefined && set.onS < dose.onS)
    return t("activities.partOf", { done: clock(set.onS, true), of: clock(dose.onS, true) });
  return null;
}

/** Every set reviewed: done in full, done in part, or off. */
export type SetCounts = { full: number; partial: number; off: number; total: number };

export function setCounts(
  done: readonly ItemDone[],
  off: readonly string[],
  planned: readonly (SetDone | undefined)[]
): SetCounts & { firstShort: number | null } {
  const states = done.flatMap((d) =>
    d.sets.map((s, set) =>
      off.includes(setKeyOf(d.item, set))
        ? "off"
        : shortOf(s, planned[d.item]) === null
          ? "full"
          : "partial"
    )
  );
  const count = (state: string): number => states.filter((s) => s === state).length;
  const short = states.findIndex((s) => s !== "full");
  return {
    full: count("full"),
    partial: count("partial"),
    off: count("off"),
    total: states.length,
    firstShort: short === -1 ? null : short,
  };
}

/** "From the timer: 3 sets full, 1 partial, 1 not done. Fix anything before saving." */
export function fromTimerNote(c: SetCounts): string {
  const parts = [
    c.full > 0 ? t("activities.setsFull", { count: c.full }) : "",
    c.partial > 0 ? t("activities.setsPartial", { count: c.partial }) : "",
    c.off > 0 ? t("activities.setsNotDone", { count: c.off }) : "",
  ];
  return t("activities.fromTimer", { summary: parts.filter((p) => p !== "").join(", ") });
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

/** Another set like the last one. */
export const addSet = (done: readonly ItemDone[], item: number): ItemDone[] =>
  withSets(done, item, (sets) => [...sets, { ...sets[sets.length - 1] }]);

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

/** How a run went, from its sets: complete, or where it first fell short. */
export const runStatus = (c: SetCounts & { firstShort: number | null }): string =>
  c.firstShort === null
    ? t("hang.sessionComplete")
    : t("activities.endedAtSet", { set: c.firstShort + 1, sets: c.total });

/** The sets still off once one of an item's sets is removed: those after it move up one. */
export function offWithout(off: readonly string[], item: number, set: number): string[] {
  return off.flatMap((key) => {
    const [i, s] = key.split(":").map(Number);
    if (i !== item || s === undefined || s < set) return [key];
    return s === set ? [] : [setKeyOf(item, s - 1)];
  });
}
