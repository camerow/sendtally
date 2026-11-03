import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  isLockedRange,
  trendRanges,
  trendRangeLabel,
  type TrendRange,
} from "@sendtally/features/trends";
import { press, tap } from "../lib/press";
import { Icon } from "./Icon";

export type RangeChipsProps = {
  member: boolean | null;
  shown: TrendRange;
  onPick: (range: TrendRange) => void;
  /** Calendar years with sessions in them, newest first, each a chip after All. */
  years: readonly number[];
};

/** The ranges, longest first, in a row that scrolls; past the free one each wears a lock and opens the membership. */
export function RangeChips({ member, shown, onPick, years }: RangeChipsProps): React.ReactElement {
  const scroll = React.useRef<ScrollView>(null);
  const lefts = React.useRef(new Map<TrendRange, number>());
  const [width, setWidth] = React.useState(0);
  const reveal = (range: TrendRange): void => {
    const x = lefts.current.get(range);
    if (x !== undefined)
      scroll.current?.scrollTo({ x: Math.max(0, x - width / 2), animated: false });
  };
  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ marginHorizontal: -18 }}
      contentContainerStyle={{ gap: 4, paddingHorizontal: 18 }}
    >
      {trendRanges(years).map((range) => {
        const locked = isLockedRange(member, range);
        const on = range === shown;
        const label = trendRangeLabel(range);
        return (
          <Pressable
            key={range}
            onLayout={(e) => {
              lefts.current.set(range, e.nativeEvent.layout.x);
              if (on) reveal(range);
            }}
            onPress={tap(() => (locked ? router.push("/membership") : onPick(range)))}
            accessibilityRole="button"
            accessibilityLabel={locked ? t("common.membersOnly", { label }) : label}
            accessibilityState={{ selected: on }}
            style={press({
              height: 32,
              paddingHorizontal: 12,
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
    </ScrollView>
  );
}
