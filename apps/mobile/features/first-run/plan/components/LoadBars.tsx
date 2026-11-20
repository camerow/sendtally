import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { darkMeta } from "../../components/DarkCard";

export type LoadBar = { label: string; value: number; deload: boolean };

export type LoadBarsProps = {
  bars: readonly LoadBar[];
  /** The bars' area, the tallest week filling it. */
  height?: number;
};

/** A column per block week on the dark card: its load above, a gold bar sized by it, its week under. */
export function LoadBars({ bars, height = 52 }: LoadBarsProps): React.ReactElement {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
      {bars.map((b, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ ...darkMeta, fontSize: 10.5, color: colors.white }}
          >
            {b.label}
          </Text>
          <View style={{ width: "100%", height, justifyContent: "flex-end" }}>
            <View
              style={{
                height: Math.max(4, (b.value / max) * height),
                borderRadius: 6,
                backgroundColor: b.deload ? "rgba(255,255,255,0.4)" : colors.gold,
              }}
            />
          </View>
          <Text style={{ ...darkMeta, fontSize: 10 }}>{t("plan.weekShort", { n: i + 1 })}</Text>
        </View>
      ))}
    </View>
  );
}
