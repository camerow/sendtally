import type { PlanItem } from "@sendtally/api-client";
import type { Schedule } from "@sendtally/core/hang";
import { loadLabel, type HangModel } from "@sendtally/features/hang";
import type { DayItemKind } from "@sendtally/features/training";
import { planItemMeta, scheduleText } from "./planItemText";

export type PlanGridRow = {
  key: string;
  kind: DayItemKind;
  name: string;
  sub: string;
  days: readonly number[];
};

/** One row per live plan for the week grid: hangboard workouts first, then the rest. */
export function planGridRows(
  schedules: readonly Schedule[],
  items: readonly PlanItem[],
  model: HangModel
): PlanGridRow[] {
  const hangs = schedules.flatMap((s): PlanGridRow[] => {
    const w = model.workout(s.workoutId);
    if (w === undefined) return [];
    const load = loadLabel(w.kind, model.load(w, s.gripId), model.settings.units);
    return [
      {
        key: s.id,
        kind: "hang",
        name: w.name,
        sub: `${model.gripName(s.gripId)} · ${load}`,
        days: s.days,
      },
    ];
  });
  const rest = items.map((i): PlanGridRow => ({
    key: i.id,
    kind: i.kind,
    name: i.title,
    sub: i.perWeek === null ? planItemMeta(i) : scheduleText(i),
    days: i.days,
  }));
  return [...hangs, ...rest];
}
