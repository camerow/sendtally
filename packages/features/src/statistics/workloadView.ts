import { colors, effortScale } from "@sendtally/design/tokens";
import { formatDate, formatNumber, t, type MessageKey } from "../i18n";
import { DAY_MS, bucketsFor, dayStart, wallClock, windowOf } from "../trends/buckets";
import type { TrendRange } from "../trends/types";
import type { Point } from "./chartGeometry";
import type { Done, DoneRef } from "./insights";
import {
  loadOf,
  workloadOn,
  workloadZone,
  type Workload,
  type WorkloadState,
  type WorkloadZone,
} from "./workload";

/** The plot's fixed top; a ratio above it sits on the edge, marked. */
export const WORKLOAD_MAX = 2;

/** The zone edges on the plot, bottom up. */
export const WORKLOAD_EDGES = [0.8, 1.3, 1.5] as const;

/** Each zone's tint behind gunmetal text; the much bigger week is orange, never the destructive red. */
export const WORKLOAD_TINTS: Record<WorkloadZone, string> = {
  light: colors.climbingTint,
  sweet: colors.strengthTint,
  caution: colors.surfaceSelected,
  high: `${effortScale[7]}40`,
};

/** The zones bottom up, each with its tint, its range on the plot and its legend range. */
export type WorkloadBandVM = {
  zone: WorkloadZone;
  label: string;
  range: string;
  lo: number;
  hi: number;
};

/** The zones bottom up, each with its range on the plot and in the legend. */
export function workloadBands(): WorkloadBandVM[] {
  const [a, b, c] = WORKLOAD_EDGES;
  const n = (x: number): string => formatNumber(x, { minimumFractionDigits: 1 });
  const band = (zone: WorkloadZone, lo: number, hi: number, range: string): WorkloadBandVM => ({
    zone,
    label: workloadZoneLabel(zone),
    range,
    lo,
    hi,
  });
  return [
    band("light", 0, a, t("statistics.workloadUnder", { n: n(a) })),
    band("sweet", a, b, t("statistics.workloadBetween", { from: n(a), to: n(b) })),
    band("caution", b, c, t("statistics.workloadBetween", { from: n(b), to: n(c) })),
    band("high", c, WORKLOAD_MAX, t("statistics.workloadOver", { n: n(c) })),
  ];
}

export const WORKLOAD_GUTTER = 36;
const PLOT_PAD = 10;

export type WorkloadPlot = {
  y: (ratio: number) => number;
  left: number;
  right: number;
  /** Runs of consecutive ratios, each its own polyline. */
  runs: Point[][];
  dots: Point[];
  /** Today's point, drawn in gold. */
  today: Point | null;
  /** Points above the plot's top, drawn on the edge with a marker. */
  over: Point[];
};

/** Where the ratio line sits in a `width` by `height` box with the value axis on the left. */
export function workloadPlot(
  points: readonly (number | null)[],
  width: number,
  height: number
): WorkloadPlot {
  const left = WORKLOAD_GUTTER;
  const right = width - 6;
  const y = (r: number): number =>
    PLOT_PAD + (height - PLOT_PAD * 2) * (1 - Math.min(r, WORKLOAD_MAX) / WORKLOAD_MAX);
  const x = (i: number): number =>
    left + 6 + (right - left - 12) * (points.length > 1 ? i / (points.length - 1) : 0.5);
  const runs: Point[][] = [];
  let run: Point[] = [];
  points.forEach((r, i) => {
    if (r === null) {
      if (run.length > 0) runs.push(run);
      run = [];
    } else run.push([x(i), y(r)]);
  });
  if (run.length > 0) runs.push(run);
  const last = points.at(-1);
  return {
    y,
    left,
    right,
    runs,
    dots: runs.flat(),
    today: last === null || last === undefined ? null : [x(points.length - 1), y(last)],
    over: points.flatMap((r, i): Point[] => (r !== null && r > WORKLOAD_MAX ? [[x(i), y(r)]] : [])),
  };
}

export type WorkloadLeftOutVM = { ref: DoneRef; detail: string };

/** A load with the days it covers and, when too much was left out, how much was counted. */
export type WorkloadTileVM = { label: string; value: string; note: string; counted: string | null };

export type WorkloadWeekVM = { label: string; load: number; value: string };

export type WorkloadVM = {
  state: WorkloadState;
  /** "1.12", only when there is a zone to go with it. */
  ratio: string | null;
  zone: WorkloadZone | null;
  /** The headline when there is no ratio: "Day 12 of 28", "Back after a break", "3 of 7 counted". */
  headline: string;
  sentence: string;
  /** Ratio per point, oldest first; `null` where the card has no ratio to show. */
  points: (number | null)[];
  from: string;
  /** Out of 28, for the early progress bar. */
  daysLogged: number;
  acute: string;
  /** `null` before four weeks, or after a break, where there is no average to give. */
  chronic: string | null;
  /** "2 not counted this week: no effort or time". */
  leftOutLine: string | null;
  sheet: {
    /** The last 7 days, then the average week unless there is none to give after a break. */
    tiles: WorkloadTileVM[];
    /** The division and zone, why there is no zone, or why there is no ratio yet. */
    footer: string;
    weeks: WorkloadWeekVM[];
    average: number;
    /** The dashed average line's own label, "1,480". */
    averageLabel: string;
    leftOut: WorkloadLeftOutVM[];
  };
};

const ZONE_KEYS: Record<WorkloadZone, { label: MessageKey; sentence: MessageKey }> = {
  light: { label: "statistics.workloadLight", sentence: "statistics.workloadLightLine" },
  sweet: { label: "statistics.workloadSweet", sentence: "statistics.workloadSweetLine" },
  caution: { label: "statistics.workloadCaution", sentence: "statistics.workloadCautionLine" },
  high: { label: "statistics.workloadHigh", sentence: "statistics.workloadHighLine" },
};

export const workloadZoneLabel = (zone: WorkloadZone): string => t(ZONE_KEYS[zone].label);

const load = (n: number): string => formatNumber(Math.round(n));

const ratioText = (n: number): string =>
  formatNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const shortDay = (ms: number): string =>
  formatDate(new Date(ms), { month: "short", day: "numeric", timeZone: "UTC" });

const counted = ({ total, leftOut }: Workload["week"]): string =>
  t("statistics.workloadCounted", { counted: total - leftOut, total });

function why(noEffort: boolean, noTime: boolean): string {
  if (noEffort && noTime) return t("statistics.workloadNoEither");
  return noEffort ? t("statistics.workloadNoEffort") : t("statistics.workloadNoTime");
}

const noEffort = (d: Done): boolean => d.rpe === null;
const noTime = (d: Done): boolean => d.minutes <= 0;

function leftOutLine(left: readonly Done[]): string | null {
  if (left.length === 0) return null;
  const reason = why(left.some(noEffort), left.some(noTime));
  return t("statistics.workloadLeftOut", { count: left.length, why: reason });
}

function tiles(w: Workload, today: number): WorkloadTileVM[] {
  const partial = w.state === "partial";
  const span = (days: number): string =>
    t("statistics.workloadSpan", {
      from: shortDay(today - (days - 1) * DAY_MS),
      to: shortDay(today),
    });
  const week: WorkloadTileVM = {
    label: t("statistics.workloadLast7"),
    value: load(w.acute),
    note: span(7),
    counted: partial ? counted(w.week) : null,
  };
  if (w.state === "break") return [week];
  return [
    week,
    {
      label: t("statistics.workloadAverage"),
      value: w.state === "early" ? t("statistics.workloadAfter4") : load(w.chronic),
      note: `${span(28)} ÷ 4`,
      counted: partial ? counted(w.month) : null,
    },
  ];
}

function footer(w: Workload, zone: WorkloadZone | null, line: string): string {
  if (zone !== null && w.ratio !== null)
    return `${load(w.acute)} ÷ ${load(w.chronic)} = ${ratioText(w.ratio)} · ${workloadZoneLabel(zone)}`;
  return w.state === "partial" ? t("statistics.workloadNoZone") : line;
}

function headline(w: Workload): string {
  if (w.state === "partial") return counted(w.week.leftOut > 0 ? w.week : w.month);
  if (w.state === "early") return t("statistics.workloadDay", { day: 28 - w.daysToGo });
  return t("statistics.workloadBreak");
}

function sentence(w: Workload, zone: WorkloadZone | null): string {
  if (zone !== null)
    return w.acute === 0 ? t("statistics.workloadRestLine") : t(ZONE_KEYS[zone].sentence);
  if (w.state === "partial") return t("statistics.workloadPartialLine");
  if (w.state === "early") return t("statistics.workloadEarlyLine");
  return t("statistics.workloadBreakLine");
}

/** The days a range plots: one a day on 7D and 1M, one a week beyond, ending today. */
function plotDays(range: TrendRange, now: Date, first: number | null): number[] {
  const { start, end } = windowOf(bucketsFor(range, now, first));
  const step = range === "7d" || range === "1m" ? DAY_MS : 7 * DAY_MS;
  const last = Math.min(dayStart(wallClock(now)), end - DAY_MS);
  const from = range === "1m" ? last - 27 * DAY_MS : start;
  const days: number[] = [];
  for (let d = last; d >= from; d -= step) days.unshift(d);
  return days;
}

/** The workload card and its sheet: today's ratio and zone, the line over the range, and the loads behind it. */
export function workloadVM(done: readonly Done[], range: TrendRange, now: Date): WorkloadVM {
  const today = dayStart(wallClock(now));
  const w = workloadOn(done, today);
  const zone = w.state === "ratio" && w.ratio !== null ? workloadZone(w.ratio) : null;
  const first = done.length === 0 ? null : Math.min(...done.map((d) => d.at));
  const days = plotDays(range, now, first);
  const lastWeek = done.filter((d) => d.at >= today - 6 * DAY_MS && d.at < today + DAY_MS);
  const left = lastWeek.filter((d) => loadOf(d) === null).sort((a, b) => b.at - a.at);
  const said = sentence(w, zone);
  return {
    state: w.state,
    ratio: zone === null || w.ratio === null ? null : ratioText(w.ratio),
    zone,
    headline: zone === null ? headline(w) : "",
    sentence: said,
    points: days.map((day) => {
      const p = workloadOn(done, day);
      return p.state === "ratio" ? p.ratio : null;
    }),
    from: days[0] === undefined ? "" : shortDay(days[0]),
    daysLogged: 28 - w.daysToGo,
    acute: load(w.acute),
    chronic: w.state === "early" || w.state === "break" ? null : load(w.chronic),
    leftOutLine: leftOutLine(left),
    sheet: {
      tiles: tiles(w, today),
      footer: footer(w, zone, said),
      weeks: w.weeks.map((n, i) => ({
        label: i === 3 ? t("statistics.workloadLast7") : shortDay(today - (27 - i * 7) * DAY_MS),
        load: n,
        value: load(n),
      })),
      average: w.chronic,
      averageLabel: load(w.chronic),
      leftOut: left.map((d) => ({
        ref: d.ref,
        detail: `${shortDay(d.at)} · ${why(noEffort(d), noTime(d))}`,
      })),
    },
  };
}
