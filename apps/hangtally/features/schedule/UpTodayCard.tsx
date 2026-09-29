import React from "react";
import { Pressable, Text, View } from "react-native";
import { blockWeeks, totalSeconds, weekOfBlock, type Schedule } from "@sendtally/core/hang";
import { humanDuration, kindLabel, loadLabel, protocolSummary } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { Label } from "../../components/Label";
import { Title } from "../../components/Title";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";

export type UpTodayCardProps = { schedule: Schedule; onEdit: () => void; onStart: () => void };

/** Today's scheduled workout: the card opens Edit schedule, Start runs the timer. */
export function UpTodayCard({
  schedule,
  onEdit,
  onStart,
}: UpTodayCardProps): React.ReactElement | null {
  const c = useTheme();
  const { model, today } = useHangData();
  const w = model.workout(schedule.workoutId);
  if (w === undefined) return null;
  const weeks = blockWeeks(schedule);
  const kind = kindLabel(w.kind);
  const kicker =
    weeks === null
      ? kind
      : t("hang.blockWeek", { label: kind, at: weekOfBlock(schedule, today), of: weeks });
  const grip = model.gripName(schedule.gripId);
  const load = loadLabel(w.kind, model.load(w, schedule.gripId), model.settings.units);

  return (
    <View style={{ borderRadius: 20, backgroundColor: c.card }}>
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={t("hang.editPlanAria", { workout: w.name, grip, load })}
        style={({ pressed }) => ({
          gap: 14,
          paddingTop: 22,
          paddingHorizontal: 22,
          paddingBottom: 14,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Label color={c.ink2}>{t("hang.upToday", { kind: kicker })}</Label>
          <Label color={c.ink2}>{humanDuration(totalSeconds(w))}</Label>
        </View>
        <View style={{ gap: 4 }}>
          <Title size={30} color={c.ink}>
            {w.name}
          </Title>
          <Text style={[type.body, { fontSize: 14, color: c.ink2 }]}>
            {protocolSummary(w, w.timeUnits)}
          </Text>
        </View>
        <Label
          color={c.ink}
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: c.soft,
          }}
        >
          {`${grip} · ${load}`}
        </Label>
      </Pressable>
      <View style={{ paddingHorizontal: 22, paddingBottom: 22 }}>
        <Button label={t("hang.start")} onPress={onStart} variant="ink" height={50} icon="play" />
      </View>
    </View>
  );
}
