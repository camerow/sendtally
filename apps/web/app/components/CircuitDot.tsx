import React from "react";
import { CIRCUIT_HEX, type CircuitColour } from "@sendtally/features/gyms";

/** The one way a circuit's colour is drawn: a small dot, white with a hairline so it stays visible. */
export function CircuitDot({
  colour,
  size = 14,
}: {
  colour: CircuitColour;
  size?: number;
}): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        flex: "none",
        width: size,
        height: size,
        borderRadius: "50%",
        boxSizing: "border-box",
        background: CIRCUIT_HEX[colour],
        border: `1px solid ${colour === "white" ? "rgba(64,63,76,0.35)" : "transparent"}`,
      }}
    />
  );
}
