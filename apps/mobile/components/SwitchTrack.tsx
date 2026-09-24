import React from "react";
import { View } from "react-native";
import { colors, radius } from "@sendtally/design/tokens";

/**
 * The look of a switch, drawn by hand: the native one changed size in iOS 26 and no longer fits
 * the box React Native lays out for it. The press belongs to whatever wraps it.
 */
export function SwitchTrack({
  checked,
  disabled = false,
}: {
  checked: boolean;
  disabled?: boolean;
}): React.ReactElement {
  return (
    <View
      style={{
        width: 46,
        height: 28,
        borderRadius: radius.pill,
        padding: 3,
        justifyContent: "center",
        backgroundColor: checked ? colors.azureInk : "rgba(64,63,76,0.22)",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.pill,
          backgroundColor: colors.white,
          marginLeft: checked ? 18 : 0,
        }}
      />
    </View>
  );
}
