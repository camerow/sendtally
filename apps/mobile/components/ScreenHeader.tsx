import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { LogoMark } from "./Logo";

export const SCREEN_HEADER_HEIGHT = 44;

export type ScreenHeaderProps = {
  title: string;
  caption?: string | null;
};

export function ScreenHeader({ title, caption = null }: ScreenHeaderProps): React.ReactElement {
  return (
    <View
      style={{
        height: SCREEN_HEADER_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        paddingHorizontal: 18,
      }}
    >
      <LogoMark size={22} />
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 22,
          letterSpacing: -0.5,
          color: colors.gunmetal,
        }}
      >
        {title}
      </Text>
      <View style={{ flex: 1 }} />
      {caption !== null && (
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.8,
            color: colors.textMuted,
          }}
        >
          {caption}
        </Text>
      )}
    </View>
  );
}
