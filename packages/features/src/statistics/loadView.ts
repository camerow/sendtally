import { formatDate, formatNumber, t, type MessageKey } from "../i18n";
import {
  DAY_MS,
  bucketsFor,
  dayStart,
  priorWindow,
  wallClock,
  windowOf,
  yearOfMs,
  type Bucket,
} from "../trends/buckets";
import { isYearRange, yearOf, type TrendRange } from "../trends/types";
import type { Done } from "./insights";
import { LEFT_OUT_LIMIT, loadOf } from "./workload";
import { leftOutLine, leftOutRows, type WorkloadLeftOutVM } from "./workloadView";

export type LoadBarVM = {
  axis: string;
  /** An average week for the bucket, or the day's load on 7D. */
  value: number;
  text: string;
  /** "Week of Sep 29 · 5 sessions · 1 not counted", read when the bar is touched. */
  readout: string;
  /** The bucket, its value, then the rest of the readout, for a screen reader. */
  spoken: string;
  /** Over a quarter of the bucket's records had no effort or time. */
  under: boolean;
};

export type LoadVM = {
  /** `none`: records in the range, but not one with effort and time. */
  state: "load" | "none";
  /** "Per week", "Average week by year". */
  caption: string;
  /** "495", or "No load yet". */
  headline: string;
  /** "average week", empty with no load. */
  unit: string;
  sentence: string | null;
  bars: LoadBarVM[];
  average: number;
  averageText: string;
  ticks: string[];
  note: string | null;
  leftOutLine: string | null;
  leftOut: WorkloadLeftOutVM[];
};

const WEEK_MS = 7 * DAY_MS;

const PRIOR_KEYS: Partial<Record<TrendRange, MessageKey>> = {
  "1m": "statistics.loadPrior1m",
  "3m": "statistics.loadPrior3m",
  "6m": "statistics.loadPrior6m",
  "1y": "statistics.loadPrior1y",
};

const loadText = (n: number): string => formatNumber(Math.round(n));

const sum = (done: readonly Done[]): number => done.reduce((n, d) => n + (loadOf(d) ?? 0), 0);

const inside = (done: readonly Done[], from: number, to: number): Done[] =>
  done.filter((d) => d.at >= from && d.at < to);

function priorName(range: TrendRange): string {
  if (isYearRange(range)) return String(yearOf(range) - 1);
  const key = PRIOR_KEYS[range];
  return key === undefined ? "" : t(key);
}

function caption(range: TrendRange, buckets: readonly Bucket[]): string {
  if (range === "7d") return t("statistics.loadPerDay");
  if (range === "1m" || range === "3m") return t("statistics.loadPerWeek");
  if (range === "all" && buckets.length > 0 && buckets[0]!.end - buckets[0]!.start > 31 * DAY_MS)
    return t("statistics.loadByYear");
  return t("statistics.loadByMonth");
}

function ticks(range: TrendRange, buckets: readonly Bucket[]): string[] {
  const axes = buckets.map((b) => b.axis);
  if (axes.length <= 1) return axes;
  const last = axes.at(-1)!;
  if (range === "7d" || axes.length < 6) return [axes[0]!, last];
  return [axes[0]!, axes[Math.floor((axes.length - 1) / 2)]!, last];
}

function change(now: number, before: number, prior: string): string | null {
  if (before <= 0) return null;
  const pct = Math.round(Math.abs(now / before - 1) * 100);
  if (pct === 0) return t("statistics.loadLevel", { prior });
  return t(now > before ? "statistics.loadUp" : "statistics.loadDown", {
    pct: formatNumber(pct),
    prior,
  });
}

/** Against the window before, from its first counted day; nothing to say under a week of it. */
function priorChange(
  all: readonly Done[],
  prior: { start: number; end: number },
  firstDay: number,
  average: number,
  name: string
): string | null {
  const from = Math.max(prior.start, firstDay);
  if (prior.end - from < WEEK_MS) return null;
  return change(average, (sum(inside(all, from, prior.end)) * WEEK_MS) / (prior.end - from), name);
}

function since(buckets: readonly Bucket[], values: readonly number[], today: number): string {
  const first = buckets[0];
  if (first === undefined) return "";
  if (first.end - first.start <= 31 * DAY_MS) {
    const month = formatDate(new Date(first.start), {
      month: "short",
      ...(yearOfMs(first.start) === yearOfMs(today) ? {} : { year: "numeric" }),
      timeZone: "UTC",
    });
    return t("statistics.loadSinceMonth", { month });
  }
  const said = t("statistics.loadSinceYear", { year: first.axis });
  const counted = values.filter((v) => v > 0).length;
  if (counted < 2) return said;
  const top = values.indexOf(Math.max(...values));
  return `${said} ${t("statistics.loadBiggestYear", { year: buckets[top]!.axis })}`;
}

/**
 * Load (effort × minutes) over the tab's range, on the effort chart's buckets from the first
 * record with load: each bar an average week for its bucket, a day's load on 7D.
 */
export function loadVM(everything: readonly Done[], range: TrendRange, now: Date): LoadVM {
  const today = dayStart(wallClock(now));
  const todayEnd = today + DAY_MS;
  const all = everything.filter((d) => d.at < todayEnd);
  const counted = all.filter((d) => loadOf(d) !== null);
  const firstCounted = counted.length === 0 ? null : Math.min(...counted.map((d) => d.at));
  const firstDay = firstCounted === null ? todayEnd : dayStart(firstCounted);
  const buckets = bucketsFor(range, now, firstCounted);
  const window = windowOf(buckets);
  const shown = range === "all" ? all : inside(all, window.start, window.end);
  const perDay = range === "7d";
  const unit = perDay ? DAY_MS : WEEK_MS;
  const span = (from: number, to: number): number => Math.max(0, Math.min(to, todayEnd) - from);
  /**
   * A month or year bucket counts from the first counted day; a week stays whole. Under 7 days
   * of it, its bar is the 7 days ending where it ends, so a month two days in reads as a week.
   */
  const startOf = (b: Bucket): number =>
    b.end - b.start > WEEK_MS && firstDay > b.start && firstDay < b.end ? firstDay : b.start;
  const bars = buckets.map((b): LoadBarVM => {
    const records = inside(shown, b.start, b.end);
    const load = sum(records);
    const from = startOf(b);
    const to = Math.min(b.end, todayEnd);
    const value = perDay
      ? load
      : to <= from
        ? 0
        : to - from < WEEK_MS
          ? sum(inside(all, to - WEEK_MS, to))
          : (load * WEEK_MS) / (to - from);
    const left = records.filter((d) => loadOf(d) === null).length;
    const under = records.length > 0 && left / records.length > LEFT_OUT_LIMIT;
    const detail = [
      t("statistics.sessionCount", { count: records.length }),
      ...(left === 0 ? [] : [t("statistics.loadNotCounted", { count: left })]),
    ];
    return {
      axis: b.axis,
      value,
      text: loadText(value),
      readout: [b.label, ...detail].join(" · "),
      spoken: [
        `${b.label}: ${loadText(value)}`,
        ...detail,
        ...(under ? [t("statistics.loadUnder")] : []),
      ].join(" · "),
      under,
    };
  });
  const total = sum(shown);
  const started = buckets.find((b) => firstCounted !== null && firstCounted < b.end);
  const from = Math.max(window.start, started === undefined ? window.start : startOf(started));
  const average = total === 0 ? 0 : (total * unit) / Math.max(unit, span(from, window.end));
  const leftOut = leftOutRows(shown, today);
  const base = {
    caption: caption(range, buckets),
    bars,
    average,
    averageText: loadText(average),
    ticks: ticks(range, buckets),
    leftOutLine: leftOutLine(
      shown.filter((d) => loadOf(d) === null),
      "statistics.loadLeftOut"
    ),
    leftOut,
  };
  if (total === 0)
    return {
      ...base,
      state: "none",
      headline: t("statistics.loadNone"),
      unit: "",
      sentence: t("statistics.loadNoneLine"),
      note: null,
    };
  const prior = priorWindow(range, window);
  const early = range !== "all" && !perDay && firstCounted !== null && firstCounted >= window.start;
  const sentence = perDay
    ? t("statistics.loadLast7", { load: loadText(total) })
    : range === "all"
      ? since(
          buckets,
          bars.map((b) => b.value),
          today
        )
      : early
        ? t("statistics.loadFirstWeeks", {
            count: Math.max(1, Math.ceil((todayEnd - dayStart(firstCounted)) / WEEK_MS)),
          })
        : prior === null
          ? null
          : priorChange(all, prior, firstDay, average, priorName(range));
  const note = [
    t(perDay ? "statistics.loadDayNote" : "statistics.workloadBarsNote"),
    ...(bars.some((b) => b.under) ? [t("statistics.loadUnderNote")] : []),
  ].join(" ");
  return {
    ...base,
    state: "load",
    headline: loadText(average),
    unit: t(perDay ? "statistics.loadAverageDay" : "statistics.loadAverageWeek"),
    sentence,
    note,
  };
}

/** The bar plot's fixed heights; the value label sits in a gutter right of the bars. */
export const LOAD_PLOT = { height: 126, base: 112, top: 12, gutter: 52, gap: 4, dotY: 120 };

export type LoadPlotBar = { x: number; w: number; y: number; h: number; path: string | null };

export type LoadPlot = {
  /** Where the bars end and the gutter starts. */
  right: number;
  bars: LoadPlotBar[];
  averageY: number | null;
};

/** Each bar's box and rounded-top path in a `width` wide plot; an empty bucket is a 3px stub with no path. */
export function loadPlot(vm: Pick<LoadVM, "bars" | "average">, width: number): LoadPlot {
  const { base, top, gutter, gap } = LOAD_PLOT;
  const right = Math.max(0, width - gutter);
  const pitch = right / Math.max(1, vm.bars.length);
  const max = Math.max(vm.average, ...vm.bars.map((b) => b.value));
  const y = (v: number): number => base - (max === 0 ? 0 : (v / max) * (base - top));
  return {
    right,
    bars: vm.bars.map((b, i) => {
      const x = 2 + i * pitch;
      const w = Math.max(1, pitch - gap);
      if (b.value <= 0) return { x, w, y: base - 3, h: 3, path: null };
      const yb = y(b.value);
      const r = Math.min(6, w / 2, base - yb);
      return {
        x,
        w,
        y: yb,
        h: base - yb,
        path: `M${x} ${base}V${yb + r}q0 ${-r} ${r} ${-r}H${x + w - r}q${r} 0 ${r} ${r}V${base}Z`,
      };
    }),
    averageY: vm.average > 0 ? y(vm.average) : null,
  };
}
