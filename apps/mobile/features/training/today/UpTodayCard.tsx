import React from "react";
import { Pressable, Text, View } from "react-native";
import { totalSeconds, type Schedule } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { humanDuration, loadLabel, protocolSummary } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { type } from "../type";
import { DayMark } from "./DayMark";
import { KIND_LOOK, kindName } from "./kindLook";
import { usePlanTag } from "./usePlanTag";

export type UpTodayCardProps = { schedule: Schedule; onEdit: () => void; onStart: () => void };

/** A hangboard workout due today: the card opens the plan, Start runs the timer. */
export function UpTodayCard({
  schedule,
  onEdit,
  onStart,
}: UpTodayCardProps): React.ReactElement | null {
  const planTag = usePlanTag();
  const { model, today } = useHangData();
  const w = model.workout(schedule.workoutId);
  if (w === undefined) return null;
  const grip = model.gripName(schedule.gripId);
  const load = loadLabel(w.kind, model.load(w, schedule.gripId), model.settings.units);
  return (
    <View
      style={{
        gap: 12,
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        backgroundColor: colors.white,
      }}
    >
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={t("hang.editPlanAria", { workout: w.name, grip, load })}
        style={({ pressed }) => ({ gap: 12, opacity: pressed ? 0.7 : 1 })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <DayMark kind="hang" filled />
          <Label color={KIND_LOOK.hang.ink} style={{ flex: 1 }}>
            {t("hang.upToday", { kind: planTag(kindName("hang"), schedule, today) })}
          </Label>
          <Label color={colors.textSecondary}>{humanDuration(totalSeconds(w))}</Label>
        </View>
        <View style={{ gap: 4 }}>
          <Title size={28}>{w.name}</Title>
          <Text style={[type.body, { fontSize: 14, lineHeight: 20, color: colors.textSecondary }]}>
            {protocolSummary(w, w.timeUnits)}
          </Text>
        </View>
        <Label
          color={colors.gunmetal}
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: colors.surfaceSoft,
          }}
        >
          {`${grip} · ${load}`}
        </Label>
      </Pressable>
      <Button label={t("hang.start")} onPress={onStart} variant="primary" height={50} icon="play" />
    </View>
  );
}
