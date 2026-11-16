import React from "react";
import { View } from "react-native";

export type RowFillProps = { share: number; color: string; opacity: number };

/**
 * A fill across the share of its row a countdown or hold has left. It sits in a box spanning the
 * whole row, so the share reaches the row's rounded edge however the row is padded.
 */
export function RowFill({ share, color, opacity }: RowFillProps): React.ReactElement {
  return (
    <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}>
      <View style={{ height: "100%", width: `${share * 100}%`, backgroundColor: color, opacity }} />
    </View>
  );
}
