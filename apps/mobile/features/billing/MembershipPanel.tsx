import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { membershipPanel, type MembershipPanelRow } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press } from "../../lib/press";

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

function LedgerRow({ row, link }: { row: MembershipPanelRow; link: boolean }): React.ReactElement {
  const inner = (
    <>
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
      {link && <Text style={panelEyebrow}>{t("billing.openTrend")} →</Text>}
    </>
  );
  const style = {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(64,63,76,0.14)",
  } as const;
  if (!link) return <View style={style}>{inner}</View>;
  return (
    <Pressable
      onPress={() => router.push(`/trend/${row.metric}`)}
      accessibilityRole="link"
      style={press(style)}
    >
      {inner}
    </Pressable>
  );
}

export type MembershipPanelProps = {
  eyebrow: string;
  title: string;
  body?: string;
  /** Members get the ledger rows as links into the trends they unlock. */
  linkRows?: boolean;
  /** The strip at the bottom: plans and purchase, or status and manage. */
  children?: React.ReactNode;
};

/** The one gold surface every membership state shares; only the strip changes. */
export function MembershipPanel({
  eyebrow,
  title,
  body,
  linkRows = false,
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
          <LedgerRow key={row.metric} row={row} link={linkRows} />
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
