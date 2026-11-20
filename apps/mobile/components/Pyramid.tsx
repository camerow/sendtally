import React from "react";
import { Text, View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import type { PyramidRow } from "@sendtally/features/climbs";
import { colors, fonts } from "@sendtally/design/tokens";

export type PyramidProps = {
  rows: readonly PyramidRow[];
  label: string;
  /** 0 to 1: how far the bars have grown out from the centre, for art that draws them in. */
  grow?: Readonly<SharedValue<number>>;
  /** Gold on the app's dark ground, as the wizard's payoff cards draw it. */
  tone?: "light" | "dark";
};

const TONES = {
  light: {
    grade: colors.gunmetal,
    count: colors.textSecondary,
    inner: colors.azureInk,
    outer: colors.dataAzureSoft,
    rule: colors.lineOnLightSoft,
  },
  dark: {
    grade: colors.white,
    count: "rgba(255,255,255,0.75)",
    inner: colors.gold,
    outer: "rgba(255,255,255,0.28)",
    rule: "transparent",
  },
} as const;

const ROW_HEIGHT = 27;
const BAR_HEIGHT = 12;
const GAP = 8;

const cell: ViewStyle = { height: ROW_HEIGHT, justifyContent: "center", borderBottomWidth: 1 };

/** One centred bar per grade, hardest on top: the inner count dark, the rest split either side; the counts share a column as wide as the widest. */
export function Pyramid({ rows, label, grow, tone = "light" }: PyramidProps): React.ReactElement {
  const look = TONES[tone];
  const row = [cell, { borderBottomColor: look.rule }];
  const [width, setWidth] = React.useState(0);
  const grown = useAnimatedStyle(() => ({ transform: [{ scaleX: grow?.value ?? 1 }] }));
  const widest = Math.max(1, ...rows.map((r) => r.inner + r.outer));
  const unit = width === 0 ? 0 : (width - 2) / widest;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ flexDirection: "row" }}
    >
      <View>
        {rows.map((r) => (
          <View key={r.gradeLabel} style={[row, { width: 38 + GAP }]}>
            <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 12, color: look.grade }}>
              {r.gradeLabel}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ flex: 1 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {rows.map((r) => (
          <View key={r.gradeLabel} style={[row, { alignItems: "center" }]}>
            <Animated.View
              style={[{ flexDirection: "row", gap: r.inner > 0 && r.outer > 0 ? 1 : 0 }, grown]}
            >
              {r.outer > 0 && <Side width={(r.outer / 2) * unit} left colour={look.outer} />}
              {r.inner > 0 && (
                <View
                  style={{
                    width: r.inner * unit,
                    height: BAR_HEIGHT,
                    backgroundColor: look.inner,
                    borderRadius: r.outer > 0 ? 0 : 3,
                  }}
                />
              )}
              {r.outer > 0 && (
                <Side width={(r.outer / 2) * unit} left={false} colour={look.outer} />
              )}
            </Animated.View>
          </View>
        ))}
      </View>
      <View>
        {rows.map((r) => (
          <View key={r.gradeLabel} style={[row, { paddingLeft: GAP, alignItems: "flex-end" }]}>
            <Text
              numberOfLines={1}
              style={{ fontFamily: fonts.mono, fontSize: 11, color: look.count }}
            >
              {r.countLabel}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Side({
  width,
  left,
  colour,
}: {
  width: number;
  left: boolean;
  colour: string;
}): React.ReactElement {
  return (
    <View
      style={{
        width,
        height: BAR_HEIGHT,
        backgroundColor: colour,
        borderTopLeftRadius: left ? 3 : 0,
        borderBottomLeftRadius: left ? 3 : 0,
        borderTopRightRadius: left ? 0 : 3,
        borderBottomRightRadius: left ? 0 : 3,
      }}
    />
  );
}
