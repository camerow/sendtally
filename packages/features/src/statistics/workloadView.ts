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

/** The plot's floor and top on a log scale centred on 1.0; 4.0 is the most a ratio can be. */
export const WORKLOAD_FLOOR = 0.25;
export const WORKLOAD_CEIL = 4;

/** Half and double sit the same distance from 1.0. */
export const WORKLOAD_TICKS = [0.5, 1, 2, 4] as const;

/** Under this many points, the card says it in words with no chart. */
const MIN_POINTS = 4;

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
    band("light", WORKLOAD_FLOOR, a, t("statistics.workloadUnder", { n: n(a) })),
    band("sweet", a, b, t("statistics.workloadBetween", { from: n(a), to: n(b) })),
    band("caution", b, c, t("statistics.workloadBetween", { from: n(b), to: n(c) })),
    band("high", c, WORKLOAD_CEIL, t("statistics.workloadOver", { n: n(c) })),
  ];
}

export const WORKLOAD_GUTTER = 36;
const PLOT_PAD = 10;
const REST_LANE = 18;

export type WorkloadPlot = {
  y: (ratio: number) => number;
  left: number;
  right: number;
  /** Where a week with nothing logged sits, in its own lane under the plot. */
  restY: number;
  /** Runs of consecutive ratios above 0, each its own thin line. */
  runs: Point[][];
  dots: Point[];
  /** Up to 3.2, smaller where weekly points crowd a phone so neighbours never touch. */
  dotRadius: number;
  /** Rest weeks, drawn as hollow dots in the rest lane. */
  rest: Point[];
  restRadius: number;
  /** Today's point, drawn in gold. */
  today: Point | null;
};

const LOG_SPAN = Math.log2(WORKLOAD_CEIL / WORKLOAD_FLOOR);

/** Where the ratio line sits in a `width` by `height` box with the value axis on the left. */
export function workloadPlot(
  points: readonly (number | null)[],
  width: number,
  height: number
): WorkloadPlot {
  const left = WORKLOAD_GUTTER;
  const right = width - 6;
  const bottom = height - PLOT_PAD - REST_LANE;
  const restY = height - PLOT_PAD - 2;
  const y = (r: number): number =>
    PLOT_PAD +
    (bottom - PLOT_PAD) *
      (1 -
        Math.log2(Math.min(Math.max(r, WORKLOAD_FLOOR), WORKLOAD_CEIL) / WORKLOAD_FLOOR) /
          LOG_SPAN);
  const span = right - left - 12;
  const x = (i: number): number =>
    left + 6 + span * (points.length > 1 ? i / (points.length - 1) : 0.5);
  const at = (r: number, i: number): Point => [x(i), r === 0 ? restY : y(r)];
  const runs: Point[][] = [];
  let run: Point[] = [];
  points.forEach((r, i) => {
    if (r === null || r === 0) {
      if (run.length > 0) runs.push(run);
      run = [];
    } else run.push(at(r, i));
  });
  if (run.length > 0) runs.push(run);
  const last = points.at(-1);
  const dotRadius = Math.min(3.2, Math.max(1.5, span / Math.max(points.length - 1, 1) / 3));
  return {
    y,
    left,
    right,
    restY,
    runs: runs.filter((r) => r.length > 1),
    dots: runs.flat(),
    dotRadius,
    restRadius: dotRadius * 0.72,
    rest: points.flatMap((r, i): Point[] => (r === 0 ? [at(0, i)] : [])),
    today: last === null || last === undefined ? null : at(last, points.length - 1),
  };
}

/** What a left-out record lacks, so its row can open the field that fills it. */
export type WorkloadMissing = "effort" | "time" | "both";

export type WorkloadLeftOutVM = { ref: DoneRef; missing: WorkloadMissing; detail: string };

/** A load with the days it covers and, when too much was left out, how much was counted. */
export type WorkloadTileVM = { label: string; value: string; note: string; counted: string | null };

/** One week's bar: its load, and its height from 0 to 1 against the tallest bar or the average. */
export type WorkloadWeekVM = { label: string; load: number; value: string; height: number };

export type WorkloadVM = {
  state: WorkloadState;
  /** "1.12", only when there is a zone to go with it. */
  ratio: string | null;
  zone: WorkloadZone | null;
  /** The headline when there is no ratio: "Day 12 of 28", "Back after a break", "3 of 7 counted". */
  headline: string;
  sentence: string;
  /** Ratio per point, oldest first; `null` where the card has no ratio to show; empty when too few to draw. */
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
    /** Where the dashed average sits, 0 to 1 on the same scale as the bars' heights. */
    averageAt: number;
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

const shortDay = (ms: number, year = false): string =>
  formatDate(new Date(ms), {
    month: "short",
    day: "numeric",
    ...(year ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });

const yearOf = (ms: number): number => new Date(ms).getUTCFullYear();

const counted = ({ total, leftOut }: Workload["week"]): string =>
  t("statistics.workloadCounted", { counted: total - leftOut, total });

const missingOf = (noEffort: boolean, noTime: boolean): WorkloadMissing =>
  noEffort && noTime ? "both" : noEffort ? "effort" : "time";

const WHY: Record<WorkloadMissing, MessageKey> = {
  effort: "statistics.workloadNoEffort",
  time: "statistics.workloadNoTime",
  both: "statistics.workloadNoEither",
};

const why = (noEffort: boolean, noTime: boolean): string => t(WHY[missingOf(noEffort, noTime)]);

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
  if (w.state === "few")
    return t("statistics.workloadFew", { count: w.month.total - w.month.leftOut });
  return t("statistics.workloadBreak");
}

function sentence(w: Workload, zone: WorkloadZone | null): string {
  if (zone !== null)
    return w.acute === 0 ? t("statistics.workloadRestLine") : t(ZONE_KEYS[zone].sentence);
  if (w.state === "partial") return t("statistics.workloadPartialLine");
  if (w.state === "early") return t("statistics.workloadEarlyLine");
  if (w.state === "few") return t("statistics.workloadFewLine");
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

const enough = (points: readonly (number | null)[]): boolean =>
  points.filter((p) => p !== null).length >= MIN_POINTS;

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
  const points = days.map((day) => {
    const p = workloadOn(done, day);
    return p.state === "ratio" ? p.ratio : null;
  });
  const top = Math.max(w.chronic, ...w.weeks, 1);
  return {
    state: w.state,
    ratio: zone === null || w.ratio === null ? null : ratioText(w.ratio),
    zone,
    headline: zone === null ? headline(w) : "",
    sentence: said,
    points: w.state !== "few" && enough(points) ? points : [],
    from: days[0] === undefined ? "" : shortDay(days[0], yearOf(days[0]) !== yearOf(today)),
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
        height: n / top,
      })),
      averageAt: w.chronic / top,
      averageLabel: load(w.chronic),
      leftOut: left.map((d) => ({
        ref: d.ref,
        missing: missingOf(noEffort(d), noTime(d)),
        detail: `${shortDay(d.at)} · ${why(noEffort(d), noTime(d))}`,
      })),
    },
  };
}
