import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";

export function PyramidLegend({
  inner,
  outer,
}: {
  inner: string;
  outer: string;
}): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      {[
        [inner, colors.azureInk],
        [outer, colors.dataAzureSoft],
      ].map(([text, colour]) => (
        <View key={text} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colour }} />
          <Text style={{ fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSecondary }}>
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}
