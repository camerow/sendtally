import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { totalSeconds, type Workout } from "@sendtally/core/hang";
import { humanDuration, kindLabel, protocolSummary, setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { KindTag } from "../components/KindTag";
import { Label } from "../components/Label";
import { PhaseBar } from "../components/PhaseBar";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { type } from "../type";

export function WorkoutCard({
  workout,
  onPress,
}: {
  workout: Workout;
  onPress: () => void;
}): React.ReactElement {
  const { model } = useHangData();
  const grip = model.defaultGrip(workout);
  const logged = model.sessions.filter((s) => s.workoutId === workout.id).length;
  const tag = kindLabel(workout.kind);
  const used = model.lastUsed(workout, grip);
  const foot = [
    model.gripName(grip),
    ...(used === null ? [] : [setupLabel(workout.kind, used, model.settings.units)]),
    logged > 0 ? t("hang.loggedTimes", { n: logged }) : t("hang.newBadge"),
  ].join(" · ");
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={pressRow({
        borderRadius: 16,
        padding: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
      })}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <KindTag label={tag} />
        <Label color={colors.textSecondary}>{humanDuration(totalSeconds(workout))}</Label>
      </View>
      <Title size={22}>{workout.name}</Title>
      <Text style={[type.body, { fontSize: 14, lineHeight: 20, color: colors.textSecondary }]}>
        {protocolSummary(workout, workout.timeUnits)}
      </Text>
      <View style={{ flexDirection: "row" }}>
        <PhaseBar protocol={workout} height={12} />
      </View>
      <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{foot}</Text>
    </Pressable>
  );
}
