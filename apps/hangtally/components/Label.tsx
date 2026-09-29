import React from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { type } from "../theme/type";

export type LabelProps = {
  children: React.ReactNode;
  color: string;
  small?: boolean;
  style?: StyleProp<TextStyle>;
};

/** Mono, tracked, uppercase: the label voice shared with sendtally. */
export function Label({ children, color, small, style }: LabelProps): React.ReactElement {
  return <Text style={[small ? type.labelSmall : type.label, { color }, style]}>{children}</Text>;
}
