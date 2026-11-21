import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";

export function PyramidLegend({
  inner,
  outer,
  dark = false,
}: {
  inner: string;
  outer: string;
  dark?: boolean;
}): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      {[
        [inner, dark ? colors.gold : colors.azureInk],
        [outer, dark ? "rgba(255,255,255,0.28)" : colors.dataAzureSoft],
      ].map(([text, colour]) => (
        <View key={text} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colour }} />
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 11.5,
              color: dark ? "rgba(255,255,255,0.75)" : colors.textSecondary,
            }}
          >
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}
