import React from "react";
import { Text, View } from "react-native";
import type { Membership } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { WorkoutLookup } from "@sendtally/features/training";
import { IconButton } from "../components/IconButton";
import { Label } from "../components/Label";
import { CategoryMark } from "../library/CategoryMark";
import { type } from "../type";

export type OngoingWorkoutsProps = {
  members: readonly Membership[];
  workout: WorkoutLookup;
  onRemove: (membershipId: string) => void;
};

/** Ongoing's workouts in Edit mode, each with × to take it out on Save. */
export function OngoingWorkouts({
  members,
  workout,
  onRemove,
}: OngoingWorkoutsProps): React.ReactElement {
  return (
    <View>
      <Label color={colors.gunmetal} style={{ paddingBottom: 6 }}>
        {t("plan.tabWorkouts")}
      </Label>
      {members.map((m) => {
        const w = workout(m.workoutId);
        const name = w?.name ?? "";
        return (
          <View
            key={m.id}
            style={{
              minHeight: 52,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              borderTopWidth: 1,
              borderTopColor: colors.lineOnLightSoft,
            }}
          >
            {w !== undefined && <CategoryMark kind={w.kind} />}
            <Text
              numberOfLines={1}
              style={[type.bodyBold, { flex: 1, fontSize: 15, color: colors.gunmetal }]}
            >
              {name}
            </Text>
            <IconButton
              icon="x"
              label={t("plan.remove", { title: name })}
              onPress={() => onRemove(m.id)}
              color={colors.textSecondary}
              size={36}
              iconSize={18}
            />
          </View>
        );
      })}
    </View>
  );
}
