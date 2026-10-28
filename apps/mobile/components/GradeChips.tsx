import React from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { press } from "../lib/press";

export type GradeChip = { key: string; label: string; colour?: string };

export type GradeChipsProps = {
  chips: readonly GradeChip[];
  active: string | null;
  /** The chip the row opens at, so the user's range is in view. */
  startIndex: number;
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
  onPick,
}: GradeChipsProps): React.ReactElement {
  const scroller = React.useRef<ScrollView>(null);
  const first = chips[0]?.key;
  React.useEffect(() => {
    scroller.current?.scrollTo({ x: Math.max(0, startIndex - 1) * (CHIP + GAP), animated: false });
  }, [first, startIndex]);
  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: GAP, paddingHorizontal: 18 }}
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
              paddingHorizontal: plain ? 10 : 0,
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
            {plain && (
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
