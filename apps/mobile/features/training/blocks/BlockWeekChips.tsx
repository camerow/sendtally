import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { blockWeekOn, type Block, type CalendarDate } from "@sendtally/core/hang";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { FERN_TINT } from "../components/tints";

const SCROLL_FROM = 9;
const CHIP_MIN = 44;
const GAP = 6;

export type BlockWeekChipsProps = {
  block: Block;
  today: CalendarDate;
  /** The week picked, dark; without `onPick` the week it is. */
  picked?: number;
  onPick?: (week: number) => void;
};

/**
 * W1 to the last week, sharing the row: the weeks gone on fern, the picked one dark, the rest
 * plain. Tap one to show it.
 */
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
  // Up to eight weeks share the row; more keep a usable width and scroll, opened on this week.
  const scrolls = block.weeks >= SCROLL_FROM;
  const chips = Array.from({ length: block.weeks }, (_, i) => {
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
          height: 36,
          ...(scrolls ? { minWidth: CHIP_MIN } : { flex: 1 }),
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
  });
  return scrolls ? (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentOffset={{ x: Math.max(0, (dark - 2) * (CHIP_MIN + GAP)), y: 0 }}
      contentContainerStyle={{ gap: GAP }}
    >
      {chips}
    </ScrollView>
  ) : (
    <View style={{ flexDirection: "row", gap: GAP }}>{chips}</View>
  );
}
