import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { useTween, type TrendPointVM, type TrendTileVM } from "@sendtally/features/trends";
import { SERIES_COLOUR } from "./series";
import { monoLabel } from "./styles";

const PLOT = 128;
const TOP = 18;
const Y_AXIS = 34;

const totalOf = (p: TrendPointVM): number | null =>
  p.a === null && p.b === null ? null : (p.a ?? 0) + (p.b ?? 0);

/** Touch a column to read it: the rest dims and the headline counts to its value. */
export function TrendTile({
  tile,
  locked = false,
  onLocked,
}: {
  tile: TrendTileVM;
  locked?: boolean;
  onLocked?: () => void;
}): React.ReactElement {
  const [hit, setHit] = React.useState<number | null>(null);
  const [width, setWidth] = React.useState(0);
  const point = hit === null ? null : (tile.points[hit] ?? null);
  const shown = useTween(point === null ? tile.total : totalOf(point), point === null ? 480 : 260);
  const [lo, hi] = tile.domain;
  const y = (v: number): number => ((v - lo) / (hi - lo || 1)) * PLOT;
  const n = Math.max(1, tile.points.length);
  const col = width / n;
  const every = Math.max(1, Math.ceil(tile.points.length / 4));
  const axis = tile.points.map((_, i) => i % every === 0 || i === tile.points.length - 1);
  const [first, second] = tile.series;
  const colourA = SERIES_COLOUR[first?.key ?? "primary"];
  const colourB = SERIES_COLOUR[second?.key ?? "primary"];
  const onLayout = (e: LayoutChangeEvent): void => setWidth(e.nativeEvent.layout.width);
  const dim = (i: number): number => (hit === null || hit === i ? 1 : 0.3);

  return (
    <View style={{ paddingVertical: 18, paddingHorizontal: 18, gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ ...monoLabel, fontSize: 13, letterSpacing: 1, color: colors.labelAccent }}>
          {tile.title}
        </Text>
        {tile.link !== null && (
          <Pressable
            hitSlop={10}
            accessibilityRole="link"
            onPress={() => (locked ? onLocked?.() : router.push(`/trend/${tile.link}`))}
          >
            <Text style={{ ...monoLabel, fontSize: 10, color: colors.azureInk }}>
              {t("trends.details")}
            </Text>
          </Pressable>
        )}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 8,
          height: 40,
        }}
      >
        <Text
          accessibilityLiveRegion="polite"
          style={{
            fontFamily: point === null ? fonts.display : fonts.displayHeavy,
            fontSize: 30,
            letterSpacing: -0.6,
            color: colors.gunmetal,
            fontVariant: ["tabular-nums"],
            transform: [{ scale: point === null ? 1 : 1.14 }],
            transformOrigin: "left bottom",
          }}
        >
          {shown === null ? "-" : `${tile.format(shown)}${tile.unit}`}
        </Text>
        {tile.delta !== null && point === null && (
          <Text
            numberOfLines={1}
            style={{
              ...monoLabel,
              textTransform: "none",
              letterSpacing: 0,
              flexShrink: 1,
              paddingBottom: 3,
            }}
          >
            {tile.delta}
          </Text>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={{ ...monoLabel, color: point === null ? colors.textSecondary : colors.labelAccent }}
      >
        {point?.label ?? tile.caption}
      </Text>
      <Text
        numberOfLines={1}
        style={{ fontFamily: fonts.sans, fontSize: 13, minHeight: 18, color: colors.textSecondary }}
      >
        {point === null ? tile.sub : (point.split ?? "")}
      </Text>
      {tile.series.length > 1 && (
        <View style={{ flexDirection: "row", gap: 14 }}>
          {tile.series.map((s) => (
            <View key={s.key} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  backgroundColor: SERIES_COLOUR[s.key],
                }}
              />
              <Text style={{ ...monoLabel, fontSize: 9 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
        <View style={{ width: Y_AXIS, height: PLOT + TOP }}>
          {tile.ticks.map((tick, i) => (
            <Text
              key={i}
              style={{
                position: "absolute",
                right: 0,
                top: TOP + (PLOT * i) / 2 - 6,
                fontFamily: fonts.monoMedium,
                fontSize: 9,
                color: colors.textSecondary,
              }}
            >
              {tick}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1 }} onLayout={onLayout}>
          <View style={{ height: PLOT + TOP }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: TOP + (PLOT * i) / 2,
                  height: 1,
                  backgroundColor: colors.lineOnLightSoft,
                }}
              />
            ))}
            {width > 0 && tile.chart === "line" && (
              <Svg width={width} height={PLOT + TOP} style={{ position: "absolute" }}>
                <Path
                  d={linePath(tile.points, col, (v) => TOP + PLOT - y(v))}
                  stroke={colourA}
                  strokeOpacity={hit === null ? 1 : 0.45}
                  strokeWidth={2}
                  fill="none"
                  strokeLinejoin="round"
                />
              </Svg>
            )}
            {width > 0 &&
              tile.points.map((p, i) => {
                const left = i * col;
                if (tile.chart === "line") {
                  if (p.a === null) return null;
                  const r = hit === i ? 6 : 3.5;
                  return (
                    <View
                      key={i}
                      style={{
                        position: "absolute",
                        left: left + col / 2 - r,
                        top: TOP + PLOT - y(p.a) - r,
                        width: r * 2,
                        height: r * 2,
                        borderRadius: r,
                        backgroundColor: colourA,
                        borderWidth: 2,
                        borderColor: colors.white,
                        opacity: dim(i),
                      }}
                    />
                  );
                }
                const a = p.a ?? 0;
                const b = tile.chart === "stack" ? (p.b ?? 0) : 0;
                const empty = a + b <= lo;
                const hA = empty ? 3 : a <= 0 ? 0 : Math.max(2, y(a));
                const hB = b <= 0 ? 0 : Math.max(2, y(lo + b));
                const gap = n > 16 ? 2 : 4;
                return (
                  <View
                    key={i}
                    style={{
                      position: "absolute",
                      left: left + gap / 2,
                      width: col - gap,
                      bottom: 0,
                      opacity: dim(i),
                      gap: hA > 0 && hB > 0 ? 2 : 0,
                    }}
                  >
                    {hB > 0 && (
                      <View
                        style={{
                          height: hB,
                          backgroundColor: colourB,
                          borderTopLeftRadius: 3,
                          borderTopRightRadius: 3,
                        }}
                      />
                    )}
                    {hA > 0 && (
                      <View
                        style={{
                          height: hA,
                          backgroundColor: empty ? colors.dataBarEmpty : colourA,
                          borderTopLeftRadius: hB > 0 ? 0 : 3,
                          borderTopRightRadius: hB > 0 ? 0 : 3,
                        }}
                      />
                    )}
                  </View>
                );
              })}
            {point !== null && hit !== null && totalOf(point) !== null && width > 0 && (
              <Text
                style={{
                  position: "absolute",
                  left: Math.min(width - 40, Math.max(0, hit * col + col / 2 - 20)),
                  width: 40,
                  textAlign: "center",
                  top: Math.max(0, TOP + PLOT - Math.max(3, y(totalOf(point)!)) - 18),
                  fontFamily: fonts.monoSemiBold,
                  fontSize: 11,
                  color: colors.gunmetal,
                }}
              >
                {tile.format(totalOf(point)!)}
              </Text>
            )}
            <View style={{ ...absoluteFill, flexDirection: "row" }}>
              {tile.points.map((p, i) => (
                <Pressable
                  key={i}
                  style={{ flex: 1 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.label}: ${totalOf(p) === null ? "-" : tile.format(totalOf(p)!)}`}
                  onPress={() => setHit((h) => (h === i ? null : i))}
                />
              ))}
            </View>
          </View>
          <View style={{ height: 18, borderTopWidth: 1, borderTopColor: colors.lineOnLight }}>
            {width > 0 &&
              tile.points.map((p, i) =>
                hit === i || (hit === null && axis[i]) ? (
                  <Text
                    key={i}
                    numberOfLines={1}
                    style={{
                      position: "absolute",
                      left: i * col + col / 2 - 26,
                      width: 52,
                      textAlign: "center",
                      paddingTop: 3,
                      fontFamily: hit === i ? fonts.monoSemiBold : fonts.monoMedium,
                      fontSize: 8,
                      textTransform: "uppercase",
                      color: hit === i ? colors.gunmetal : colors.textSecondary,
                    }}
                  >
                    {p.axis}
                  </Text>
                ) : null
              )}
          </View>
        </View>
      </View>
    </View>
  );
}

const absoluteFill = { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 } as const;

function linePath(points: TrendPointVM[], col: number, yOf: (v: number) => number): string {
  let d = "";
  let pen = false;
  points.forEach((p, i) => {
    if (p.a === null) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${(i * col + col / 2).toFixed(1)} ${yOf(p.a).toFixed(1)} `;
    pen = true;
  });
  return d;
}
