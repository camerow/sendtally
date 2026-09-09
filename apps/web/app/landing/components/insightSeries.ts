import { COPY, type TrendCopy } from "../copy";
import type { MiniBar } from "./MiniBars";

type TrendMetricKey = keyof typeof COPY.trends.cards;

const MONTHS = ["MAR", "APR", "MAY", "JUN", "JUL", "AUG"];

export type InsightSeries = TrendCopy & {
  metric: TrendMetricKey;
  bars: MiniBar[];
};

const VOLUME: MiniBar[] = [24, 29, 11, 27, 31, 41, 28, 0, 25, 27, 31, 32].map((v, i) => ({
  key: `w${i}`,
  value: v,
}));

const PYRAMID: MiniBar[] = [
  { key: "V2", label: "V2", value: 7 },
  { key: "V3", label: "V3", value: 18 },
  { key: "V4", label: "V4", value: 31 },
  { key: "V5", label: "V5", value: 28 },
  { key: "V6", label: "V6", value: 15 },
  { key: "V7", label: "V7", value: 2, peak: true },
  { key: "V8", label: "V8", value: 0 },
];

const FLASH: MiniBar[] = [22, 26, 25, 31, 33, 36].map((v, i) => ({
  key: MONTHS[i] ?? `m${i}`,
  label: MONTHS[i] ?? "",
  value: v,
  peak: i === 5,
}));

const HARDEST: MiniBar[] = [20, 20, 35, 35, 52, 52].map((v, i) => ({
  key: MONTHS[i] ?? `m${i}`,
  label: MONTHS[i] ?? "",
  value: v,
  peak: i === 2 || i === 4,
}));

const AVG_GRADE: MiniBar[] = [
  ["5/18", "V4.2", 42],
  ["5/25", "V4.3", 43],
  ["6/1", "V4.1", 41],
  ["6/8", "V4.4", 44],
  ["6/15", "V4.5", 45],
  ["6/22", "V4.6", 46],
  ["6/29", "V4.4", 44],
  ["7/6", "n/a", 0],
  ["7/13", "V4.6", 46],
  ["7/20", "V4.7", 47],
  ["7/27", "V4.8", 48],
  ["8/3", "V4.9", 49],
].map(([week, grade, value]) => ({
  key: String(week),
  label: String(week),
  topLabel: String(grade),
  value: Number(value),
  peak: week === "8/3",
}));

function series(metric: TrendMetricKey, bars: MiniBar[]): InsightSeries {
  return { metric, bars, ...COPY.trends.cards[metric] };
}

export const INSIGHT_SERIES: InsightSeries[] = [
  series("volume", VOLUME),
  series("pyramid", PYRAMID),
  series("hardest", HARDEST),
  series("flash", FLASH),
  series("avggrade", AVG_GRADE),
];
