import React from "react";
import { Text, View } from "react-native";
import { membershipPanel } from "@sendtally/features/billing";
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

/** A line of what membership keeps: its metric, its own words, a small chart of it. */
export type LedgerRowVM = { eyebrow: string; text: string };

type DrawnRow = LedgerRowVM & { bars: readonly number[]; peak: number };

function LedgerRow({ row }: { row: DrawnRow }): React.ReactElement {
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
          {row.text}
        </Text>
      </View>
    </View>
  );
}

export type MembershipPanelProps = {
  eyebrow: string;
  title: string;
  body?: string;
  /** In place of the stats rows; each borrows the chart of the default row in its place. */
  rows?: readonly LedgerRowVM[];
  /** The strip at the bottom: plans and purchase, or status and manage. */
  children?: React.ReactNode;
};

/** The one gold surface every membership state shares; only the strip changes. */
export function MembershipPanel({
  eyebrow,
  title,
  body,
  rows,
  children,
}: MembershipPanelProps): React.ReactElement {
  const charts = membershipPanel().rows;
  const drawn: DrawnRow[] = (rows ?? charts.map((r) => ({ eyebrow: r.eyebrow, text: r.line }))).map(
    (row, i) => {
      const chart = charts[i % charts.length]!;
      return { ...row, bars: chart.bars, peak: chart.peak };
    }
  );
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
        {drawn.map((row) => (
          <LedgerRow key={row.eyebrow} row={row} />
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
