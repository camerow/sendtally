import {
  addDays,
  changeFrom,
  fromUnit,
  loadStep,
  toUnit,
  weekday,
  type CalendarDate,
  type Dose,
  type Weekday,
  type WeightUnit,
} from "@sendtally/core/hang";

/** P4's two shortcuts: more each week, and an easier last week. */
export type Shortcuts = { stepUp: boolean; deload: boolean };

export type Shortcut = "step_up" | "deload" | "both" | "none";

export const shortcutOf = ({ stepUp, deload }: Shortcuts): Shortcut =>
  stepUp && deload ? "both" : stepUp ? "step_up" : deload ? "deload" : "none";

/** What one press adds each week: a step of weight in the user's unit, else a rep. */
export const weeklyStepKg = (unit: WeightUnit): number => fromUnit(loadStep("pull", unit), unit);

const DELOAD = 0.8;

/**
 * Each week's change to a dose as the shortcuts fill it: from week 2 a step of weight (or a
 * rep, with no weight) more each week, and a last week with a set fewer at 80% of the weight
 * (or two reps fewer). An empty change is the week as written.
 */
export function shortcutChanges(
  written: Dose,
  weeks: number,
  { stepUp, deload }: Shortcuts,
  unit: WeightUnit
): Partial<Dose>[] {
  const kg = written.weightKg ?? 0;
  const reps = written.reps ?? 0;
  const step = loadStep("pull", unit);
  return Array.from({ length: weeks }, (_, i) => {
    const last = deload && weeks > 1 && i === weeks - 1;
    if (last) {
      const easier: Dose = { ...written, sets: Math.max(1, written.sets - 1) };
      if (kg > 0)
        easier.weightKg = fromUnit(Math.round(toUnit(kg * DELOAD, unit) / step) * step, unit);
      else if (reps > 0) easier.reps = Math.max(1, reps - 2);
      return changeFrom(written, easier);
    }
    if (!stepUp || i === 0) return {};
    if (kg > 0) return changeFrom(written, { ...written, weightKg: kg + weeklyStepKg(unit) * i });
    return reps > 0 ? changeFrom(written, { ...written, reps: reps + i }) : {};
  });
}

/** The Monday a block starts on: today when it is one, else the next. */
export const nextMonday = (today: CalendarDate): CalendarDate =>
  addDays(today, (7 - weekday(today)) % 7);

/** Sessions a week, across every workout's days. */
export const sessionsPerWeek = (days: Readonly<Record<string, readonly Weekday[]>>): number =>
  Object.values(days).reduce((n, d) => n + d.length, 0);

/** The first weekday anything is planned on, or null when nothing is. */
export const firstWeekday = (
  days: Readonly<Record<string, readonly Weekday[]>>
): Weekday | null => {
  const all = Object.values(days).flat();
  return all.length === 0 ? null : (Math.min(...all) as Weekday);
};
