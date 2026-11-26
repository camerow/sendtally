import React from "react";
import { Pressable, Text } from "react-native";
import { colors, disabledOpacity, fonts, radius } from "@sendtally/design/tokens";
import { press, tap } from "../lib/press";
import { Icon, type IconName } from "./Icon";

export type ChipProps = {
  label: string;
  active: boolean;
  disabled?: boolean;
  dashed?: boolean;
  uppercase?: boolean;
  icon?: IconName;
  leading?: React.ReactNode;
  onPress: () => void;
};

export function Chip({
  label,
  active,
  disabled = false,
  dashed = false,
  uppercase = true,
  icon,
  leading,
  onPress,
}: ChipProps): React.ReactElement {
  const textColor = active ? colors.gunmetal : "rgba(64,63,76,0.65)";
  return (
    <Pressable
      onPress={tap(onPress)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      style={press({
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 12,
        minHeight: 40,
        justifyContent: "center",
        borderRadius: radius.pill,
        backgroundColor: active ? colors.gold : "transparent",
        borderWidth: 1,
        borderStyle: dashed ? "dashed" : "solid",
        borderColor: active ? colors.gold : dashed ? "rgba(64,63,76,0.3)" : "rgba(64,63,76,0.18)",
        opacity: disabled ? disabledOpacity : 1,
      })}
    >
      {leading}
      {icon !== undefined && <Icon name={icon} color={textColor} size={14} strokeWidth={2} />}
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 11,
          letterSpacing: 0.6,
          textTransform: uppercase ? "uppercase" : "none",
          color: textColor,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
