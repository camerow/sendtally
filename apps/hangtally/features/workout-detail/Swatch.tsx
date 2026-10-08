import React from "react";
import { View } from "react-native";
import { Label } from "../../components/Label";
import { useTheme } from "../../theme/ThemeContext";

/** A legend key: a colour square and its label. */
export function Swatch({ color, label }: { color: string; label: string }): React.ReactElement {
  const c = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
      <Label color={c.onDark2}>{label}</Label>
    </View>
  );
}
