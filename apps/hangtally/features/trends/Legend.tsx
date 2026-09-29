import React from "react";
import { View } from "react-native";
import { Label } from "../../components/Label";
import { useTheme } from "../../theme/ThemeContext";

/** A filled dot for complete sessions, a ring for partial ones. */
export function Legend({ ring, label }: { ring: boolean; label: string }): React.ReactElement {
  const c = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: ring ? undefined : c.ink,
          borderWidth: ring ? 2.5 : 0,
          borderColor: c.ink,
        }}
      />
      <Label small color={c.ink2}>
        {label}
      </Label>
    </View>
  );
}
