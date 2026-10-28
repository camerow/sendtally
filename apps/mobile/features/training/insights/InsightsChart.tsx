import React from "react";
import { Text, View } from "react-native";
import Svg, { Path, Polyline } from "react-native-svg";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { InsightsPointVM } from "@sendtally/features/statistics";
import { type } from "../type";

const HEIGHT = 96;
const PAD = 6;
const GRID = [0.25, 0.5, 0.75];

const LINES = [
  { key: "effort", label: () => t("common.effort"), color: colors.gunmetal },
  { key: "sessions", label: () => t("common.sessions"), color: colors.azure },
] as const;

/** Effort and sessions per bucket, each line on its own scale. */
export function InsightsChart({ points }: { points: InsightsPointVM[] }): React.ReactElement {
  const [width, setWidth] = React.useState(0);
  const most = Math.max(1, ...points.map((p) => p.sessions));
  const x = (i: number): number =>
    PAD + (width - PAD * 2) * (points.length > 1 ? i / (points.length - 1) : 0.5);
  const y = (share: number): number => PAD + (HEIGHT - PAD * 2) * (1 - share);
  const line = (key: "effort" | "sessions"): string =>
    points
      .flatMap((p, i) => {
        const v = key === "effort" ? (p.effort === null ? null : p.effort / 10) : p.sessions / most;
        return v === null ? [] : [`${x(i).toFixed(1)},${y(v).toFixed(1)}`];
      })
      .join(" ");
  const first = points[0];
  const last = points.at(-1);

  return (
    <View
      style={{
        gap: 8,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
      }}
    >
      <View style={{ flexDirection: "row", gap: 14 }}>
        {LINES.map((l) => (
          <View key={l.key} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 10, height: 3, borderRadius: 2, backgroundColor: l.color }} />
            <Text style={[type.body, { fontSize: 11.5, color: colors.textSecondary }]}>
              {l.label()}
            </Text>
          </View>
        ))}
      </View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
        {width > 0 && (
          <Svg
            width={width}
            height={HEIGHT}
            accessible
            accessibilityLabel={t("statistics.chartLabel")}
          >
            <Path
              d={GRID.map((g) => `M0 ${HEIGHT * g}H${width}`).join("")}
              stroke={colors.lineOnLightSoft}
              strokeWidth={1}
            />
            {LINES.map((l) => (
              <Polyline
                key={l.key}
                points={line(l.key)}
                fill="none"
                stroke={l.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </Svg>
        )}
      </View>
      {first !== undefined && last !== undefined && (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={[type.mono, { fontSize: 10, color: colors.textSecondary }]}>
            {first.axis}
          </Text>
          <Text style={[type.mono, { fontSize: 10, color: colors.textSecondary }]}>
            {last.axis}
          </Text>
        </View>
      )}
    </View>
  );
}
