import React from "react";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  WORKLOAD_EDGES,
  WORKLOAD_GUTTER,
  WORKLOAD_TICKS,
  WORKLOAD_TINTS,
  polyline,
  workloadBands,
  workloadPlot,
} from "@sendtally/features/statistics";
import { useWidth } from "../../../training/components/useWidth";

const HEIGHT = 132;

/** The ratio a day over the window on a log axis against the four zones, rest days in their own lane, today in gold. */
export function WorkloadChart({
  points,
  from,
  weeks,
}: {
  points: readonly (number | null)[];
  from: string;
  weeks: number;
}): React.ReactElement {
  const [box, width] = useWidth();
  const plot = workloadPlot(points, width, HEIGHT);
  const bands = workloadBands();
  const label = (y: number, text: string, strong = false): React.ReactElement => (
    <text
      key={text}
      x={WORKLOAD_GUTTER - 6}
      y={y + 3.5}
      textAnchor="end"
      fontFamily="var(--font-mono)"
      fontWeight={strong ? 600 : 400}
      fontSize={10}
      fill={strong ? colors.gunmetal : colors.textSecondary}
    >
      {text}
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
            aria-label={t("statistics.workloadChartLabel", { weeks })}
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
            {WORKLOAD_TICKS.map((v) => label(plot.y(v), v.toFixed(1), v === 1))}
            {label(plot.restY, t("statistics.workloadRest"))}
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
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
            ))}
            {plot.lone.map(([x, y]) => (
              <circle key={`l${x}`} cx={x} cy={y} r={1.5} fill={colors.gunmetal} />
            ))}
            {plot.rest.map(([x1, x2]) => (
              <line
                key={`r${x1}`}
                x1={x1}
                x2={x2}
                y1={plot.restY}
                y2={plot.restY}
                stroke={colors.gunmetal}
                strokeWidth={2.4}
                strokeLinecap="round"
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
