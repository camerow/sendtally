import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { GradeBinVM, GradeRange } from "@sendtally/features/trends";

export type GradeHistogramProps = {
  bins: readonly GradeBinVM[];
  range: GradeRange | null;
  onTap: (rank: number) => void;
};

const BAR_MAX = 84;

/** A bar per grade with its count on top; the picked range is solid, the rest pale. */
export function GradeHistogram({ bins, range, onTap }: GradeHistogramProps): React.ReactElement {
  const max = Math.max(1, ...bins.map((b) => b.count));
  const within = (rank: number): boolean =>
    range === null || (rank >= range.lo && rank <= range.hi);
  const picked = (rank: number): boolean => range !== null && within(rank);
  return (
    <View style={{ paddingHorizontal: 18, gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, height: 118 }}>
        {bins.map((b) => (
          <Pressable
            key={b.rank}
            onPress={() => onTap(b.rank)}
            accessibilityRole="button"
            accessibilityState={{ selected: picked(b.rank) }}
            accessibilityLabel={t("trends.gradeBin", {
              grade: b.label,
              climbs: t("common.climbCount", { count: b.count }),
            })}
            style={{ flex: 1, height: "100%", justifyContent: "flex-end", gap: 6 }}
          >
            <Text
              style={{
                fontFamily: fonts.mono,
                fontSize: 10,
                textAlign: "center",
                color: colors.textSecondary,
              }}
            >
              {b.count === 0 ? "" : b.count}
            </Text>
            <View
              style={{
                height: b.count === 0 ? 2 : Math.max(3, Math.round((b.count / max) * BAR_MAX)),
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
                backgroundColor: within(b.rank) ? colors.azure : colors.dataAzureSoft,
              }}
            />
          </Pressable>
        ))}
      </View>
      <View
        style={{
          flexDirection: "row",
          gap: 4,
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: colors.lineOnLightStrong,
        }}
      >
        {bins.map((b) => (
          <Text
            key={b.rank}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: picked(b.rank) ? fonts.monoSemiBold : fonts.mono,
              fontSize: 10,
              color: picked(b.rank) ? colors.gunmetal : colors.textMuted,
            }}
          >
            {b.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
