import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import Svg, { Path, Polyline } from "react-native-svg";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";
import { dots, paddedRange, plot, polyline } from "./chartGeometry";

const HEIGHT = 120;
const PAD = 12;
const AXIS = 52;

export type SeriesChartProps = {
  values: readonly number[];
  /** Points drawn as rings: partial or only attempted. */
  hollow: readonly boolean[];
  /** The least spread the value axis shows. */
  air: number;
  edge: (value: number) => string;
  label: string;
  /** Changes when the series does, to fade the new one in. */
  seriesKey: string;
};

/** Values over time: filled dots, hollow ones for partials, the latest in gold. */
export function SeriesChart({
  values,
  hollow,
  air,
  edge,
  label,
  seriesKey,
}: SeriesChartProps): React.ReactElement {
  const [width, setWidth] = React.useState(0);
  const [lo, hi] = paddedRange(values, air);
  const points = plot(values, lo, hi, width, HEIGHT, PAD);
  const complete = points.filter((_, i) => hollow[i] !== true);
  const partial = points.filter((_, i) => hollow[i] === true);
  const latest = points.slice(-1);
  const rules = `M0 ${PAD}H${width}M0 ${HEIGHT - PAD}H${width}`;
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
          <Animated.View entering={FadeIn.duration(260)} key={seriesKey}>
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
