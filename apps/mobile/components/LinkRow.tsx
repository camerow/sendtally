import React from "react";
import { Pressable, Text } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "./Icon";

export type LinkRowProps = {
  label: string;
  onPress: () => void;
};

export function LinkRow({ label, onPress }: LinkRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.azureInk }}>
        {label}
      </Text>
      <Icon name="chevron" color={colors.azureInk} size={18} />
    </Pressable>
  );
}
