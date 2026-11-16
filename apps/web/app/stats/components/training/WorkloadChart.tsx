import React from "react";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  WORKLOAD_EDGES,
  WORKLOAD_GUTTER,
  WORKLOAD_TINTS,
  polyline,
  workloadBands,
  workloadPlot,
} from "@sendtally/features/statistics";
import { useWidth } from "../../../training/components/useWidth";

const HEIGHT = 132;

/** The ratio over the range against the four zones, today in gold, gaps where there is no ratio. */
export function WorkloadChart({
  points,
  from,
}: {
  points: readonly (number | null)[];
  from: string;
}): React.ReactElement {
  const [box, width] = useWidth();
  const plot = workloadPlot(points, width, HEIGHT);
  const bands = workloadBands();
  const tick = (value: number, strong = false): React.ReactElement => (
    <text
      key={`t${value}`}
      x={WORKLOAD_GUTTER - 6}
      y={plot.y(value) + 3.5}
      textAnchor="end"
      fontFamily="var(--font-mono)"
      fontWeight={strong ? 600 : 400}
      fontSize={10}
      fill={strong ? colors.gunmetal : colors.textSecondary}
    >
      {value.toFixed(1)}
    </text>
  );

  return (
    <>
      <div ref={box} style={{ height: HEIGHT }}>
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={t("statistics.workloadChartLabel")}
          >
            {bands.map((b) => (
              <rect
                key={b.zone}
                x={plot.left}
                y={plot.y(b.hi)}
                width={plot.right - plot.left}
                height={plot.y(b.lo) - plot.y(b.hi)}
                fill={WORKLOAD_TINTS[b.zone]}
              />
            ))}
            {WORKLOAD_EDGES.map((edge) => (
              <line
                key={edge}
                x1={plot.left}
                x2={plot.right}
                y1={plot.y(edge)}
                y2={plot.y(edge)}
                stroke={colors.dataBarEmpty}
                strokeDasharray="2 3"
              />
            ))}
            {tick(WORKLOAD_EDGES[2])}
            {tick(1, true)}
            <line
              x1={plot.left}
              x2={plot.right}
              y1={plot.y(1)}
              y2={plot.y(1)}
              stroke={colors.lineOnLightStrong}
            />
            {plot.runs.map((run) => (
              <polyline
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
                <circle key={x} cx={x} cy={y} r={3.2} fill={colors.gunmetal} />
              ))}
            {plot.over.map(([x, y]) => (
              <path
                key={`o${x}`}
                d={`M${x - 4} ${y - 4}L${x} ${y - 9}L${x + 4} ${y - 4}`}
                fill={colors.gunmetal}
              />
            ))}
            {plot.today !== null && (
              <circle
                cx={plot.today[0]}
                cy={plot.today[1]}
                r={5}
                fill={colors.gold}
                stroke={colors.gunmetal}
                strokeWidth={2}
              />
            )}
          </svg>
        )}
      </div>
      <div className="insights-axis workload-axis" style={{ paddingLeft: WORKLOAD_GUTTER }}>
        <span>{from}</span>
        <span>{t("statistics.workloadToday")}</span>
      </div>
      <div className="workload-legend">
        {bands.map((b) => (
          <span key={b.zone} className="workload-legend-item">
            <span className="workload-swatch" style={{ background: WORKLOAD_TINTS[b.zone] }} />
            {b.label} <span className="workload-mono">{b.range}</span>
          </span>
        ))}
      </div>
    </>
  );
}
