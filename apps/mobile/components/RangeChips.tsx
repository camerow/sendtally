import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  TREND_RANGES,
  isLockedRange,
  trendRangeLabel,
  type TrendRange,
} from "@sendtally/features/trends";
import { press, tap } from "../lib/press";
import { Icon } from "./Icon";

export type RangeChipsProps = {
  member: boolean | null;
  shown: TrendRange;
  onPick: (range: TrendRange) => void;
};

/** The seven ranges; past the free one each wears a lock and opens the membership. */
export function RangeChips({ member, shown, onPick }: RangeChipsProps): React.ReactElement {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {TREND_RANGES.map((range) => {
          const locked = isLockedRange(member, range);
          const on = range === shown;
          const label = trendRangeLabel(range);
          return (
            <Pressable
              key={range}
              onPress={tap(() => (locked ? router.push("/membership") : onPick(range)))}
              accessibilityRole="button"
              accessibilityLabel={locked ? t("common.membersOnly", { label }) : label}
              accessibilityState={{ selected: on }}
              style={press({
                flex: 1,
                height: 32,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                borderRadius: radius.pill,
                backgroundColor: on ? colors.gunmetal : colors.surfaceSoft,
              })}
            >
              {locked && <Icon name="lock" color={colors.textMuted} size={11} strokeWidth={2.4} />}
              <Text
                style={{
                  fontFamily: fonts.sansSemiBold,
                  fontSize: 12,
                  color: on ? colors.white : locked ? colors.textMuted : colors.gunmetal,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {member !== true && (
        <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary }}>
          {t("trends.freeRanges")}
        </Text>
      )}
    </View>
  );
}
