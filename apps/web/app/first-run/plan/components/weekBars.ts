import type { Plan } from "@sendtally/api-client";
import { itemIdOf, type Dose, type WeightUnit } from "@sendtally/core/hang";
import { hangLoadText, weightText } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { exerciseName, type LibraryWorkout } from "@sendtally/features/workouts";
import type { LoadBar } from "./types";

/** The block's main exercise week by week, as P5 draws it: its first weighted item's first dose. */
export function weekBars(
  workout: LibraryWorkout,
  membershipId: string,
  weeks: number,
  changes: Plan["weekChanges"],
  unit: WeightUnit,
  gripName: (id: string) => string
): { name: string; bars: LoadBar[] } | null {
  const index = Math.max(
    0,
    workout.items.findIndex((i) => (i.doses[0]?.weightKg ?? 0) > 0)
  );
  const item = workout.items[index];
  const written = item?.doses[0];
  if (item === undefined || written === undefined) return null;
  const itemId = itemIdOf(item, index);
  const doses = Array.from({ length: weeks }, (_, w): Dose => {
    const c = changes.find(
      (x) =>
        x.membershipId === membershipId && x.week === w + 1 && x.dose === 0 && x.itemId === itemId
    );
    return { ...written, ...c?.change };
  });
  const volume = (d: Dose): number =>
    d.sets * (d.reps ?? 1) * ((d.weightKg ?? 0) > 0 ? (d.weightKg ?? 0) : 10);
  const load = workout.kind === "hangboard" ? hangLoadText : weightText;
  const bars = doses.map((d, w) => ({
    label:
      (d.weightKg ?? 0) > 0
        ? load(d.weightKg ?? 0, unit)
        : t("statistics.repsValue", { count: d.reps ?? 0 }),
    value: volume(d),
    deload: w === weeks - 1 && w > 0 && volume(d) < volume(doses[w - 1] ?? d),
  }));
  return { name: exerciseName(item.exercise, gripName), bars };
}
