import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { HardestInYear } from "@sendtally/features/onboarding";
import { darkLabel } from "../../components/DarkCard";

/** Hardest send by year: a gold bar a year, as tall as its grade, the grade over it. */
export function YearBars({ years }: { years: readonly HardestInYear[] }): React.ReactElement {
  const ranks = years.map((y) => y.rank);
  const lo = Math.max(0, Math.min(...ranks) - 2);
  const span = Math.max(1, Math.max(...ranks) - lo);
  return (
    <View style={{ gap: 6 }}>
      <Text style={darkLabel}>{t("onboarding.history.card.hardestByYear")}</Text>
      <View
        accessible
        accessibilityLabel={years.map((y) => `${y.year}: ${y.gradeLabel}`).join(". ")}
        style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}
      >
        {years.map((y) => (
          <View key={y.year} style={{ flex: 1, minWidth: 0, alignItems: "center", gap: 4 }}>
            <Text
              numberOfLines={1}
              style={{ fontFamily: fonts.monoSemiBold, fontSize: 10.5, color: colors.white }}
            >
              {y.gradeLabel}
            </Text>
            <View
              style={{
                alignSelf: "stretch",
                height: 14 + ((y.rank - lo) / span) * 46,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2,
                backgroundColor: colors.gold,
              }}
            />
            <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
              {String(y.year).slice(2)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
