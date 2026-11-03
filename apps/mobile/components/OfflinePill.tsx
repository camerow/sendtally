import React from "react";
import { Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { useOnline } from "../lib/useOnline";

/** Says the phone is offline; what the user does still saves, and syncs once it is back. */
export function OfflinePill(): React.ReactElement | null {
  if (useOnline()) return null;
  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        height: 24,
        paddingHorizontal: 9,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted }} />
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: colors.textSecondary,
        }}
      >
        {t("common.offline")}
      </Text>
    </View>
  );
}
