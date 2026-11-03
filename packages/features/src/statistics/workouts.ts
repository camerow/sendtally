import type { SessionLogWithClimbs } from "@sendtally/api-client";
import { FOCI, totalSeconds, type CalendarDate, type Focus } from "@sendtally/core/hang";
import { kindLabel } from "../activities/format";
import { shortDate } from "../hang/format";
import { t } from "../i18n";
import { durationLabel } from "../log-session/transforms";
import { hangTitle } from "../sessions/hang";
import { focusLabel } from "../training/focus";
import { ACTIVITY_KINDS, type ActivityKind } from "./overview";
import { workoutKeyOf } from "./workoutKey";

/** How the training mix and the workouts are grouped. */
export type TrainedBy = "category" | "focus";

export type WorkoutSessionVM = {
  id: string;
  dateLabel: string;
  duration: string | null;
  rpe: string | null;
};

export type WorkoutDoneVM = {
  key: string;
  name: string;
  kind: ActivityKind;
  /** "14 times" in range. */
  meta: string;
  /** The last three in range, newest first. */
  sessions: WorkoutSessionVM[];
  /** Every time it was ever done, which is what the log shows. */
  total: number;
};

/** A category's or focus's workouts; the key matches its row in the training mix. */
export type WorkoutGroupVM = {
  key: string;
  label: string;
  kind: ActivityKind | null;
  rows: WorkoutDoneVM[];
};

export type WorkoutsDoneVM = Record<TrainedBy, WorkoutGroupVM[]>;

type Done = {
  id: string;
  key: string;
  name: string;
  kind: ActivityKind;
  focus: Focus | null;
  date: CalendarDate;
  minutes: number;
  rpe: number | null;
};

export const focusKey = (focus: Focus | null): string => focus ?? "general";

function workoutsOf(log: Pick<SessionLogWithClimbs, "hangSessions" | "activities">): Done[] {
  return [
    ...log.hangSessions.map((h): Done => {
      const name = hangTitle(h);
      return {
        id: h.id,
        key: workoutKeyOf({ workoutId: h.workoutId, title: name }),
        name,
        kind: "hangboard",
        focus: h.focus ?? null,
        date: h.date,
        minutes: Math.round(totalSeconds(h.protocol) / 60),
        rpe: h.rpe,
      };
    }),
    ...log.activities.map((a): Done => ({
      id: a.id,
      key: workoutKeyOf(a),
      name: a.title.trim(),
      kind: a.kind,
      focus: a.focus ?? null,
      date: a.date,
      minutes: a.minutes,
      rpe: a.rpe,
    })),
  ];
}

const newestFirst = (a: Done, b: Done): number => b.date.localeCompare(a.date);

function rowsOf(shown: readonly Done[], totals: ReadonlyMap<string, number>): WorkoutDoneVM[] {
  const byKey = new Map<string, Done[]>();
  for (const d of [...shown].sort(newestFirst)) byKey.set(d.key, [...(byKey.get(d.key) ?? []), d]);
  return [...byKey.values()]
    .sort((a, b) => b.length - a.length || (b[0]?.date ?? "").localeCompare(a[0]?.date ?? ""))
    .flatMap((done) => {
      const latest = done[0];
      if (latest === undefined) return [];
      return {
        key: latest.key,
        name: latest.name,
        kind: latest.kind,
        meta: t("statistics.timesCount", { count: done.length }),
        sessions: done.slice(0, 3).map((d) => ({
          id: d.id,
          dateLabel: shortDate(d.date),
          duration: d.minutes > 0 ? durationLabel(d.minutes) : null,
          rpe: d.rpe === null ? null : `RPE ${d.rpe}`,
        })),
        total: totals.get(latest.key) ?? done.length,
      };
    });
}

/** Every workout done in range, the most done first, grouped both by category and by focus. */
export function workoutsDone(
  log: Pick<SessionLogWithClimbs, "hangSessions" | "activities">,
  within: (ms: number) => boolean,
  kinds: readonly ActivityKind[]
): WorkoutsDoneVM {
  const all = workoutsOf(log).filter((d) => kinds.includes(d.kind));
  const totals = new Map<string, number>();
  for (const d of all) totals.set(d.key, (totals.get(d.key) ?? 0) + 1);
  const shown = all.filter((d) => within(Date.parse(d.date)));
  return {
    category: ACTIVITY_KINDS.map((kind) => ({
      key: kind,
      label: kindLabel(kind),
      kind,
      rows: rowsOf(
        shown.filter((d) => d.kind === kind),
        totals
      ),
    })).filter((g) => g.rows.length > 0),
    focus: [...FOCI, null]
      .map((focus) => ({
        key: focusKey(focus),
        label: focusLabel(focus),
        kind: null,
        rows: rowsOf(
          shown.filter((d) => d.focus === focus),
          totals
        ),
      }))
      .filter((g) => g.rows.length > 0),
  };
}

/** Only the picked category's or focus's workouts, or all of them with nothing picked. */
export const pickedWorkouts = (
  groups: readonly WorkoutGroupVM[],
  picked: string | null
): WorkoutGroupVM[] => groups.filter((g) => picked === null || g.key === picked);
