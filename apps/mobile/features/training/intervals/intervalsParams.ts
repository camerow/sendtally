import { router, type Href } from "expo-router";
import type { ActivityKind } from "@sendtally/api-client";
import type { CalendarDate } from "@sendtally/core/hang";
import { ACTIVITY_KINDS, type IntervalsTemplate } from "@sendtally/features/activities";

/** What the intervals player runs, and what the activity it logs is filed under. */
export type IntervalsRun = {
  kind: ActivityKind;
  title: string;
  date: CalendarDate;
  planItemId: string | null;
  /** The activity a run from the activity form becomes; null logs a new one. */
  activityId: string | null;
  body: IntervalsTemplate;
};

type RawParams = Partial<Record<string, string | string[]>>;

const str = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

export function intervalsPath(r: IntervalsRun): Href {
  return {
    pathname: "/workout/intervals",
    params: {
      kind: r.kind,
      title: r.title,
      date: r.date,
      body: JSON.stringify(r.body),
      ...(r.planItemId === null ? {} : { planItemId: r.planItemId }),
      ...(r.activityId === null ? {} : { activityId: r.activityId }),
    },
  };
}

export function startIntervals(r: IntervalsRun): void {
  router.push(intervalsPath(r));
}

const parseBody = (text: string): IntervalsTemplate | null => {
  try {
    const body: unknown = JSON.parse(text);
    if (typeof body !== "object" || body === null) return null;
    const { kind, rounds, steps } = body as Partial<IntervalsTemplate>;
    if (kind !== "intervals" || typeof rounds !== "number" || !Array.isArray(steps)) return null;
    return steps.length === 0 ? null : (body as IntervalsTemplate);
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
    planItemId: str(p.planItemId) || null,
    activityId: str(p.activityId) || null,
    body,
  };
}
