import React from "react";
import { Pressable, Text, View } from "react-native";
import { totalSeconds, type CalendarDate, type Schedule } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { dayTitle, humanDuration, setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { IconButton } from "../components/IconButton";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { type } from "../type";
import { DayMark } from "./DayMark";
import { KIND_LOOK } from "./kindLook";
import { usePlanTag } from "./usePlanTag";

export type PlannedRowProps = {
  schedule: Schedule;
  date: CalendarDate;
  missed: boolean;
  onOpen: () => void;
  onSkip: () => void;
};

/** A workout planned for another day, or missed once that day has passed. × skips that date. */
export function PlannedRow({
  schedule,
  date,
  missed,
  onOpen,
  onSkip,
}: PlannedRowProps): React.ReactElement | null {
  const planTag = usePlanTag();
  const { model } = useHangData();
  const w = model.workout(schedule.workoutId);
  if (w === undefined) return null;
  const grip = model.gripName(schedule.gripId);
  const load = setupLabel(
    w.kind,
    model.setup(w, schedule.gripId, { schedule }),
    model.settings.units
  );
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingLeft: 14,
        paddingRight: 6,
        borderRadius: 14,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: "rgba(64,63,76,0.24)",
        overflow: "hidden",
      }}
    >
      <DayMark kind="hang" filled={false} />
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={t("hang.editPlanAria", { workout: w.name, grip, load })}
        style={pressRow({ flex: 1, gap: 3, paddingVertical: 10 })}
      >
        <Label small color={missed ? colors.watermelonInk : KIND_LOOK.hang.ink}>
          {missed ? t("hang.missed") : planTag(t("hang.planned"), schedule, date)}
        </Label>
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{w.name}</Text>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {[grip, load, humanDuration(totalSeconds(w))].join(" · ")}
        </Text>
      </Pressable>
      <IconButton
        icon="x"
        label={t("hang.skipDay", { workout: w.name, grip, date: dayTitle(date) })}
        onPress={onSkip}
        color={colors.textSecondary}
      />
    </View>
  );
}
