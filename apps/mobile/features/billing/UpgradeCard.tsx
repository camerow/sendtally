import React from "react";
import { Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";

export type UpgradeCardProps = {
  title: string;
  body: string;
  points?: string[];
  children?: React.ReactNode;
};

export function UpgradeCard({
  title,
  body,
  points = [],
  children,
}: UpgradeCardProps): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: colors.petalTint,
        borderRadius: radius.card,
        padding: 20,
        gap: 12,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 10,
          letterSpacing: 0.8,
          color: colors.watermelonInk,
        }}
      >
        MEMBERS
      </Text>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 24,
          lineHeight: 28,
          letterSpacing: -0.6,
          color: colors.gunmetal,
        }}
      >
        {title}
      </Text>
      <Text
        style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: colors.gunmetal }}
      >
        {body}
      </Text>
      {points.map((point) => (
        <Text
          key={point}
          style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: colors.gunmetal }}
        >
          {`·  ${point}`}
        </Text>
      ))}
      {children}
    </View>
  );
}
