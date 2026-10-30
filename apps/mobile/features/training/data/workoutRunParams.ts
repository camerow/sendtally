import { router, type Href } from "expo-router";
import type { ActivityKind } from "@sendtally/api-client";
import type { CalendarDate, ItemDone, PlanLink, SessionItem } from "@sendtally/core/hang";
import { ACTIVITY_KINDS } from "@sendtally/features/activities";
import { today } from "@sendtally/features/journal";
import { startTimeOf } from "../intervals/intervalsText";
import { planLinkParams, readPlanLink } from "./planLinkParams";

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

export type RunPlayer = "/workout/sets" | "/workout/checklist";

type RawParams = Partial<Record<string, string | string[]>>;

const str = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

const minutesParam = (minutes: number | null): Record<string, string> =>
  minutes === null ? {} : { minutes: String(minutes) };

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

export function runPath(player: RunPlayer, r: WorkoutRun): Href {
  return { pathname: player, params: runParams(r) };
}

const isItem = (v: unknown): v is SessionItem => {
  if (typeof v !== "object" || v === null) return false;
  const { exercise, dose } = v as Partial<SessionItem>;
  return typeof exercise === "string" && typeof dose?.sets === "number";
};

const parseItems = (text: string): SessionItem[] | null => {
  try {
    const items: unknown = JSON.parse(text);
    return Array.isArray(items) && items.length > 0 && items.every(isItem) ? items : null;
  } catch {
    return null;
  }
};

const count = (text: string): number | null => {
  const n = Number(text);
  return text === "" || !Number.isFinite(n) ? null : n;
};

/** The run from its route params, or null when they do not hold one. */
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

/** What the activity a run logs is filed under. */
export type RunFiling = Pick<WorkoutRun, "kind" | "title" | "link"> & { workoutId: string | null };

/**
 * The review for a workout, with what was done in place of what it prescribes when given, and
 * the sets of it a player did not finish.
 */
export function activityFormPath(
  r: RunFiling & Pick<WorkoutRun, "date" | "minutes">,
  done?: readonly ItemDone[],
  startTime?: string,
  off: readonly string[] = []
): { pathname: "/activity/new"; params: Record<string, string> } {
  return {
    pathname: "/activity/new",
    params: {
      kind: r.kind,
      title: r.title,
      date: r.date,
      ...(r.workoutId === null ? {} : { workoutId: r.workoutId }),
      ...minutesParam(r.minutes),
      ...planLinkParams(r.link),
      ...(done === undefined ? {} : { done: JSON.stringify(done) }),
      ...(startTime === undefined ? {} : { startTime }),
      ...(off.length === 0 ? {} : { off: JSON.stringify(off) }),
    },
  };
}

/**
 * Hands a finished run to its review, in place of the player, to check its sets, take an effort
 * and save, timed by the player's clock from its start.
 */
export function logRun(
  r: RunFiling,
  done: readonly ItemDone[],
  startedAt: number,
  off: readonly string[] = []
): void {
  const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60_000));
  const date = today(new Date(startedAt));
  const path = activityFormPath({ ...r, date, minutes }, done, startTimeOf(startedAt), off);
  router.replace({ ...path, params: { ...path.params, live: "1" } });
}
