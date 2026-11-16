import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";

/**
 * A dashed line filling its row. iOS draws no dashed border on one side alone, so it is the
 * top edge of a fully dashed box, the rest clipped.
 */
export function DashedRule(): React.ReactElement {
  return (
    <View style={{ flex: 1, height: 1.5, overflow: "hidden" }}>
      <View
        style={{
          height: 6,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: colors.lineOnLightStrong,
        }}
      />
    </View>
  );
}
