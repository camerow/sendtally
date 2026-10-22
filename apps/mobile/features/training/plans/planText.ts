import { planStatus, type CalendarDate, type Schedule } from "@sendtally/core/hang";
import {
  daysList,
  loadLabel,
  planRange,
  planStatusLabel,
  type HangModel,
} from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";

export type PlanText = {
  tag: string;
  started: boolean;
  name: string;
  meta: string;
  removeLabel: string;
};

/** What a Plans row says about one scheduled workout. */
export function planText(s: Schedule, model: HangModel, today: CalendarDate): PlanText | null {
  const w = model.workout(s.workoutId);
  if (w === undefined) return null;
  const grip = model.gripName(s.gripId);
  const load = loadLabel(w.kind, model.load(w, s.gripId), model.settings.units);
  return {
    tag: planStatusLabel(planStatus(s, today)),
    started: s.start <= today,
    name: w.name,
    meta: [grip, load, daysList(s.days), planRange(s)].join(" · "),
    removeLabel: t("hang.removePlan", { workout: w.name, grip }),
  };
}
