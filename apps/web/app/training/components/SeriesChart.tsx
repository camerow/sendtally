import React from "react";
import { dots, paddedRange, plot, polyline } from "@sendtally/features/statistics";
import { useWidth } from "./useWidth";

const HEIGHT = 120;
const PAD = 12;

export type SeriesChartProps = {
  values: readonly number[];
  /** Points drawn as rings: partial or only attempted. */
  hollow?: readonly boolean[];
  /** The least spread the value axis shows. */
  air: number;
  edge: (value: number) => string;
  label: string;
  /** The point drawn in gold; the latest unless given. */
  marked?: number;
};

/** Values over time: filled dots, hollow ones for partials, the latest or the marked one in gold. */
export function SeriesChart({
  values,
  hollow = [],
  air,
  edge,
  label,
  marked = values.length - 1,
}: SeriesChartProps): React.ReactElement {
  const [box, width] = useWidth();
  const [lo, hi] = paddedRange(values, air);
  const points = plot(values, lo, hi, width, HEIGHT, PAD);
  const partial = points.filter((_, i) => hollow[i] === true);
  const gold = points.slice(marked, marked + 1);
  const dot = (d: string, stroke: string, size: number): React.ReactElement => (
    <path d={d} stroke={stroke} strokeWidth={size} strokeLinecap="round" />
  );
  return (
    <div className="series-chart">
      <div className="series-axis">
        <span>{edge(hi)}</span>
        <span>{edge(lo)}</span>
      </div>
      <div ref={box} className="series-plot">
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label={label}>
            <path
              d={`M0 ${PAD}H${width}M0 ${HEIGHT - PAD}H${width}`}
              stroke="var(--line-on-light)"
              fill="none"
            />
            <polyline
              points={polyline(points)}
              fill="none"
              stroke="var(--bs-gunmetal)"
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {dot(dots(points), "var(--bs-gunmetal)", 11)}
            {dot(dots(partial), "var(--bs-white)", 7)}
            {dot(dots(gold), "var(--bs-gold)", 7)}
          </svg>
        )}
      </div>
    </div>
  );
}
