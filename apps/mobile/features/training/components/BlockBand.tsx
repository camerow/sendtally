import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Label } from "./Label";

export const BLOCK_TINT = "rgba(249,220,92,0.28)";

export type BlockBandProps = { label: string | null; strong?: boolean };

/** The strip over a calendar week naming the block it is in, empty when it is in none. */
export function BlockBand({ label, strong = false }: BlockBandProps): React.ReactElement {
  return (
    <View
      style={{
        height: 16,
        marginTop: 4,
        marginHorizontal: 2,
        paddingHorizontal: 6,
        borderRadius: 5,
        justifyContent: "center",
        backgroundColor: label === null ? undefined : strong ? colors.gold : BLOCK_TINT,
      }}
    >
      {label !== null && (
        <Label small color={colors.gunmetal} style={{ fontSize: 9 }}>
          {label}
        </Label>
      )}
    </View>
  );
}
