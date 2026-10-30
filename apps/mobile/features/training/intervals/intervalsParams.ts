import { router, type Href } from "expo-router";
import type { ActivityKind } from "@sendtally/api-client";
import type { CalendarDate, Intervals, PlanLink } from "@sendtally/core/hang";
import { ACTIVITY_KINDS } from "@sendtally/features/activities";
import { startLive } from "../../live-session/startLive";
import { planLinkParams, readPlanLink } from "../data/planLinkParams";

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

type RawParams = Partial<Record<string, string | string[]>>;

const str = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

export const intervalsParams = (r: IntervalsRun): Record<string, string> => ({
  kind: r.kind,
  title: r.title,
  date: r.date,
  body: JSON.stringify(r.body),
  ...(r.workoutId === null ? {} : { workoutId: r.workoutId }),
  ...planLinkParams(r.link),
});

export function intervalsPath(r: IntervalsRun): Href {
  return { pathname: "/workout/intervals", params: intervalsParams(r) };
}

/** Runs it in the intervals player, once whatever already runs is dealt with. */
export function startIntervals(r: IntervalsRun): void {
  startLive(r.title, () => router.push(intervalsPath(r)));
}

const parseBody = (text: string): Intervals | null => {
  try {
    const body: unknown = JSON.parse(text);
    if (typeof body !== "object" || body === null) return null;
    const { rounds, steps } = body as Partial<Intervals>;
    if (typeof rounds !== "number" || !Array.isArray(steps)) return null;
    return steps.length === 0 ? null : (body as Intervals);
  } catch {
    return null;
  }
};

/** The run from its route params, or null when they do not hold one. */
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
