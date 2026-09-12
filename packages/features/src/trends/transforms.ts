import { climbDiscipline, climbRank, type Discipline } from "@sendtally/core";
import type { SessionWithClimbs } from "@sendtally/api-client";
import { climbKey } from "../climbs/transforms";
import { gradeFormatterFor, type GradeFormatter } from "../sessions/grades";
import { sessionTagGroups } from "../sessions/tags";
import type {
  TrendBarVM,
  TrendDetailVM,
  TrendMetric,
  TrendRange,
  TrendTagRowVM,
  TrendTileVM,
  TrendsVM,
} from "./types";

const WEEK_MS = 7 * 24 * 3_600_000;

type Sent = { grade: number; flash: boolean; time: number };

type Bucket = { start: number; end: number; label: string };

const RANGE_LABELS: Record<TrendRange, string> = {
  "1m": "LAST MONTH",
  "3m": "LAST 3 MONTHS",
  "6m": "LAST 6 MONTHS",
  ytd: "YEAR TO DATE",
  "1y": "LAST 12 MONTHS",
  all: "ALL TIME",
};

// A flash is a first encounter: one try on a climb with nothing logged against
// its name before, in this session or any earlier one. Working a project is
// what makes the later send a redpoint, so those attempts count here.
function sends(sessions: SessionWithClimbs[], discipline: Discipline): Sent[] {
  const climbs = sessions
    .flatMap((s) => s.climbs.map((c) => ({ climb: c, time: Date.parse(c.time) })))
    .sort((a, b) => a.time - b.time);
  const seen = new Set<string>();
  const out: Sent[] = [];
  for (const { climb, time } of climbs) {
    const key = climbKey(climb.name);
    const firstEncounter = key === "" || !seen.has(key);
    if (key !== "") seen.add(key);
    const rank = climbRank(climb);
    if (climb.kind === "send" && rank >= 0 && climbDiscipline(climb) === discipline) {
      out.push({ grade: rank, flash: firstEncounter && climb.tries <= 1, time });
    }
  }
  return out;
}

function disciplinesWithSends(sessions: SessionWithClimbs[]): Discipline[] {
  const counts = { boulder: 0, route: 0 };
  for (const s of sessions) {
    for (const c of s.climbs) {
      if (c.kind === "send" && climbRank(c) >= 0) counts[climbDiscipline(c)]++;
    }
  }
  const present = (["boulder", "route"] as const).filter((d) => counts[d] > 0);
  return present.sort((a, b) => counts[b] - counts[a]);
}

export function resolveDiscipline(
  sessions: SessionWithClimbs[],
  requested: Discipline | null
): { discipline: Discipline; disciplines: Discipline[] } {
  const ranked = disciplinesWithSends(sessions);
  const disciplines = (["boulder", "route"] as const).filter((d) => ranked.includes(d));
  const discipline =
    requested !== null && ranked.includes(requested) ? requested : (ranked[0] ?? "boulder");
  return { discipline, disciplines };
}

function normalize(values: number[]): number[] {
  const max = Math.max(1, ...values);
  return values.map((v) => (v === 0 ? 0 : v / max));
}

function weekLabel(msStart: number): string {
  return new Date(msStart).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function monthStartUtc(year: number, month: number): number {
  return Date.UTC(year, month, 1);
}

function monthLabelOf(ms: number): string {
  return new Date(ms)
    .toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })
    .toUpperCase();
}

function trailingWeeks(now: Date, weeks: number): Bucket[] {
  const out: Bucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = now.getTime() - (i + 1) * WEEK_MS;
    out.push({ start, end: start + WEEK_MS, label: weekLabel(start) });
  }
  return out;
}

function monthsBetween(firstMs: number, now: Date): Bucket[] {
  const first = new Date(firstMs);
  const out: Bucket[] = [];
  let y = first.getUTCFullYear();
  let m = first.getUTCMonth();
  while (y < now.getUTCFullYear() || (y === now.getUTCFullYear() && m <= now.getUTCMonth())) {
    const start = monthStartUtc(y, m);
    const end = monthStartUtc(y, m + 1);
    out.push({ start, end, label: monthLabelOf(start) });
    m += 1;
    if (m === 12) {
      m = 0;
      y += 1;
    }
  }
  return out;
}

function trailingMonths(now: Date, months: number): Bucket[] {
  const first = monthStartUtc(now.getUTCFullYear(), now.getUTCMonth() - (months - 1));
  return monthsBetween(first, now);
}

function yearsBetween(firstMs: number, now: Date): Bucket[] {
  const out: Bucket[] = [];
  for (let y = new Date(firstMs).getUTCFullYear(); y <= now.getUTCFullYear(); y++) {
    out.push({ start: Date.UTC(y, 0, 1), end: Date.UTC(y + 1, 0, 1), label: String(y) });
  }
  return out;
}

export function bucketsFor(range: TrendRange, now: Date, firstSessionMs: number | null): Bucket[] {
  switch (range) {
    case "1m":
      return trailingWeeks(now, 4);
    case "3m":
      return trailingWeeks(now, 13);
    case "6m":
      return trailingMonths(now, 6);
    case "ytd":
      return trailingMonths(now, now.getUTCMonth() + 1);
    case "1y":
      return trailingMonths(now, 12);
    case "all": {
      const first = firstSessionMs ?? now.getTime();
      const months = monthsBetween(first, now);
      return months.length > 24 ? yearsBetween(first, now) : months;
    }
  }
}

function ticks(max: number, format: (v: number) => string): string[] {
  if (max <= 0) return ["", "", ""];
  return [format(max), format(max / 2), format(0)];
}

function thinAxis(buckets: Bucket[]): (i: number) => string {
  const every = Math.max(1, Math.ceil(buckets.length / 6));
  return (i) => (i % every === 0 || i === buckets.length - 1 ? buckets[i]!.label : "");
}

const MAX_BREAKDOWN_ROWS = 10;

type TagStat = {
  key: string;
  label: string;
  sessions: number;
  volume: number;
  sends: number;
  hardest: number | null;
  flash: number | null;
  avg: number | null;
};

type MetricPick = (t: TagStat, format: GradeFormatter) => { value: number | null; label: string };

const METRIC_PICK: Record<TrendMetric, MetricPick> = {
  volume: (t) => ({ value: t.volume, label: String(t.volume) }),
  pyramid: (t) => ({ value: t.sends, label: String(t.sends) }),
  hardest: (t, format) => ({
    value: t.hardest,
    label: t.hardest === null ? "-" : format.label(t.hardest),
  }),
  flash: (t) => ({ value: t.flash, label: t.flash === null ? "-" : `${t.flash}%` }),
  avggrade: (t, format) => ({ value: t.avg, label: t.avg === null ? "-" : format.average(t.avg) }),
};

function tagStats(
  sessions: SessionWithClimbs[],
  windowStart: number,
  discipline: Discipline
): TagStat[] {
  return sessionTagGroups(sessions).map((group) => {
    const sent = sends(group.sessions, discipline).filter((c) => c.time >= windowStart);
    const grades = sent.map((c) => c.grade);
    return {
      key: group.key,
      label: group.label,
      sessions: group.sessions.length,
      volume: group.sessions.reduce((a, s) => a + s.climb_count, 0),
      sends: sent.length,
      hardest: grades.length === 0 ? null : Math.max(...grades),
      flash:
        sent.length === 0
          ? null
          : Math.round((sent.filter((c) => c.flash).length / sent.length) * 100),
      avg: grades.length === 0 ? null : grades.reduce((a, g) => a + g, 0) / grades.length,
    };
  });
}

function breakdownFor(
  metric: TrendMetric,
  stats: TagStat[],
  format: GradeFormatter
): TrendTagRowVM[] {
  const rows = stats
    .map((stat) => ({ stat, ...METRIC_PICK[metric](stat, format) }))
    .filter((r): r is { stat: TagStat; value: number; label: string } => r.value !== null);
  const max = Math.max(0, ...rows.map((r) => r.value));
  return rows
    .sort((a, b) => b.value - a.value || a.stat.label.localeCompare(b.stat.label))
    .slice(0, MAX_BREAKDOWN_ROWS)
    .map((r) => ({
      key: r.stat.key,
      label: r.stat.label,
      value: r.label,
      ratio: max <= 0 ? 0 : r.value / max,
      sessions: r.stat.sessions,
    }));
}

export function trendsVM(
  sessions: SessionWithClimbs[],
  range: TrendRange = "3m",
  now: Date = new Date(),
  requestedDiscipline: Discipline | null = null
): TrendsVM {
  const rangeLabel = RANGE_LABELS[range];
  const { discipline, disciplines } = resolveDiscipline(sessions, requestedDiscipline);
  const format = gradeFormatterFor(
    sessions.flatMap((s) => s.climbs),
    discipline
  );
  const grade = format.label;
  const avgLabel = format.average;
  const sessionTimes = sessions.map((s) => Date.parse(s.start_at));
  const firstSessionMs = sessionTimes.length > 0 ? Math.min(...sessionTimes) : null;
  const buckets = bucketsFor(range, now, firstSessionMs);
  const windowStart = buckets[0]?.start ?? 0;

  const inRange = sessions.filter((s) => Date.parse(s.start_at) >= windowStart);
  const rangeSends = sends(inRange, discipline).filter((c) => c.time >= windowStart);

  const bucketClimbs = buckets.map((b) =>
    inRange
      .filter((s) => Date.parse(s.start_at) >= b.start && Date.parse(s.start_at) < b.end)
      .reduce((a, s) => a + s.climb_count, 0)
  );
  const bucketSends = buckets.map((b) =>
    rangeSends.filter((c) => c.time >= b.start && c.time < b.end)
  );
  const bucketAvg = bucketSends.map((g) =>
    g.length === 0 ? 0 : g.reduce((a, c) => a + c.grade, 0) / g.length
  );
  const bucketHardest = bucketSends.map((g) =>
    g.length === 0 ? null : Math.max(...g.map((c) => c.grade))
  );
  const bucketFlash = bucketSends.map((g) => {
    if (g.length === 0) return null;
    return Math.round((g.filter((c) => c.flash).length / g.length) * 100);
  });

  const grades = rangeSends.map((s) => s.grade);
  const lo = grades.length > 0 ? Math.min(...grades) : 0;
  const hi = grades.length > 0 ? Math.max(...grades) : 0;
  const pyramid: Array<{ grade: number; count: number }> = [];
  for (let g = lo; g <= hi; g++) {
    pyramid.push({ grade: g, count: rangeSends.filter((s) => s.grade === g).length });
  }

  const totalSends = rangeSends.length;
  const totalClimbs = inRange.reduce((a, s) => a + s.climb_count, 0);
  const avgGrade = totalSends > 0 ? rangeSends.reduce((a, s) => a + s.grade, 0) / totalSends : 0;

  const stats = tagStats(inRange, windowStart, discipline);
  const axis = thinAxis(buckets);
  const countTick = (v: number): string => String(Math.round(v));
  const gradeTick = (v: number): string => grade(Math.round(v));
  const avgTick = (v: number): string => avgLabel(v);
  const pctTick = (v: number): string => `${Math.round(v)}%`;

  const volumeBars: TrendBarVM[] = normalize(bucketClimbs).map((h, i) => ({
    height: h,
    peak: false,
    valueLabel: bucketClimbs[i] === 0 ? "" : String(bucketClimbs[i]),
    axisLabel: axis(i),
  }));

  const volumeMax = Math.max(0, ...bucketClimbs);
  const pyramidPeak = Math.max(0, ...pyramid.map((p) => p.count));
  const pyramidMax = Math.max(1, pyramidPeak);
  const pyramidBars: TrendBarVM[] = pyramid.map((p) => ({
    height: p.count === 0 ? 0 : p.count / pyramidMax,
    peak: p.grade === hi && p.count > 0,
    valueLabel: String(p.count),
    axisLabel: grade(p.grade),
  }));

  const hardestVals = bucketHardest.map((g) => (g === null ? 0 : g));
  const hardestBars: TrendBarVM[] = bucketHardest.map((g, i) => {
    const prevMax = Math.max(0, ...hardestVals.slice(0, i));
    return {
      height: g === null ? 0 : hi > 0 ? g / hi : 0,
      peak: g !== null && g > prevMax && i > 0,
      valueLabel: g === null ? "-" : grade(g),
      axisLabel: axis(i),
    };
  });

  const avgMax = Math.max(0, ...bucketAvg);
  const flashBest = Math.max(0, ...bucketFlash.map((f) => f ?? 0));
  const flashBars: TrendBarVM[] = bucketFlash.map((f, i) => ({
    height: f === null || flashBest === 0 ? 0 : f / flashBest,
    peak: f !== null && f === flashBest && flashBest > 0,
    valueLabel: f === null ? "-" : `${f}%`,
    axisLabel: axis(i),
  }));

  const avgBars: TrendBarVM[] = normalize(bucketAvg).map((h, i) => ({
    height: h,
    peak: false,
    valueLabel: bucketAvg[i] === 0 ? "" : avgLabel(bucketAvg[i]!),
    axisLabel: axis(i),
  }));

  const lastFlash = [...bucketFlash].reverse().find((f) => f !== null) ?? null;
  const biggestBucket = Math.max(0, ...bucketClimbs);
  const biggestBucketIdx = bucketClimbs.indexOf(biggestBucket);

  const tiles: TrendTileVM[] = [
    {
      metric: "volume",
      label: "VOLUME",
      value: `${totalClimbs} climbs`,
      caption: `${inRange.length} SESSIONS · ${rangeLabel}`,
      bars: volumeBars,
      yTicks: ticks(volumeMax, countTick),
    },
    {
      metric: "pyramid",
      label: "GRADE PYRAMID",
      value: `${totalSends} sends`,
      caption: totalSends > 0 ? `${rangeLabel} · ${grade(lo)}-${grade(hi)}` : rangeLabel,
      bars: pyramidBars,
      yTicks: ticks(pyramidPeak, countTick),
    },
    {
      metric: "hardest",
      label: "HARDEST SEND",
      value: totalSends > 0 ? grade(hi) : "-",
      caption: rangeLabel,
      bars: hardestBars,
      yTicks: ticks(hi, gradeTick),
    },
    {
      metric: "flash",
      label: "FLASH RATE",
      value: lastFlash === null ? "-" : `${lastFlash}%`,
      caption: `SENDS ON THE FIRST TRY · ${rangeLabel}`,
      bars: flashBars,
      yTicks: ticks(flashBest, pctTick),
    },
    {
      metric: "avggrade",
      label: "AVG GRADE",
      value: totalSends > 0 ? avgLabel(avgGrade) : "-",
      caption: rangeLabel,
      bars: avgBars,
      yTicks: ticks(avgMax, avgTick),
    },
  ];

  const details: Record<TrendMetric, TrendDetailVM> = {
    volume: {
      metric: "volume",
      title: "Volume",
      caption: `CLIMBS OVER TIME · ${rangeLabel}`,
      bars: volumeBars,
      yTicks: ticks(volumeMax, countTick),
      specs: [
        { k: "SESSIONS", v: String(inRange.length) },
        { k: "CLIMBS", v: String(totalClimbs) },
        {
          k: "BIGGEST",
          v: biggestBucket > 0 ? `${biggestBucket} · ${buckets[biggestBucketIdx]!.label}` : "-",
        },
      ],
      breakdown: breakdownFor("volume", stats, format),
      insight:
        biggestBucket > 0
          ? `${totalClimbs} climbs across ${inRange.length} sessions, peaking at ${biggestBucket}.`
          : "Log a few sessions and the rhythm shows up here.",
    },
    pyramid: {
      metric: "pyramid",
      title: "Grade pyramid",
      caption: `SENDS BY GRADE · ${rangeLabel}`,
      bars: pyramidBars,
      yTicks: ticks(pyramidPeak, countTick),
      specs: [
        {
          k: "BASE",
          v:
            totalSends > 0
              ? `${grade(pyramid.reduce((a, b) => (b.count > a.count ? b : a)).grade)} · ${Math.max(
                  ...pyramid.map((p) => p.count)
                )} sends`
              : "-",
        },
        {
          k: "TOP",
          v:
            totalSends > 0
              ? `${grade(hi)} · ${pyramid.find((p) => p.grade === hi)?.count ?? 0} sends`
              : "-",
        },
        { k: "TOTAL", v: `${totalSends} sends` },
      ],
      breakdown: breakdownFor("pyramid", stats, format),
      insight:
        totalSends > 0
          ? `A ${grade(pyramid.reduce((a, b) => (b.count > a.count ? b : a)).grade)} base carrying ${grade(hi)} on top.`
          : "Sends stack up here by grade.",
    },
    hardest: {
      metric: "hardest",
      title: "Hardest send",
      caption: `MAX GRADE OVER TIME · ${rangeLabel}`,
      bars: hardestBars,
      yTicks: ticks(hi, gradeTick),
      specs: [
        { k: "MAX", v: totalSends > 0 ? grade(hi) : "-" },
        {
          k: "LATEST",
          v:
            bucketHardest[bucketHardest.length - 1] == null
              ? "-"
              : grade(bucketHardest[bucketHardest.length - 1]!),
        },
        { k: "SENDS AT MAX", v: String(rangeSends.filter((s) => s.grade === hi).length) },
      ],
      breakdown: breakdownFor("hardest", stats, format),
      insight:
        totalSends > 0
          ? `Top grade ${grade(hi)}, with ${rangeSends.filter((s) => s.grade === hi).length} send${
              rangeSends.filter((s) => s.grade === hi).length === 1 ? "" : "s"
            } there so far.`
          : "Your max grade charts here.",
    },
    flash: {
      metric: "flash",
      title: "Flash rate",
      caption: `FLASHES AS % OF SENDS · ${rangeLabel}`,
      bars: flashBars,
      yTicks: ticks(flashBest, pctTick),
      specs: [
        {
          k: "FLASH CEILING",
          v: rangeSends.some((s) => s.flash)
            ? `${grade(Math.max(...rangeSends.filter((s) => s.flash).map((s) => s.grade)))} - hardest flash`
            : "-",
        },
        { k: "BEST", v: flashBest > 0 ? `${flashBest}%` : "-" },
        {
          k: "TOTAL",
          v:
            totalSends > 0
              ? `${rangeSends.filter((s) => s.flash).length} of ${totalSends} flashed`
              : "-",
        },
      ],
      breakdown: breakdownFor("flash", stats, format),
      insight:
        totalSends > 0
          ? "Flash rate tracks how well you read a climb before pulling on."
          : "First-try sends chart here.",
    },
    avggrade: {
      metric: "avggrade",
      title: "Avg grade",
      caption: `AVG SEND GRADE OVER TIME · ${rangeLabel}`,
      bars: avgBars,
      yTicks: ticks(avgMax, avgTick),
      specs: [
        { k: "AVG", v: totalSends > 0 ? avgLabel(avgGrade) : "-" },
        {
          k: "LATEST",
          v:
            bucketAvg[bucketAvg.length - 1] === 0 || bucketAvg[bucketAvg.length - 1] === undefined
              ? "-"
              : avgLabel(bucketAvg[bucketAvg.length - 1]!),
        },
        { k: "SENDS COUNTED", v: String(totalSends) },
      ],
      breakdown: breakdownFor("avggrade", stats, format),
      insight:
        totalSends > 0
          ? "Average send grade drifts slowly - steady beats spiky."
          : "Average send grade lands here.",
    },
  };

  return {
    caption: rangeLabel,
    discipline,
    disciplines,
    tiles,
    details,
  };
}
