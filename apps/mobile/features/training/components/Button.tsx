import React from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, disabledOpacity, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../../components/Icon";
import { press } from "../../../lib/press";
import { type } from "../type";
import { HangIcon, type HangIconName } from "./HangIcon";
import { ON_DARK, ON_DARK_LINE } from "@sendtally/features/workouts";

export type ButtonVariant =
  "primary" | "goldText" | "outline" | "danger" | "link" | "plain" | "muted" | "outlineDark";

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant: ButtonVariant;
  height?: number;
  icon?: HangIconName;
  disabled?: boolean;
  /** Members only: the lock in place of the icon, read as such; what it presses is the caller's. */
  locked?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const LOOKS: Record<ButtonVariant, { box: ViewStyle; ink: string }> = {
  primary: { box: { backgroundColor: colors.azureInk }, ink: colors.white },
  goldText: { box: { paddingHorizontal: 8 }, ink: colors.gold },
  outline: { box: { borderWidth: 1, borderColor: colors.lineOnLightStrong }, ink: colors.gunmetal },
  danger: { box: {}, ink: colors.watermelonInk },
  link: { box: {}, ink: colors.azureInk },
  plain: { box: {}, ink: colors.gunmetal },
  muted: { box: {}, ink: colors.textSecondary },
  outlineDark: { box: { borderWidth: 1, borderColor: ON_DARK_LINE }, ink: ON_DARK },
};

export function Button({
  label,
  onPress,
  variant,
  height = 48,
  icon,
  disabled,
  locked = false,
  accessibilityLabel,
  style,
}: ButtonProps): React.ReactElement {
  const { box, ink } = LOOKS[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={locked ? t("common.membersOnly", { label }) : accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={press([
        {
          minHeight: height,
          borderRadius: height >= 52 ? 14 : radius.control,
          paddingHorizontal: height > 40 ? 16 : 13,
          paddingVertical: 6,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? disabledOpacity : 1,
        },
        box,
        style,
      ])}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {locked ? (
          <Icon name="lock" color={ink} size={18} strokeWidth={2.4} />
        ) : (
          icon !== undefined && <HangIcon name={icon} color={ink} size={18} strokeWidth={2.4} />
        )}
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
