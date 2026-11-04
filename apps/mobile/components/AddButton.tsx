import React from "react";
import { Pressable } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { press } from "../lib/press";
import { Icon } from "./Icon";

/** The round + that adds something to a list: a workout to a day, a note to a history. */
export function AddButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={press({
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 18,
        backgroundColor: colors.gunmetal,
      })}
    >
      <Icon name="plus" color={colors.white} size={18} strokeWidth={2.5} />
    </Pressable>
  );
}
