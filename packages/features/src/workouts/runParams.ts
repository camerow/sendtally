import type { ActivityKind } from "@sendtally/api-client";
import type {
  CalendarDate,
  HangSetup,
  Intervals,
  ItemDone,
  PlanLink,
  SessionItem,
} from "@sendtally/core/hang";
import { ACTIVITY_KINDS } from "../activities/format";
import { startTimeOf } from "../activities/intervalsText";
import { timeOfDay } from "../hang/format";
import { t } from "../i18n";
import { today } from "../journal/transforms";
import { durationLabel } from "../sessions/years";
import { NO_PLAN, planLinkParams, readPlanLink, readSession } from "../training/planLinkParams";

/** A workout run in the sets or checklist player, and what the activity it logs is filed under. */
export type WorkoutRun = {
  kind: ActivityKind;
  title: string;
  date: CalendarDate;
  workoutId: string;
  link: PlanLink;
  /** What the workout says it takes, if it says. */
  minutes: number | null;
  /** The rest between one item and the next; none at zero. */
  exerciseRestS: number;
  items: SessionItem[];
};

/** What the intervals player runs, and what the activity it logs is filed under. */
export type IntervalsRun = {
  kind: ActivityKind;
  title: string;
  date: CalendarDate;
  /** The library workout it runs, if any. */
  workoutId: string | null;
  link: PlanLink;
  body: Intervals;
};

/** What the timer saw: every set at what it held, those it never held off, and each item's setup. */
export type TimerRun = { done: ItemDone[]; off: string[]; setups: HangSetup[]; startedAt: number };

/** A hangboard workout's review. */
export type DoneParams = {
  workoutId: string;
  gripId: string;
  link: PlanLink;
  /** How many sessions of the workout came before this one. */
  session: number;
  /** Null when it is logged without the timer, every set as planned. */
  run: TimerRun | null;
};

/** What a player hands its review: what was done, the sets left unticked, and when it last ticked one. */
export type RunFinish = { done: ItemDone[]; off: string[]; lastTickAt?: number };

/** What the activity a run logs is filed under. */
export type RunFiling = Pick<WorkoutRun, "kind" | "title" | "link"> & { workoutId: string | null };

/** Route or search params as a router hands them over. */
export type RawParams = Partial<Record<string, string | string[]>>;

const str = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

const minutesParam = (minutes: number | null): Record<string, string> =>
  minutes === null ? {} : { minutes: String(minutes) };

const count = (text: string): number | null => {
  const n = Number(text);
  return text === "" || !Number.isFinite(n) ? null : n;
};

/** JSON the reader checks is an object; null when it is not one. */
const parseObject = <T>(text: string): Partial<T> | null => {
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === "object" && value !== null ? (value as Partial<T>) : null;
  } catch {
    return null;
  }
};

export const runParams = (r: WorkoutRun): Record<string, string> => ({
  kind: r.kind,
  title: r.title,
  date: r.date,
  workoutId: r.workoutId,
  items: JSON.stringify(r.items),
  ...(r.exerciseRestS > 0 ? { exerciseRestS: String(r.exerciseRestS) } : {}),
  ...minutesParam(r.minutes),
  ...planLinkParams(r.link),
});

const isItem = (v: unknown): v is SessionItem => {
  if (typeof v !== "object" || v === null) return false;
  const { exercise, dose } = v as Partial<SessionItem>;
  return typeof exercise === "string" && typeof dose?.sets === "number";
};

const parseItems = (text: string): SessionItem[] | null => {
  try {
    const items: unknown = JSON.parse(text);
    return Array.isArray(items) && items.every(isItem) ? items : null;
  } catch {
    return null;
  }
};

/** The run from its params, or null when they do not hold one. */
export function readWorkoutRun(p: RawParams): WorkoutRun | null {
  const items = parseItems(str(p.items));
  const kind = ACTIVITY_KINDS.find((k) => k === str(p.kind));
  if (items === null || kind === undefined || str(p.workoutId) === "") return null;
  return {
    kind,
    title: str(p.title),
    date: str(p.date),
    workoutId: str(p.workoutId),
    link: readPlanLink(p),
    minutes: count(str(p.minutes)),
    exerciseRestS: count(str(p.exerciseRestS)) ?? 0,
    items,
  };
}

/**
 * The review for a workout, with what was done in place of what it prescribes when given, and
 * the sets of it a player did not finish.
 */
export function activityFormParams(
  r: RunFiling & Pick<WorkoutRun, "date" | "minutes">,
  done?: readonly ItemDone[],
  startTime?: string,
  off: readonly string[] = []
): Record<string, string> {
  return {
    kind: r.kind,
    title: r.title,
    date: r.date,
    ...(r.workoutId === null ? {} : { workoutId: r.workoutId }),
    ...minutesParam(r.minutes),
    ...planLinkParams(r.link),
    ...(done === undefined ? {} : { done: JSON.stringify(done) }),
    ...(startTime === undefined ? {} : { startTime }),
    ...(off.length === 0 ? {} : { off: JSON.stringify(off) }),
  };
}

/** How long a run may sit after its last tick before the review ends it there. */
const IDLE_MS = 20 * 60_000;

/**
 * A finished run's review, timed by the player's clock from its start, marked live so the
 * review knows it came straight from a player. A run left idle over 20 minutes after its last
 * tick ends at that tick, and says so.
 */
export function finishedRunParams(
  r: RunFiling,
  done: readonly ItemDone[],
  startedAt: number,
  now: number,
  off: readonly string[] = [],
  lastTickAt?: number
): Record<string, string> {
  const idle = lastTickAt !== undefined && now - lastTickAt > IDLE_MS;
  const end = idle ? lastTickAt : now;
  const minutes = Math.max(1, Math.round((end - startedAt) / 60_000));
  const date = today(new Date(startedAt));
  return {
    ...activityFormParams({ ...r, date, minutes }, done, startTimeOf(startedAt), off),
    ...(idle && {
      endTime: startTimeOf(end),
      idle: String(Math.round((now - end) / 60_000)),
    }),
    live: "1",
  };
}

/** Where the review cut a run left open: the minutes it ended on, and the line that says so. */
export type IdleEnd = { minutes: number; line: string };

/** The cut a finished run's review params carry, or null when the clock ran to Finish. */
export function idleEnd(p: RawParams): IdleEnd | null {
  const idle = count(str(p.idle));
  const minutes = count(str(p.minutes));
  if (idle === null || minutes === null || str(p.endTime) === "") return null;
  const time = timeOfDay(str(p.endTime));
  return { minutes, line: t("activities.endedAtLastSet", { time, idle: durationLabel(idle) }) };
}

/** The cut's line while the duration is still the one it cut to; gone once the climber changes it. */
export const idleNote = (end: IdleEnd | null, minutes: number): string | null =>
  end !== null && end.minutes === minutes ? end.line : null;

export const intervalsParams = (r: IntervalsRun): Record<string, string> => ({
  kind: r.kind,
  title: r.title,
  date: r.date,
  body: JSON.stringify(r.body),
  ...(r.workoutId === null ? {} : { workoutId: r.workoutId }),
  ...planLinkParams(r.link),
});

const parseBody = (text: string): Intervals | null => {
  const body = parseObject<Intervals>(text);
  if (body === null || typeof body.rounds !== "number" || !Array.isArray(body.steps)) return null;
  return body.steps.length === 0 ? null : (body as Intervals);
};

/** The intervals run from its params, or null when they do not hold one. */
export function readIntervalsParams(p: RawParams): IntervalsRun | null {
  const body = parseBody(str(p.body));
  const kind = ACTIVITY_KINDS.find((k) => k === str(p.kind));
  if (body === null || kind === undefined) return null;
  return {
    kind,
    title: str(p.title),
    date: str(p.date),
    workoutId: str(p.workoutId) || null,
    link: readPlanLink(p),
    body,
  };
}

/** The timer's params for a hangboard workout's `session`th session. */
export const timerParams = (
  workoutId: string,
  gripId: string,
  session: number,
  link: PlanLink = NO_PLAN
): Record<string, string> => ({
  workoutId,
  gripId,
  session: String(session),
  ...planLinkParams(link),
});

/** A hangboard workout's review as params. */
export const doneParams = ({
  workoutId,
  gripId,
  link,
  session,
  run,
}: DoneParams): Record<string, string> => ({
  ...timerParams(workoutId, gripId, session, link),
  ...(run === null ? {} : { run: JSON.stringify(run) }),
});

function parseRun(text: string): TimerRun | null {
  const run = parseObject<TimerRun>(text);
  if (run === null) return null;
  const valid =
    Array.isArray(run.done) &&
    Array.isArray(run.off) &&
    Array.isArray(run.setups) &&
    typeof run.startedAt === "number";
  return valid ? (run as TimerRun) : null;
}

export function readDoneParams(p: RawParams): DoneParams {
  return {
    workoutId: str(p.workoutId),
    gripId: str(p.gripId),
    link: readPlanLink(p),
    session: readSession(p),
    run: str(p.run) === "" ? null : parseRun(str(p.run)),
  };
}
