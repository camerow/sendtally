import type { HangHistoryRow, SessionLog } from "@sendtally/api-client";
import { timeOnEdge, totalSeconds, type CalendarDate } from "@sendtally/core/hang";
import { dayMonth } from "../hang/format";
import { formatNumber, t, type MessageKey } from "../i18n";
import { isUnscored } from "../sessions/meta";
import { durationLabel, sessionMinutes } from "../sessions/years";
import { OVERVIEW_WEEKS, summariseActivity, type Activity } from "./activity";

export const ACTIVITY_KINDS = ["climbing", "hangboard", "strength", "mobility", "other"] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

const KIND_NAMES: Record<ActivityKind, MessageKey> = {
  climbing: "statistics.climbing",
  hangboard: "statistics.hangboard",
  strength: "activities.kindStrength",
  mobility: "activities.kindMobility",
  other: "activities.kindOther",
};

const AXIS_EVERY = 4;

export type OverviewWeekVM = {
  start: CalendarDate;
  sessions: Record<ActivityKind, number>;
  effort: number | null;
  axis: string;
  label: string;
};

export type OverviewKindVM = { kind: ActivityKind; name: string; minutes: number; time: string };

export type OverviewStatVM = { label: string; value: string };

export type StatisticsOverviewVM = {
  sessions: number;
  perWeek: string;
  perWeekCaption: string;
  weeks: OverviewWeekVM[];
  mostInAWeek: number;
  effortNow: string | null;
  effortChange: string | null;
  stats: OverviewStatVM[];
  kinds: OverviewKindVM[];
};

const share = (h: HangHistoryRow): number => Math.min(100, Math.max(0, h.pct)) / 100;

export function activitiesOf(log: SessionLog): Activity<ActivityKind>[] {
  return [
    ...log.sessions.map((s): Activity<ActivityKind> => ({
      kind: "climbing",
      date: s.start_at.slice(0, 10),
      minutes: sessionMinutes(s),
      rpe: isUnscored(s) ? null : s.rpe,
    })),
    ...log.hangSessions.map((h): Activity<ActivityKind> => ({
      kind: "hangboard",
      date: h.date,
      minutes: (totalSeconds(h.protocol) * share(h)) / 60,
      rpe: h.rpe,
    })),
    ...log.activities.map((a): Activity<ActivityKind> => ({
      kind: a.kind,
      date: a.date,
      minutes: a.minutes,
      rpe: a.rpe,
    })),
  ];
}

const kindName = (kind: ActivityKind): string => t(KIND_NAMES[kind]);

/** The kinds a week holds, or climbing alone to say an empty week is empty. */
const weekKinds = (sessions: Record<ActivityKind, number>): ActivityKind[] => {
  const held = ACTIVITY_KINDS.filter((k) => sessions[k] > 0);
  return held.length > 0 ? held : ["climbing"];
};

const oneDecimal = (n: number): string =>
  formatNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const time = (minutes: number): string => durationLabel(Math.round(minutes));

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

/** Twelve weeks of every kind of session: counts, effort, streak and where the time went. */
export function overviewVM(log: SessionLog, today: CalendarDate): StatisticsOverviewVM {
  const summary = summariseActivity(activitiesOf(log), ACTIVITY_KINDS, today);
  const last = summary.weeks.length - 1;
  const weeks = summary.weeks.map((w, i): OverviewWeekVM => ({
    ...w,
    axis: i === last ? t("statistics.now") : i % AXIS_EVERY === 0 ? dayMonth(w.start) : "",
    label: t("statistics.weekSummary", {
      date: dayMonth(w.start),
      sessions: weekKinds(w.sessions)
        .map((k) => `${kindName(k)} ${w.sessions[k]}`)
        .join(", "),
    }),
  }));
  const from = summary.weeks[0]?.start ?? today;
  const edgeSeconds = log.hangSessions
    .filter((h) => h.date >= from && h.date <= today)
    .reduce((sum, h) => sum + timeOnEdge(h.protocol) * share(h), 0);
  const effortNow = [...weeks].reverse().find((w) => w.effort !== null)?.effort ?? null;
  return {
    sessions: summary.sessions,
    perWeek: oneDecimal(summary.sessions / OVERVIEW_WEEKS),
    perWeekCaption: t("statistics.perWeekCaption", { count: summary.sessions }),
    weeks,
    mostInAWeek: Math.max(
      1,
      ...weeks.map((w) => ACTIVITY_KINDS.reduce((n, k) => n + w.sessions[k], 0))
    ),
    effortNow: effortNow === null ? null : oneDecimal(effortNow),
    effortChange: effortChange(weeks),
    stats: [
      { label: t("statistics.sessions"), value: formatNumber(summary.sessions) },
      { label: t("statistics.weekStreak"), value: formatNumber(summary.streak) },
      { label: t("statistics.climbingTime"), value: time(summary.minutes.climbing) },
      { label: t("statistics.onTheEdge"), value: time(edgeSeconds / 60) },
    ],
    kinds: ACTIVITY_KINDS.map((kind) => ({
      kind,
      name: kindName(kind),
      minutes: summary.minutes[kind],
      time: time(summary.minutes[kind]),
    })),
  };
}
