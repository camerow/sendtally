import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import {
  categoryLabel,
  workoutMinutes,
  type LibraryWorkout,
  type WorkoutUse,
} from "@sendtally/features/workouts";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { CategoryMark } from "../library/CategoryMark";
import { MineBadge } from "../library/MineBadge";
import { KIND_LOOK } from "../today/kindLook";
import { type } from "../type";

export type LibraryIntroProps = { workout: LibraryWorkout; use: WorkoutUse | undefined };

/** A workout's category, name, what it is for, and its length, effort and use. */
export function LibraryIntro({ workout, use }: LibraryIntroProps): React.ReactElement {
  const minutes = workoutMinutes(workout);
  const meta = [
    ...(minutes === null ? [] : [durationLabel(minutes)]),
    ...(workout.targetRpe === null ? [] : [t("plan.targetValue", { n: workout.targetRpe })]),
    use === undefined || use.count === 0
      ? t("workouts.notUsed")
      : t("workouts.usedTimes", { count: use.count }),
  ].join(" · ");
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <CategoryMark category={workout.category} size={28} />
        <Label color={KIND_LOOK[workout.category].ink} style={{ flex: 1 }}>
          {categoryLabel(workout.category)}
        </Label>
        {workout.source === "mine" && <MineBadge />}
      </View>
      <Title size={38}>{workout.name}</Title>
      {workout.description !== null && (
        <Text style={[type.body, { fontSize: 15, lineHeight: 22, color: colors.textSecondary }]}>
          {workout.description}
        </Text>
      )}
      <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{meta}</Text>
      {workout.tags.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {workout.tags.map((tag) => (
            <Label
              key={tag}
              small
              color={colors.gunmetal}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                overflow: "hidden",
                backgroundColor: colors.surfaceSoft,
              }}
            >
              {tag}
            </Label>
          ))}
        </View>
      )}
    </View>
  );
}
