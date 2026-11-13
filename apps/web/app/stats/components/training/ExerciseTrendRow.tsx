import React from "react";
import { Link } from "react-router";
import type { WeightUnit } from "@sendtally/core/hang";
import { metricText } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { dots, plot, polyline, type ExerciseTrendVM } from "@sendtally/features/statistics";
import { Icon } from "../../../components/Icon";

const SPARK = 6;
const SPARK_WIDTH = 34;
const SPARK_HEIGHT = 20;
const SPARK_PAD = 3;

/** "+6 kg": the change since the first time in range, in what the exercise is measured in; nothing when it did not move. */
export function changeText(row: ExerciseTrendVM, unit: WeightUnit): string {
  if (row.change === 0 || row.count < 2) return "";
  return `${row.change < 0 ? "−" : "+"}${metricText(Math.abs(row.change), row.metric, unit)}`;
}

/** An exercise: how often, its last few bests as a line, and how much it moved; it opens its trend. */
export function ExerciseTrendRow({
  row,
  unit,
  to,
}: {
  row: ExerciseTrendVM;
  unit: WeightUnit;
  to?: string;
}): React.ReactElement {
  const values = row.values.slice(-SPARK);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const flat = lo === hi;
  const points = plot(
    values,
    flat ? lo - 1 : lo,
    flat ? hi + 1 : hi,
    SPARK_WIDTH,
    SPARK_HEIGHT,
    SPARK_PAD
  );
  const tone = row.change > 0 ? "var(--bs-fern)" : "rgba(64,63,76,0.55)";
  const change = changeText(row, unit);
  const count = t("statistics.timesCount", { count: row.count });
  const body = (
    <>
      <span className="trend-row-text">
        <span className="trend-row-name">{row.name}</span>
        <span className="trend-row-meta">{row.meta ?? count}</span>
      </span>
      {points.length < 2 ? (
        <span style={{ width: SPARK_WIDTH }} />
      ) : (
        <svg width={SPARK_WIDTH} height={SPARK_HEIGHT} aria-hidden="true">
          <polyline
            points={polyline(points)}
            fill="none"
            stroke="var(--line-on-light-strong)"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <path
            d={dots(points.slice(-1))}
            stroke={tone}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
      <span className="trend-row-change" style={{ color: tone }}>
        {change}
      </span>
    </>
  );
  const label = [row.name, count, change].filter(Boolean).join(", ");
  return to === undefined ? (
    <div className="trend-row" aria-label={label}>
      {body}
    </div>
  ) : (
    <Link to={to} className="trend-row trend-row--link" aria-label={label}>
      {body}
      <Icon name="chevron" size={16} strokeWidth={2} />
    </Link>
  );
}
