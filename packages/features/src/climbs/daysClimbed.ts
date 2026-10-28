import { formatDate, t } from "../i18n";
import { bucketsFor, DAY_MS, dayStart, rangeLabel, windowOf } from "../trends/buckets";
import type { TrendRange } from "../trends/types";
import type { InsightsSession } from "./insights";

const WEEK_MS = 7 * DAY_MS;

/** A day on the grid: climbed outside (even if also in the gym), in the gym, neither, or to come. */
export type ClimbingDay = "outside" | "gym" | "rest" | "future";

/** One column, Monday to Sunday, named by the month whose first day it holds. */
export type ClimbingWeek = { month: string | null; days: ClimbingDay[] };

export type DaysClimbedVM = {
  /** Monday to Sunday, every other day named so the labels fit beside 14px squares. */
  weekdays: string[];
  weeks: ClimbingWeek[];
  outside: number;
  gym: number;
  /** The grid read aloud: the range and how many days of each. */
  label: string;
};

const utc = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions => ({
  ...options,
  timeZone: "UTC",
});

const monthOf = (ms: number): string => formatDate(new Date(ms), utc({ month: "short" }));

/**
 * The range as weeks of days ending on this week, a column a week (7D is one, 3M thirteen, 1Y
 * fifty-three), each day coloured by where the climbing was.
 */
export function daysClimbed(
  sessions: readonly Pick<InsightsSession, "start_at" | "location">[],
  range: TrendRange,
  now: Date = new Date()
): DaysClimbedVM {
  const first =
    sessions.length === 0 ? null : Math.min(...sessions.map((s) => Date.parse(s.start_at)));
  const { start, end } = windowOf(bucketsFor(range, now, first));
  const columns = Math.max(1, Math.ceil((end - start) / WEEK_MS));
  const today = dayStart(now.getTime());
  const monday = today - ((new Date(today).getUTCDay() + 6) % 7) * DAY_MS;
  const from = monday - (columns - 1) * WEEK_MS;

  const climbed = new Map<number, ClimbingDay>();
  for (const s of sessions) {
    const day = dayStart(Date.parse(s.start_at));
    if (climbed.get(day) !== "outside")
      climbed.set(day, s.location === "outdoor" ? "outside" : "gym");
  }

  const dayAt = (ms: number): ClimbingDay => (ms > today ? "future" : (climbed.get(ms) ?? "rest"));
  const firstOfMonth = (week: number): number | undefined =>
    Array.from({ length: 7 }, (_, d) => from + week * WEEK_MS + d * DAY_MS).find(
      (ms) => ms <= today && new Date(ms).getUTCDate() === 1
    );

  const weeks = Array.from({ length: columns }, (_, w): ClimbingWeek => {
    const opens = firstOfMonth(w);
    const lead = w === 0 && (columns === 1 || firstOfMonth(1) === undefined);
    return {
      month: opens !== undefined ? monthOf(opens) : lead ? monthOf(from) : null,
      days: Array.from({ length: 7 }, (_, d) => dayAt(from + w * WEEK_MS + d * DAY_MS)),
    };
  });
  const all = weeks.flatMap((w) => w.days);
  const outside = all.filter((d) => d === "outside").length;
  const gym = all.filter((d) => d === "gym").length;
  return {
    weekdays: Array.from({ length: 7 }, (_, d) =>
      d % 2 === 0 ? formatDate(new Date(from + d * DAY_MS), utc({ weekday: "narrow" })) : ""
    ),
    weeks,
    outside,
    gym,
    label: t("climbs.daysClimbingLabel", { range: rangeLabel(range), outside, gym }),
  };
}
