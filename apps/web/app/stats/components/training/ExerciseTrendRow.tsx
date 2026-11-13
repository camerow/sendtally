import React from "react";
import { Link } from "react-router";
import type { WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  SPARK_HEIGHT,
  SPARK_WIDTH,
  dots,
  polyline,
  sparkPoints,
  trendChange,
  type ExerciseTrendVM,
} from "@sendtally/features/statistics";
import { Icon } from "../../../components/Icon";

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
  const points = sparkPoints(row.values);
  const tone = row.change > 0 ? "var(--bs-fern)" : "rgba(64,63,76,0.55)";
  const change = trendChange(row, unit);
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
