import {
  defaultExerciseRestS,
  FOCI,
  foldVariations,
  isCalendarDate,
  WORKOUT_KINDS,
  type Block,
  type Dose,
  type Focus,
  type ItemDone,
  type Item,
  type Membership,
  type WeekChange,
  type Workout,
} from "@sendtally/core/hang";
import { z } from "zod";
import type { BlockRow, MembershipRow, WeekChangeRow, WorkoutRow } from "./repo";

export const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

export const trainingIdParam = z.object({ id });

export const calendarDate = z.string().refine(isCalendarDate, "not a calendar date");

export const title = z.string().trim().min(1).max(80);

export const minutes = z.number().int().min(1).max(1440);

export const rpe = z.number().int().min(1).max(10);

export const MAX_BLOCK_WEEKS = 16;

const MAX_DOSES = 10;

const MAX_ITEMS = 30;

const seconds = z.number().int().min(0).max(86400);

export const dose = z.object({
  sets: z.number().int().min(1).max(100),
  reps: z.number().int().min(0).max(1000).optional(),
  weightKg: z.number().min(-200).max(1000).optional(),
  onS: seconds.optional(),
  offS: seconds.optional(),
  edgeMm: z.number().int().min(0).max(60).optional(),
  setRestS: seconds.optional(),
});

const exercise = z.string().trim().min(1).max(80);

const MAX_DOSE_NAME = 24;

const namedDose = dose.extend({ name: z.string().trim().min(1).max(MAX_DOSE_NAME).optional() });

const item = z.object({ exercise, doses: z.array(namedDose).min(1).max(MAX_DOSES) });

const doseIndex = z
  .number()
  .int()
  .min(0)
  .max(MAX_DOSES - 1);

const itemIndex = z
  .number()
  .int()
  .min(0)
  .max(MAX_ITEMS - 1);

const blockWeek = z.number().int().min(1).max(MAX_BLOCK_WEEKS);

/** Older app builds send none, which leaves the focus saved alone; null clears it. */
export const focus = z.enum(FOCI).nullable().optional();

/** A row as saved, where a missing focus keeps the one it had. */
export type FocusOptional<T extends { focus: Focus | null }> = Omit<T, "focus"> & {
  focus?: Focus | null | undefined;
};

const workoutFields = {
  kind: z.enum(WORKOUT_KINDS),
  name: title,
  description: z.string().trim().max(2000),
  minutes: minutes.nullable(),
  targetRpe: rpe.nullable(),
  // Older app builds send none.
  exerciseRestS: seconds.optional(),
  focus,
};

// Older app builds send whole variations, which fold into items where their exercises line
// up and otherwise keep the first.
const legacyItems = z
  .array(
    z.object({
      items: z.array(z.object({ exercise, dose })).max(MAX_ITEMS),
    })
  )
  .min(1)
  .max(MAX_DOSES)
  .transform(
    (variations): Item[] =>
      foldVariations({ variations }) ??
      (variations[0]?.items ?? []).map((i) => ({ exercise: i.exercise, doses: [i.dose] }))
  );

export const workoutBody = z
  .union([
    z.object({ ...workoutFields, items: z.array(item).max(MAX_ITEMS) }),
    z.object({ ...workoutFields, variations: legacyItems }),
  ])
  .transform(({ kind, name, description, minutes, targetRpe, exerciseRestS, focus, ...body }) => ({
    kind,
    name,
    description,
    minutes,
    targetRpe,
    items: "items" in body ? body.items : body.variations,
    exerciseRestS: exerciseRestS ?? defaultExerciseRestS(kind),
    focus,
  }));

export const blockBody = z.object({
  name: title,
  start: calendarDate,
  weeks: z.number().int().min(1).max(MAX_BLOCK_WEEKS),
  focus,
});

export const membershipBody = z.object({
  workoutId: id,
  blockId: id.nullable(),
  // No weekdays is a one-off on `start`.
  weekdays: z
    .array(z.literal([0, 1, 2, 3, 4, 5, 6]))
    .refine((days) => new Set(days).size === days.length, "repeated weekday"),
  start: calendarDate,
});

/** An empty change puts the item back as written for that week. */
export const weekChangeBody = z.object({
  week: blockWeek,
  dose: doseIndex,
  item: itemIndex,
  change: dose.partial(),
});

// A climb logged on the session tally, in the set it was climbed in.
const setClimb = z.object({
  grade: z.string().max(12),
  scale: z.enum(["v", "font", "yds", "french"]),
  tries: z.number().int().min(1).max(99),
  sent: z.boolean(),
  style: z.enum(["redpoint", "flash", "onsight"]).optional(),
  circuit: z
    .object({
      id: z.string().min(1).max(40),
      label: z.string().max(40),
      colour: z.string().min(1).max(20),
    })
    .optional(),
  name: z.string().trim().max(200).optional(),
});

const setDone = dose.omit({ sets: true }).extend({ climbs: z.array(setClimb).max(100).optional() });

/** What a session did, per item of what it ran. */
export const doneBody = z
  .array(
    z.object({
      item: itemIndex,
      exercise: z.string().trim().min(1).max(80),
      sets: z.array(setDone).max(100),
    })
  )
  .max(MAX_ITEMS);

/** The plan a session ran. Older app builds send none, which is logged on its own. */
export const planLinkShape = {
  membershipId: id.nullable().default(null),
  week: blockWeek.nullable().default(null),
  focus,
};

export type WorkoutInput = z.infer<typeof workoutBody>;

export type BlockInput = z.infer<typeof blockBody>;

export type MembershipInput = z.infer<typeof membershipBody>;

export type WeekChangeInput = z.infer<typeof weekChangeBody>;

export type Plan = { blocks: Block[]; memberships: Membership[]; weekChanges: WeekChange[] };

/** A workout of the user's own, as the API returns it. */
export type WorkoutRecord = Workout & { updatedAt: string };

export const workoutOf = (row: WorkoutRow): WorkoutRecord => ({
  id: row.id,
  kind: row.kind,
  name: row.name,
  description: row.description ?? "",
  minutes: row.minutes,
  targetRpe: row.target_rpe,
  items: JSON.parse(row.items_json) as Item[],
  exerciseRestS: row.exercise_rest_s,
  focus: row.focus,
  updatedAt: row.updated_at,
});

export const blockOf = (row: BlockRow): Block => ({
  id: row.id,
  name: row.name,
  start: row.start,
  weeks: row.weeks,
  focus: row.focus,
});

export const membershipOf = (row: MembershipRow): Membership => ({
  id: row.id,
  workoutId: row.workout_id,
  blockId: row.block_id,
  weekdays: JSON.parse(row.weekdays_json) as Membership["weekdays"],
  start: row.start,
});

export const weekChangeOf = (row: WeekChangeRow): WeekChange => ({
  membershipId: row.membership_id,
  week: row.week,
  dose: row.dose,
  item: row.item,
  change: JSON.parse(row.change_json) as Partial<Dose>,
});

export const doneOf = (json: string): ItemDone[] => JSON.parse(json) as ItemDone[];
