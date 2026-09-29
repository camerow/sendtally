import React from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { type } from "../theme/type";
import { Icon } from "./Icon";

export type DateFieldProps = { text: string; open: boolean; onToggle: () => void; label: string };

export function DateField({ text, open, onToggle, label }: DateFieldProps): React.ReactElement {
  const c = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${text}`}
      accessibilityState={{ expanded: open }}
      style={{
        height: 50,
        paddingHorizontal: 14,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: c.soft,
        borderWidth: open ? 2 : 1,
        borderColor: open ? c.ink : c.lineLight,
      }}
    >
      <Text style={[type.bodyBold, { fontSize: 16, color: c.ink }]}>{text}</Text>
      <Icon name="schedule" color={c.ink} size={20} strokeWidth={1.8} />
    </Pressable>
  );
}
