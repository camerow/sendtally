import React from "react";
import { weekday, type CalendarDate } from "@sendtally/core/hang";
import { dayMonth, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { blockOn, blockTag, trainingDay, useTrainingLog } from "@sendtally/features/training";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { useAppApi } from "../../lib/useAppApi";
import { useScheduledToast } from "../blocks/useScheduledToast";
import { useHangData } from "../data/HangDataContext";
import { AddWorkoutsSheet } from "../plan-week/AddWorkoutsSheet";
import { DaySection } from "../plan-week/DaySection";
import { CALENDAR_PATH } from "./paths";

/** One day of the plan: what was logged on it, each workout planned and how it went, and Schedule for it. */
export function PlanDayPage({ date }: { date: CalendarDate }): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useAppApi());
  const day = trainingDay(log, date, today);
  const block = blockOn(log.plan.blocks, date);
  const [adding, setAdding] = React.useState(false);
  const scheduled = useScheduledToast();
  return (
    <DetailFrame
      backTo={CALENDAR_PATH}
      footer={
        <button type="button" className="detail-primary" onClick={() => setAdding(true)}>
          {t("plan.schedule")}
        </button>
      }
    >
      <div className="schedule-head">
        {block !== null && <span className="plan-label">{blockTag(block.name, block, date)}</span>}
        <h1 className="schedule-title">{weekdayLong(weekday(date))}</h1>
        <span className="plan-row-meta">{dayMonth(date)}</span>
      </div>
      <DaySection day={day} heading={false} />
      {adding && (
        <AddWorkoutsSheet
          flow={{ date, blockId: block?.id ?? null }}
          onClose={() => setAdding(false)}
          onScheduled={scheduled}
        />
      )}
    </DetailFrame>
  );
}
