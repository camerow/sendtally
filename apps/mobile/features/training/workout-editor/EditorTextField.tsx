import React from "react";
import { TextInput } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { SheetSection } from "../components/SheetSection";

export type EditorTextFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
  onChange: (text: string) => void;
};

export function EditorTextField({
  label,
  value,
  placeholder,
  maxLength,
  multiline = false,
  onChange,
}: EditorTextFieldProps): React.ReactElement {
  return (
    <SheetSection label={label}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        accessibilityLabel={label}
        maxLength={maxLength}
        multiline={multiline}
        style={{
          fontFamily: fonts.sans,
          fontSize: 15,
          color: colors.gunmetal,
          borderWidth: 1,
          borderColor: "rgba(64,63,76,0.15)",
          borderRadius: radius.control,
          paddingHorizontal: 13,
          paddingVertical: 12,
          minHeight: multiline ? 88 : 46,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </SheetSection>
  );
}
