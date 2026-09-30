import React from "react";
import { Pressable } from "react-native";
import { press } from "../lib/press";
import { Icon, type IconName } from "./Icon";

const THIN: readonly IconName[] = ["restart", "skip", "sound", "muted", "edit"];

export type IconButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  color: string;
  border?: string;
  size?: number;
  square?: boolean;
  iconSize?: number;
};

export function IconButton({
  icon,
  label,
  onPress,
  color,
  border,
  size = 40,
  square,
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
        borderRadius: square ? 16 : size / 2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: border === undefined ? 0 : 1,
        borderColor: border,
        flexShrink: 0,
      })}
    >
      <Icon
        name={icon}
        color={color}
        size={iconSize}
        strokeWidth={THIN.includes(icon) ? 1.8 : 2.2}
      />
    </Pressable>
  );
}
