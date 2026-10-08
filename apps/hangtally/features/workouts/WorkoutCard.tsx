import React from "react";
import { Pressable, Text, View } from "react-native";
import { totalSeconds, type Workout } from "@sendtally/core/hang";
import { humanDuration, kindLabel, loadLabel, protocolSummary } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { KindTag } from "../../components/KindTag";
import { Label } from "../../components/Label";
import { PhaseBar } from "../../components/PhaseBar";
import { Title } from "../../components/Title";
import { press } from "../../lib/press";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";

export function WorkoutCard({
  workout,
  onPress,
}: {
  workout: Workout;
  onPress: () => void;
}): React.ReactElement {
  const c = useTheme();
  const { model } = useHangData();
  const grip = model.defaultGrip(workout);
  const logged = model.sessions.filter((s) => s.workoutId === workout.id).length;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={press({ borderRadius: 16, padding: 18, gap: 10, backgroundColor: c.card })}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <KindTag kind={workout.kind} label={kindLabel(workout.kind)} />
        <Label color={c.ink2}>{humanDuration(totalSeconds(workout))}</Label>
      </View>
      <Title size={24} color={c.ink}>
        {workout.name}
      </Title>
      <Text style={[type.body, { fontSize: 14, color: c.ink2 }]}>
        {protocolSummary(workout, workout.timeUnits)}
      </Text>
      <View style={{ flexDirection: "row" }}>
        <PhaseBar protocol={workout} height={8} />
      </View>
      <View style={{ flexDirection: "row", gap: 14 }}>
        <Label color={c.ink2}>{model.gripName(grip)}</Label>
        <Label color={c.ink2}>
          {loadLabel(workout.kind, model.load(workout, grip), model.settings.units)}
        </Label>
        <Label color={c.ink2}>
          {logged > 0 ? t("hang.loggedTimes", { n: logged }) : t("hang.newBadge")}
        </Label>
      </View>
    </Pressable>
  );
}
