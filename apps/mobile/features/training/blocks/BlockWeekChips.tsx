import React from "react";
import { Pressable, Text, View } from "react-native";
import { blockWeekOn, type Block, type CalendarDate } from "@sendtally/core/hang";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { FERN_TINT } from "../components/tints";

export type BlockWeekChipsProps = {
  block: Block;
  today: CalendarDate;
  /** The week picked, dark; without `onPick` the week it is. */
  picked?: number;
  onPick?: (week: number) => void;
};

/** W1 to the last week: the weeks gone on fern, the picked one dark, the rest plain. Tap one to show it. */
export function BlockWeekChips({
  block,
  today,
  picked,
  onPick,
}: BlockWeekChipsProps): React.ReactElement {
  const now =
    blockWeekOn(block, today) ??
    (block.start === null || today < block.start ? 0 : block.weeks + 1);
  const dark = picked ?? now;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {Array.from({ length: block.weeks }, (_, i) => {
        const week = i + 1;
        const look =
          week === dark
            ? { color: colors.white, background: colors.gunmetal }
            : week < now
              ? { color: colors.fern, background: FERN_TINT }
              : { color: colors.gunmetal, background: colors.surfaceSoft };
        const label = t("plan.weekShort", { n: week });
        return (
          <Pressable
            key={week}
            disabled={onPick === undefined}
            onPress={() => onPick?.(week)}
            accessibilityRole="button"
            accessibilityState={{ selected: week === dark }}
            accessibilityLabel={t("plan.weekNumber", { n: week })}
            style={press({
              height: 32,
              minWidth: 40,
              paddingHorizontal: 11,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: look.background,
            })}
          >
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 12,
                letterSpacing: 0.6,
                color: look.color,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
