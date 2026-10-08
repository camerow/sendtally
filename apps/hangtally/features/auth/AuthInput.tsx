import React from "react";
import { TextInput, type TextInputProps } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";

export function AuthInput({ style, ...props }: TextInputProps): React.ReactElement {
  const c = useTheme();
  return (
    <TextInput
      placeholderTextColor={c.onDark3}
      {...props}
      style={[
        type.body,
        {
          fontSize: 16,
          color: c.onDark,
          backgroundColor: c.deep,
          borderWidth: 1,
          borderColor: c.lineDark,
          borderRadius: 12,
          paddingHorizontal: 15,
          minHeight: 50,
        },
        style,
      ]}
    />
  );
}
