import type { Activity } from "@sendtally/api-client";
import { toUnit, type ItemDone, type SetDone, type WeightUnit } from "@sendtally/core/hang";
import { formatNumber, t } from "../i18n";

const MAX_SUGGESTIONS = 5;

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
      : t("hang.loadPlain", { value: formatNumber(toUnit(set.weightKg, unit)), unit });
  const work = [set.reps === undefined ? undefined : formatNumber(set.reps), load]
    .filter((p) => p !== undefined)
    .join(" × ");
  return [work, set.onS === undefined ? "" : t("hang.seconds", { n: set.onS })]
    .filter((p) => p !== "")
    .join(" · ");
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
