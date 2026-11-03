import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";

/** A climb's grade in a soft box at the head of its row. */
export function GradeBadge({ label }: { label: string }): React.ReactElement {
  return (
    <View
      style={{
        minWidth: 52,
        height: 36,
        paddingHorizontal: 6,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surfaceSoft,
      }}
    >
      <Text
        numberOfLines={1}
        style={{ fontFamily: fonts.monoSemiBold, fontSize: 13, color: colors.gunmetal }}
      >
        {label}
      </Text>
    </View>
  );
}
