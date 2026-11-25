import React from "react";
import { Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";

const panelEyebrow = {
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

type MembershipPanelProps = {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
};

export function MembershipPanel({
  eyebrow,
  title,
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
    </View>
  );
}
