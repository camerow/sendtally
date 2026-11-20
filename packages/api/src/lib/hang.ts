import {
  GRIP_MEASURES,
  isBuiltInGrip,
  isCalendarDate,
  defaultEdgeMm,
  DEFAULT_WEIGHT_UNIT,
  WEIGHT_UNITS,
  protocolOf,
  type BuiltInGrip,
  type BuiltInLibrary,
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

// What a session holds of its own, as against what a workout's fingerboard part takes from its run.
const sessionShape = {
  gripId: hangId,
  edgeMm: edgeMm.optional(),
  loadKg: kg,
  pct: z.number().int().min(0).max(100),
  misses: z.number().int().min(0).max(10_000),
  protocol: protocolSchema,
  done: doneBody.default([]),
};

// App builds before setups send the edge inside the protocol instead.
const withEdge = <T extends { edgeMm?: number; protocol: z.infer<typeof protocolSchema> }>({
  edgeMm: mm,
  protocol,
  ...rest
}: T): Omit<T, "edgeMm" | "protocol"> & { edgeMm: number; protocol: Protocol } => ({
  ...rest,
  edgeMm: mm ?? protocol.edgeMm ?? defaultEdgeMm(protocol.kind),
  protocol: protocolOf(protocol),
});

const hasEdge = (s: { edgeMm: number; protocol: Protocol }): boolean =>
  s.protocol.kind === "pull" || s.edgeMm >= 4;

export const hangSessionBody = z
  .object({
    workoutId: hangId,
    date: calendarDate,
    rpe: z.number().int().min(1).max(10).nullable(),
    ...sessionShape,
    ...planLinkShape,
  })
  .transform(withEdge)
  .refine(hasEdge, "a hang needs an edge");

/** A workout's fingerboard part: its date, workout, plan link and effort are its run's. */
export const fingerboardBody = z
  .object(sessionShape)
  .transform(withEdge)
  .refine(hasEdge, "a hang needs an edge");

export type Fingerboard = z.infer<typeof fingerboardBody>;

export const hangSettingsBody = z
  .object({
    units: z.enum(WEIGHT_UNITS),
    theme: z.enum(["moss", "dusk", "gunmetal"]),
    reminders: z.boolean(),
    reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    postToStrava: z.boolean(),
    reminderPromptSeen: z.boolean(),
  })
  .partial();

export const DEFAULT_HANG_SETTINGS: HangSettings = {
  units: DEFAULT_WEIGHT_UNIT,
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

/** A workout's fingerboard part, a hang session of the activity it ran in; no workout once its run has none. */
export type HangPart = Omit<HangSessionRecord, "workoutId"> & {
  workoutId: string | null;
  activityId: string;
};

// The column holds "" for a part whose run lost its workout; readers see null.
const partWorkout = (row: HangSessionRow): string | null =>
  row.workout_id === "" ? null : row.workout_id;

export type HangData = {
  grips: Grip[];
  defaultGrips: Record<string, string>;
  loads: Loads;
  /** Sessions of their own; parts are counted as their activities. */
  sessions: HangSessionRecord[];
  /** Every workout's fingerboard part, read with `sessions` for grips only. */
  parts: HangPart[];
  settings: HangSettings;
  strava: { connected: boolean };
};

/** The one spelling two grip names share when they differ only in case or spacing. */
export const gripKey = (name: string): string => name.trim().replace(/\s+/g, " ").toLowerCase();

/** A built-in grip's English name, as the library has it. */
export const builtInGripName = (library: BuiltInLibrary, id: BuiltInGrip): string =>
  library.grips.find((g) => g.id === id)?.name ?? id;

/** A built-in grip's row: its English name, so a custom grip can never take it. */
export const builtInGripRow = (
  library: BuiltInLibrary,
  id: BuiltInGrip
): { id: string; name: string; nameKey: string } => {
  const name = builtInGripName(library, id);
  return { id, name, nameKey: gripKey(name) };
};

export function builtInGripNamed(library: BuiltInLibrary, name: string): Grip | null {
  const entry = library.grips.find((g) => gripKey(g.name) === gripKey(name));
  return entry === undefined || !isBuiltInGrip(entry.id)
    ? null
    : { id: entry.id, name: entry.name, custom: false, hidden: false };
}

/** A grip's measure as the apps read it: none for a hang. */
export const measured = (measure: GripMeasure): Pick<Grip, "measure"> =>
  measure === "hang" ? {} : { measure };

export const gripOf = (row: HangGripRow): Grip => ({
  id: row.id,
  name: row.name,
  custom: !isBuiltInGrip(row.id),
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

/** The part a row is, or null for a session of its own. */
export const hangPartOf = (row: HangSessionRow): HangPart | null =>
  row.activity_id === null
    ? null
    : { ...hangSessionOf(row), workoutId: partWorkout(row), activityId: row.activity_id };

export function hangHistoryOf(
  row: HangSessionRow,
  customGrips: readonly HangGripRow[]
): HangHistoryRow {
  return {
    ...hangSessionOf(row),
    gripName: customGrips.find((g) => g.id === row.grip_id)?.name ?? null,
  };
}

/** A workout's fingerboard part as history lists it, beside its activity. */
export type HangHistoryPart = HangPart & { gripName: string | null };

/** History's sessions of their own, and the parts its activities carry, each listed once. */
export function hangHistory(
  rows: readonly HangSessionRow[],
  customGrips: readonly HangGripRow[]
): { hangSessions: HangHistoryRow[]; hangParts: HangHistoryPart[] } {
  return {
    hangSessions: rows
      .filter((r) => r.activity_id === null)
      .map((r) => hangHistoryOf(r, customGrips)),
    hangParts: rows.flatMap((r) => {
      const part = hangPartOf(r);
      return part === null ? [] : [{ ...part, gripName: hangHistoryOf(r, customGrips).gripName }];
    }),
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
