import React from "react";
import { Pressable, Text } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press, tap } from "../lib/press";

export type ChipProps = {
  label: string;
  active: boolean;
  disabled?: boolean;
  dashed?: boolean;
  uppercase?: boolean;
  /** Members-only: drawn dashed with a lock, still pressable so the press can explain itself. */
  locked?: boolean;
  onPress: () => void;
};

function Lock({ color }: { color: string }): React.ReactElement {
  return (
    <Svg width={8} height={9} viewBox="0 0 8 9">
      <Rect
        x={0.75}
        y={3.75}
        width={6.5}
        height={4.5}
        rx={1}
        stroke={color}
        strokeWidth={1.3}
        fill="none"
      />
      <Path d="M2 3.75V2.5a2 2 0 0 1 4 0v1.25" stroke={color} strokeWidth={1.3} fill="none" />
    </Svg>
  );
}

export function Chip({
  label,
  active,
  disabled = false,
  dashed = false,
  uppercase = true,
  locked = false,
  onPress,
}: ChipProps): React.ReactElement {
  const dashedBorder = dashed || locked;
  const textColor = active
    ? colors.gunmetal
    : locked
      ? "rgba(64,63,76,0.42)"
      : "rgba(64,63,76,0.65)";
  return (
    <Pressable
      onPress={tap(onPress)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={locked ? t("common.membersOnly", { label }) : undefined}
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
        borderStyle: dashedBorder ? "dashed" : "solid",
        borderColor: active
          ? colors.gold
          : dashedBorder
            ? "rgba(64,63,76,0.3)"
            : "rgba(64,63,76,0.18)",
        opacity: disabled ? 0.5 : 1,
      })}
    >
      {locked && <Lock color={textColor} />}
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
