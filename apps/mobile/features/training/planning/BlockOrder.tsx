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

export type BlockOrderProps = {
  members: readonly Membership[];
  workout: WorkoutLookup;
  onMove: (membershipId: string, by: -1 | 1) => void;
};

/** The block's workouts in order, each moved up or down a place. */
export function BlockOrder({ members, workout, onMove }: BlockOrderProps): React.ReactElement {
  return (
    <View>
      <Label color={colors.gunmetal} style={{ paddingBottom: 6 }}>
        {t("plan.order")}
      </Label>
      {members.map((m, i) => {
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
            <Text style={[type.mono, { width: 14, fontSize: 12, color: colors.textSecondary }]}>
              {i + 1}
            </Text>
            {w !== undefined && <CategoryMark kind={w.kind} />}
            <Text
              numberOfLines={1}
              style={[type.bodyBold, { flex: 1, fontSize: 15, color: colors.gunmetal }]}
            >
              {name}
            </Text>
            <IconButton
              icon="up"
              label={t("workouts.moveUp", { name })}
              onPress={() => onMove(m.id, -1)}
              color={colors.textSecondary}
              size={36}
              iconSize={18}
              disabled={i === 0}
            />
            <IconButton
              icon="down"
              label={t("workouts.moveDown", { name })}
              onPress={() => onMove(m.id, 1)}
              color={colors.textSecondary}
              size={36}
              iconSize={18}
              disabled={i === members.length - 1}
            />
          </View>
        );
      })}
    </View>
  );
}
