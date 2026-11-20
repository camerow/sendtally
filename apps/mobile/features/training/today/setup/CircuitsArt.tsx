import React from "react";
import { View } from "react-native";
import { CIRCUIT_HEX } from "@sendtally/features/gyms";
import { SETUP_CIRCUITS } from "@sendtally/features/onboarding";

/** A gym's circuit colours, for the gym card. */
export function CircuitsArt(): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
      {SETUP_CIRCUITS.map((c) => (
        <View
          key={c}
          style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: CIRCUIT_HEX[c] }}
        />
      ))}
    </View>
  );
}
