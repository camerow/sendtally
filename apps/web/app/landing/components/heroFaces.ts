import type { GradeBar } from "@sendtally/design";
import type { MiniBar } from "./MiniBars";
import type { StatGridItem } from "./StatGrid";

function series(values: number[], labels: string[], peak: number): MiniBar[] {
  return values.map((value, i) => ({
    key: `${labels[i] ?? i}-${i}`,
    value,
    label: labels[i] ?? "",
    peak: i === peak,
  }));
}

export const TREND_BARS: MiniBar[] = series(
  [24, 29, 11, 27, 31, 41, 28, 0, 25, 27, 31, 32, 30],
  ["6/9", "", "", "6/30", "", "", "7/21", "", "", "8/11", "", "", "9/1"],
  5
);

export const TREND_STATS: StatGridItem[] = [
  { label: "CLIMBS", value: "336" },
  { label: "AVG GRADE", value: "V4.9" },
  { label: "FLASH", value: "36%" },
  { label: "TOP", value: "V7", accent: true },
];

export const TAGS = ["Gym", "Board", "Outdoor", "Power"] as const;

export const TAG_BARS: MiniBar[] = series([14, 9, 5, 3], ["GYM", "BOARD", "OUTDOOR", "POWER"], 0);

export const TAG_STATS: StatGridItem[] = [
  { label: "TAGS", value: "4" },
  { label: "SESSIONS", value: "31" },
  { label: "TOP TAG", value: "Gym" },
];

export const EFFORT_BARS: MiniBar[] = series(
  [5, 7, 6, 8, 4, 7, 9, 6],
  ["W1", "", "W3", "", "W5", "", "W7", ""],
  6
);

export const EFFORT_STATS: StatGridItem[] = [
  { label: "AVG RPE", value: "6.5" },
  { label: "HARDEST", value: "9.0", accent: true },
  { label: "SESSIONS", value: "8" },
];

export const PYRAMID_BARS: GradeBar[] = [
  { grade: "V4", count: 42 },
  { grade: "V5", count: 31 },
  { grade: "V6", count: 14 },
  { grade: "V7", count: 3, peak: true },
  { grade: "V8", count: 0 },
];

export const PYRAMID_STATS: StatGridItem[] = [
  { label: "SENDS", value: "90" },
  { label: "AVG", value: "V4.9" },
  { label: "TOP", value: "V7", accent: true },
];

export const PROJECTS = [
  { name: "The Arete", grade: "V7", sessions: 6, attempts: 34, sent: false },
  { name: "Slab Problem", grade: "V6", sessions: 4, attempts: 21, sent: false },
  { name: "Roof Traverse", grade: "V5", sessions: 3, attempts: 12, sent: true },
] as const;

export const PROJECT_STATS: StatGridItem[] = [
  { label: "OPEN", value: "3" },
  { label: "ATTEMPTS", value: "67" },
  { label: "HARDEST", value: "V7", accent: true },
];

export const STRAVA_BARS: GradeBar[] = [
  { grade: "V4", count: 4 },
  { grade: "V5", count: 6 },
  { grade: "V6", count: 3 },
  { grade: "V7", count: 1, peak: true },
  { grade: "V8", count: 0 },
];

export const STRAVA_STATS: StatGridItem[] = [
  { label: "TIME", value: "1:24" },
  { label: "SENDS", value: "14" },
  { label: "ATTEMPTS", value: "31" },
  { label: "GRADES", value: "V4-V7" },
];
