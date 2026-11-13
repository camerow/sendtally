import React from "react";
import { t } from "@sendtally/features/i18n";
import type { InsightsPointVM } from "@sendtally/features/statistics";
import { useWidth } from "../../../training/components/useWidth";

const HEIGHT = 96;
const PAD = 6;
const GRID = [0.25, 0.5, 0.75];

const LINES = [
  { key: "effort", label: () => t("common.effort"), color: "var(--bs-gunmetal)" },
  { key: "sessions", label: () => t("common.sessions"), color: "var(--bs-azure)" },
] as const;

/** Effort and sessions per bucket, each line on its own scale. */
export function InsightsChart({ points }: { points: InsightsPointVM[] }): React.ReactElement {
  const [box, width] = useWidth();
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
    <section className="stats-card stats-wide">
      <div className="insights-legend">
        {LINES.map((l) => (
          <span key={l.key} className="insights-legend-item">
            <span className="insights-legend-swatch" style={{ background: l.color }} />
            {l.label()}
          </span>
        ))}
      </div>
      <div ref={box} style={{ height: HEIGHT }}>
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label={t("statistics.chartLabel")}>
            <path
              d={GRID.map((g) => `M0 ${HEIGHT * g}H${width}`).join("")}
              stroke="var(--line-on-light-soft)"
              strokeWidth={1}
            />
            {LINES.map((l) => (
              <polyline
                key={l.key}
                points={line(l.key)}
                fill="none"
                stroke={l.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </svg>
        )}
      </div>
      {first !== undefined && last !== undefined && (
        <div className="insights-axis">
          <span>{first.axis}</span>
          <span>{last.axis}</span>
        </div>
      )}
    </section>
  );
}
