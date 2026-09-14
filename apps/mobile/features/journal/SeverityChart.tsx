import React from "react";
import { useWindowDimensions } from "react-native";
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";
import { t } from "@sendtally/features/i18n";
import { dayLabel, type SeverityPoint } from "@sendtally/features/journal";
import { colors, fonts } from "@sendtally/design/tokens";

const H = 168;
const LEFT = 34;
const TOP = 20;
const BOTTOM = 120;

const y = (severity: number): number => BOTTOM - (severity / 10) * (BOTTOM - TOP);

/**
 * One series, so no legend - the heading names it, and both ends carry their
 * number. The grey band underneath is sessions climbed in the same week.
 */
export function SeverityChart({
  points,
  sessionsPerPoint,
}: {
  points: SeverityPoint[];
  sessionsPerPoint: number[];
}): React.ReactElement | null {
  const { width } = useWindowDimensions();
  if (points.length < 2) return null;

  // The card is the screen minus its own and the page's padding.
  const w = width - 36 - 32;
  const right = w - 30;
  const step = (right - LEFT) / (points.length - 1);
  const at = (i: number): number => LEFT + step * i;
  const busiest = Math.max(1, ...sessionsPerPoint);
  const first = points[0]!;
  const last = points[points.length - 1]!;

  return (
    <Svg
      width={w}
      height={H}
      accessibilityRole="image"
      accessibilityLabel={t("journal.severityValue", { n: last.severity })}
    >
      {[10, 5, 0].map((value) => (
        <React.Fragment key={value}>
          <Line
            x1={LEFT}
            y1={y(value)}
            x2={right + 10}
            y2={y(value)}
            stroke={value === 0 ? "rgba(64,63,76,0.16)" : "rgba(64,63,76,0.08)"}
            strokeWidth={1}
          />
          <SvgText
            x={LEFT - 12}
            y={y(value) + 4}
            textAnchor="end"
            fontFamily={fonts.mono}
            fontSize={10}
            fill={colors.textFaint}
          >
            {value}
          </SvgText>
        </React.Fragment>
      ))}

      {sessionsPerPoint.map((count, i) => (
        <Rect
          key={`band-${i}`}
          x={at(i) - 16}
          y={BOTTOM + 8}
          width={32}
          height={8}
          rx={4}
          fill={`rgba(64,63,76,${(0.1 + (count / busiest) * 0.24).toFixed(3)})`}
        />
      ))}

      <Polyline
        points={points.map((p, i) => `${at(i)},${y(p.severity)}`).join(" ")}
        fill="none"
        stroke={colors.watermelonInk}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <Circle
          key={i}
          cx={at(i)}
          cy={y(p.severity)}
          r={i === points.length - 1 ? 6.5 : 5}
          fill={colors.watermelonInk}
          stroke={colors.white}
          strokeWidth={i === points.length - 1 ? 2.5 : 2}
        />
      ))}

      {[first, last].map((p, i) => (
        <React.Fragment key={`end-${i}`}>
          <SvgText
            x={i === 0 ? LEFT : right}
            y={y(p.severity) - 12}
            textAnchor="middle"
            fontFamily={fonts.monoSemiBold}
            fontSize={11}
            fill={colors.gunmetal}
          >
            {p.severity}
          </SvgText>
          <SvgText
            x={i === 0 ? LEFT : right}
            y={H - 10}
            textAnchor="middle"
            fontFamily={fonts.mono}
            fontSize={10}
            fill={colors.textMuted}
          >
            {dayLabel(p.at)}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}
