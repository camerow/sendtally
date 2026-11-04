import React from "react";
import { Pressable } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { press } from "../lib/press";
import { Icon } from "./Icon";

/** The round + that adds something to a list: a workout to a day, a note to a history. */
export function AddButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={6}
      style={press({
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 18,
        backgroundColor: colors.gunmetal,
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Icon name="plus" color={colors.white} size={18} strokeWidth={2.5} />
    </Pressable>
  );
}
