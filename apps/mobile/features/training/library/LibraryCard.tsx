import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { doseProtocol, intervalsOf, sessionItems } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { durationLabel } from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import {
  bodySummary,
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
import { MineBadge } from "./MineBadge";

export type LibraryCardProps = {
  workout: LibraryWorkout;
  use: WorkoutUse | undefined;
  onPress: () => void;
  /** Its category's name; off where the screen already names it. */
  showKind?: boolean;
  /** Set on a shelf, where cards sit side by side; otherwise it fills the column. */
  width?: number;
};

/** A workout in the library: its kind, name, length, what it holds, and how much it ran. */
export function LibraryCard({
  workout,
  use,
  onPress,
  showKind = true,
  width,
}: LibraryCardProps): React.ReactElement {
  const minutes = workoutMinutes(workout, use?.count ?? 0);
  const summary = bodySummary(workout);
  const items = sessionItems(workout.items, use?.count ?? 0);
  const [first] = items;
  const timed = items.length > 0 && items.every((i) => i.dose.onS !== undefined);
  const foot =
    use === undefined || use.count === 0
      ? t("workouts.notUsed")
      : t("workouts.usedTimes", { count: use.count });
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
        width,
      })}
    >
      {showKind && <Label color={KIND_LOOK[workout.kind].ink}>{kindLabel(workout.kind)}</Label>}
      <View style={{ gap: 6 }}>
        <Title size={22}>{workout.name}</Title>
        {(workout.source === "mine" || minutes !== null) && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {workout.source === "mine" && <MineBadge />}
            {minutes !== null && (
              <Label color={colors.textSecondary}>{durationLabel(minutes)}</Label>
            )}
          </View>
        )}
      </View>
      {summary !== null && (
        <Text style={[type.body, { fontSize: 14, lineHeight: 20, color: colors.textSecondary }]}>
          {summary}
        </Text>
      )}
      {workout.kind === "hangboard" && first !== undefined && (
        <View style={{ flexDirection: "row" }}>
          <PhaseBar protocol={doseProtocol(workout.name, first.dose)} height={12} />
        </View>
      )}
      {workout.kind !== "hangboard" && timed && (
        <View style={{ flexDirection: "row" }}>
          <IntervalsBar intervals={intervalsOf(items)} height={12} />
        </View>
      )}
      <Text
        numberOfLines={1}
        style={[type.mono, { marginTop: "auto", fontSize: 12, color: colors.textSecondary }]}
      >
        {foot}
      </Text>
    </Pressable>
  );
}
