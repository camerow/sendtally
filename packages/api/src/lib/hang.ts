import {
  BUILT_IN_GRIP_NAMES,
  BUILT_IN_GRIPS,
  isCalendarDate,
  LIBRARY,
  type Grip,
  type HangSession,
  type HangSettings,
  type Loads,
  type Protocol,
  type Schedule,
  type TimeUnits,
  type Workout,
} from "@sendtally/core/hang";
import { z } from "zod";
import type {
  HangGripRow,
  HangScheduleRow,
  HangSessionRow,
  HangSettingsRow,
  HangWorkoutRow,
} from "./repo";

const hangId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

export const hangIdParam = z.object({ id: hangId });

export const hangWorkoutParam = z.object({ workoutId: hangId });

const calendarDate = z.string().refine(isCalendarDate, "not a calendar date");

const seconds = z.number().int().min(0).max(3600);

const kg = z.number().min(-200).max(500);

// Ranges from the spec's number inputs. A hang needs time on the edge and an
// edge to hang from; a ground pull has neither, and lifts up to 100 per set.
const fitsKind = (p: Protocol): boolean =>
  p.kind === "hang"
    ? p.hangS >= 1 && p.reps <= 50 && p.edgeMm >= 4
    : p.edgeMm === 0 || p.edgeMm >= 4;

const protocolShape = {
  name: z.string().trim().min(1).max(80),
  kind: z.enum(["hang", "pull"]),
  hangS: seconds,
  restS: seconds,
  reps: z.number().int().min(1).max(100),
  sets: z.number().int().min(1).max(50),
  setRestS: seconds,
  edgeMm: z.number().int().min(0).max(60),
};

const protocolSchema = z.object(protocolShape).refine(fitsKind, "outside the protocol's ranges");

const timeUnit = z.enum(["s", "min"]);

export const hangGripBody = z.object({ name: z.string().trim().min(1).max(40) });

export const hangWorkoutBody = z
  .object({
    ...protocolShape,
    grip: hangId,
    timeUnits: z.object({ hangS: timeUnit, restS: timeUnit, setRestS: timeUnit }),
  })
  .refine(fitsKind, "outside the protocol's ranges");

export const hangDefaultGripBody = z.object({ gripId: hangId });

export const hangLoadsBody = z.object({
  loads: z
    .record(z.string().regex(/^[A-Za-z0-9_-]{1,64}:[A-Za-z0-9_-]{1,64}$/), kg)
    .refine((loads) => Object.keys(loads).length <= 200, "too many loads"),
});

export const hangScheduleBody = z
  .object({
    workoutId: hangId,
    gripId: hangId,
    days: z
      .array(z.literal([0, 1, 2, 3, 4, 5, 6]))
      .min(1)
      .refine((days) => new Set(days).size === days.length, "repeated weekday"),
    start: calendarDate,
    end: calendarDate.nullable(),
    skip: z.array(calendarDate).max(1000),
  })
  .refine((s) => s.end === null || s.end > s.start, "end is not after start");

export const hangSessionBody = z.object({
  workoutId: hangId,
  gripId: hangId,
  date: calendarDate,
  loadKg: kg,
  pct: z.number().int().min(0).max(100),
  misses: z.number().int().min(0).max(10_000),
  rpe: z.number().int().min(1).max(10).nullable(),
  protocol: protocolSchema,
});

export const hangSettingsBody = z
  .object({
    units: z.enum(["kg", "lb"]),
    theme: z.enum(["moss", "dusk", "gunmetal"]),
    reminders: z.boolean(),
    reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    postToStrava: z.boolean(),
    reminderPromptSeen: z.boolean(),
  })
  .partial();

export const DEFAULT_HANG_SETTINGS: HangSettings = {
  units: "kg",
  theme: "moss",
  reminders: false,
  reminderTime: "08:00",
  postToStrava: false,
  reminderPromptSeen: false,
};

export type HangPostState = "pending" | "posted" | "failed";

export type HangSessionRecord = HangSession & {
  stravaActivityId: string | null;
  postState: HangPostState | null;
  postError: string | null;
  updatedAt: string;
};

/** A hang session as sendtally's history lists it. `gripName` is set for the user's own grips only: the apps name a built-in in their language. */
export type HangHistoryRow = HangSessionRecord & { gripName: string | null };

export type HangData = {
  grips: Grip[];
  workouts: Workout[];
  defaultGrips: Record<string, string>;
  loads: Loads;
  schedules: Schedule[];
  sessions: HangSessionRecord[];
  settings: HangSettings;
  strava: { connected: boolean };
};

export const isLibraryWorkout = (id: string): boolean => LIBRARY.some((w) => w.id === id);

/** The one spelling two grip names share when they differ only in case or spacing. */
export const gripKey = (name: string): string => name.trim().replace(/\s+/g, " ").toLowerCase();

export function builtInGripNamed(name: string): Grip | null {
  const id = BUILT_IN_GRIPS.find((g) => gripKey(BUILT_IN_GRIP_NAMES[g]) === gripKey(name));
  return id === undefined ? null : { id, name: BUILT_IN_GRIP_NAMES[id], custom: false };
}

export const gripOf = (row: HangGripRow): Grip => ({ id: row.id, name: row.name, custom: true });

export function workoutOf(row: HangWorkoutRow): Workout {
  return {
    id: row.id,
    source: "mine",
    name: row.name,
    kind: row.kind,
    grip: row.grip,
    edgeMm: row.edge_mm,
    hangS: row.hang_s,
    restS: row.rest_s,
    reps: row.reps,
    sets: row.sets,
    setRestS: row.set_rest_s,
    timeUnits: JSON.parse(row.time_units_json) as TimeUnits,
  };
}

export function scheduleOf(row: HangScheduleRow): Schedule {
  return {
    id: row.id,
    workoutId: row.workout_id,
    gripId: row.grip_id,
    days: JSON.parse(row.days_json) as Schedule["days"],
    start: row.start,
    end: row.end,
    skip: JSON.parse(row.skip_json) as string[],
  };
}

export function hangSessionOf(row: HangSessionRow): HangSessionRecord {
  return {
    id: row.id,
    workoutId: row.workout_id,
    gripId: row.grip_id,
    date: row.date,
    loadKg: row.load_kg,
    pct: row.pct,
    misses: row.misses,
    rpe: row.rpe,
    protocol: JSON.parse(row.protocol_json) as Protocol,
    stravaActivityId: row.strava_activity_id === null ? null : String(row.strava_activity_id),
    postState: row.post_state,
    postError: row.post_error,
    updatedAt: row.updated_at,
  };
}

export function hangHistoryOf(
  row: HangSessionRow,
  customGrips: readonly HangGripRow[]
): HangHistoryRow {
  return {
    ...hangSessionOf(row),
    gripName: customGrips.find((g) => g.id === row.grip_id)?.name ?? null,
  };
}

export function settingsOf(row: HangSettingsRow | null): HangSettings {
  if (row === null) return DEFAULT_HANG_SETTINGS;
  return {
    units: row.units,
    theme: row.theme,
    reminders: row.reminders,
    reminderTime: row.reminder_time,
    postToStrava: row.post_to_strava,
    reminderPromptSeen: row.reminder_prompt_seen,
  };
}
