import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

/**
 * The RPE strip, one control lower and in watermelon, so two stacked strips
 * never read as one question. 0 is a value here, so it gets its own segment.
 */
export function SeverityPicker({
  severity,
  onChange,
}: {
  severity: number | null;
  onChange: (severity: number | null) => void;
}): React.ReactElement {
  return (
    <View style={{ gap: 8 }}>
      <View
        style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}
      >
        <Text style={label}>{t("journal.howDidItFeel")}</Text>
        {severity === null ? (
          <Text style={{ ...label, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>
            {t("journal.severityScale")}
          </Text>
        ) : (
          <Text
            style={{ fontFamily: fonts.monoSemiBold, fontSize: 17, color: colors.watermelonInk }}
          >
            {severity}
            <Text style={{ fontSize: 12, color: "rgba(196,48,61,0.6)" }}>/10</Text>
          </Text>
        )}
      </View>
      <View style={{ flexDirection: "row", gap: 3 }}>
        {Array.from({ length: 11 }, (_, value) => {
          const lit = severity !== null && value <= severity && value > 0;
          const zeroPicked = severity === 0 && value === 0;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={t("journal.severityValue", { n: value })}
              accessibilityState={{ selected: severity === value }}
              onPress={() => onChange(severity === value ? null : value)}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 4,
                backgroundColor: lit || zeroPicked ? colors.watermelonInk : colors.dataBarEmpty,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
