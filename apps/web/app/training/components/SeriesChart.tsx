import React from "react";
import { dots, paddedRange, plot, polyline } from "@sendtally/features/statistics";

const HEIGHT = 120;
const PAD = 12;

export type SeriesChartProps = {
  values: readonly number[];
  /** The least spread the value axis shows. */
  air: number;
  edge: (value: number) => string;
  label: string;
};

/** Values over time: filled dots with the latest in gold. */
export function SeriesChart({ values, air, edge, label }: SeriesChartProps): React.ReactElement {
  const box = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = box.current;
    if (el === null) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const [lo, hi] = paddedRange(values, air);
  const points = plot(values, lo, hi, width, HEIGHT, PAD);
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
            <path
              d={dots(points)}
              stroke="var(--bs-gunmetal)"
              strokeWidth={11}
              strokeLinecap="round"
            />
            <path
              d={dots(points.slice(-1))}
              stroke="var(--bs-gold)"
              strokeWidth={7}
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
