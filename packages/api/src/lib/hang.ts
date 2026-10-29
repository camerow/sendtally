import {
  BUILT_IN_GRIP_NAMES,
  BUILT_IN_GRIPS,
  GRIP_MEASURES,
  isCalendarDate,
  defaultSetup,
  protocolOf,
  type Grip,
  type GripMeasure,
  type HangSession,
  type HangSettings,
  type Loads,
  type Protocol,
} from "@sendtally/core/hang";
import { z } from "zod";
import { doneBody, doneOf, planLinkShape } from "./plan";
import type { HangGripRow, HangSessionRow, HangSettingsRow } from "./repo";

const hangId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

export const hangIdParam = z.object({ id: hangId });

export const hangWorkoutParam = z.object({ workoutId: hangId });

const calendarDate = z.string().refine(isCalendarDate, "not a calendar date");

const seconds = z.number().int().min(0).max(3600);

const kg = z.number().min(-200).max(500);

const edgeMm = z
  .number()
  .int()
  .min(0)
  .max(60)
  .refine((mm) => mm === 0 || mm >= 4, "too shallow an edge");

// Ranges from the spec's number inputs. A hang needs time on the edge; a
// ground pull has none, and lifts up to 100 per set.
const fitsKind = (p: Protocol): boolean => p.kind === "pull" || (p.hangS >= 1 && p.reps <= 50);

const protocolShape = {
  name: z.string().trim().min(1).max(80),
  kind: z.enum(["hang", "pull"]),
  hangS: seconds,
  restS: seconds,
  reps: z.number().int().min(1).max(100),
  sets: z.number().int().min(1).max(50),
  setRestS: seconds,
  /** Sent by app builds before setups, which kept the edge on the workout. */
  edgeMm: edgeMm.optional(),
};

const protocolSchema = z.object(protocolShape).refine(fitsKind, "outside the protocol's ranges");

// App builds before grip measures send none, which leaves a grip's measure as it was.
export const hangGripBody = z.object({
  name: z.string().trim().min(1).max(40),
  measure: z.enum(GRIP_MEASURES).optional(),
});

export const hangDefaultGripBody = z.object({ gripId: hangId });

export const hangLoadsBody = z.object({
  loads: z
    .record(z.string().regex(/^[A-Za-z0-9_-]{1,64}:[A-Za-z0-9_-]{1,64}$/), kg)
    .refine((loads) => Object.keys(loads).length <= 200, "too many loads"),
});

// App builds before setups send the edge inside the protocol instead.
export const hangSessionBody = z
  .object({
    workoutId: hangId,
    gripId: hangId,
    date: calendarDate,
    edgeMm: edgeMm.optional(),
    loadKg: kg,
    pct: z.number().int().min(0).max(100),
    misses: z.number().int().min(0).max(10_000),
    rpe: z.number().int().min(1).max(10).nullable(),
    protocol: protocolSchema,
    ...planLinkShape,
    done: doneBody.default([]),
  })
  .transform(({ edgeMm: mm, protocol, ...rest }) => ({
    ...rest,
    edgeMm: mm ?? protocol.edgeMm ?? defaultSetup(protocol.kind).edgeMm,
    protocol: protocolOf(protocol),
  }))
  .refine((s) => s.protocol.kind === "pull" || s.edgeMm >= 4, "a hang needs an edge");

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
  units: "lb",
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
  defaultGrips: Record<string, string>;
  loads: Loads;
  sessions: HangSessionRecord[];
  settings: HangSettings;
  strava: { connected: boolean };
};

/** The one spelling two grip names share when they differ only in case or spacing. */
export const gripKey = (name: string): string => name.trim().replace(/\s+/g, " ").toLowerCase();

export function builtInGripNamed(name: string): Grip | null {
  const id = BUILT_IN_GRIPS.find((g) => gripKey(BUILT_IN_GRIP_NAMES[g]) === gripKey(name));
  return id === undefined
    ? null
    : { id, name: BUILT_IN_GRIP_NAMES[id], custom: false, hidden: false };
}

/** A grip's measure as the apps read it: none for a hang. */
export const measured = (measure: GripMeasure): Pick<Grip, "measure"> =>
  measure === "hang" ? {} : { measure };

export const gripOf = (row: HangGripRow): Grip => ({
  id: row.id,
  name: row.name,
  custom: true,
  hidden: row.hidden,
  ...measured(row.measure),
});

// App builds before setups read the edge from the protocol snapshot.
const legacyProtocol = (row: HangSessionRow): Protocol & { edgeMm: number } => ({
  ...protocolOf(JSON.parse(row.protocol_json) as Protocol),
  edgeMm: row.edge_mm,
});

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
    edgeMm: row.edge_mm,
    protocol: legacyProtocol(row),
    membershipId: row.membership_id,
    week: row.week,
    focus: row.focus,
    done: doneOf(row.done_json),
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
