import type { SessionLogWithClimbs } from "@sendtally/api-client";
import type { CalendarDate } from "@sendtally/core/hang";
import { dayMonth } from "../hang/format";
import { formatNumber, t, type MessageKey } from "../i18n";
import { isUnscored } from "../sessions/meta";
import { firstWeek, summariseActivity, type Activity } from "./activity";
import { topSendVM, type TopSendVM } from "./topSend";

export const ACTIVITY_KINDS = ["climbing", "hangboard", "strength", "mobility", "other"] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const STATISTICS_RANGES = ["12w", "1y"] as const;

export type StatisticsRange = (typeof STATISTICS_RANGES)[number];

const RANGE_WEEKS: Record<StatisticsRange, number> = { "12w": 12, "1y": 52 };

const RANGE_NAMES: Record<StatisticsRange, MessageKey> = {
  "12w": "statistics.range12w",
  "1y": "statistics.range1y",
};

export const statisticsRangeLabel = (range: StatisticsRange): string => t(RANGE_NAMES[range]);

const KIND_NAMES: Record<ActivityKind, MessageKey> = {
  climbing: "statistics.climbing",
  hangboard: "statistics.hangboard",
  strength: "activities.kindStrength",
  mobility: "activities.kindMobility",
  other: "activities.kindOther",
};

export type OverviewWeekVM = {
  start: CalendarDate;
  sessions: Record<ActivityKind, number>;
  effort: number | null;
  axis: string;
  label: string;
};

export type OverviewKindVM = { kind: ActivityKind; name: string };

export type StatisticsOverviewVM = {
  sessions: number;
  perWeek: string;
  perWeekCaption: string;
  weeks: OverviewWeekVM[];
  mostInAWeek: number;
  effortNow: string | null;
  effortChange: string | null;
  kinds: OverviewKindVM[];
  topSend: TopSendVM;
};

export function activitiesOf(log: SessionLogWithClimbs): Activity<ActivityKind>[] {
  return [
    ...log.sessions.map((s): Activity<ActivityKind> => ({
      kind: "climbing",
      date: s.start_at.slice(0, 10),
      rpe: isUnscored(s) ? null : s.rpe,
    })),
    ...log.hangSessions.map((h): Activity<ActivityKind> => ({
      kind: "hangboard",
      date: h.date,
      rpe: h.rpe,
    })),
    ...log.activities.map((a): Activity<ActivityKind> => ({
      kind: a.kind,
      date: a.date,
      rpe: a.rpe,
    })),
  ];
}

const kindName = (kind: ActivityKind): string => t(KIND_NAMES[kind]);

const total = (sessions: Record<ActivityKind, number>): number =>
  ACTIVITY_KINDS.reduce((n, k) => n + sessions[k], 0);

/** The kinds a week holds, or the first kind shown to say an empty week is empty. */
const weekKinds = (
  sessions: Record<ActivityKind, number>,
  kinds: readonly ActivityKind[]
): ActivityKind[] => {
  const held = kinds.filter((k) => sessions[k] > 0);
  return held.length > 0 ? held : kinds.slice(0, 1);
};

const oneDecimal = (n: number): string =>
  formatNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function effortChange(weeks: readonly OverviewWeekVM[]): string | null {
  const scored = weeks.flatMap((w) =>
    w.effort === null ? [] : [{ start: w.start, effort: w.effort }]
  );
  const first = scored[0];
  const last = scored[scored.length - 1];
  if (first === undefined || last === undefined || scored.length < 2) return null;
  const change = last.effort - first.effort;
  return t("statistics.effortSince", {
    arrow: change >= 0 ? "▲" : "▼",
    value: oneDecimal(Math.abs(change)),
    date: dayMonth(first.start),
  });
}

/** Weeks of sessions by kind, their effort, and the top gym send, over the range. */
export function overviewVM(
  log: SessionLogWithClimbs,
  today: CalendarDate,
  range: StatisticsRange,
  kinds: readonly ActivityKind[] = ACTIVITY_KINDS
): StatisticsOverviewVM {
  const count = RANGE_WEEKS[range];
  const every = Math.round(count / 3);
  const shown = activitiesOf(log).filter((a) => kinds.includes(a.kind));
  const summary = summariseActivity(shown, ACTIVITY_KINDS, today, count);
  const last = summary.weeks.length - 1;
  const weeks = summary.weeks.map((w, i): OverviewWeekVM => ({
    ...w,
    axis: i === last ? t("statistics.now") : i % every === 0 ? dayMonth(w.start) : "",
    label: t("statistics.weekSummary", {
      date: dayMonth(w.start),
      sessions: weekKinds(w.sessions, kinds)
        .map((k) => `${kindName(k)} ${w.sessions[k]}`)
        .join(", "),
    }),
  }));
  const effortNow = [...weeks].reverse().find((w) => w.effort !== null)?.effort ?? null;
  return {
    sessions: summary.sessions,
    perWeek: oneDecimal(summary.sessions / count),
    perWeekCaption: t("statistics.perWeekCaption", { count: summary.sessions }),
    weeks,
    mostInAWeek: Math.max(1, ...weeks.map((w) => total(w.sessions))),
    effortNow: effortNow === null ? null : oneDecimal(effortNow),
    effortChange: effortChange(weeks),
    kinds: kinds
      .filter((kind) => weeks.some((w) => w.sessions[kind] > 0))
      .map((kind) => ({ kind, name: kindName(kind) })),
    topSend: topSendVM(log.sessions, firstWeek(today, count), count),
  };
}
