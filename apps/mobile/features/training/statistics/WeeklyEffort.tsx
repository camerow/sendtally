import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Path, Polyline } from "react-native-svg";
import { colors, effortColor } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { StatisticsOverviewVM } from "@sendtally/features/statistics";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { paddedRange } from "../trends/chartGeometry";
import { type } from "../type";
import { weekCentre } from "./weekColumns";

const HEIGHT = 90;
const PAD = 7;
const GRID = [0.25, 0.5, 0.75];

/** Weekly average effort across every kind, each week's dot in its effort colour. */
export function WeeklyEffort({ vm }: { vm: StatisticsOverviewVM }): React.ReactElement {
  const [width, setWidth] = React.useState(0);
  const scored = vm.weeks.flatMap((w, i) => (w.effort === null ? [] : [{ i, effort: w.effort }]));
  const [lo, hi] = paddedRange(
    scored.map((s) => s.effort),
    0.5
  );
  const points = scored.map((s) => ({
    x: weekCentre(s.i, vm.weeks.length, width),
    y: PAD + (HEIGHT - PAD * 2) * (1 - (s.effort - lo) / (hi - lo || 1)),
    effort: s.effort,
  }));
  return (
    <View
      style={{
        gap: 12,
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
      }}
    >
      <Label color={colors.gunmetal}>{t("statistics.averageEffort")}</Label>
      {vm.effortNow === null ? (
        <Text style={[type.body, { fontSize: 14, color: colors.textSecondary }]}>
          {t("statistics.noEffort")}
        </Text>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
            <Title size={40}>{vm.effortNow}</Title>
            {vm.effortChange !== null && (
              <Label
                color={colors.gunmetal}
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 6,
                  overflow: "hidden",
                  backgroundColor: colors.surfaceSoft,
                }}
              >
                {vm.effortChange}
              </Label>
            )}
          </View>
          <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
            {width > 0 && (
              <Svg
                width={width}
                height={HEIGHT}
                accessible
                accessibilityLabel={t("statistics.effortChart")}
              >
                <Path
                  d={GRID.map((g) => `M0 ${HEIGHT * g}H${width}`).join("")}
                  stroke={colors.lineOnLightSoft}
                  strokeWidth={1}
                />
                <Polyline
                  points={points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
                  fill="none"
                  stroke={colors.gunmetal}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                {points.map((p) => (
                  <Circle
                    key={p.x}
                    cx={p.x}
                    cy={p.y}
                    r={5}
                    fill={effortColor(p.effort)}
                    stroke={colors.white}
                    strokeWidth={2}
                  />
                ))}
              </Svg>
            )}
          </View>
        </>
      )}
    </View>
  );
}
