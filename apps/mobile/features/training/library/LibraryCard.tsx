import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { durationLabel } from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import {
  bodySummary,
  categoryLabel,
  workoutMinutes,
  type LibraryWorkout,
  type WorkoutUse,
} from "@sendtally/features/workouts";
import { pressRow } from "../../../lib/press";
import { IntervalsBar } from "../components/IntervalsBar";
import { Label } from "../components/Label";
import { PhaseBar } from "../components/PhaseBar";
import { Title } from "../components/Title";
import { KIND_LOOK } from "../today/kindLook";
import { type } from "../type";
import { CategoryMark } from "./CategoryMark";
import { MineBadge } from "./MineBadge";

export type LibraryCardProps = {
  workout: LibraryWorkout;
  use: WorkoutUse | undefined;
  onPress: () => void;
};

/** A workout in the library: its category, name, length, what it holds, and how much it ran. */
export function LibraryCard({ workout, use, onPress }: LibraryCardProps): React.ReactElement {
  const minutes = workoutMinutes(workout);
  const summary = bodySummary(workout);
  const body = workout.body;
  const foot = [
    ...workout.tags,
    use === undefined || use.count === 0
      ? t("workouts.notUsed")
      : t("workouts.usedTimes", { count: use.count }),
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <CategoryMark category={workout.category} size={28} />
        <Label color={KIND_LOOK[workout.category].ink} style={{ flex: 1 }}>
          {categoryLabel(workout.category)}
        </Label>
        {workout.source === "mine" && <MineBadge />}
        {minutes !== null && <Label color={colors.textSecondary}>{durationLabel(minutes)}</Label>}
      </View>
      <Title size={22}>{workout.name}</Title>
      {summary !== null && (
        <Text style={[type.body, { fontSize: 14, lineHeight: 20, color: colors.textSecondary }]}>
          {summary}
        </Text>
      )}
      {body?.kind === "hang" && (
        <View style={{ flexDirection: "row" }}>
          <PhaseBar protocol={body.workout} height={12} />
        </View>
      )}
      {body?.kind === "intervals" && (
        <View style={{ flexDirection: "row" }}>
          <IntervalsBar intervals={body} height={12} />
        </View>
      )}
      <Text numberOfLines={1} style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
        {foot}
      </Text>
    </Pressable>
  );
}
