import React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { LOAD_PLOT, loadPlot, type LoadVM } from "@sendtally/features/statistics";
import { type } from "../type";

/** Grey bars, the latest gold, the dashed average labelled in the gutter; touch a bar to read it. */
export function LoadChart({
  load,
  hit,
  onHit,
  height = LOAD_PLOT.height,
}: {
  load: LoadVM;
  hit: number | null;
  onHit: (i: number | null) => void;
  height?: number;
}): React.ReactElement {
  const [width, setWidth] = React.useState(0);
  const plot = loadPlot(load, width, height);
  const last = load.bars.length - 1;
  const dim = (i: number): number => (hit === null || hit === i ? 1 : 0.3);

  return (
    <View style={{ gap: 6, paddingTop: 4 }}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 && (
          <Svg
            width={width}
            height={height}
            accessible
            accessibilityLabel={t("statistics.loadChartLabel", { count: load.bars.length })}
          >
            {plot.bars.map((b, i) =>
              b.path === null ? (
                <Rect
                  key={i}
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx={1}
                  fill={colors.dataBarEmpty}
                  opacity={dim(i)}
                />
              ) : (
                <Path
                  key={i}
                  d={b.path}
                  fill={
                    hit === i
                      ? colors.gunmetal
                      : i === last
                        ? colors.gold
                        : colors.lineOnLightStrong
                  }
                  stroke={hit !== i && i === last ? colors.gunmetal : undefined}
                  strokeWidth={1.5}
                  opacity={dim(i)}
                />
              )
            )}
            {plot.bars.map((b, i) =>
              load.bars[i]?.under ? (
                <Circle
                  key={`u${i}`}
                  cx={b.x + b.w / 2}
                  cy={plot.dotY}
                  r={2}
                  fill={colors.gunmetal}
                  opacity={dim(i)}
                />
              ) : null
            )}
            {plot.averageY !== null && (
              <>
                <Line
                  x1={0}
                  x2={plot.right}
                  y1={plot.averageY}
                  y2={plot.averageY}
                  stroke={colors.gunmetal}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                <SvgText
                  x={plot.right + 8}
                  y={plot.averageY + 4}
                  fontFamily={fonts.monoSemiBold}
                  fontSize={11}
                  fill={colors.gunmetal}
                >
                  {load.averageText}
                </SvgText>
              </>
            )}
          </Svg>
        )}
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: plot.right,
            flexDirection: "row",
          }}
        >
          {load.state === "load" &&
            load.bars.map((b, i) => (
              <Pressable
                key={i}
                style={{ flex: 1 }}
                accessibilityRole="button"
                accessibilityLabel={b.spoken}
                accessibilityState={{ selected: hit === i }}
                onPress={() => onHit(hit === i ? null : i)}
              />
            ))}
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", width: plot.right }}>
        {load.ticks.map((tick) => (
          <Text key={tick} style={[type.mono, { fontSize: 10, color: colors.textSecondary }]}>
            {tick}
          </Text>
        ))}
      </View>
    </View>
  );
}
