import React from "react";
import { t } from "@sendtally/features/i18n";
import { dayLabel, type SeverityPoint } from "@sendtally/features/journal";

const W = 600;
const H = 168;
const LEFT = 40;
const RIGHT = 570;
const TOP = 20;
const BOTTOM = 120;

const y = (severity: number): number => BOTTOM - (severity / 10) * (BOTTOM - TOP);

/**
 * One series, so no legend - the heading names it, and both ends carry their
 * number. The grey band underneath is sessions climbed in the same week, which
 * is the only thing that tells a settling injury from a stopped one.
 */
export function SeverityChart({
  points,
  sessionsPerPoint,
}: {
  points: SeverityPoint[];
  sessionsPerPoint: number[];
}): React.ReactElement | null {
  if (points.length < 2) return null;

  const step = points.length === 1 ? 0 : (RIGHT - LEFT) / (points.length - 1);
  const at = (i: number): number => LEFT + step * i;
  const busiest = Math.max(1, ...sessionsPerPoint);
  const first = points[0]!;
  const last = points[points.length - 1]!;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={200}
      role="img"
      aria-label={t("journal.severityValue", { n: last.severity })}
    >
      {[10, 5, 0].map((value) => (
        <line
          key={value}
          x1={LEFT}
          y1={y(value)}
          x2={RIGHT + 10}
          y2={y(value)}
          stroke={value === 0 ? "rgba(64,63,76,0.16)" : "rgba(64,63,76,0.08)"}
          strokeWidth={1}
        />
      ))}
      {[10, 5, 0].map((value) => (
        <text
          key={value}
          x={LEFT - 16}
          y={y(value) + 4}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize={10}
          fill="rgba(64,63,76,0.45)"
        >
          {value}
        </text>
      ))}

      {sessionsPerPoint.map((count, i) => (
        <rect
          key={`band-${i}`}
          x={at(i) - 18}
          y={BOTTOM + 8}
          width={36}
          height={8}
          rx={4}
          fill={`rgba(64,63,76,${(0.1 + (count / busiest) * 0.24).toFixed(3)})`}
        />
      ))}

      <polyline
        points={points.map((p, i) => `${at(i)},${y(p.severity)}`).join(" ")}
        fill="none"
        stroke="var(--bs-watermelon-ink)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={at(i)}
          cy={y(p.severity)}
          r={i === points.length - 1 ? 6.5 : 5}
          fill="var(--bs-watermelon-ink)"
          stroke="var(--bs-white)"
          strokeWidth={i === points.length - 1 ? 2.5 : 2}
        />
      ))}

      <text
        x={LEFT}
        y={y(first.severity) - 12}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontWeight={600}
        fontSize={11}
        fill="var(--bs-gunmetal)"
      >
        {first.severity}
      </text>
      <text
        x={RIGHT}
        y={y(last.severity) - 12}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontWeight={600}
        fontSize={11}
        fill="var(--bs-gunmetal)"
      >
        {last.severity}
      </text>

      <text
        x={LEFT}
        y={H - 10}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="rgba(64,63,76,0.55)"
      >
        {dayLabel(first.at)}
      </text>
      <text
        x={RIGHT}
        y={H - 10}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="rgba(64,63,76,0.55)"
      >
        {dayLabel(last.at)}
      </text>
    </svg>
  );
}
