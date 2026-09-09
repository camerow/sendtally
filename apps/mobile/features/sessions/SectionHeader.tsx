import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";

export const SECTION_HEADER_HEIGHT = 34;

export function SectionHeader({
  title,
  meta,
}: {
  title: string;
  meta: string;
}): React.ReactElement {
  return (
    <View
      style={{
        height: SECTION_HEADER_HEIGHT,
        flexDirection: "row",
        alignItems: "baseline",
        gap: 8,
        paddingHorizontal: 18,
        paddingTop: 9,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLight,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 15,
          lineHeight: 18,
          letterSpacing: -0.3,
          color: colors.gunmetal,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 10,
          lineHeight: 13,
          letterSpacing: 0.8,
          color: colors.textMuted,
        }}
      >
        {meta}
      </Text>
    </View>
  );
}
