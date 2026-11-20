import React from "react";
import { View } from "react-native";
import { colors, disabledOpacity, radius } from "@sendtally/design/tokens";

/**
 * The look of a switch, drawn by hand: the native one changed size in iOS 26 and no longer fits
 * the box React Native lays out for it. The press belongs to whatever wraps it.
 */
const TRACKS = {
  light: { on: colors.azureInk, off: "rgba(64,63,76,0.22)" },
  dark: { on: colors.gold, off: "rgba(255,255,255,0.2)" },
} as const;

export function SwitchTrack({
  checked,
  disabled = false,
  tone = "light",
}: {
  checked: boolean;
  disabled?: boolean;
  /** Gold on the app's dark ground, as the wizard's payoff screens draw it. */
  tone?: "light" | "dark";
}): React.ReactElement {
  return (
    <View
      style={{
        width: 46,
        height: 28,
        borderRadius: radius.pill,
        padding: 3,
        justifyContent: "center",
        backgroundColor: checked ? TRACKS[tone].on : TRACKS[tone].off,
        opacity: disabled ? disabledOpacity : 1,
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
