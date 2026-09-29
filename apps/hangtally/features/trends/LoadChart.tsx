import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import Svg, { Path, Polyline } from "react-native-svg";
import type { HangSessionRecord } from "@sendtally/api-client";
import { fromUnit, toUnit, type HangKind, type WeightUnit } from "@sendtally/core/hang";
import { loadLabel } from "@sendtally/features/hang";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { area, dots, paddedRange, plot, polyline } from "./chartGeometry";

const HEIGHT = 150;
const PAD = 10;

export type LoadChartProps = {
  series: readonly HangSessionRecord[];
  kind: HangKind;
  unit: WeightUnit;
  label: string;
};

/** Load over time: filled dots for complete sessions, rings for partial ones, the latest in the accent. */
export function LoadChart({ series, kind, unit, label }: LoadChartProps): React.ReactElement {
  const c = useTheme();
  const [width, setWidth] = React.useState(0);
  const loads = series.map((s) => toUnit(s.loadKg, unit));
  const [lo, hi] = paddedRange(loads, unit === "lb" ? 4 : 2);
  const points = plot(loads, lo, hi, width, HEIGHT, PAD);
  const complete = points.filter((_, i) => (series[i]?.pct ?? 0) >= 100);
  const partial = points.filter((_, i) => (series[i]?.pct ?? 0) < 100);
  const rules = `M0 ${PAD}H${width}M0 ${HEIGHT / 2}H${width}M0 ${HEIGHT - PAD}H${width}`;
  const edge = (value: number): string => loadLabel(kind, fromUnit(value, unit), unit);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
      {width > 0 && (
        <Animated.View entering={FadeIn.duration(260)} key={series[0]?.id}>
          <Svg width={width} height={HEIGHT} accessibilityLabel={label} accessible>
            <Path
              d={rules}
              stroke={c.lineLight}
              strokeWidth={1}
              strokeDasharray="3 4"
              fill="none"
            />
            <Path d={area(points, HEIGHT)} fill={c.accentSoft} />
            <Polyline
              points={polyline(points)}
              fill="none"
              stroke={c.ink}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <Path
              d={dots(complete)}
              stroke={c.ink}
              strokeWidth={8}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d={dots(partial)}
              stroke={c.ink}
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d={dots(partial)}
              stroke={c.card}
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d={dots(points.slice(-1))}
              stroke={c.accent}
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      )}
      <Text
        style={[
          type.mono,
          { position: "absolute", right: 0, top: -2, fontSize: 11, color: c.ink2 },
        ]}
      >
        {edge(hi)}
      </Text>
      <Text
        style={[
          type.mono,
          { position: "absolute", right: 0, top: HEIGHT - 22, fontSize: 11, color: c.ink2 },
        ]}
      >
        {edge(lo)}
      </Text>
    </View>
  );
}
