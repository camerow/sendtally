import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { press } from "../lib/press";

export type GradeChip = { key: string; label: string; colour?: string };

export type GradeChipsProps = {
  chips: readonly GradeChip[];
  active: string | null;
  /** The chip the row opens at, so the user's range is in view; a pick never scrolls it. */
  startIndex: number;
  /** Space before the first chip and after the last: the screen's gutter, or none inside a card. */
  inset?: number;
  /** Grey chips on white, for a form; the tally's own are on its dark ground. */
  light?: boolean;
  onPick: (key: string) => void;
};

const CHIP = 56;
const GAP = 8;

export function GradeChips({
  chips,
  active,
  startIndex,
  light = false,
  inset = 18,
  onPick,
}: GradeChipsProps): React.ReactElement {
  const scroller = React.useRef<ScrollView>(null);
  const first = chips[0]?.key;
  const open = React.useEffectEvent(() => {
    scroller.current?.scrollTo({ x: Math.max(0, startIndex - 1) * (CHIP + GAP), animated: false });
  });
  React.useEffect(() => open(), [first]);
  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: GAP, paddingHorizontal: inset }}
    >
      {chips.map((chip) => {
        const on = chip.key === active;
        const plain = chip.colour === undefined;
        return (
          <Pressable
            key={chip.key}
            onPress={() => onPick(chip.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={chip.label}
            style={press({
              minWidth: CHIP,
              height: light ? 44 : CHIP,
              flexDirection: "row",
              gap: 5,
              paddingHorizontal: plain || light ? 10 : 0,
              borderRadius: light ? 12 : 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: light
                ? on
                  ? colors.gunmetal
                  : colors.surfaceSoft
                : (chip.colour ?? "rgba(255,255,255,0.1)"),
              borderWidth: light ? 0 : 2,
              borderColor: on ? colors.gold : plain ? "transparent" : "rgba(255,255,255,0.25)",
            })}
          >
            {light && !plain && (
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: chip.colour,
                  borderWidth: 1,
                  borderColor: colors.lineOnLightStrong,
                }}
              />
            )}
            {(plain || light) && (
              <Text
                style={{
                  fontFamily: fonts.monoSemiBold,
                  fontSize: light ? 14 : 16,
                  color: light && !on ? colors.gunmetal : colors.white,
                }}
              >
                {chip.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
