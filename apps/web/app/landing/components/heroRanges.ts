import type { MiniBar } from "./MiniBars";
import type { StatGridItem } from "./StatGrid";

export type HeroRange = {
  key: "3m" | "6m" | "1y";
  chip: string;
  caption: string;
  bars: MiniBar[];
  stats: StatGridItem[];
};

function series(values: number[], labels: string[], peak: number): MiniBar[] {
  return values.map((value, i) => ({
    key: `${labels[i] ?? i}-${i}`,
    value,
    label: labels[i] ?? "",
    peak: i === peak,
  }));
}

export const RANGE_CHIPS = ["1M", "3M", "6M", "YTD", "1Y", "ALL"];

export const HERO_RANGES: HeroRange[] = [
  {
    key: "3m",
    chip: "3M",
    caption: "LAST 3 MONTHS · 31 SESSIONS",
    bars: series(
      [24, 29, 11, 27, 31, 41, 28, 0, 25, 27, 31, 32, 30],
      ["6/9", "", "", "6/30", "", "", "7/21", "", "", "8/11", "", "", "9/1"],
      5
    ),
    stats: [
      { label: "CLIMBS", value: "336" },
      { label: "AVG GRADE", value: "V4.9" },
      { label: "FLASH", value: "36%" },
      { label: "TOP", value: "V7", accent: true },
    ],
  },
  {
    key: "6m",
    chip: "6M",
    caption: "LAST 6 MONTHS · 58 SESSIONS",
    bars: series([88, 96, 70, 112, 128, 120], ["MAR", "APR", "MAY", "JUN", "JUL", "AUG"], 4),
    stats: [
      { label: "CLIMBS", value: "614" },
      { label: "AVG GRADE", value: "V4.6" },
      { label: "FLASH", value: "31%" },
      { label: "TOP", value: "V7", accent: true },
    ],
  },
  {
    key: "1y",
    chip: "1Y",
    caption: "LAST 12 MONTHS · 104 SESSIONS",
    bars: series(
      [60, 72, 80, 84, 90, 88, 96, 70, 112, 128, 120, 40],
      ["SEP", "", "NOV", "", "JAN", "", "MAR", "", "MAY", "", "JUL", ""],
      9
    ),
    stats: [
      { label: "CLIMBS", value: "1,040" },
      { label: "AVG GRADE", value: "V4.3" },
      { label: "FLASH", value: "28%" },
      { label: "TOP", value: "V7", accent: true },
    ],
  },
];
