import React from "react";
import { Pressable } from "react-native";
import { colors, disabledOpacity } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press } from "../lib/press";
import { Icon } from "./Icon";
import { Lock } from "./Lock";

/** The round + that adds something to a list: a workout to a day, a note to a history. Locked, it wears the lock instead. */
export function AddButton({
  label,
  onPress,
  disabled = false,
  locked = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  locked?: boolean;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={locked ? t("common.membersOnly", { label }) : label}
      accessibilityState={{ disabled }}
      hitSlop={6}
      style={press({
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 18,
        backgroundColor: locked ? colors.surfaceSoft : colors.gunmetal,
        opacity: disabled ? disabledOpacity : 1,
      })}
    >
      {locked ? <Lock /> : <Icon name="plus" color={colors.white} size={18} strokeWidth={2.5} />}
    </Pressable>
  );
}
