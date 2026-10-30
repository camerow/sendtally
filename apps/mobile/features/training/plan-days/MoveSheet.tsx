import React from "react";
import { Pressable, Text, View } from "react-native";
import { weekday, type CalendarDate } from "@sendtally/core/hang";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { daysList, weekdayLetters, weekdayShort } from "@sendtally/features/hang";
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
import { press } from "../../../lib/press";
import { Button } from "../components/Button";
import { SheetHeader } from "../components/SheetHeader";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { usePlanActions } from "../plan/usePlanActions";
import { type } from "../type";

export type MoveSheetProps = { occurrence: Occurrence; name: string; onClose: () => void };

/** Moves one planned run to another day of its week; the weeks after keep their days. */
export function MoveSheet({ occurrence: o, name, onClose }: MoveSheetProps): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const actions = usePlanActions();
  const days = moveWeek(o);
  const plansOn = (d: CalendarDate) => trainingDay(log, d, today).plans;
  const open = days.filter((d) => canMoveTo(o, d, today, plansOn));
  const [to, setTo] = React.useState<CalendarDate | null>(open[0] ?? null);
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
        <View style={{ flexDirection: "row", gap: 6 }}>
          {days.map((d) => {
            const from = d === plannedOn(o);
            const enabled = open.includes(d);
            const picked = d === to;
            return (
              <Pressable
                key={d}
                disabled={!enabled}
                onPress={() => setTo(d)}
                accessibilityRole="radio"
                accessibilityState={{ selected: picked, disabled: !enabled }}
                accessibilityLabel={weekdayShort(weekday(d))}
                style={press({
                  flex: 1,
                  height: 58,
                  gap: 2,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: radius.control,
                  borderWidth: picked ? 2 : 1,
                  borderColor: picked ? colors.gunmetal : colors.lineOnLight,
                  backgroundColor: picked ? colors.surfaceSoft : colors.white,
                  opacity: enabled || from ? 1 : 0.35,
                })}
              >
                <Text
                  style={{
                    fontFamily: fonts.monoMedium,
                    fontSize: 10,
                    color: colors.textSecondary,
                  }}
                >
                  {weekdayLetters()[weekday(d)]}
                </Text>
                <Text
                  style={[
                    type.monoBold,
                    {
                      fontSize: 15,
                      color: colors.gunmetal,
                      textDecorationLine: from ? "line-through" : "none",
                    },
                  ]}
                >
                  {String(Number(d.slice(8)))}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[type.body, { fontSize: 13, lineHeight: 19, color: colors.textSecondary }]}>
          {o.week === null
            ? t("plan.moveCopy", { days: weekly })
            : t("plan.moveCopyBlock", { next: o.week + 1, days: weekly, n: o.week })}
        </Text>
        <Button
          label={
            to === null ? t("plan.move") : t("plan.moveTo", { day: weekdayShort(weekday(to)) })
          }
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
