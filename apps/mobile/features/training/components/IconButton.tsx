import React from "react";
import { Pressable } from "react-native";
import { press } from "../../../lib/press";
import { HangIcon, type HangIconName } from "./HangIcon";

const THIN: readonly HangIconName[] = ["restart", "skip", "sound", "muted", "edit"];

export type IconButtonProps = {
  icon: HangIconName;
  label: string;
  onPress: () => void;
  color: string;
  border?: string;
  size?: number;
  iconSize?: number;
};

export function IconButton({
  icon,
  label,
  onPress,
  color,
  border,
  size = 44,
  iconSize = 16,
}: IconButtonProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={size < 44 ? (44 - size) / 2 : 0}
      style={press({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: border === undefined ? 0 : 1,
        borderColor: border,
        flexShrink: 0,
      })}
    >
      <HangIcon
        name={icon}
        color={color}
        size={iconSize}
        strokeWidth={THIN.includes(icon) ? 1.9 : 2.2}
      />
    </Pressable>
  );
}
