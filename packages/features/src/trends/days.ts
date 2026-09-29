import type { Gym, SessionWithClimbs } from "@sendtally/api-client";
import { formatDate, formatNumber, t } from "../i18n";
import { isUnscored } from "../sessions/meta";
import { DAY_MS, bucketsFor, dayStart } from "./buckets";
import { ALL_LADDER } from "./slice";
import { formatter, tile } from "./tile";
import type { DayCellVM, DayTagVM, DaysVM } from "./types";

const WEEK_DAYS = 7;
const YEAR_DAYS = 365;

type Day = { outdoor: boolean; sessions: SessionWithClimbs[] };

/** Monday is 0, so a week column reads Monday to Sunday. */
function weekday(ms: number): number {
  return (new Date(ms).getUTCDay() + 6) % 7;
}

function weekdayName(index: number, width: "short" | "long"): string {
  // 2024-01-01 was a Monday.
  return formatDate(new Date(Date.UTC(2024, 0, 1 + index)), { weekday: width, timeZone: "UTC" });
}

function dayDetail(day: Day | undefined, gyms: Map<string, string>): string {
  if (day === undefined) return t("trends.restDay");
  const climbs = day.sessions.reduce((a, s) => a + s.climb_count, 0);
  const scored = day.sessions.filter((s) => !isUnscored(s));
  const place = day.outdoor
    ? [
        t("trends.outside"),
        ...new Set(
          day.sessions
            .filter((s) => s.location === "outdoor")
            .flatMap((s) => s.tags.map((g) => g.name))
        ),
      ].join(", ")
    : [...new Set(day.sessions.map((s) => (s.gym_id === null ? null : gyms.get(s.gym_id))))]
        .filter((n): n is string => n !== null && n !== undefined)
        .join(", ") || t("trends.inside");
  return [
    place,
    t("common.climbCount", { count: climbs }),
    ...(scored.length === 0 ? [] : [`RPE ${Math.max(...scored.map((s) => s.rpe))}`]),
  ].join(" · ");
}

/** The last 52 weeks of climbing days, whatever the filters say: a calendar is the whole picture. */
export function daysVM(sessions: SessionWithClimbs[], gyms: Gym[], now: Date = new Date()): DaysVM {
  const today = dayStart(now.getTime());
  const firstDay = today - (YEAR_DAYS - 1) * DAY_MS;
  const gridStart = firstDay - weekday(firstDay) * DAY_MS;
  const gymNames = new Map(gyms.map((g) => [g.id, g.name]));

  const days = new Map<number, Day>();
  for (const s of sessions) {
    const key = dayStart(Date.parse(s.start_at));
    if (key < firstDay || key > today) continue;
    const day = days.get(key) ?? { outdoor: false, sessions: [] };
    day.sessions.push(s);
    day.outdoor = day.outdoor || s.location === "outdoor";
    days.set(key, day);
  }
  const keys = [...days.keys()].sort((a, b) => a - b);
  const outside = keys.filter((k) => days.get(k)!.outdoor).length;
  const inside = keys.length - outside;

  const weeks: DayCellVM[][] = [];
  const monthMarks: string[] = [];
  let lastMonth = -1;
  for (let week = gridStart; week <= today; week += WEEK_DAYS * DAY_MS) {
    const cells: DayCellVM[] = [];
    for (let i = 0; i < WEEK_DAYS; i++) {
      const ms = week + i * DAY_MS;
      const day = days.get(ms);
      cells.push({
        key: String(ms),
        state:
          ms < firstDay || ms > today
            ? "void"
            : day === undefined
              ? "none"
              : day.outdoor
                ? "outdoor"
                : "indoor",
        date: formatDate(new Date(ms), {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        }),
        detail: dayDetail(day, gymNames),
      });
    }
    const month = new Date(week + (WEEK_DAYS - 1) * DAY_MS).getUTCMonth();
    monthMarks.push(
      month === lastMonth
        ? ""
        : formatDate(new Date(week + (WEEK_DAYS - 1) * DAY_MS), { month: "short", timeZone: "UTC" })
    );
    lastMonth = month;
    weeks.push(cells);
  }

  const weekIndex = (ms: number): number => Math.floor((ms - gridStart) / (WEEK_DAYS * DAY_MS));
  const climbedWeeks = new Set(keys.map(weekIndex));
  let longest = 0;
  let run = 0;
  for (let w = 0; w < weeks.length; w++) {
    run = climbedWeeks.has(w) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // This week still has days left in it, so an empty one has not broken the streak yet.
  let current = 0;
  let w = weeks.length - 1;
  if (!climbedWeeks.has(w)) w--;
  while (w >= 0 && climbedWeeks.has(w)) {
    current++;
    w--;
  }
  let gap = 0;
  for (let i = 1; i < keys.length; i++) {
    gap = Math.max(gap, Math.round((keys[i]! - keys[i - 1]!) / DAY_MS) - 1);
  }

  const months = bucketsFor("1y", now, null).map((b) => {
    const inMonth = keys.filter((k) => k >= b.start && k < b.end);
    const out = inMonth.filter((k) => days.get(k)!.outdoor).length;
    return { a: inMonth.length - out, b: out, axis: b.axis, label: b.label };
  });
  const byWeekday = Array.from({ length: WEEK_DAYS }, (_, i) => {
    const on = keys.filter((k) => weekday(k) === i);
    const out = on.filter((k) => days.get(k)!.outdoor).length;
    return {
      a: on.length - out,
      b: out,
      axis: weekdayName(i, "short"),
      label: weekdayName(i, "long"),
    };
  });
  const busiest = byWeekday.reduce(
    (best, d, i, all) => (d.a + d.b > all[best]!.a + all[best]!.b ? i : best),
    0
  );

  const series = [
    { key: "inside" as const, label: t("trends.seriesInside") },
    { key: "outside" as const, label: t("trends.seriesOutside") },
  ];
  const count = formatter("count", ALL_LADDER);
  const splitInside = (a: number, b: number): string =>
    t("trends.splitInside", { inside: count(a), outside: count(b) });
  const year = t("trends.range1y");
  const split = splitInside(inside, outside);

  const tagDays = new Map<string, { name: string; inside: Set<number>; outside: Set<number> }>();
  for (const key of keys) {
    for (const s of days.get(key)!.sessions) {
      for (const tag of s.tags) {
        const entry = tagDays.get(tag.slug) ?? {
          name: tag.name,
          inside: new Set(),
          outside: new Set(),
        };
        (s.location === "outdoor" ? entry.outside : entry.inside).add(key);
        tagDays.set(tag.slug, entry);
      }
    }
  }
  const tagRows = [...tagDays.entries()].map(([slug, e]) => ({
    slug,
    name: e.name,
    inside: e.inside.size,
    outside: e.outside.size,
    total: new Set([...e.inside, ...e.outside]).size,
  }));
  const tagMax = Math.max(1, ...tagRows.map((r) => r.inside + r.outside));
  const tags: DayTagVM[] = tagRows
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .map((r) => ({ ...r, insideRatio: r.inside / tagMax, outsideRatio: r.outside / tagMax }));

  const weeksCount = (n: number): string => t("trends.weekCount", { count: n, n: formatNumber(n) });
  return {
    lead: t("trends.daysLead", {
      days: t("trends.dayCount", { count: keys.length }),
      inside: count(inside),
      outside: count(outside),
    }),
    summary: `${t("trends.dayCount", { count: keys.length })} · ${split}`,
    stats: [
      { key: "days", label: t("trends.daysClimbing"), value: count(keys.length), lifetime: null },
      {
        key: "perWeek",
        label: t("trends.daysAWeek"),
        value: formatNumber(keys.length / 52, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
        lifetime: null,
      },
      {
        key: "current",
        label: t("trends.currentStreak"),
        value: weeksCount(current),
        lifetime: null,
      },
      {
        key: "longest",
        label: t("trends.longestStreak"),
        value: weeksCount(longest),
        lifetime: null,
      },
      {
        key: "break",
        label: t("trends.longestBreak"),
        value: t("trends.dayCount", { count: gap }),
        lifetime: null,
      },
    ],
    weeks,
    monthMarks,
    weekdayMarks: Array.from({ length: WEEK_DAYS }, (_, i) => weekdayName(i, "short")),
    tiles: [
      tile({
        id: "months",
        title: t("trends.daysPerMonth"),
        chart: "stack",
        kind: "count",
        ladder: ALL_LADDER,
        total: keys.length,
        caption: `${t("trends.insideAndOutside")} · ${year}`,
        sub: split,
        series,
        split: splitInside,
        points: months,
      }),
      tile({
        id: "weekdays",
        title: t("trends.weeklyRhythm"),
        chart: "stack",
        kind: "count",
        ladder: ALL_LADDER,
        total: keys.length,
        caption: `${t("trends.daysByWeekday")} · ${year}`,
        sub: keys.length === 0 ? "" : t("trends.mostOftenOn", { day: byWeekday[busiest]!.label }),
        series,
        split: splitInside,
        points: byWeekday,
      }),
    ],
    tags,
  };
}
