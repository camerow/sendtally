import React from "react";
import { Text, View } from "react-native";
import { CIRCUIT_HEX, type CircuitColour } from "@sendtally/features/gyms";
import { colors, fonts } from "@sendtally/design/tokens";

/**
 * A climb's grade in a soft box at the head of its row; white on a row that is soft itself.
 * A circuit climb's box is its circuit's colour instead, with no grade, as on the tally.
 */
export function GradeBadge({
  label,
  onSoft = false,
  colour,
}: {
  label: string;
  onSoft?: boolean;
  colour?: CircuitColour | undefined;
}): React.ReactElement {
  return (
    <View
      style={{
        minWidth: 52,
        height: 36,
        paddingHorizontal: 6,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
          colour !== undefined ? CIRCUIT_HEX[colour] : onSoft ? colors.white : colors.surfaceSoft,
        borderWidth: colour === "white" ? 1 : 0,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      {colour === undefined && (
        <Text
          numberOfLines={1}
          style={{ fontFamily: fonts.monoSemiBold, fontSize: 13, color: colors.gunmetal }}
        >
          {label}
        </Text>
      )}
    </View>
  );
}
