import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, severityColor, severityNoneTint } from "@sendtally/design/tokens";

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

/**
 * The effort strip, one control lower, so two stacked strips never read as one
 * question. 0 is a value here, so it gets its own segment.
 */
function barColor(severity: number | null, value: number): string {
  if (value === 0) return severity === 0 ? severityColor(0) : severityNoneTint;
  if (severity !== null && value <= severity) return severityColor(severity);
  return colors.dataBarEmpty;
}

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
          <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 17, color: colors.gunmetal }}>
            {severity}
            <Text style={{ fontSize: 12, color: colors.textMuted }}>/10</Text>
          </Text>
        )}
      </View>
      <View style={{ flexDirection: "row", gap: 3 }}>
        {Array.from({ length: 11 }, (_, value) => {
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
                backgroundColor: barColor(severity, value),
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
