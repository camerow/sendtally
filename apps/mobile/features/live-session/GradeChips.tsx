import React from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { press } from "../../lib/press";

export type GradeChip = { key: string; label: string; colour?: string };

export type GradeChipsProps = {
  chips: readonly GradeChip[];
  active: string | null;
  /** The chip the row opens at, so the user's range is in view. */
  startIndex: number;
  onPick: (key: string) => void;
};

const CHIP = 56;
const GAP = 8;

export function GradeChips({
  chips,
  active,
  startIndex,
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
      contentContainerStyle={{ gap: GAP, paddingHorizontal: 18 }}
    >
      {chips.map((chip) => {
        const on = chip.key === active;
        return (
          <Pressable
            key={chip.key}
            onPress={() => onPick(chip.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={chip.label}
            style={press({
              minWidth: CHIP,
              height: CHIP,
              paddingHorizontal: chip.colour === undefined ? 10 : 0,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: chip.colour ?? "rgba(255,255,255,0.1)",
              borderWidth: 2,
              borderColor: on
                ? colors.gold
                : chip.colour === undefined
                  ? "transparent"
                  : "rgba(255,255,255,0.25)",
            })}
          >
            {chip.colour === undefined && (
              <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 16, color: colors.white }}>
                {chip.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
