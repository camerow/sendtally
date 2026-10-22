export type Point = [number, number];

/** Evenly spaced points for `values`, scaled into the box between `lo` and `hi`. */
export function plot(
  values: readonly number[],
  lo: number,
  hi: number,
  width: number,
  height: number,
  pad: number
): Point[] {
  const n = values.length;
  return values.map((v, i) => [
    pad + (width - pad * 2) * (n > 1 ? i / (n - 1) : 0.5),
    pad + (height - pad * 2) * (1 - (v - lo) / (hi - lo || 1)),
  ]);
}

export const polyline = (points: readonly Point[]): string =>
  points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** Zero-length round-capped strokes: one dot per point. */
export const dots = (points: readonly Point[]): string =>
  points.map(([x, y]) => `M${x.toFixed(1)} ${y.toFixed(1)}h0`).join("");

export function area(points: readonly Point[], floor: number): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (first === undefined || last === undefined) return "";
  const line = points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L");
  return `M${first[0].toFixed(1)} ${floor}L${line}L${last[0].toFixed(1)} ${floor}Z`;
}

/** The value range with some air when the loads barely move. */
export function paddedRange(values: readonly number[], pad: number): [number, number] {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return hi - lo < pad * 2 ? [lo - pad, hi + pad] : [lo, hi];
}
