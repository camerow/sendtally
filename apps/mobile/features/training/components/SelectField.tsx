import React from "react";
import { Pressable, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";
import { HangIcon } from "./HangIcon";

export type SelectFieldProps = {
  text: string;
  placeholder: boolean;
  label: string;
  onPress: () => void;
};

/** A dropdown-style field that opens a picker. */
export function SelectField({
  text,
  placeholder,
  label,
  onPress,
}: SelectFieldProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${text}`}
      style={{
        minHeight: 50,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        backgroundColor: colors.surfaceSoft,
      }}
    >
      <Text
        style={[
          type.bodyBold,
          {
            flex: 1,
            fontSize: 15,
            lineHeight: 21,
            color: placeholder ? colors.textSecondary : colors.gunmetal,
          },
        ]}
      >
        {text}
      </Text>
      <HangIcon name="down" color={colors.gunmetal} size={18} strokeWidth={2.2} />
    </Pressable>
  );
}
