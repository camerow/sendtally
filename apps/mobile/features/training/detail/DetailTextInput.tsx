import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import React from "react";
import { TextInput, type StyleProp, type TextStyle } from "react-native";
import { colors, radius } from "@sendtally/design/tokens";
import { type } from "../type";

export type DetailTextInputProps = {
  value: string;
  onChange: (text: string) => void;
  label: string;
  placeholder: string;
  maxLength: number;
  inSheet: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: StyleProp<TextStyle>;
};

/** A plain text field that also works inside a bottom sheet, where the keyboard needs its own input. */
export function DetailTextInput({
  value,
  onChange,
  label,
  placeholder,
  maxLength,
  inSheet,
  onFocus,
  onBlur,
  style,
}: DetailTextInputProps): React.ReactElement {
  const Input = inSheet ? BottomSheetTextInput : TextInput;
  return (
    <Input
      value={value}
      onChangeText={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      accessibilityLabel={label}
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      maxLength={maxLength}
      returnKeyType="done"
      style={[
        type.body,
        {
          minHeight: 44,
          paddingHorizontal: 12,
          fontSize: 15,
          color: colors.gunmetal,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.lineOnLightStrong,
          borderRadius: radius.control,
        },
        style,
      ]}
    />
  );
}
