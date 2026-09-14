import React from "react";
import { Text, View } from "react-native";
import { MEMBERSHIP_PANEL, type MembershipPanelRow } from "@sendtally/features/billing";
import { colors, fonts } from "@sendtally/design/tokens";

export const ledgerEyebrow = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  color: colors.gunmetal,
} as const;

function LedgerRow({ row }: { row: MembershipPanelRow }): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: "rgba(64,63,76,0.14)",
      }}
    >
      <View style={{ width: 44, height: 24, flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
        {row.bars.map((value, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: `${value}%`,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
              backgroundColor: i === row.peak ? colors.dataBarPeak : colors.gunmetal,
              opacity: i === row.peak ? 1 : 0.85,
            }}
          />
        ))}
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={{ ...ledgerEyebrow, fontSize: 9 }}>{row.eyebrow}</Text>
        <Text
          style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.gunmetal }}
        >
          {row.line}
        </Text>
      </View>
    </View>
  );
}

/** The four trend rows every membership pitch shows, on the gold panel ground. */
export function MembershipLedger(): React.ReactElement {
  return (
    <View>
      {MEMBERSHIP_PANEL.rows.map((row) => (
        <LedgerRow key={row.eyebrow} row={row} />
      ))}
    </View>
  );
}
