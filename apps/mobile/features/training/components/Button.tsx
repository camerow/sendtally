import React from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { press } from "../../../lib/press";
import { type } from "../type";
import { HangIcon, type HangIconName } from "./HangIcon";
import { ON_DARK, ON_DARK_LINE } from "./onDark";

export type ButtonVariant =
  "primary" | "gold" | "outline" | "dashed" | "danger" | "link" | "outlineDark";

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant: ButtonVariant;
  height?: number;
  icon?: HangIconName;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const LOOKS: Record<ButtonVariant, { box: ViewStyle; ink: string }> = {
  primary: { box: { backgroundColor: colors.gunmetal }, ink: colors.white },
  gold: { box: { backgroundColor: colors.gold }, ink: colors.gunmetal },
  outline: { box: { borderWidth: 1, borderColor: colors.lineOnLightStrong }, ink: colors.gunmetal },
  dashed: {
    box: { borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.gunmetal },
    ink: colors.gunmetal,
  },
  danger: { box: {}, ink: colors.watermelonInk },
  link: { box: {}, ink: colors.azureInk },
  outlineDark: { box: { borderWidth: 1, borderColor: ON_DARK_LINE }, ink: ON_DARK },
};

export function Button({
  label,
  onPress,
  variant,
  height = 48,
  icon,
  disabled,
  accessibilityLabel,
  style,
}: ButtonProps): React.ReactElement {
  const { box, ink } = LOOKS[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={press([
        {
          height,
          borderRadius: height >= 52 ? 14 : height > 40 ? 12 : 10,
          paddingHorizontal: height > 40 ? 16 : 13,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.35 : 1,
        },
        box,
        style,
      ])}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {icon !== undefined && <HangIcon name={icon} color={ink} size={18} strokeWidth={2.4} />}
        <Text
          style={[
            type.bodyBold,
            { fontSize: height >= 54 ? 16 : height > 40 ? 15 : 14, color: ink },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
