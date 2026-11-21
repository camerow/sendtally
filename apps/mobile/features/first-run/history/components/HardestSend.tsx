import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { darkMeta } from "../../components/DarkCard";

/** The hardest send on the dark card: its grade in gold, its name, and the year it went. */
export function HardestSend({
  gradeLabel,
  name,
  year,
}: {
  gradeLabel: string;
  name: string;
  year: number | null;
}): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          minWidth: 40,
          height: 28,
          paddingHorizontal: 6,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.gold,
        }}
      >
        <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 13, color: colors.gunmetal }}>
          {gradeLabel}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.white }}
        >
          {name}
        </Text>
        {year !== null && (
          <Text style={darkMeta}>{t("onboarding.history.card.hardestSendYear", { year })}</Text>
        )}
      </View>
    </View>
  );
}
