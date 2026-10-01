import React from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { type } from "../theme/type";
import { Icon } from "./Icon";

export type SelectFieldProps = {
  text: string;
  placeholder: boolean;
  label: string;
  onPress: () => void;
};

/** A dropdown-style field in a light sheet that opens a picker. */
export function SelectField({
  text,
  placeholder,
  label,
  onPress,
}: SelectFieldProps): React.ReactElement {
  const c = useTheme();
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
        backgroundColor: c.soft,
        borderWidth: 1,
        borderColor: c.lineLight,
      }}
    >
      <Text
        style={[
          type.bodyBold,
          { flex: 1, fontSize: 16, lineHeight: 22, color: placeholder ? c.ink2 : c.ink },
        ]}
      >
        {text}
      </Text>
      <Icon name="down" color={c.ink} size={20} strokeWidth={2.4} />
    </Pressable>
  );
}
