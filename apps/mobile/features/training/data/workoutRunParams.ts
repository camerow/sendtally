import { router, type Href } from "expo-router";
import type { ActivityKind } from "@sendtally/api-client";
import type { CalendarDate, ItemDone, PlanLink, SessionItem } from "@sendtally/core/hang";
import { ACTIVITY_KINDS } from "@sendtally/features/activities";
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

export function runPath(player: RunPlayer, r: WorkoutRun): Href {
  return {
    pathname: player,
    params: {
      kind: r.kind,
      title: r.title,
      date: r.date,
      workoutId: r.workoutId,
      items: JSON.stringify(r.items),
      ...(r.exerciseRestS > 0 ? { exerciseRestS: String(r.exerciseRestS) } : {}),
      ...minutesParam(r.minutes),
      ...planLinkParams(r.link),
    },
  };
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

/** The activity form for a workout, with what was done in place of what it prescribes when given. */
export function activityFormPath(
  r: Omit<WorkoutRun, "items" | "exerciseRestS">,
  done?: readonly ItemDone[]
): Href {
  return {
    pathname: "/activity/new",
    params: {
      kind: r.kind,
      title: r.title,
      date: r.date,
      workoutId: r.workoutId,
      ...minutesParam(r.minutes),
      ...planLinkParams(r.link),
      ...(done === undefined ? {} : { done: JSON.stringify(done) }),
    },
  };
}

/**
 * Hands a finished run to the activity form, in place of the player, to take an effort and
 * save, timed by the player's clock from its start.
 */
export function logRun(r: WorkoutRun, done: readonly ItemDone[], startedAt: number): void {
  const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60_000));
  router.replace(activityFormPath({ ...r, minutes }, done));
}
