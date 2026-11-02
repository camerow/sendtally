import { z } from "zod";
import { calendarDate, doneBody, doneOf, id, minutes, planLinkShape, rpe, title } from "./plan";
import type { ActivityRow } from "./repo";

// A climbing workout logs here too: its climbs ride in its sets, never as a session.
export const ACTIVITY_KINDS = ["climbing", "strength", "mobility", "other"] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

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
  // The library workout it ran, if any.
  workoutId: id.nullable().default(null),
  ...planLinkShape,
  done: doneBody.default([]),
});

export const activitiesQuery = z.object({
  from: calendarDate.optional(),
  to: calendarDate.optional(),
});

export type Activity = z.infer<typeof activityBody> & { id: string };

export type ActivityInput = Omit<Activity, "id">;

export type ActivityPostState = "pending" | "posted" | "failed";

export type ActivityRecord = Activity & {
  stravaActivityId: string | null;
  postedAt: string | null;
  postState: ActivityPostState | null;
  postError: string | null;
};

export function activityOf(row: ActivityRow): ActivityRecord {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    minutes: row.minutes,
    rpe: row.rpe,
    notes: row.notes,
    workoutId: row.workout_id,
    membershipId: row.membership_id,
    week: row.week,
    focus: row.focus,
    done: doneOf(row.done_json),
    stravaActivityId: row.strava_activity_id === null ? null : String(row.strava_activity_id),
    postedAt: row.posted_at,
    postState: row.post_state,
    postError: row.post_error,
  };
}
