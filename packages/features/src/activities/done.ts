import type { Activity } from "@sendtally/api-client";
import { toUnit, type ItemDone, type SetDone, type WeightUnit } from "@sendtally/core/hang";
import { formatNumber, t } from "../i18n";

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

/** "5 × 100 kg · 30s", leaving out what the set does not have. */
export function setText(set: SetDone, unit: WeightUnit): string {
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
  const weight = set.weightKg ? weightValue(set.weightKg, unit) : undefined;
  const work = [set.reps === undefined ? undefined : formatNumber(set.reps), weight]
    .filter((p) => p !== undefined)
    .join(" × ");
  return [work, set.onS === undefined ? "" : t("hang.seconds", { n: set.onS })]
    .filter((p) => p !== "")
    .join(" · ");
}

/** An item's sets in one line: "2 × 60s" when they match, else each in turn. */
export function setsLine(sets: readonly SetDone[], unit: WeightUnit): string {
  const chips = sets.map((s) => setChip(s, unit)).filter((c) => c !== "");
  const [first = ""] = chips;
  if (chips.length !== sets.length || chips.some((c) => c !== first)) return chips.join(", ");
  return chips.length === 1 ? first : `${formatNumber(chips.length)} × ${first}`;
}

/** What was done only ticks off: nothing has reps or a weight. */
export const isChecklist = (done: readonly ItemDone[]): boolean =>
  done.every((d) => d.sets.every((s) => s.reps === undefined && s.weightKg === undefined));

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
