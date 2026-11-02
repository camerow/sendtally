import React from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";

export type TitleProps = {
  children: React.ReactNode;
  size: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function Title({
  children,
  size,
  color = colors.gunmetal,
  style,
}: TitleProps): React.ReactElement {
  return (
    <Text
      accessibilityRole="header"
      style={[type.display, { fontSize: size, lineHeight: Math.round(size * 1.05), color }, style]}
    >
      {children}
    </Text>
  );
}
