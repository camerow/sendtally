import React from "react";
import { Text, View } from "react-native";
import { addDays, blockEnd, isDated, type CalendarDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { daysList, shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  canMoveTo,
  moveOf,
  moveWeek,
  plannedOn,
  trainingDay,
  useTrainingLog,
  type Occurrence,
} from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { MonthCalendar } from "../components/MonthCalendar";
import { SheetHeader } from "../components/SheetHeader";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { usePlanActions } from "../plan/usePlanActions";
import { type } from "../type";

export type MoveSheetProps = { occurrence: Occurrence; name: string; onClose: () => void };

/** Moves one planned run to any day from today on, inside its block; the weeks after keep their days. */
export function MoveSheet({ occurrence: o, name, onClose }: MoveSheetProps): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const actions = usePlanActions();
  const week = moveWeek(o);
  const plansOn = (d: CalendarDate) => trainingDay(log, d, today).plans;
  const [to, setTo] = React.useState<CalendarDate | null>(
    week.find((d) => canMoveTo(o, d, today, plansOn)) ?? null
  );
  const dated = o.block !== null && isDated(o.block) ? o.block : null;
  const last = dated === null ? null : addDays(blockEnd(dated), -1);
  const first = dated !== null && dated.start > today ? dated.start : today;
  const weekly = daysList(o.membership.weekdays);
  return (
    <HangSheet visible onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 18, paddingBottom: 12 }}>
        <SheetHeader
          kicker={name}
          title={t("plan.moveTitle")}
          action={t("common.cancel")}
          onAction={onClose}
        />
        <MonthCalendar
          selected={to ?? plannedOn(o)}
          picked={to === null ? [] : [to]}
          min={first}
          {...(last !== null && { max: last })}
          today={today}
          shaded={() => false}
          onPick={(d) => {
            if (canMoveTo(o, d, today, plansOn)) setTo(d);
          }}
        />
        <Text style={[type.body, { fontSize: 13, lineHeight: 19, color: colors.textSecondary }]}>
          {o.week === null
            ? t("plan.moveCopy", { days: weekly })
            : t("plan.moveCopyBlock", { next: o.week + 1, days: weekly, n: o.week })}
        </Text>
        <Button
          label={to === null ? t("plan.move") : t("plan.moveTo", { day: shortDate(to) })}
          disabled={to === null}
          onPress={() => {
            if (to === null) return;
            void actions.savePlanChange(moveOf(o, to));
            onClose();
          }}
          variant="primary"
          height={54}
        />
      </View>
    </HangSheet>
  );
}
