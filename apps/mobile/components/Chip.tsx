import React from "react";
import { Pressable, Text } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press } from "../lib/press";

export type ChipProps = {
  label: string;
  active: boolean;
  disabled?: boolean;
  dashed?: boolean;
  onPress: () => void;
};

export function Chip({
  label,
  active,
  disabled = false,
  dashed = false,
  onPress,
}: ChipProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      style={press({
        paddingHorizontal: 12,
        minHeight: 40,
        justifyContent: "center",
        borderRadius: radius.pill,
        backgroundColor: active ? colors.gold : "transparent",
        borderWidth: 1,
        borderStyle: dashed ? "dashed" : "solid",
        borderColor: active ? colors.gold : dashed ? "rgba(64,63,76,0.3)" : "rgba(64,63,76,0.18)",
        opacity: disabled ? 0.5 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 11,
          letterSpacing: 0.6,
          color: active ? colors.gunmetal : "rgba(64,63,76,0.65)",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
