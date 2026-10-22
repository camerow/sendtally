import { isCalendarDate } from "@sendtally/core/hang";
import { z } from "zod";
import type { ActivityRow, PlanItemRow } from "./repo";

export const ACTIVITY_KINDS = ["strength", "mobility", "run", "yoga", "other"] as const;

export const PLAN_KINDS = ["climb", ...ACTIVITY_KINDS] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export type PlanKind = (typeof PLAN_KINDS)[number];

const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

export const trainingIdParam = z.object({ id });

const calendarDate = z.string().refine(isCalendarDate, "not a calendar date");

const title = z.string().trim().min(1).max(80);

const minutes = z.number().int().min(1).max(1440);

const rpe = z.number().int().min(1).max(10);

// A typed body joins as a discriminated union on `kind` ("sets", "checklist"),
// stored as detail_kind plus detail_json, so rows written before it stay valid.
const activityDetail = z.null();

export const activityBody = z.object({
  kind: z.enum(ACTIVITY_KINDS),
  title,
  date: calendarDate,
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
  minutes,
  rpe: rpe.nullable(),
  notes: z.string().trim().max(2000).nullable(),
  planItemId: id.nullable(),
  detail: activityDetail,
});

export const activitiesQuery = z.object({
  from: calendarDate.optional(),
  to: calendarDate.optional(),
});

export const planItemBody = z
  .object({
    kind: z.enum(PLAN_KINDS),
    title,
    days: z
      .array(z.literal([0, 1, 2, 3, 4, 5, 6]))
      .refine((days) => new Set(days).size === days.length, "repeated weekday"),
    perWeek: z.number().int().min(1).max(7).nullable(),
    start: calendarDate,
    end: calendarDate.nullable(),
    skip: z.array(calendarDate).max(1000),
    minutes: minutes.nullable(),
    targetRpe: rpe.nullable(),
    projectId: z.string().min(1).max(200).nullable(),
  })
  .refine((p) => p.days.length > 0 !== (p.perWeek !== null), "set days or perWeek, not both")
  .refine((p) => p.end === null || p.end > p.start, "end is not after start")
  .refine((p) => p.projectId === null || p.kind === "climb", "only a climb has a project");

export const planItemSkipBody = z.object({ date: calendarDate, skipped: z.boolean() });

export type Activity = z.infer<typeof activityBody> & { id: string };

export type ActivityInput = Omit<Activity, "id">;

export type PlanItem = z.infer<typeof planItemBody> & { id: string };

export type PlanItemInput = Omit<PlanItem, "id">;

export function activityOf(row: ActivityRow): Activity {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    minutes: row.minutes,
    rpe: row.rpe,
    notes: row.notes,
    planItemId: row.plan_item_id,
    detail: null,
  };
}

export function planItemOf(row: PlanItemRow): PlanItem {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    days: JSON.parse(row.days_json) as PlanItem["days"],
    perWeek: row.per_week,
    start: row.start,
    end: row.end,
    skip: JSON.parse(row.skip_json) as string[],
    minutes: row.minutes,
    targetRpe: row.target_rpe,
    projectId: row.project_id,
  };
}
