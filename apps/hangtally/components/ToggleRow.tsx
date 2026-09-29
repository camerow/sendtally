import React from "react";
import { Switch, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { type } from "../theme/type";

export type ToggleRowProps = {
  label: string;
  note?: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleRow({ label, note, value, onChange }: ToggleRowProps): React.ReactElement {
  const c = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodyBold, { fontSize: 15, color: c.ink }]}>{label}</Text>
        {note !== undefined && (
          <Text style={[type.body, { fontSize: 13, lineHeight: 19, color: c.ink2 }]}>{note}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: c.ink, false: c.lineLight }}
      />
    </View>
  );
}
