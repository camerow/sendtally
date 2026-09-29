import React from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { press } from "../lib/press";
import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/themes";
import { type } from "../theme/type";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant =
  "accent" | "ink" | "outlineDark" | "outlineLight" | "dashed" | "ghost" | "link";

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant: ButtonVariant;
  height?: number;
  icon?: IconName;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

function look(variant: ButtonVariant, c: Theme): { box: ViewStyle; ink: string } {
  switch (variant) {
    case "accent":
      return { box: { backgroundColor: c.accent }, ink: c.ground };
    case "ink":
      return { box: { backgroundColor: c.ink }, ink: c.card };
    case "outlineDark":
      return { box: { borderWidth: 1, borderColor: c.lineDark }, ink: c.onDark };
    case "outlineLight":
      return { box: { borderWidth: 1, borderColor: c.lineLight }, ink: c.ink };
    case "dashed":
      return {
        box: { borderWidth: 1.5, borderStyle: "dashed", borderColor: c.accent },
        ink: c.accent,
      };
    case "ghost":
      return { box: {}, ink: c.onDark2 };
    case "link":
      return { box: {}, ink: c.accent };
  }
}

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
  const c = useTheme();
  const { box, ink } = look(variant, c);
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
        {icon !== undefined && <Icon name={icon} color={ink} size={18} strokeWidth={2.4} />}
        <Text
          style={[
            type.bodyBold,
            { fontSize: height >= 56 ? 16 : height > 40 ? 15 : 14, color: ink },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
