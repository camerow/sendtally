import React from "react";
import { View } from "react-native";
import type { CircuitColour } from "@sendtally/features/gyms";
import { CIRCUIT_HEX } from "@sendtally/features/gyms";

/** The one way a circuit's colour is drawn: a small dot, white with a hairline so it stays visible. */
export function CircuitDot({
  colour,
  size = 14,
}: {
  colour: CircuitColour;
  size?: number;
}): React.ReactElement {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: CIRCUIT_HEX[colour],
        borderWidth: 1,
        borderColor: colour === "white" ? "rgba(64,63,76,0.35)" : "transparent",
      }}
    />
  );
}
