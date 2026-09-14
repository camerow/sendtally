import React from "react";
import { Text, View } from "react-native";
import { membershipPanel } from "@sendtally/features/billing";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { ledgerEyebrow, MembershipLedger } from "./MembershipLedger";

export type UpgradeCardProps = {
  children?: React.ReactNode;
};

export function UpgradeCard({ children }: UpgradeCardProps): React.ReactElement {
  const panel = membershipPanel();
  return (
    <View
      style={{
        backgroundColor: colors.gold,
        borderRadius: radius.card,
        padding: 18,
        gap: 12,
      }}
    >
      <Text style={ledgerEyebrow}>{panel.eyebrow}</Text>
      <Text
        style={{
          fontFamily: fonts.displayHeavy,
          fontSize: 24,
          lineHeight: 27,
          letterSpacing: -0.8,
          color: colors.gunmetal,
        }}
      >
        {panel.title}
      </Text>
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 13,
          lineHeight: 20,
          color: "rgba(64,63,76,0.88)",
        }}
      >
        {panel.body}
      </Text>
      <MembershipLedger />
      {children}
    </View>
  );
}
