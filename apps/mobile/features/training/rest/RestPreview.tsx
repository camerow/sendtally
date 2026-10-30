import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import { type } from "../type";

/** A rest still to come between exercises: a slim line, until it runs as a RestRow. */
export function RestPreview({ seconds }: { seconds: number }): React.ReactElement {
  const rule = { flex: 1, height: 1, backgroundColor: colors.lineOnLight };
  return (
    <View
      style={{
        height: 24,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 4,
      }}
    >
      <View style={rule} />
      <Text style={[type.mono, { fontSize: 11.5, color: colors.textMuted }]}>
        {t("activities.restPreview", { time: elapsedClock(seconds) })}
      </Text>
      <View style={rule} />
    </View>
  );
}
