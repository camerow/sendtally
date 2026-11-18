import React from "react";
import { Pressable, Text, View } from "react-native";
import type { EffortRange } from "@sendtally/features/journal";
import { gradeTap } from "@sendtally/features/trends";
import { colors, effortScale, fonts } from "@sendtally/design/tokens";
import { tap } from "../../lib/press";

export type EffortStripProps = {
  value: EffortRange | null;
  onChange: (range: EffortRange) => void;
};

const LEVELS = effortScale.map((color, i) => ({ level: i + 1, color }));

/** The 1-10 effort scale: tap one level, then another for a range. */
export function EffortStrip({ value, onChange }: EffortStripProps): React.ReactElement {
  const [anchor, setAnchor] = React.useState<number | null>(null);
  const within = (level: number): boolean =>
    value === null || (level >= value.lo && level <= value.hi);
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {LEVELS.map(({ level, color }) => (
          <Pressable
            key={level}
            onPress={tap(() => {
              const next = gradeTap(anchor, level);
              setAnchor(next.anchor);
              onChange(next.grade);
            })}
            accessibilityRole="button"
            accessibilityLabel={`RPE ${level}`}
            accessibilityState={{ selected: value !== null && within(level) }}
            hitSlop={{ top: 6, bottom: 6 }}
            style={{
              flex: 1,
              height: 28,
              borderRadius: 6,
              backgroundColor: color,
              opacity: within(level) ? 1 : 0.22,
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {LEVELS.map(({ level }) => (
          <Text
            key={level}
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: value !== null && within(level) ? fonts.monoSemiBold : fonts.mono,
              fontSize: 10,
              color: value !== null && within(level) ? colors.gunmetal : colors.textMuted,
            }}
          >
            {level}
          </Text>
        ))}
      </View>
    </View>
  );
}
