import React from "react";
import { Pressable, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { MarkKind } from "@sendtally/features/training";
import { Icon } from "../../../components/Icon";
import { pressRow } from "../../../lib/press";
import { CategoryMark } from "../library/CategoryMark";
import { type } from "../type";

export type PlanChoiceRowProps = { kind: MarkKind; title: string; onPress: () => void };

export function PlanChoiceRow({ kind, title, onPress }: PlanChoiceRowProps): React.ReactElement {
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
      <CategoryMark category={kind} />
      <Text style={[type.bodyBold, { flex: 1, fontSize: 15, color: colors.gunmetal }]}>
        {title}
      </Text>
      <Icon name="chevron" size={12} strokeWidth={2} color="rgba(64,63,76,0.35)" />
    </Pressable>
  );
}
