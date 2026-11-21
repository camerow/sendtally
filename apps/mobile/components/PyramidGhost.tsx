import React from "react";
import { View } from "react-native";

/** Where a pyramid will be, on the dark ground, before there is a climb to draw. */
export function PyramidGhost(): React.ReactElement {
  return (
    <View style={{ alignItems: "center", gap: 8, paddingVertical: 6 }}>
      {(["26%", "48%", "74%"] as const).map((width) => (
        <View
          key={width}
          style={{
            width,
            height: 12,
            borderRadius: 3,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: "rgba(255,255,255,0.3)",
          }}
        />
      ))}
    </View>
  );
}
