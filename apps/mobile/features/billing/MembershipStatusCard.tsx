import React from "react";
import { Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";

export type MembershipStatusCardProps = {
  label: string;
  headline: string;
  detail: string | null;
  body: string;
  active: boolean;
  children?: React.ReactNode;
};

export function MembershipStatusCard({
  label,
  headline,
  detail,
  body,
  active,
  children,
}: MembershipStatusCardProps): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: active ? colors.petalTint : colors.surfaceSoft,
        borderWidth: 1,
        borderColor: active ? colors.petalTint : colors.lineOnLightSoft,
        borderRadius: radius.card,
        padding: 18,
        gap: 10,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 10,
          letterSpacing: 0.8,
          color: active ? colors.petalInk : colors.watermelonInk,
        }}
      >
        {label}
      </Text>
      <View style={{ gap: 3 }}>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 24,
            lineHeight: 28,
            letterSpacing: -0.6,
            color: colors.gunmetal,
          }}
        >
          {headline}
        </Text>
        {detail !== null && (
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 11,
              letterSpacing: 0.6,
              color: colors.textSecondary,
            }}
          >
            {detail.toUpperCase()}
          </Text>
        )}
      </View>
      <Text
        style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: colors.gunmetal }}
      >
        {body}
      </Text>
      {children}
    </View>
  );
}
