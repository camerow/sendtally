import { formatDate, formatNumber, t, type MessageKey } from "../i18n";
import { DAY_MS, bucketsFor, dayStart, wallClock, windowOf } from "../trends/buckets";
import type { TrendRange } from "../trends/types";
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

export type WorkloadLeftOutVM = { ref: DoneRef; detail: string };

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
    span: string;
    division: string | null;
    weekCounted: string;
    monthCounted: string;
    weeks: WorkloadWeekVM[];
    average: number;
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

function missing(d: Done): string {
  if (d.rpe === null && d.minutes <= 0) return t("statistics.workloadNoEither");
  return d.rpe === null ? t("statistics.workloadNoEffort") : t("statistics.workloadNoTime");
}

function leftOutLine(left: readonly Done[]): string | null {
  if (left.length === 0) return null;
  const noEffort = left.some((d) => d.rpe === null);
  const noTime = left.some((d) => d.minutes <= 0);
  const why =
    noEffort && noTime
      ? t("statistics.workloadNoEither")
      : noEffort
        ? t("statistics.workloadNoEffort")
        : t("statistics.workloadNoTime");
  return t("statistics.workloadLeftOut", { count: left.length, why });
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
  return {
    state: w.state,
    ratio: zone === null || w.ratio === null ? null : ratioText(w.ratio),
    zone,
    headline: zone === null ? headline(w) : "",
    sentence: sentence(w, zone),
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
      span: t("statistics.workloadSpan", {
        from: shortDay(today - 6 * DAY_MS),
        to: shortDay(today),
      }),
      division:
        zone === null || w.ratio === null
          ? null
          : `${load(w.acute)} ÷ ${load(w.chronic)} = ${ratioText(w.ratio)} · ${workloadZoneLabel(zone)}`,
      weekCounted: counted(w.week),
      monthCounted: counted(w.month),
      weeks: w.weeks.map((n, i) => ({
        label: i === 3 ? t("statistics.workloadLast7") : shortDay(today - (27 - i * 7) * DAY_MS),
        load: n,
        value: load(n),
      })),
      average: w.chronic,
      leftOut: left.map((d) => ({ ref: d.ref, detail: `${shortDay(d.at)} · ${missing(d)}` })),
    },
  };
}
