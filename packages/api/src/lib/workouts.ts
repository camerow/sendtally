import { z } from "zod";
import { id, minutes, PLAN_KINDS, planTemplate, rpe, title, type PlanKind } from "./activities";
import type { WorkoutRow } from "./repo";

export const CLIMB_FOCUSES = ["limit", "volume", "project", "endurance"] as const;

export type ClimbFocus = (typeof CLIMB_FOCUSES)[number];

const climbBody = z
  .object({
    kind: z.literal("climb"),
    focus: z.enum(CLIMB_FOCUSES),
    projectId: z.string().min(1).max(200).nullable(),
  })
  .refine((b) => b.projectId === null || b.focus === "project", "only a project focus has one");

const workoutBodySchema = z.union([planTemplate.unwrap(), climbBody]).nullable();

export const workoutBody = z
  .object({
    name: title,
    category: z.enum(PLAN_KINDS),
    description: z.string().trim().max(2000).nullable(),
    tags: z
      .array(z.string().trim().min(1).max(30))
      .max(10)
      .refine((tags) => new Set(tags).size === tags.length, "repeated tag"),
    minutes: minutes.nullable(),
    targetRpe: rpe.nullable(),
    body: workoutBodySchema,
  })
  .refine(
    (w) => (w.category === "climb") === (w.body?.kind === "climb"),
    "a climbing workout has a climbing body, and only it"
  );

export type WorkoutBody = NonNullable<z.infer<typeof workoutBodySchema>>;

export type ClimbWorkoutBody = Extract<WorkoutBody, { kind: "climb" }>;

export type UserWorkoutInput = z.infer<typeof workoutBody>;

/** A library workout of the user's own, other than a hangboard one. */
export type UserWorkout = UserWorkoutInput & { id: string; category: PlanKind; updatedAt: string };

export const workoutIdParam = z.object({ id });

export function userWorkoutOf(row: WorkoutRow): UserWorkout {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    tags: JSON.parse(row.tags_json) as string[],
    minutes: row.minutes,
    targetRpe: row.target_rpe,
    body: row.body_json === null ? null : (JSON.parse(row.body_json) as WorkoutBody),
    updatedAt: row.updated_at,
  };
}
