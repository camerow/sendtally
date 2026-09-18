import { formatNumber, t } from "../i18n";
import type { Bucket } from "./buckets";
import type { Ladder } from "./slice";
import type {
  TrendChart,
  TrendPage,
  TrendPointVM,
  TrendSeriesVM,
  TrendTileId,
  TrendTileVM,
} from "./types";

/** How a number reads, and how its change against the prior period reads. */
export type Kind = "count" | "pct" | "grade" | "gradeAvg" | "decimal" | "hours";

export function formatter(kind: Kind, ladder: Ladder): (value: number) => string {
  switch (kind) {
    case "count":
      return (v) => formatNumber(Math.round(v));
    case "pct":
      return (v) => formatNumber(Math.round(v) / 100, { style: "percent" });
    case "grade":
      return (v) => ladder.label(Math.round(v));
    case "gradeAvg":
      return (v) => ladder.average(v);
    case "decimal":
      return (v) => formatNumber(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    case "hours":
      return (v) => t("trends.hoursValue", { n: formatNumber(Math.round(v)) });
  }
}

const oneDecimal = (n: number): string =>
  formatNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** `short` drops "vs prior period" for a table column that already says what it compares. */
export function delta(
  kind: Kind,
  current: number | null,
  prior: number | null,
  short = false
): string | null {
  if (current === null || prior === null) return null;
  const diff = current - prior;
  let amount: string;
  let level: boolean;
  if (kind === "count" || kind === "hours") {
    if (prior === 0) return null;
    const pct = Math.abs(Math.round((diff / prior) * 100));
    level = pct === 0;
    amount = t("trends.deltaPercent", { n: formatNumber(pct) });
  } else if (kind === "pct") {
    const pts = Math.abs(Math.round(diff));
    level = pts === 0;
    amount = t("trends.deltaPoints", { count: pts, n: formatNumber(pts) });
  } else if (kind === "grade" || kind === "gradeAvg") {
    const steps = Math.round(Math.abs(diff) * 10) / 10;
    level = steps === 0;
    const n = Number.isInteger(steps) ? formatNumber(steps) : oneDecimal(steps);
    amount = t("trends.deltaGrades", { count: steps, n });
  } else {
    const d = Math.round(Math.abs(diff) * 10) / 10;
    level = d === 0;
    amount = oneDecimal(d);
  }
  if (level) return short ? t("trends.deltaLevelShort") : t("trends.deltaLevel");
  if (short) return t(diff > 0 ? "trends.deltaUpShort" : "trends.deltaDownShort", { amount });
  return t(diff > 0 ? "trends.deltaUp" : "trends.deltaDown", { amount });
}

function isGradeKind(kind: Kind): boolean {
  return kind === "grade" || kind === "gradeAvg";
}

function domainOf(
  kind: Kind,
  chart: TrendChart,
  points: TrendPointVM[],
  fixed?: readonly [number, number]
): readonly [number, number] {
  if (fixed !== undefined) return fixed;
  const values = points
    .map((p) => (p.a === null && p.b === null ? null : (p.a ?? 0) + (p.b ?? 0)))
    .filter((v): v is number => v !== null);
  if (isGradeKind(kind)) {
    if (values.length === 0) return [0, 1];
    return [Math.max(0, Math.floor(Math.min(...values)) - 1), Math.ceil(Math.max(...values)) + 1];
  }
  const max = Math.max(0, ...values);
  return [0, Math.max(1, chart === "line" ? max * 1.15 : max)];
}

export type TileSpec = {
  id: TrendTileId;
  title: string;
  chart: TrendChart;
  kind: Kind;
  ladder: Ladder;
  total: number | null;
  prior?: number | null;
  caption: string;
  sub?: string;
  unit?: string;
  series?: TrendSeriesVM[];
  /** A stacked bucket's readout, "12 sent · 7 not yet". */
  split?: (a: number, b: number) => string;
  points: Array<{ a: number | null; b?: number | null; axis: string; label: string }>;
  domain?: readonly [number, number];
  link?: TrendPage;
};

export function tile(spec: TileSpec): TrendTileVM {
  const format = formatter(spec.kind, spec.ladder);
  const stacked = spec.chart === "stack";
  const points: TrendPointVM[] = spec.points.map((p) => {
    const b = p.b ?? null;
    return {
      a: p.a,
      b,
      axis: p.axis,
      label: p.label,
      split: stacked && spec.split !== undefined ? spec.split(p.a ?? 0, b ?? 0) : null,
    };
  });
  const domain = domainOf(spec.kind, spec.chart, points, spec.domain);
  const [lo, hi] = domain;
  const tick = (v: number): string => format(isGradeKind(spec.kind) ? Math.round(v) : v);
  return {
    id: spec.id,
    title: spec.title,
    chart: spec.chart,
    total: spec.total,
    format,
    unit: spec.unit ?? "",
    caption: spec.caption,
    sub: spec.sub ?? "",
    delta: spec.prior === undefined ? null : delta(spec.kind, spec.total, spec.prior),
    series: spec.series ?? [{ key: "primary", label: spec.title }],
    points,
    domain,
    ticks: [tick(hi), tick((hi + lo) / 2), tick(lo)],
    link: spec.link ?? null,
  };
}

export function pointsOver<T>(
  buckets: Bucket[],
  per: T[],
  a: (x: T) => number | null,
  b?: (x: T) => number | null
): TileSpec["points"] {
  return buckets.map((bucket, i) => ({
    a: a(per[i]!),
    ...(b === undefined ? {} : { b: b(per[i]!) }),
    axis: bucket.axis,
    label: bucket.label,
  }));
}

/** Every chart axis names at most seven ticks, and always the latest one. */
export function thinned(points: TrendPointVM[]): boolean[] {
  const every = Math.max(1, Math.ceil(points.length / 7));
  return points.map((_, i) => i % every === 0 || i === points.length - 1);
}
