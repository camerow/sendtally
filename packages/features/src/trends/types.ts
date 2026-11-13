import type { Discipline } from "@sendtally/core";
import type { CircuitColour } from "@sendtally/api-client";
import { t } from "../i18n";

export type { Discipline };

/** One calendar year, such as `y2025`. */
export type YearRange = `y${number}`;

export type TrendRange = "7d" | "1m" | "3m" | "6m" | "1y" | "all" | YearRange;

export const isYearRange = (range: TrendRange): range is YearRange => range.startsWith("y");

export const yearRange = (year: number): YearRange => `y${year}`;

export const yearOf = (range: YearRange): number => Number(range.slice(1));

/** The one range a non-member can see; every longer range is the membership. */
export const PREVIEW_TREND_RANGE: TrendRange = "7d";

export const TREND_RANGES: readonly TrendRange[] = ["all", "1y", "6m", "3m", "1m", "7d"];

/** Longest first: All, each calendar year with sessions in it newest first, then the trailing ranges. */
export const trendRanges = (years: readonly number[]): TrendRange[] => [
  "all",
  ...years.map(yearRange),
  ...TREND_RANGES.slice(1),
];

/** The years anything was logged in, newest first, from timestamps or calendar dates. */
export const yearsOf = (dates: readonly string[]): number[] =>
  [...new Set(dates.map((d) => Number(d.slice(0, 4))))]
    .filter(Number.isFinite)
    .sort((a, b) => b - a);

/** The years Stats can show: anything climbed, hung or otherwise trained in, newest first. */
export const statsYears = (logged: {
  sessions: readonly { start_at: string }[];
  hangSessions: readonly { date: string }[];
  activities: readonly { date: string }[];
}): number[] =>
  yearsOf([
    ...logged.sessions.map((s) => s.start_at),
    ...logged.hangSessions.map((h) => h.date),
    ...logged.activities.map((a) => a.date),
  ]);

/** Everything for a member; the one unlocked range for anyone else. */
export const defaultRange = (member: boolean | null): TrendRange =>
  member === true ? "all" : PREVIEW_TREND_RANGE;

/** Every range but the preview is the membership; unknown membership counts as free. */
export const isLockedRange = (member: boolean | null, range: TrendRange): boolean =>
  member !== true && range !== PREVIEW_TREND_RANGE;

/** The range drawn: the one picked, unless it is locked. */
export const shownRange = (member: boolean | null, picked: TrendRange): TrendRange =>
  isLockedRange(member, picked) ? PREVIEW_TREND_RANGE : picked;

export function trendRangeLabel(range: TrendRange): string {
  if (isYearRange(range)) return String(yearOf(range));
  if (range === "1y") return t("trends.rangeShort1y");
  if (range === "all") return t("trends.rangeShortAll");
  return range.toUpperCase();
}

/**
 * What the trends read: a discipline, everything, or one gym's own circuit ladder.
 * A circuit scope needs a gym, and grades never convert between any two of them.
 */
export type TrendScope = Discipline | "all" | "circuit";

export type TrendSetting = "all" | "indoor" | "outdoor";

/** Ranks on the scope's own ladder: V number, route index, or circuit position. */
export type GradeRange = { lo: number; hi: number };

export type TrendFilter = {
  /** `null` reads as the discipline with the most sends. */
  scope: TrendScope | null;
  range: TrendRange;
  grade: GradeRange | null;
  setting: TrendSetting;
  /** A gym is inside by definition; it narrows the setting to one place. */
  gymId: string | null;
  tags: string[];
};

export const DEFAULT_TREND_FILTER: TrendFilter = {
  scope: null,
  range: "all",
  grade: null,
  setting: "all",
  gymId: null,
  tags: [],
};

export type TrendPage = "endurance" | "days";

/** Series name a colour; each platform owns the palette, so the VM never carries a hex. */
export type TrendSeries =
  | "primary"
  | "sent"
  | "notYet"
  | "worked"
  | "firstTry"
  | "inside"
  | "outside"
  | "clean"
  | "partial"
  | "boulder"
  | "route"
  | "effort";

export type TrendSeriesVM = { key: TrendSeries; label: string };

export type TrendPointVM = {
  /** The first series; `null` is a bucket with nothing to measure. */
  a: number | null;
  /** The second series of a stacked chart. */
  b: number | null;
  axis: string;
  label: string;
  /** The stacked split for the readout, "12 sent · 7 not yet". */
  split: string | null;
};

export type TrendChart = "bar" | "line" | "stack";

export type TrendTileId =
  | "volume"
  | "days"
  | "effort"
  | "hours"
  | "hardest"
  | "avggrade"
  | "pyramid"
  | "flash"
  | "tries"
  | "endurance"
  | "laps"
  | "cleanRate"
  | "pumpCurve"
  | "moves"
  | "months"
  | "weekdays";

export type TrendTileVM = {
  id: TrendTileId;
  title: string;
  chart: TrendChart;
  /** The headline at rest; the readout tweens between this and a bucket's value. */
  total: number | null;
  /** Formats a headline, a tick or a bucket value; tolerates in-between tween values. */
  format: (value: number) => string;
  /** Appended to the headline only, "/10". */
  unit: string;
  caption: string;
  sub: string;
  delta: string | null;
  series: TrendSeriesVM[];
  points: TrendPointVM[];
  domain: readonly [number, number];
  ticks: readonly [string, string, string];
  link: TrendPage | null;
};

export type TrendGroupId = "grade" | "volume" | "technique" | "endurance";

export type TrendGroupVM = {
  id: TrendGroupId;
  title: string;
  question: string;
  insight: string | null;
  tiles: TrendTileVM[];
};

export type TrendStatVM = { key: string; label: string; value: string; lifetime: string | null };

export type GradeBinVM = { rank: number; label: string; count: number };

export type GradePresetVM = {
  key: "any" | "limit" | "volume";
  label: string;
  grade: GradeRange | null;
};

export type TrendGymVM = { id: string; name: string; sessions: number };

export type TrendScaleGymVM = TrendGymVM & {
  ladder: Array<{ id: string; colour: CircuitColour; range: string }>;
};

export type TrendTagVM = { slug: string; name: string; sessions: number };

export type TrendsVM = {
  scope: TrendScope;
  rangeLabel: string;
  /** Every year with a session or a hang in it, newest first, each its own range. */
  years: number[];
  sessions: number;
  sessionsLine: string;
  insight: string | null;
  /** Top-level numbers for the All view, each with its lifetime figure. */
  stats: TrendStatVM[] | null;
  groups: TrendGroupVM[];
  /** Climbs per grade in the range, for the grade picker. Empty in All. */
  grades: GradeBinVM[];
  gradeLabel: string | null;
  presets: GradePresetVM[];
  gyms: TrendGymVM[];
  /** Gyms with their own circuit ladders, offered as a fourth scope. */
  scaleGyms: TrendScaleGymVM[];
  tags: TrendTagVM[];
};

export type EnduranceCircuitVM = {
  key: string;
  label: string;
  colour: CircuitColour | null;
  length: string;
  sets: number;
  laps: number;
  rate: string;
  ratio: number;
  best: string;
  trend: string;
};

export type EnduranceVM = {
  rangeLabel: string;
  insight: string;
  stats: TrendStatVM[];
  tiles: TrendTileVM[];
  circuits: EnduranceCircuitVM[];
};

export type DayState = "none" | "indoor" | "outdoor" | "void";

export type DayCellVM = { key: string; state: DayState; date: string; detail: string };

export type DayTagVM = {
  slug: string;
  name: string;
  inside: number;
  outside: number;
  total: number;
  insideRatio: number;
  outsideRatio: number;
};

export type DaysVM = {
  lead: string;
  summary: string;
  stats: TrendStatVM[];
  /** Monday-first columns of seven, oldest first. */
  weeks: DayCellVM[][];
  /** One per week column: the month's short name where a month starts, else "". */
  monthMarks: string[];
  weekdayMarks: string[];
  tiles: TrendTileVM[];
  tags: DayTagVM[];
};
