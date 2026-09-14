import type { GradeBar } from "@sendtally/design";
import { upper } from "@sendtally/features/i18n";
import type { LandingCopy } from "../copy";
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

const PYRAMID_BARS: GradeBar[] = [
  { grade: "V4", count: 42 },
  { grade: "V5", count: 31 },
  { grade: "V6", count: 14 },
  { grade: "V7", count: 3, peak: true },
  { grade: "V8", count: 0 },
];

const STRAVA_BARS: GradeBar[] = [
  { grade: "V4", count: 4 },
  { grade: "V5", count: 6 },
  { grade: "V6", count: 3 },
  { grade: "V7", count: 1, peak: true },
  { grade: "V8", count: 0 },
];

export type HeroProject = {
  name: string;
  grade: string;
  sessions: number;
  attempts: number;
  sent: boolean;
};

export type HeroFaces = {
  trendBars: MiniBar[];
  trendStats: StatGridItem[];
  tags: string[];
  tagBars: MiniBar[];
  tagStats: StatGridItem[];
  effortBars: MiniBar[];
  effortStats: StatGridItem[];
  pyramidBars: GradeBar[];
  pyramidStats: StatGridItem[];
  projects: HeroProject[];
  projectStats: StatGridItem[];
  stravaBars: GradeBar[];
  stravaStats: StatGridItem[];
};

export function heroFaces(copy: LandingCopy): HeroFaces {
  const { stats, tags, weekPrefix, projects } = copy.hero.faces;
  const week = (n: number): string => `${weekPrefix}${n}`;
  return {
    trendBars: series(
      [24, 29, 11, 27, 31, 41, 28, 0, 25, 27, 31, 32, 30],
      ["6/9", "", "", "6/30", "", "", "7/21", "", "", "8/11", "", "", "9/1"],
      5
    ),
    trendStats: [
      { label: stats.climbs, value: "336" },
      { label: stats.avgGrade, value: "V4.9" },
      { label: stats.flash, value: "36%" },
      { label: stats.top, value: "V7", accent: true },
    ],
    tags,
    tagBars: series([14, 9, 5, 3], tags.map(upper), 0),
    tagStats: [
      { label: stats.tags, value: "4" },
      { label: stats.sessions, value: "31" },
      { label: stats.topTag, value: tags[0] },
    ],
    effortBars: series(
      [5, 7, 6, 8, 4, 7, 9, 6],
      [week(1), "", week(3), "", week(5), "", week(7), ""],
      6
    ),
    effortStats: [
      { label: stats.avgRpe, value: "6.5" },
      { label: stats.hardest, value: "9.0", accent: true },
      { label: stats.sessions, value: "8" },
    ],
    pyramidBars: PYRAMID_BARS,
    pyramidStats: [
      { label: stats.sends, value: "90" },
      { label: stats.avg, value: "V4.9" },
      { label: stats.top, value: "V7", accent: true },
    ],
    projects: [
      { name: projects[0], grade: "V7", sessions: 6, attempts: 34, sent: false },
      { name: projects[1], grade: "V6", sessions: 4, attempts: 21, sent: false },
      { name: projects[2], grade: "V5", sessions: 3, attempts: 12, sent: true },
    ],
    projectStats: [
      { label: stats.open, value: "3" },
      { label: stats.attempts, value: "67" },
      { label: stats.hardest, value: "V7", accent: true },
    ],
    stravaBars: STRAVA_BARS,
    stravaStats: [
      { label: stats.time, value: "1:24" },
      { label: stats.sends, value: "14" },
      { label: stats.attempts, value: "31" },
      { label: stats.grades, value: "V4-V7" },
    ],
  };
}
