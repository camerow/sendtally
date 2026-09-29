import React from "react";
import {
  blockWeeks,
  totalSeconds,
  weekOfBlock,
  type CalendarDate,
  type Schedule,
} from "@sendtally/core/hang";
import { dayTitle, humanDuration, loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { PlanRow } from "../../components/PlanRow";
import { useTheme } from "../../theme/ThemeContext";
import { useHangData } from "../data/HangDataContext";

export type PendingRowProps = {
  schedule: Schedule;
  date: CalendarDate;
  missed: boolean;
  onOpen: () => void;
  onSkip: () => void;
};

/** A workout planned for another day: "Planned · week 1 of 4", or "Missed" once past. */
export function PendingRow({
  schedule,
  date,
  missed,
  onOpen,
  onSkip,
}: PendingRowProps): React.ReactElement | null {
  const c = useTheme();
  const { model } = useHangData();
  const w = model.workout(schedule.workoutId);
  if (w === undefined) return null;
  const grip = model.gripName(schedule.gripId);
  const weeks = blockWeeks(schedule);
  const planned = t("hang.planned");
  const tag = missed
    ? t("hang.missed")
    : weeks === null
      ? planned
      : t("hang.blockWeek", { label: planned, at: weekOfBlock(schedule, date), of: weeks });
  const load = loadLabel(w.kind, model.load(w, schedule.gripId), model.settings.units);
  return (
    <PlanRow
      tag={tag}
      tagColor={missed ? c.rest : c.accent}
      name={w.name}
      meta={[grip, load, humanDuration(totalSeconds(w))].join(" · ")}
      look={missed ? "missed" : "filled"}
      onOpen={onOpen}
      onRemove={onSkip}
      removeLabel={t("hang.skipDay", { workout: w.name, grip, date: dayTitle(date) })}
    />
  );
}
