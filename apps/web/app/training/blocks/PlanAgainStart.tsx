import React from "react";
import type { Block, CalendarDate } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { blockMembers, hasDays, scheduleOf, useTrainingLog } from "@sendtally/features/training";
import { useAppApi } from "../../lib/useAppApi";
import { useHangData } from "../data/HangDataContext";
import { StartPicker } from "./StartPicker";

export type PlanAgainStartProps = {
  block: Block;
  start: CalendarDate;
  onPick: (date: CalendarDate) => void;
};

/** The day a block's copy starts, its weeks running from that weekday, and which of its workouts have no days yet. */
export function PlanAgainStart({ block, start, onPick }: PlanAgainStartProps): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useAppApi());
  const dayless =
    block.start === null
      ? blockMembers(log.plan, block)
          .filter((m) => !hasDays(scheduleOf(log.plan, m)))
          .flatMap((m) => log.workout(m.workoutId)?.name ?? [])
      : [];
  return (
    <div className="plan-again">
      <StartPicker block={block} start={start} today={today} onPick={onPick} />
      {dayless.length > 0 && (
        <p className="sheet-body">
          {t("plan.noDaysYet", { count: dayless.length, workouts: dayless.join(", ") })}
        </p>
      )}
    </div>
  );
}
