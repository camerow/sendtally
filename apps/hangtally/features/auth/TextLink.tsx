import React from "react";
import { Pressable, Text } from "react-native";
import { type } from "../../theme/type";

export type TextLinkProps = {
  label: string;
  onPress: () => void;
  color: string;
  disabled?: boolean;
};

export function TextLink({ label, onPress, color, disabled }: TextLinkProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={{ minHeight: 44, justifyContent: "center" }}
    >
      <Text style={[type.mono, { fontSize: 12, color, textDecorationLine: "underline" }]}>
        {label}
      </Text>
    </Pressable>
  );
}
