import React from "react";
import { Pressable, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Icon } from "../../../components/Icon";
import { pressRow } from "../../../lib/press";
import { type } from "../type";

/** A card's bottom row: a line of mono text that opens more, with a chevron. */
export function CardRow({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={pressRow({
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: colors.lineOnLight,
      })}
    >
      <Text style={[type.mono, { flex: 1, fontSize: 12.5, color: colors.gunmetal }]}>
        {children}
      </Text>
      <Icon name="chevron" color={colors.textSecondary} size={16} />
    </Pressable>
  );
}
