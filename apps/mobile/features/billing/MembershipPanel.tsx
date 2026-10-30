import React from "react";
import { Text, View } from "react-native";
import { membershipPanel, type MembershipPanelRow } from "@sendtally/features/billing";
import { colors, fonts, radius } from "@sendtally/design/tokens";

export const panelEyebrow = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.gunmetal,
} as const;

export const panelMono = {
  fontFamily: fonts.monoMedium,
  fontSize: 11,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: "rgba(64,63,76,0.88)",
} as const;

export const panelNote = {
  fontFamily: fonts.sans,
  fontSize: 13,
  lineHeight: 20,
  color: "rgba(64,63,76,0.88)",
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
        <Text style={{ ...panelEyebrow, fontSize: 9 }}>{row.eyebrow}</Text>
        <Text
          style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.gunmetal }}
        >
          {row.line}
        </Text>
      </View>
    </View>
  );
}

export type MembershipPanelProps = {
  eyebrow: string;
  title: string;
  body?: string;
  /** The strip at the bottom: plans and purchase, or status and manage. */
  children?: React.ReactNode;
};

/** The one gold surface every membership state shares; only the strip changes. */
export function MembershipPanel({
  eyebrow,
  title,
  body,
  children,
}: MembershipPanelProps): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: colors.gold,
        borderRadius: radius.card,
        padding: 18,
        gap: 12,
      }}
    >
      <Text style={panelEyebrow}>{eyebrow}</Text>
      <Text
        style={{
          fontFamily: fonts.displayHeavy,
          fontSize: 24,
          lineHeight: 27,
          letterSpacing: -0.8,
          color: colors.gunmetal,
        }}
      >
        {title}
      </Text>
      {body !== undefined && <Text style={panelNote}>{body}</Text>}
      <View>
        {membershipPanel().rows.map((row) => (
          <LedgerRow key={row.metric} row={row} />
        ))}
      </View>
      {children !== undefined && (
        <View
          style={{
            gap: 12,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: "rgba(64,63,76,0.22)",
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
}
