import type { Activity, HangSessionRecord, Plan, SessionRow } from "@sendtally/api-client";
import { addDays, type CalendarDate, type WorkoutKind } from "@sendtally/core/hang";
import { utcDate } from "../log-session/transforms";
import { isUnscored } from "../sessions/meta";
import { occurrencesOn, type LoggedSession, type Occurrence, type WorkoutLookup } from "./plan";

/** Something logged on a training day. */
export type LoggedItem =
  | { kind: "climb"; session: SessionRow }
  | { kind: "hang"; session: HangSessionRecord }
  | { kind: "activity"; activity: Activity };

export type TrainingDay = {
  date: CalendarDate;
  isToday: boolean;
  isPast: boolean;
  logged: LoggedItem[];
  /** Every membership landing on the day: done, missed or still planned. */
  plans: Occurrence[];
};

export type TrainingLog = {
  climbs: readonly SessionRow[];
  hangs: readonly HangSessionRecord[];
  activities: readonly Activity[];
  plan: Plan;
  workout: WorkoutLookup;
};

/** A climbing session's calendar day: its wall-clock start is stored as UTC. */
export const climbDate = (session: Pick<SessionRow, "start_at">): CalendarDate =>
  utcDate(session.start_at);

/** Everything logged, as the plan reads it. */
export function loggedSessions(log: Omit<TrainingLog, "plan" | "workout">): LoggedSession[] {
  return [
    ...log.climbs.map((s) => ({
      kind: "climbing" as const,
      date: climbDate(s),
      membershipId: s.membership_id,
      workoutId: null,
    })),
    ...log.hangs.map((s) => ({
      kind: "hangboard" as const,
      date: s.date,
      membershipId: s.membershipId,
      workoutId: s.workoutId,
    })),
    ...log.activities.map((a) => ({
      kind: a.kind,
      date: a.date,
      membershipId: a.membershipId,
      workoutId: a.workoutId,
    })),
  ];
}

export function trainingDay(
  log: TrainingLog,
  date: CalendarDate,
  today: CalendarDate
): TrainingDay {
  return {
    date,
    isToday: date === today,
    isPast: date < today,
    logged: [
      ...log.climbs
        .filter((s) => climbDate(s) === date)
        .map((session): LoggedItem => ({ kind: "climb", session })),
      ...log.hangs
        .filter((s) => s.date === date)
        .map((session): LoggedItem => ({ kind: "hang", session })),
      ...log.activities
        .filter((a) => a.date === date)
        .map((activity): LoggedItem => ({ kind: "activity", activity })),
    ],
    plans: occurrencesOn(log.plan, log.workout, loggedSessions(log), date, today),
  };
}

/** The seven days from `monday`. */
export function trainingWeek(
  log: TrainingLog,
  monday: CalendarDate,
  today: CalendarDate
): TrainingDay[] {
  return Array.from({ length: 7 }, (_, i) => trainingDay(log, addDays(monday, i), today));
}

export function itemEffort(item: LoggedItem): number | null {
  if (item.kind === "activity") return item.activity.rpe;
  if (item.kind === "hang") return item.session.rpe;
  return isUnscored(item.session) ? null : item.session.rpe;
}

/** The kind of training a logged item is. */
export const loggedKind = (item: LoggedItem): WorkoutKind =>
  item.kind === "activity" ? item.activity.kind : item.kind === "hang" ? "hangboard" : "climbing";

export type DayMarkSpec = { kind: WorkoutKind; filled: boolean };

/**
 * One mark per thing on the day: filled for what was logged, outlined while open. A plan
 * done adds none, since the session that did it is already logged.
 */
export function dayMarks(day: TrainingDay): DayMarkSpec[] {
  return [
    ...day.logged.map((i) => ({ kind: loggedKind(i), filled: true })),
    ...day.plans
      .filter((p) => p.status !== "done")
      .flatMap((p) => (p.workout === undefined ? [] : [{ kind: p.workout.kind, filled: false }])),
  ];
}

/** The week's logged marks out of every mark: what was logged plus everything still open. */
export function weekDone(days: readonly TrainingDay[]): { done: number; planned: number } {
  const marks = days.flatMap(dayMarks);
  return { done: marks.filter((m) => m.filled).length, planned: marks.length };
}
