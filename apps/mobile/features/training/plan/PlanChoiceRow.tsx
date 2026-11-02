import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { WorkoutKind } from "@sendtally/core/hang";
import { Icon } from "../../../components/Icon";
import { pressRow } from "../../../lib/press";
import { CategoryMark } from "../library/CategoryMark";
import { type } from "../type";

export type PlanChoiceRowProps = {
  kind: WorkoutKind;
  title: string;
  hint?: string;
  count?: number;
  onPress: () => void;
};

export function PlanChoiceRow({
  kind,
  title,
  hint,
  count,
  onPress,
}: PlanChoiceRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={pressRow({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        minHeight: 56,
        paddingHorizontal: 14,
        borderRadius: 14,
      })}
    >
      <CategoryMark kind={kind} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{title}</Text>
        {hint !== undefined && (
          <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>{hint}</Text>
        )}
      </View>
      {count !== undefined && (
        <Text style={[type.mono, { fontSize: 13, color: colors.textSecondary }]}>{count}</Text>
      )}
      <Icon name="chevron" size={12} strokeWidth={2} color="rgba(64,63,76,0.35)" />
    </Pressable>
  );
}
