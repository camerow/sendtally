import type { Discipline } from "@sendtally/core";
import type { CircuitColour } from "@sendtally/api-client";
import { t } from "../i18n";

export type { Discipline };

export type TrendMetric = "volume" | "pyramid" | "hardest" | "flash" | "avggrade";

export const TREND_DISCIPLINES: readonly Discipline[] = ["boulder", "route"];

export type TrendRange = "7d" | "1m" | "3m" | "6m" | "ytd" | "1y" | "all";

/** The one range a non-member can see; every longer range is the membership. */
export const PREVIEW_TREND_RANGE: TrendRange = "7d";

export const TREND_RANGES: readonly TrendRange[] = ["7d", "1m", "3m", "6m", "ytd", "1y", "all"];

export function trendRangeLabel(range: TrendRange): string {
  if (range === "ytd") return t("trends.rangeShortYtd");
  if (range === "1y") return t("trends.rangeShort1y");
  if (range === "all") return t("trends.rangeShortAll");
  return range.toUpperCase();
}

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
  colour?: CircuitColour;
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
