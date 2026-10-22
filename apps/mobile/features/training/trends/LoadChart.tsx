import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import Svg, { Path, Polyline } from "react-native-svg";
import type { HangSessionRecord } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { fromUnit, toUnit, type HangKind, type WeightUnit } from "@sendtally/core/hang";
import { loadLabel } from "@sendtally/features/hang";
import { type } from "../type";
import { dots, paddedRange, plot, polyline } from "./chartGeometry";

const HEIGHT = 120;
const PAD = 12;
const AXIS = 52;

export type LoadChartProps = {
  series: readonly HangSessionRecord[];
  kind: HangKind;
  unit: WeightUnit;
  label: string;
};

/** Load over time: filled dots for complete sessions, hollow ones for partials, the latest in gold. */
export function LoadChart({ series, kind, unit, label }: LoadChartProps): React.ReactElement {
  const [width, setWidth] = React.useState(0);
  const loads = series.map((s) => toUnit(s.loadKg, unit));
  const [lo, hi] = paddedRange(loads, unit === "lb" ? 4 : 2);
  const points = plot(loads, lo, hi, width, HEIGHT, PAD);
  const complete = points.filter((_, i) => (series[i]?.pct ?? 0) >= 100);
  const partial = points.filter((_, i) => (series[i]?.pct ?? 0) < 100);
  const latest = points.slice(-1);
  const rules = `M0 ${PAD}H${width}M0 ${HEIGHT - PAD}H${width}`;
  const edge = (value: number): string => loadLabel(kind, fromUnit(value, unit), unit);
  const axisText = [type.mono, { fontSize: 10, color: colors.textSecondary }];

  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      <View style={{ width: AXIS, height: HEIGHT, justifyContent: "space-between" }}>
        <Text style={axisText}>{edge(hi)}</Text>
        <Text style={axisText}>{edge(lo)}</Text>
      </View>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ flex: 1, height: HEIGHT }}
      >
        {width > 0 && (
          <Animated.View entering={FadeIn.duration(260)} key={series[0]?.id}>
            <Svg width={width} height={HEIGHT} accessibilityLabel={label} accessible>
              <Path d={rules} stroke={colors.lineOnLight} strokeWidth={1} fill="none" />
              <Polyline
                points={polyline(points)}
                fill="none"
                stroke={colors.gunmetal}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              <Path
                d={dots(complete)}
                stroke={colors.gunmetal}
                strokeWidth={11}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d={dots(partial)}
                stroke={colors.gunmetal}
                strokeWidth={11}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d={dots(partial)}
                stroke={colors.white}
                strokeWidth={7}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d={dots(latest)}
                stroke={colors.gunmetal}
                strokeWidth={11}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d={dots(latest)}
                stroke={colors.gold}
                strokeWidth={7}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </Animated.View>
        )}
      </View>
    </View>
  );
}
