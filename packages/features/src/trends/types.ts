import type { Discipline } from "@sendtally/core";

export type { Discipline };

export type TrendMetric = "volume" | "pyramid" | "hardest" | "flash" | "avggrade";

export const TREND_DISCIPLINES: Array<{ value: Discipline; label: string }> = [
  { value: "boulder", label: "BOULDERS" },
  { value: "route", label: "ROUTES" },
];

export type TrendRange = "1m" | "3m" | "6m" | "ytd" | "1y" | "all";

export const TREND_RANGES: Array<{ value: TrendRange; label: string }> = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "ytd", label: "YTD" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "ALL" },
];

export type TrendBarVM = {
  height: number;
  peak: boolean;
  valueLabel: string;
  axisLabel: string;
};

export type TrendTileVM = {
  metric: TrendMetric;
  label: string;
  value: string;
  caption: string;
  bars: TrendBarVM[];
  yTicks: string[];
};

export type TrendSpecVM = { k: string; v: string };

export const TILE_BREAKDOWN_ROWS = 3;

export type TrendTagRowVM = {
  key: string;
  label: string;
  value: string;
  ratio: number;
  sessions: number;
};

export type TrendDetailVM = {
  metric: TrendMetric;
  title: string;
  caption: string;
  bars: TrendBarVM[];
  yTicks: string[];
  specs: TrendSpecVM[];
  breakdown: TrendTagRowVM[];
  insight: string;
};

export type TrendsVM = {
  caption: string;
  discipline: Discipline;
  disciplines: Discipline[];
  tiles: TrendTileVM[];
  details: Record<TrendMetric, TrendDetailVM>;
};
