import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Path, Polyline, Rect, Text as SvgText } from "react-native-svg";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  WORKLOAD_EDGES,
  WORKLOAD_GUTTER,
  WORKLOAD_TINTS,
  polyline,
  workloadBands,
  workloadPlot,
} from "@sendtally/features/statistics";
import { type } from "../type";

const HEIGHT = 132;

/** The ratio over the range against the four zones, today in gold, gaps where there is no ratio. */
export function WorkloadChart({
  points,
  from,
}: {
  points: readonly (number | null)[];
  from: string;
}): React.ReactElement {
  const [width, setWidth] = React.useState(0);
  const plot = workloadPlot(points, width, HEIGHT);
  const bands = workloadBands();
  const tick = (value: number, strong = false): React.ReactElement => (
    <SvgText
      key={`t${value}`}
      x={WORKLOAD_GUTTER - 6}
      y={plot.y(value) + 3.5}
      textAnchor="end"
      fontFamily={strong ? fonts.monoSemiBold : fonts.mono}
      fontSize={10}
      fill={strong ? colors.gunmetal : colors.textSecondary}
    >
      {value.toFixed(1)}
    </SvgText>
  );

  return (
    <View style={{ gap: 6 }}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
        {width > 0 && (
          <Svg
            width={width}
            height={HEIGHT}
            accessible
            accessibilityLabel={t("statistics.workloadChartLabel")}
          >
            {bands.map((b) => (
              <Rect
                key={b.zone}
                x={plot.left}
                y={plot.y(b.hi)}
                width={plot.right - plot.left}
                height={plot.y(b.lo) - plot.y(b.hi)}
                fill={WORKLOAD_TINTS[b.zone]}
              />
            ))}
            {WORKLOAD_EDGES.map((edge) => (
              <Line
                key={edge}
                x1={plot.left}
                x2={plot.right}
                y1={plot.y(edge)}
                y2={plot.y(edge)}
                stroke={colors.dataBarEmpty}
                strokeDasharray="2 3"
              />
            ))}
            {WORKLOAD_EDGES.map((edge) => tick(edge))}
            {tick(1, true)}
            <Line
              x1={plot.left}
              x2={plot.right}
              y1={plot.y(1)}
              y2={plot.y(1)}
              stroke={colors.lineOnLightStrong}
            />
            {plot.runs.map((run) => (
              <Polyline
                key={`${run[0]?.[0]}`}
                points={polyline(run)}
                fill="none"
                stroke={colors.gunmetal}
                strokeWidth={2}
                strokeLinejoin="round"
              />
            ))}
            {points.length <= 31 &&
              plot.dots.map(([x, y]) => (
                <Circle key={x} cx={x} cy={y} r={3.2} fill={colors.gunmetal} />
              ))}
            {plot.over.map(([x, y]) => (
              <Path
                key={`o${x}`}
                d={`M${x - 4} ${y - 4}L${x} ${y - 9}L${x + 4} ${y - 4}`}
                fill={colors.gunmetal}
              />
            ))}
            {plot.today !== null && (
              <Circle
                cx={plot.today[0]}
                cy={plot.today[1]}
                r={5}
                fill={colors.gold}
                stroke={colors.gunmetal}
                strokeWidth={2}
              />
            )}
          </Svg>
        )}
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingLeft: WORKLOAD_GUTTER,
        }}
      >
        <Text style={[type.mono, { fontSize: 10, color: colors.textSecondary }]}>{from}</Text>
        <Text style={[type.mono, { fontSize: 10, color: colors.textSecondary }]}>
          {t("statistics.workloadToday")}
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 6, columnGap: 14 }}>
        {bands.map((b) => (
          <View key={b.zone} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: WORKLOAD_TINTS[b.zone],
                borderWidth: 1,
                borderColor: colors.lineOnLightStrong,
              }}
            />
            <Text style={[type.body, { fontSize: 12, color: colors.textSecondary }]}>
              {b.label} <Text style={[type.mono, { fontSize: 11 }]}>{b.range}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
