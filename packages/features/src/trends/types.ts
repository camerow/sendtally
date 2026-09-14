import type { Discipline } from "@sendtally/core";
import { t, upper } from "../i18n";

export type { Discipline };

export type TrendMetric = "volume" | "pyramid" | "hardest" | "flash" | "avggrade";

export const TREND_DISCIPLINES: Array<{ value: Discipline; label: string }> = [
  {
    value: "boulder",
    get label() {
      return upper(t("logSession.boulders"));
    },
  },
  {
    value: "route",
    get label() {
      return upper(t("logSession.routes"));
    },
  },
];

export type TrendRange = "1m" | "3m" | "6m" | "ytd" | "1y" | "all";

export const TREND_RANGES: Array<{ value: TrendRange; label: string }> = [
  {
    value: "1m",
    get label() {
      return upper(t("trends.rangeShort1m"));
    },
  },
  {
    value: "3m",
    get label() {
      return upper(t("trends.rangeShort3m"));
    },
  },
  {
    value: "6m",
    get label() {
      return upper(t("trends.rangeShort6m"));
    },
  },
  {
    value: "ytd",
    get label() {
      return upper(t("trends.rangeShortYtd"));
    },
  },
  {
    value: "1y",
    get label() {
      return upper(t("trends.rangeShort1y"));
    },
  },
  {
    value: "all",
    get label() {
      return upper(t("trends.rangeShortAll"));
    },
  },
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
