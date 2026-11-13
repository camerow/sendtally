import React from "react";
import { blockLastDay, isDated, type CalendarDate } from "@sendtally/core/hang";
import { daysList, shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  canMoveTo,
  daysInWeek,
  moveOf,
  moveWeek,
  plannedOn,
  scheduleOf,
  trainingDay,
  useTrainingLog,
  type Occurrence,
} from "@sendtally/features/training";
import { Sheet } from "../../components/Sheet";
import { useAppApi } from "../../lib/useAppApi";
import { MonthCalendar } from "../components/MonthCalendar";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../data/usePlanActions";

export type MoveSheetProps = { occurrence: Occurrence; name: string; onClose: () => void };

/** Moves one planned run to any day from today on, inside its block; the weeks after keep their days. */
export function MoveSheet({ occurrence: o, name, onClose }: MoveSheetProps): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useAppApi());
  const actions = usePlanActions();
  const plansOn = (d: CalendarDate): ReturnType<typeof trainingDay>["plans"] =>
    trainingDay(log, d, today).plans;
  const [to, setTo] = React.useState<CalendarDate | null>(
    () => moveWeek(o).find((d) => canMoveTo(o, d, today, plansOn)) ?? null
  );
  const dated = o.block !== null && isDated(o.block) ? o.block : null;
  const first = dated !== null && dated.start > today ? dated.start : today;
  const nextDays = daysList(
    o.week === null
      ? o.membership.weekdays
      : daysInWeek(scheduleOf(log.plan, o.membership), o.week + 1)
  );
  const copy =
    o.week === null
      ? t("plan.moveCopy", { days: nextDays })
      : nextDays === "" || (dated !== null && o.week >= dated.weeks)
        ? t("plan.moveCopyBlockOnly", { n: o.week })
        : t("plan.moveCopyBlock", { next: o.week + 1, days: nextDays, n: o.week });
  return (
    <Sheet
      open
      kicker={name}
      title={t("plan.moveTitle")}
      onClose={onClose}
      action={{
        label: to === null ? t("plan.move") : t("plan.moveTo", { day: shortDate(to) }),
        disabled: to === null,
        onPress: () => {
          if (to === null) return;
          void actions.savePlanChange(moveOf(o, to));
          onClose();
        },
      }}
    >
      <MonthCalendar
        selected={to ?? plannedOn(o)}
        picked={to === null ? [] : [to]}
        min={first}
        max={dated === null ? undefined : blockLastDay(dated)}
        today={today}
        onPick={(d) => {
          if (canMoveTo(o, d, today, plansOn)) setTo(d);
        }}
      />
      <p className="sheet-copy">{copy}</p>
    </Sheet>
  );
}
