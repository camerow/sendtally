import type { SessionLogWithClimbs } from "@sendtally/api-client";
import { FOCI, gripSeries, setupsOf, totalSeconds, type Focus } from "@sendtally/core/hang";
import { gripSetupLabel } from "../hang/format";
import { formatNumber, t } from "../i18n";
import { durationLabel } from "../log-session/transforms";
import { focusLabel } from "../training/focus";
import { isUnscored } from "../sessions/meta";
import { DAY_MS, bucketsFor, windowOf } from "../trends/buckets";
import type { TrendRange } from "../trends/types";
import { exerciseSeries, type ExerciseMetric } from "./exercises";
import { ACTIVITY_KINDS, kindName, oneDecimal, type ActivityKind } from "./overview";

type Done = {
  kind: ActivityKind;
  focus: Focus | null;
  at: number;
  rpe: number | null;
  minutes: number;
};

export type InsightsPointVM = {
  label: string;
  axis: string;
  sessions: number;
  effort: number | null;
};

type TrainedVM = { name: string; share: number; detail: string };

export type TrainedKindVM = TrainedVM & { kind: ActivityKind };

/** A focus's share of what was trained, General for sessions with none. */
export type TrainedFocusVM = TrainedVM & { focus: Focus | null };

export type ExerciseTrendVM = {
  key: string;
  name: string;
  count: number;
  /** The best of each session, oldest first. */
  values: number[];
  /** Latest minus first, on the metric. */
  change: number;
  metric: ExerciseMetric;
  /** Said under the name in place of the count: a grip's setup and count. */
  meta?: string;
};

export type ExerciseGroupKind = "hangboard" | "strength" | "mobility" | "other";

export type ExerciseGroupVM = { kind: ExerciseGroupKind; rows: ExerciseTrendVM[] };

export type TrainingInsightsVM = {
  sessions: number;
  /** "Effort 6.4, up 0.3 · 2.6 sessions a week" */
  line: string;
  points: InsightsPointVM[];
  trained: TrainedKindVM[];
  /** Every focus trained, in season order, then General. */
  byFocus: TrainedFocusVM[];
  total: string;
  exercises: ExerciseGroupVM[];
};

const minutesBetween = (start: string, end: string): number =>
  Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 60_000));

function doneOf(log: SessionLogWithClimbs): Done[] {
  return [
    ...log.sessions.map((s): Done => ({
      kind: "climbing",
      focus: s.focus ?? null,
      at: Date.parse(s.start_at),
      rpe: isUnscored(s) ? null : s.rpe,
      minutes: s.times === "both" ? minutesBetween(s.start_at, s.end_at) : 0,
    })),
    ...log.hangSessions.map((h): Done => ({
      kind: "hangboard",
      focus: h.focus ?? null,
      at: Date.parse(h.date),
      rpe: h.rpe,
      minutes: Math.round(totalSeconds(h.protocol) / 60),
    })),
    ...log.activities.map((a): Done => ({
      kind: a.kind,
      focus: a.focus ?? null,
      at: Date.parse(a.date),
      rpe: a.rpe,
      minutes: a.minutes,
    })),
  ];
}

const mean = (values: readonly number[]): number | null =>
  values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;

const effortOf = (done: readonly Done[]): number | null =>
  mean(done.flatMap((d) => (d.rpe === null ? [] : [d.rpe])));

function effortLine(now: number | null, before: number | null): string | null {
  if (now === null) return null;
  const effort = oneDecimal(now);
  if (before === null || Math.abs(now - before) < 0.05) return t("statistics.effortIs", { effort });
  const change = oneDecimal(Math.abs(now - before));
  return now > before
    ? t("statistics.effortUp", { effort, change })
    : t("statistics.effortDown", { effort, change });
}

function trend(
  key: string,
  name: string,
  metric: ExerciseMetric,
  values: number[]
): ExerciseTrendVM {
  return {
    key,
    name,
    count: values.length,
    values,
    change: (values.at(-1) ?? 0) - (values[0] ?? 0),
    metric,
  };
}

/** Each grip on its most used setup: its completed loads there, oldest first, and their change. */
function hangTrends(
  log: SessionLogWithClimbs,
  within: (ms: number) => boolean,
  gripName: (id: string) => string
): ExerciseTrendVM[] {
  const shown = log.hangSessions.filter((h) => within(Date.parse(h.date)));
  return [...new Set(shown.map((h) => h.gripId))]
    .flatMap((id) => {
      const [setup] = setupsOf(shown, id);
      if (setup === undefined) return [];
      const loads = gripSeries(shown, id, setup)
        .filter((h) => h.pct >= 100)
        .map((h) => h.loadKg);
      const count = shown.filter((h) => h.gripId === id).length;
      const times = t("statistics.timesCount", { count });
      return [
        {
          ...trend(id, gripName(id), "load", loads),
          count,
          meta: `${gripSetupLabel(setup)} · ${times}`,
        },
      ];
    })
    .sort((a, b) => b.count - a.count);
}

/** Each group's share of the sessions and its time, leaving out groups with none. */
function mix<K>(
  shown: readonly Done[],
  keys: readonly K[],
  keyOf: (d: Done) => K,
  name: (k: K) => string
): (TrainedVM & { key: K })[] {
  return keys.flatMap((key) => {
    const of = shown.filter((d) => keyOf(d) === key);
    if (of.length === 0) return [];
    const time = of.reduce((n, d) => n + d.minutes, 0);
    return [
      {
        key,
        name: name(key),
        share: of.length / shown.length,
        detail: time === 0 ? String(of.length) : `${of.length} · ${durationLabel(time)}`,
      },
    ];
  });
}

/**
 * Training over a range: effort and sessions per bucket, the mix of kinds by sessions and time,
 * and each exercise grouped by kind, the most done first, with its change on its own metric.
 */
function perWeekLabel(perWeek: number): string {
  const n = Math.round(perWeek * 10) / 10;
  return t("statistics.perWeek", { count: n, n: formatNumber(n, { maximumFractionDigits: 1 }) });
}

export function trainingInsightsVM(
  log: SessionLogWithClimbs,
  range: TrendRange,
  kinds: readonly ActivityKind[],
  gripName: (id: string) => string,
  now: Date = new Date()
): TrainingInsightsVM {
  const all = doneOf(log).filter((d) => kinds.includes(d.kind));
  const first = all.length === 0 ? null : Math.min(...all.map((d) => d.at));
  const buckets = bucketsFor(range, now, first);
  const { start, end } = windowOf(buckets);
  const within = (ms: number): boolean => ms >= start && ms < end;
  const shown = all.filter((d) => within(d.at));
  const before = all.filter((d) => d.at >= start - (end - start) && d.at < start);
  const weeks = Math.max(1, (end - start) / (7 * DAY_MS));
  const minutes = shown.reduce((n, d) => n + d.minutes, 0);
  const line = [
    effortLine(effortOf(shown), effortOf(before)),
    perWeekLabel(shown.length / weeks),
  ].filter((p) => p !== null);
  const activities = log.activities.filter((a) => within(Date.parse(a.date)));
  const groups: ExerciseGroupVM[] = [
    {
      kind: "hangboard" as const,
      rows: kinds.includes("hangboard") ? hangTrends(log, within, gripName) : [],
    },
    ...(["strength", "mobility", "other"] as const).map((kind) => ({
      kind,
      rows: kinds.includes(kind)
        ? exerciseSeries(activities.filter((a) => a.kind === kind)).map((s) =>
            trend(
              s.key,
              s.name,
              s.metric,
              s.sessions.map((x) => x.value)
            )
          )
        : [],
    })),
  ];
  return {
    sessions: shown.length,
    line: line.join(" · "),
    points: buckets.map((b) => {
      const inside = shown.filter((d) => d.at >= b.start && d.at < b.end);
      return { label: b.label, axis: b.axis, sessions: inside.length, effort: effortOf(inside) };
    }),
    trained: mix(shown, ACTIVITY_KINDS, (d) => d.kind, kindName).map(({ key, ...k }) => ({
      ...k,
      kind: key,
    })),
    byFocus: mix(shown, [...FOCI, null], (d) => d.focus, focusLabel).map(({ key, ...f }) => ({
      ...f,
      focus: key,
    })),
    total: [
      t("statistics.sessionCount", { count: shown.length }),
      ...(minutes === 0 ? [] : [durationLabel(minutes)]),
    ].join(" · "),
    exercises: groups.filter((g) => g.rows.length > 0),
  };
}
