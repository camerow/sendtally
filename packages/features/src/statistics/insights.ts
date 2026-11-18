import type { SessionLogWithClimbs } from "@sendtally/api-client";
import {
  FOCI,
  gripSeries,
  setupsOf,
  hangSessionSeconds,
  type Focus,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { gripSetupLabel } from "../hang/format";
import { formatNumber, t } from "../i18n";
import { durationLabel, sessionMinutes } from "../sessions/years";
import { focusLabel } from "../training/focus";
import { isUnscored } from "../sessions/meta";
import { hangTitle } from "../sessions/hang";
import { DAY_MS, bucketsFor, priorWindow, windowOf } from "../trends/buckets";
import type { TrendRange } from "../trends/types";
import { exerciseSeries, type ExerciseMetric } from "./exercises";
import { gripRuns } from "../activities/summary";
import { kindLabel } from "../activities/format";
import { TRAINED_KINDS, oneDecimal } from "./overview";
import { workoutsDone, type WorkoutsDoneVM } from "./workouts";
import { loadVM, type LoadVM } from "./loadView";
import { WORKLOAD_WINDOWS, workloadVM, type WorkloadVM, type WorkloadWeeks } from "./workloadView";

/** Where a record opens: a climbing session by fingerprint, anything trained by id. */
export type DoneRef = { type: "session" | "activity"; id: string; name: string };

export type Done = {
  ref: DoneRef;
  kind: WorkoutKind;
  focus: Focus | null;
  at: number;
  rpe: number | null;
  /** The whole run, its fingerboard part's minutes included. */
  minutes: number;
  /** The minutes of the run that were its fingerboard part, counted as Fingers in the mix. */
  fingers: number;
};

export type InsightsPointVM = {
  label: string;
  axis: string;
  sessions: number;
  effort: number | null;
};

type TrainedVM = { name: string; share: number; detail: string };

export type TrainedKindVM = TrainedVM & { kind: WorkoutKind };

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
  workouts: WorkoutsDoneVM;
  workload: WorkloadVM;
  load: LoadVM;
};

/** A run's minutes that were its fingerboard part: every grip and the rests between them. */
const partMinutes = (
  minutes: number,
  part: Parameters<typeof hangSessionSeconds>[0] | undefined
): number =>
  part === undefined ? 0 : Math.min(minutes, Math.round(hangSessionSeconds(part) / 60));

/** Every record once: a run's fingerboard part counts inside its activity, never on its own. */
export function doneOf(log: SessionLogWithClimbs): Done[] {
  const parts = new Map(log.hangParts.map((p) => [p.activityId, p]));
  return [
    ...log.sessions.map((s): Done => ({
      ref: { type: "session", id: s.fingerprint, name: s.name ?? s.title },
      kind: "climbing",
      focus: s.focus ?? null,
      at: Date.parse(s.start_at),
      rpe: isUnscored(s) ? null : s.rpe,
      minutes: sessionMinutes(s),
      fingers: 0,
    })),
    ...log.hangSessions.map((h): Done => ({
      ref: { type: "activity", id: h.id, name: hangTitle(h) },
      kind: "hangboard",
      focus: h.focus ?? null,
      at: Date.parse(h.date),
      rpe: h.rpe,
      minutes: Math.round(hangSessionSeconds(h) / 60),
      fingers: 0,
    })),
    ...log.activities.map((a): Done => ({
      ref: { type: "activity", id: a.id, name: a.title },
      kind: a.kind,
      focus: a.focus ?? null,
      at: Date.parse(a.date),
      rpe: a.rpe,
      minutes: a.minutes,
      fingers: partMinutes(a.minutes, parts.get(a.id)),
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
  const shown = [...log.hangSessions, ...log.hangParts]
    .filter((h) => within(Date.parse(h.date)))
    .flatMap(gripRuns);
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

/**
 * Each group's sessions and time, its bar its share of the time, leaving out
 * groups with neither. A record is one session under its own group; `minutesIn` gives each group
 * its time. With no time logged at all, the bar falls back to the sessions.
 */
function mix<K>(
  shown: readonly Done[],
  keys: readonly K[],
  keyOf: (d: Done) => K,
  name: (k: K) => string,
  minutesIn: (d: Done, key: K) => number = (d, key) => (keyOf(d) === key ? d.minutes : 0)
): (TrainedVM & { key: K })[] {
  const timeOf = (key: K): number => shown.reduce((n, d) => n + minutesIn(d, key), 0);
  const total = keys.reduce((n, key) => n + timeOf(key), 0);
  return keys.flatMap((key) => {
    const count = shown.filter((d) => keyOf(d) === key).length;
    const time = timeOf(key);
    if (count === 0 && time === 0) return [];
    return [
      {
        key,
        name: name(key),
        share: total > 0 ? time / total : count / shown.length,
        detail:
          time === 0
            ? String(count)
            : count === 0
              ? durationLabel(time)
              : `${count} · ${durationLabel(time)}`,
      },
    ];
  });
}

/** A run's time under its kind, but its fingerboard part's under Fingers. */
const kindMinutes = (d: Done, kind: WorkoutKind): number =>
  (d.kind === kind ? d.minutes - d.fingers : 0) + (kind === "hangboard" ? d.fingers : 0);

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
  kinds: readonly WorkoutKind[],
  gripName: (id: string) => string,
  now: Date = new Date(),
  workloadWeeks: WorkloadWeeks = WORKLOAD_WINDOWS[0]
): TrainingInsightsVM {
  const all = doneOf(log).filter((d) => kinds.includes(d.kind));
  const first = all.length === 0 ? null : Math.min(...all.map((d) => d.at));
  const buckets = bucketsFor(range, now, first);
  const { start, end } = windowOf(buckets);
  const within = (ms: number): boolean => ms >= start && ms < end;
  const shown = all.filter((d) => within(d.at));
  const prior = priorWindow(range, { start, end }) ?? { start: start - (end - start), end: start };
  const before = all.filter((d) => d.at >= prior.start && d.at < prior.end);
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
    trained: mix(shown, TRAINED_KINDS, (d) => d.kind, kindLabel, kindMinutes).map(
      ({ key, ...k }) => ({
        ...k,
        kind: key,
      })
    ),
    byFocus: mix(shown, [...FOCI, null], (d) => d.focus, focusLabel).map(({ key, ...f }) => ({
      ...f,
      focus: key,
    })),
    total: [
      t("statistics.sessionCount", { count: shown.length }),
      ...(minutes === 0 ? [] : [durationLabel(minutes)]),
    ].join(" · "),
    exercises: groups.filter((g) => g.rows.length > 0),
    workouts: workoutsDone(log, within, kinds),
    workload: workloadVM(all, workloadWeeks, now),
    load: loadVM(all, range, now),
  };
}
