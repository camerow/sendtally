import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { RowFill } from "../components/RowFill";
import { type } from "../type";

export type ClockRowProps = {
  /** How much of the target is behind it, for the green fill. */
  share: number;
  accessibilityLabel: string;
  lead?: React.ReactNode;
  word: string | null;
  clock: string;
  /** "of 1:00", the target. */
  of: string | null;
  /** Its controls, on the trailing edge. */
  children: React.ReactNode;
};

/** A clock counting up toward its target where it sits, one height in every state. */
export function ClockRow({
  share,
  accessibilityLabel,
  lead,
  word,
  clock,
  of,
  children,
}: ClockRowProps): React.ReactElement {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={{
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingRight: 6,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: colors.surfaceSoft,
      }}
    >
      <RowFill share={share} color={colors.fern} opacity={0.16} />
      {lead ?? <View style={{ width: 12 }} />}
      <View style={{ flex: 1, flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        {word !== null && (
          <Text style={[type.bodyBold, { fontSize: 13, color: colors.gunmetal }]}>{word}</Text>
        )}
        <Text style={[type.monoBold, { fontSize: 20, color: colors.gunmetal }]}>{clock}</Text>
        {of !== null && (
          <Text style={[type.mono, { fontSize: 12.5, color: colors.textSecondary }]}>{of}</Text>
        )}
      </View>
      {children}
    </View>
  );
}
