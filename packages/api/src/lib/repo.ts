import { disciplineOf } from "@sendtally/core";
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  getTableColumns,
  gte,
  inArray,
  isNull,
  like,
  lt,
  lte,
  ne,
  not,
  notInArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { alias, type SQLiteColumn } from "drizzle-orm/sqlite-core";
import {
  activities,
  areaClimbs,
  areas,
  boardConnections,
  climbNotes,
  contentReports,
  contentRevisions,
  duplicateReports,
  entrySessions,
  entryTags,
  exercises,
  gyms,
  hangDefaultGrips,
  hangGrips,
  hangLoads,
  hangSessions,
  hangSettings,
  journalEntries,
  memberships,
  sessionClimbLinks,
  sessions,
  sessionTags,
  storeEntitlements,
  stravaConnections,
  syncState,
  tags,
  trainingBlocks,
  userClimbs,
  users,
  weekChanges,
  workouts,
} from "../db/schema";
import {
  addDays,
  daysBetween,
  defaultMeasure,
  loadKey,
  measureOf,
  type Block,
  type HangSession,
  type HangSettings,
  type Item,
  type ItemDone,
  type Loads,
  type Membership,
  type WeekChange,
  type Workout,
} from "@sendtally/core/hang";
import type { ActivityInput } from "./activities";
import { exerciseKindOf, exerciseNameKey, workoutExercises, type ExerciseInput } from "./exercises";
import type { ContentEntity, Viewer } from "./areas";
import type { ClimbLink } from "./manual";
import type { EntryWrite } from "./entries";
import type { StoreEntitlement } from "./revenuecat";
import type { NormalizedTag } from "./tags";

export type UserRow = typeof users.$inferSelect;

export type StravaConnectionRow = typeof stravaConnections.$inferSelect;

// What the apps read. `summary` and `climbs_json` are the Strava description
// and the raw climb blob, which the endpoints shape themselves.
const SESSION_PRIVATE_COLUMNS = ["user_id", "summary", "climbs_json"] as const;

export type SessionRow = Omit<
  typeof sessions.$inferSelect,
  (typeof SESSION_PRIVATE_COLUMNS)[number]
>;

const sessionListColumns = Object.fromEntries(
  Object.entries(getTableColumns(sessions)).filter(
    ([name]) => !SESSION_PRIVATE_COLUMNS.includes(name as (typeof SESSION_PRIVATE_COLUMNS)[number])
  )
) as { [K in keyof SessionRow]: (typeof sessions)[K] };

export async function upsertUser(db: D1Database, id: string, timezone: string): Promise<void> {
  await drizzle(db)
    .insert(users)
    .values({ id, timezone, created_at: new Date().toISOString() })
    .onConflictDoUpdate({ target: users.id, set: { timezone } });
}

export async function ensureUser(db: D1Database, id: string): Promise<void> {
  await drizzle(db)
    .insert(users)
    .values({ id, created_at: new Date().toISOString() })
    .onConflictDoNothing();
}

export async function getUser(db: D1Database, id: string): Promise<UserRow | null> {
  const row = await drizzle(db).select().from(users).where(eq(users.id, id)).get();
  return row ?? null;
}

// The scale a user reads grades in, per discipline. Stored so anywhere we show a
// grade without asking - the project dialog, a new session draft - shows theirs.
export type GradeScales = { boulder: "v" | "font"; route: "yds" | "french" };

export const DEFAULT_GRADE_SCALES: GradeScales = { boulder: "v", route: "yds" };

export function gradeScalesOf(user: UserRow | null): GradeScales {
  if (user === null) return DEFAULT_GRADE_SCALES;
  return { boulder: user.boulder_scale, route: user.route_scale };
}

export async function setGradeScales(
  db: D1Database,
  id: string,
  scales: Partial<GradeScales>
): Promise<void> {
  await drizzle(db)
    .update(users)
    .set({
      ...(scales.boulder === undefined ? {} : { boulder_scale: scales.boulder }),
      ...(scales.route === undefined ? {} : { route_scale: scales.route }),
    })
    .where(eq(users.id, id));
}

export async function setTrainingMode(db: D1Database, id: string, enabled: boolean): Promise<void> {
  await drizzle(db)
    .update(users)
    .set({ training_mode: enabled ? 1 : 0 })
    .where(eq(users.id, id));
}

export type TrainingReminderSettings = { enabled: boolean; time: string; promptSeen: boolean };

export function trainingRemindersOf(user: UserRow | null): TrainingReminderSettings {
  return {
    enabled: user?.training_reminders === 1,
    time: user?.training_reminder_time ?? "08:00",
    promptSeen: user?.training_reminder_prompt_seen === 1,
  };
}

export async function setTrainingReminders(
  db: D1Database,
  id: string,
  settings: Partial<TrainingReminderSettings>
): Promise<void> {
  const flag = (value: boolean): number => (value ? 1 : 0);
  await drizzle(db)
    .update(users)
    .set({
      ...(settings.enabled === undefined ? {} : { training_reminders: flag(settings.enabled) }),
      ...(settings.time === undefined ? {} : { training_reminder_time: settings.time }),
      ...(settings.promptSeen === undefined
        ? {}
        : { training_reminder_prompt_seen: flag(settings.promptSeen) }),
    })
    .where(eq(users.id, id));
}

export type StravaConnectionInput = {
  user_id: string;
  athlete_id: number;
  access_token_ciphertext: string;
  refresh_token_ciphertext: string;
  expires_at: number;
};

export async function upsertStravaConnection(
  db: D1Database,
  row: StravaConnectionInput
): Promise<void> {
  const connected_at = new Date().toISOString();
  await drizzle(db)
    .insert(stravaConnections)
    .values({ ...row, status: "active", connected_at })
    .onConflictDoUpdate({
      target: stravaConnections.user_id,
      set: {
        athlete_id: row.athlete_id,
        access_token_ciphertext: row.access_token_ciphertext,
        refresh_token_ciphertext: row.refresh_token_ciphertext,
        expires_at: row.expires_at,
        status: "active",
        connected_at,
      },
    });
}

export async function getStravaConnection(
  db: D1Database,
  userId: string
): Promise<StravaConnectionRow | null> {
  const row = await drizzle(db)
    .select()
    .from(stravaConnections)
    .where(eq(stravaConnections.user_id, userId))
    .get();
  return row ?? null;
}

export async function updateStravaTokens(
  db: D1Database,
  userId: string,
  accessTokenCiphertext: string,
  refreshTokenCiphertext: string,
  expiresAt: number
): Promise<void> {
  await drizzle(db)
    .update(stravaConnections)
    .set({
      access_token_ciphertext: accessTokenCiphertext,
      refresh_token_ciphertext: refreshTokenCiphertext,
      expires_at: expiresAt,
    })
    .where(eq(stravaConnections.user_id, userId));
}

export async function markStravaConnectionDeadByAthlete(
  db: D1Database,
  athleteId: number
): Promise<void> {
  await drizzle(db)
    .update(stravaConnections)
    .set({ status: "dead" })
    .where(eq(stravaConnections.athlete_id, athleteId));
}

export type StoreEntitlementRow = typeof storeEntitlements.$inferSelect;

export async function listStoreEntitlements(
  db: D1Database,
  userId: string
): Promise<StoreEntitlementRow[]> {
  return drizzle(db)
    .select()
    .from(storeEntitlements)
    .where(eq(storeEntitlements.user_id, userId))
    .all();
}

export async function replaceStoreEntitlements(
  db: D1Database,
  userId: string,
  rows: StoreEntitlement[]
): Promise<void> {
  const d = drizzle(db);
  const clear = d.delete(storeEntitlements).where(eq(storeEntitlements.user_id, userId));
  if (rows.length === 0) {
    await clear;
    return;
  }
  const updated_at = new Date().toISOString();
  await d.batch([
    clear,
    d.insert(storeEntitlements).values(
      rows.map((r) => ({
        user_id: userId,
        entitlement: r.entitlement,
        store: r.store,
        product_id: r.product_id,
        expires_at: r.expires_at,
        will_renew: r.will_renew ? 1 : 0,
        updated_at,
      }))
    ),
  ]);
}

export type ManualSessionInput = {
  fingerprint: string;
  /** Absent leaves the plan link as it was. */
  membership_id?: string | null;
  week?: number | null;
  location: "indoor" | "outdoor" | null;
  gym_id: string | null;
  area_id: string | null;
  name: string | null;
  start_at: string;
  end_at: string;
  times: "both" | "start" | "end" | "none";
  climb_count: number;
  send_count: number;
  top_grade: number;
  top_send_grade: number;
  top_grade_label: string | null;
  top_send_grade_label: string | null;
  rpe: number;
  rpe_source: "user" | "computed" | "none";
  title: string;
  summary: string;
  climbs_json: string;
};

const insertLinks = (d: Db, userId: string, fingerprint: string, links: ClimbLink[]) =>
  d.insert(sessionClimbLinks).values(links.map((l) => ({ user_id: userId, fingerprint, ...l })));

const clearLinks = (d: Db, userId: string, fingerprint: string) =>
  d
    .delete(sessionClimbLinks)
    .where(
      and(eq(sessionClimbLinks.user_id, userId), eq(sessionClimbLinks.fingerprint, fingerprint))
    );

export async function insertManualSession(
  db: D1Database,
  userId: string,
  s: ManualSessionInput,
  links: ClimbLink[] = []
): Promise<void> {
  const d = drizzle(db);
  const insert = d
    .insert(sessions)
    .values({ user_id: userId, source: "manual", board: null, ...s });
  if (links.length === 0) await insert;
  else await d.batch([insert, insertLinks(d, userId, s.fingerprint, links)]);
}

// The links are replaced whole, like the session's tags and notes.
export async function updateManualSession(
  db: D1Database,
  userId: string,
  s: ManualSessionInput,
  links: ClimbLink[]
): Promise<void> {
  const d = drizzle(db);
  const { fingerprint, ...rest } = s;
  const update = d
    .update(sessions)
    .set(rest)
    .where(
      and(
        eq(sessions.user_id, userId),
        eq(sessions.fingerprint, fingerprint),
        eq(sessions.source, "manual")
      )
    );
  const clear = clearLinks(d, userId, fingerprint);
  await (links.length === 0
    ? d.batch([update, clear])
    : d.batch([update, clear, insertLinks(d, userId, fingerprint, links)]));
}

export type SessionLinks = {
  area: { id: string; name: string; slug: string } | null;
  climbs: Map<string, { id: string; name: string; slug: string }>;
};

export type ClimbSessionRow = {
  fingerprint: string;
  name: string | null;
  title: string;
  start_at: string;
  climb_slug: string;
  climbs_json: string | null;
};

export async function sessionsOnClimb(
  db: D1Database,
  userId: string,
  climbId: string
): Promise<ClimbSessionRow[]> {
  return drizzle(db)
    .select({
      fingerprint: sessions.fingerprint,
      name: sessions.name,
      title: sessions.title,
      start_at: sessions.start_at,
      climb_slug: sessionClimbLinks.climb_slug,
      climbs_json: sessions.climbs_json,
    })
    .from(sessionClimbLinks)
    .innerJoin(
      sessions,
      and(
        eq(sessions.user_id, sessionClimbLinks.user_id),
        eq(sessions.fingerprint, sessionClimbLinks.fingerprint)
      )
    )
    .where(and(eq(sessionClimbLinks.user_id, userId), eq(sessionClimbLinks.climb_id, climbId)))
    .orderBy(desc(sessions.start_at))
    .all();
}

// Only what the viewer can still see and is still live comes back: a merge
// repoints links at the survivor, and a rejected climb drops out.
export async function getSessionLinks(
  db: D1Database,
  viewer: Viewer,
  fingerprint: string,
  areaId: string | null
): Promise<SessionLinks> {
  const d = drizzle(db);
  const open = inArray(areaClimbs.status, ["active", "pending"]);
  const [area, climbs] = await Promise.all([
    areaId === null
      ? undefined
      : d
          .select({ id: areas.id, name: areas.name, slug: areas.slug })
          .from(areas)
          .where(
            and(
              eq(areas.id, areaId),
              inArray(areas.status, ["active", "pending"]),
              visibleTo(areas, viewer)
            )
          )
          .get(),
    d
      .select({
        climb_slug: sessionClimbLinks.climb_slug,
        id: areaClimbs.id,
        name: areaClimbs.name,
        slug: areaClimbs.slug,
      })
      .from(sessionClimbLinks)
      .innerJoin(areaClimbs, eq(areaClimbs.id, sessionClimbLinks.climb_id))
      .where(
        and(
          eq(sessionClimbLinks.user_id, viewer.id),
          eq(sessionClimbLinks.fingerprint, fingerprint),
          open,
          visibleTo(areaClimbs, viewer)
        )
      )
      .all(),
  ]);
  return {
    area: area ?? null,
    climbs: new Map(climbs.map(({ climb_slug, ...climb }) => [climb_slug, climb])),
  };
}

// Any session the user owns can be deleted, board-sourced history included.
// Removing a row of your own is not a refresh: it calls nothing upstream and
// re-scores nothing. Editing a board row stays blocked, since that would
// re-score history we can no longer verify.
export async function deleteSession(
  db: D1Database,
  userId: string,
  fingerprint: string
): Promise<boolean> {
  const d = drizzle(db);
  const result = await d
    .delete(sessions)
    .where(and(eq(sessions.user_id, userId), eq(sessions.fingerprint, fingerprint)));
  if (result.meta.changes === 0) return false;
  await d.batch([
    d
      .delete(sessionTags)
      .where(and(eq(sessionTags.user_id, userId), eq(sessionTags.fingerprint, fingerprint))),
    d
      .delete(climbNotes)
      .where(and(eq(climbNotes.user_id, userId), eq(climbNotes.fingerprint, fingerprint))),
    clearLinks(d, userId, fingerprint),
  ]);
  await pruneUnusedTags(d, userId);
  return true;
}

export type TagRow = { id: string; name: string; slug: string };

export type TagSummary = TagRow & { session_count: number };

type Db = ReturnType<typeof drizzle>;

const tagColumns = { id: tags.id, name: tags.name, slug: tags.slug };

// A tag exists while something wears it. Both link tables count, so a tag left
// only on an entry survives being taken off every session.
async function pruneUnusedTags(d: Db, userId: string): Promise<void> {
  const [onSessions, onEntries] = await Promise.all([
    d
      .select({ tag_id: sessionTags.tag_id })
      .from(sessionTags)
      .where(eq(sessionTags.user_id, userId))
      .all(),
    d
      .select({ tag_id: entryTags.tag_id })
      .from(entryTags)
      .where(eq(entryTags.user_id, userId))
      .all(),
  ]);
  const used = [...new Set([...onSessions, ...onEntries].map((r) => r.tag_id))];
  const unused = used.length === 0 ? undefined : notInArray(tags.id, used);
  await d.delete(tags).where(and(eq(tags.user_id, userId), unused));
}

/** Find or create the user's tags by slug. The vocabulary is shared; the links are not. */
async function ensureTags(d: Db, userId: string, wanted: NormalizedTag[]): Promise<TagRow[]> {
  const slugs = wanted.map((t) => t.slug);
  const known =
    slugs.length === 0
      ? []
      : await d
          .select(tagColumns)
          .from(tags)
          .where(and(eq(tags.user_id, userId), inArray(tags.slug, slugs)))
          .all();
  const bySlug = new Map(known.map((t) => [t.slug, t]));

  const missing = wanted.filter((t) => !bySlug.has(t.slug));
  if (missing.length > 0) {
    const created_at = new Date().toISOString();
    const created = missing.map((t) => ({ id: crypto.randomUUID(), name: t.name, slug: t.slug }));
    await d.insert(tags).values(created.map((t) => ({ user_id: userId, created_at, ...t })));
    for (const tag of created) bySlug.set(tag.slug, tag);
  }

  return wanted.map((t) => bySlug.get(t.slug)!);
}

export async function listTags(db: D1Database, userId: string): Promise<TagSummary[]> {
  return drizzle(db)
    .select({ ...tagColumns, session_count: count(sessionTags.fingerprint) })
    .from(tags)
    .leftJoin(
      sessionTags,
      and(eq(sessionTags.user_id, tags.user_id), eq(sessionTags.tag_id, tags.id))
    )
    .where(eq(tags.user_id, userId))
    .groupBy(tags.id)
    .orderBy(asc(tags.name))
    .all();
}

export async function tagsBySession(
  db: D1Database,
  userId: string
): Promise<Map<string, TagRow[]>> {
  const rows = await drizzle(db)
    .select({ fingerprint: sessionTags.fingerprint, ...tagColumns })
    .from(sessionTags)
    .innerJoin(tags, and(eq(tags.user_id, sessionTags.user_id), eq(tags.id, sessionTags.tag_id)))
    .where(eq(sessionTags.user_id, userId))
    .orderBy(asc(tags.name))
    .all();
  const bySession = new Map<string, TagRow[]>();
  for (const { fingerprint, ...tag } of rows) {
    const existing = bySession.get(fingerprint);
    if (existing) existing.push(tag);
    else bySession.set(fingerprint, [tag]);
  }
  return bySession;
}

export async function getSessionTags(
  db: D1Database,
  userId: string,
  fingerprint: string
): Promise<TagRow[]> {
  return drizzle(db)
    .select(tagColumns)
    .from(sessionTags)
    .innerJoin(tags, and(eq(tags.user_id, sessionTags.user_id), eq(tags.id, sessionTags.tag_id)))
    .where(and(eq(sessionTags.user_id, userId), eq(sessionTags.fingerprint, fingerprint)))
    .orderBy(asc(tags.name))
    .all();
}

// A note belongs to the user, not to the scoring engine, so any owned session
// takes one, board-sourced history included. Storage is the journal now: the
// log form's single notes field edits the session's first entry, which is what
// the old column could hold, and creates one when there is none.
export async function upsertSessionNote(
  db: D1Database,
  userId: string,
  fingerprint: string,
  occurredAt: string,
  body: string | null
): Promise<boolean> {
  if ((await getSession(db, userId, fingerprint)) === null) return false;
  const existing = await drizzle(db)
    .select({ id: journalEntries.id })
    .from(journalEntries)
    .innerJoin(
      entrySessions,
      and(
        eq(entrySessions.user_id, journalEntries.user_id),
        eq(entrySessions.entry_id, journalEntries.id)
      )
    )
    .where(
      and(
        eq(journalEntries.user_id, userId),
        eq(entrySessions.fingerprint, fingerprint),
        eq(journalEntries.kind, "journal"),
        // A thread update is a journal entry too, and it can be linked to a
        // session. It is not the session's note and must never be edited as one.
        isNull(journalEntries.parent_id)
      )
    )
    // The same entry `sessionResponse` reads back as `notes`, or the form would
    // show one entry and overwrite another.
    .orderBy(desc(journalEntries.occurred_at), desc(journalEntries.created_at))
    .get();

  if (existing === undefined) {
    if (body === null) return true;
    const id = crypto.randomUUID();
    await insertEntry(db, userId, id, {
      kind: "journal",
      occurred_at: occurredAt,
      ends_at: null,
      title: null,
      body,
      parent_id: null,
      severity: null,
      status: null,
    });
    await setEntrySessions(db, userId, id, [fingerprint]);
    return true;
  }

  if (body === null) await deleteEntry(db, userId, existing.id);
  else
    await drizzle(db)
      .update(journalEntries)
      .set({ body, updated_at: new Date().toISOString() })
      .where(and(eq(journalEntries.user_id, userId), eq(journalEntries.id, existing.id)));
  return true;
}

export async function setSessionTags(
  db: D1Database,
  userId: string,
  fingerprint: string,
  wanted: NormalizedTag[]
): Promise<TagRow[]> {
  const d = drizzle(db);
  const linked = await ensureTags(d, userId, wanted);
  const clear = d
    .delete(sessionTags)
    .where(and(eq(sessionTags.user_id, userId), eq(sessionTags.fingerprint, fingerprint)));
  if (linked.length === 0) await clear;
  else {
    await d.batch([
      clear,
      d
        .insert(sessionTags)
        .values(linked.map((t) => ({ user_id: userId, fingerprint, tag_id: t.id }))),
    ]);
  }
  await pruneUnusedTags(d, userId);
  return linked;
}

export async function listSessionClimbLinks(
  db: D1Database,
  userId: string
): Promise<Array<{ climb_slug: string; climb_id: string }>> {
  return drizzle(db)
    .select({ climb_slug: sessionClimbLinks.climb_slug, climb_id: sessionClimbLinks.climb_id })
    .from(sessionClimbLinks)
    .where(eq(sessionClimbLinks.user_id, userId))
    .all();
}

export type ClimbNoteRow = typeof climbNotes.$inferSelect;

export type ClimbNoteInput = { climb_slug: string; note: string };

export async function listClimbNotes(db: D1Database, userId: string): Promise<ClimbNoteRow[]> {
  return drizzle(db).select().from(climbNotes).where(eq(climbNotes.user_id, userId)).all();
}

export async function getSessionClimbNotes(
  db: D1Database,
  userId: string,
  fingerprint: string
): Promise<ClimbNoteRow[]> {
  return drizzle(db)
    .select()
    .from(climbNotes)
    .where(and(eq(climbNotes.user_id, userId), eq(climbNotes.fingerprint, fingerprint)))
    .all();
}

// The log form carries every note the user can see for that session, so saving
// it replaces the session's whole set - the same contract as its tags.
export async function setClimbNotes(
  db: D1Database,
  userId: string,
  fingerprint: string,
  notes: ClimbNoteInput[]
): Promise<void> {
  const d = drizzle(db);
  const updated_at = new Date().toISOString();
  const clear = d
    .delete(climbNotes)
    .where(and(eq(climbNotes.user_id, userId), eq(climbNotes.fingerprint, fingerprint)));
  if (notes.length === 0) {
    await clear;
    return;
  }
  await d.batch([
    clear,
    d
      .insert(climbNotes)
      .values(notes.map((n) => ({ user_id: userId, fingerprint, updated_at, ...n }))),
  ]);
}

export async function setClimbNote(
  db: D1Database,
  userId: string,
  fingerprint: string,
  climb_slug: string,
  note: string | null
): Promise<void> {
  const d = drizzle(db);
  if (note === null) {
    await d
      .delete(climbNotes)
      .where(
        and(
          eq(climbNotes.user_id, userId),
          eq(climbNotes.fingerprint, fingerprint),
          eq(climbNotes.climb_slug, climb_slug)
        )
      );
    return;
  }
  const updated_at = new Date().toISOString();
  await d
    .insert(climbNotes)
    .values({ user_id: userId, fingerprint, climb_slug, note, updated_at })
    .onConflictDoUpdate({
      target: [climbNotes.user_id, climbNotes.fingerprint, climbNotes.climb_slug],
      set: { note, updated_at },
    });
}

export async function getEntryTags(
  db: D1Database,
  userId: string,
  entryId: string
): Promise<TagRow[]> {
  return drizzle(db)
    .select(tagColumns)
    .from(entryTags)
    .innerJoin(tags, and(eq(tags.user_id, entryTags.user_id), eq(tags.id, entryTags.tag_id)))
    .where(and(eq(entryTags.user_id, userId), eq(entryTags.entry_id, entryId)))
    .orderBy(asc(tags.name))
    .all();
}

export async function tagsByEntry(db: D1Database, userId: string): Promise<Map<string, TagRow[]>> {
  const rows = await drizzle(db)
    .select({ entry_id: entryTags.entry_id, ...tagColumns })
    .from(entryTags)
    .innerJoin(tags, and(eq(tags.user_id, entryTags.user_id), eq(tags.id, entryTags.tag_id)))
    .where(eq(entryTags.user_id, userId))
    .orderBy(asc(tags.name))
    .all();
  const byEntry = new Map<string, TagRow[]>();
  for (const { entry_id, ...tag } of rows) {
    const existing = byEntry.get(entry_id);
    if (existing) existing.push(tag);
    else byEntry.set(entry_id, [tag]);
  }
  return byEntry;
}

export async function setEntryTags(
  db: D1Database,
  userId: string,
  entryId: string,
  wanted: NormalizedTag[]
): Promise<TagRow[]> {
  const d = drizzle(db);
  const linked = await ensureTags(d, userId, wanted);
  const clear = d
    .delete(entryTags)
    .where(and(eq(entryTags.user_id, userId), eq(entryTags.entry_id, entryId)));
  if (linked.length === 0) await clear;
  else {
    await d.batch([
      clear,
      d
        .insert(entryTags)
        .values(linked.map((t) => ({ user_id: userId, entry_id: entryId, tag_id: t.id }))),
    ]);
  }
  await pruneUnusedTags(d, userId);
  return linked;
}

export type EntryRow = Omit<typeof journalEntries.$inferSelect, "user_id">;

const entryColumns = Object.fromEntries(
  Object.entries(getTableColumns(journalEntries)).filter(([name]) => name !== "user_id")
) as { [K in keyof EntryRow]: (typeof journalEntries)[K] };

export async function listEntries(
  db: D1Database,
  userId: string,
  limit = 500
): Promise<EntryRow[]> {
  return drizzle(db)
    .select(entryColumns)
    .from(journalEntries)
    .where(eq(journalEntries.user_id, userId))
    .orderBy(desc(journalEntries.occurred_at), desc(journalEntries.created_at))
    .limit(limit)
    .all();
}

export async function getEntry(
  db: D1Database,
  userId: string,
  id: string
): Promise<EntryRow | null> {
  const row = await drizzle(db)
    .select(entryColumns)
    .from(journalEntries)
    .where(and(eq(journalEntries.user_id, userId), eq(journalEntries.id, id)))
    .get();
  return row ?? null;
}

export async function getEntrySessions(
  db: D1Database,
  userId: string,
  entryId: string
): Promise<string[]> {
  const rows = await drizzle(db)
    .select({ fingerprint: entrySessions.fingerprint })
    .from(entrySessions)
    .where(and(eq(entrySessions.user_id, userId), eq(entrySessions.entry_id, entryId)))
    .all();
  return rows.map((r) => r.fingerprint);
}

export async function sessionsByEntry(
  db: D1Database,
  userId: string
): Promise<Map<string, string[]>> {
  const rows = await drizzle(db)
    .select({ entry_id: entrySessions.entry_id, fingerprint: entrySessions.fingerprint })
    .from(entrySessions)
    .where(eq(entrySessions.user_id, userId))
    .all();
  const byEntry = new Map<string, string[]>();
  for (const { entry_id, fingerprint } of rows) {
    const existing = byEntry.get(entry_id);
    if (existing) existing.push(fingerprint);
    else byEntry.set(entry_id, [fingerprint]);
  }
  return byEntry;
}

export async function setEntrySessions(
  db: D1Database,
  userId: string,
  entryId: string,
  fingerprints: string[]
): Promise<string[]> {
  const d = drizzle(db);
  // Only sessions the user owns, and each at most once.
  const owned = await d
    .select({ fingerprint: sessions.fingerprint })
    .from(sessions)
    .where(and(eq(sessions.user_id, userId), inArray(sessions.fingerprint, fingerprints)))
    .all();
  const wanted = [...new Set(owned.map((s) => s.fingerprint))];
  const clear = d
    .delete(entrySessions)
    .where(and(eq(entrySessions.user_id, userId), eq(entrySessions.entry_id, entryId)));
  if (wanted.length === 0) await clear;
  else {
    await d.batch([
      clear,
      d
        .insert(entrySessions)
        .values(wanted.map((fingerprint) => ({ user_id: userId, entry_id: entryId, fingerprint }))),
    ]);
  }
  return wanted;
}

export async function insertEntry(
  db: D1Database,
  userId: string,
  id: string,
  entry: EntryWrite
): Promise<void> {
  const now = new Date().toISOString();
  await drizzle(db)
    .insert(journalEntries)
    .values({ user_id: userId, id, ...entry, created_at: now, updated_at: now });
}

export async function updateEntry(
  db: D1Database,
  userId: string,
  id: string,
  entry: EntryWrite
): Promise<boolean> {
  const result = await drizzle(db)
    .update(journalEntries)
    .set({ ...entry, updated_at: new Date().toISOString() })
    .where(and(eq(journalEntries.user_id, userId), eq(journalEntries.id, id)));
  return result.meta.changes > 0;
}

// Deleting a thread's parent takes its updates with it - an orphaned "felt
// better today" belongs to nothing. Deleting a session does not: see clearEntrySessions.
export async function deleteEntry(db: D1Database, userId: string, id: string): Promise<void> {
  const d = drizzle(db);
  const children = await d
    .select({ id: journalEntries.id })
    .from(journalEntries)
    .where(and(eq(journalEntries.user_id, userId), eq(journalEntries.parent_id, id)))
    .all();
  const ids = [id, ...children.map((c) => c.id)];
  await d.batch([
    d.delete(entryTags).where(and(eq(entryTags.user_id, userId), inArray(entryTags.entry_id, ids))),
    d
      .delete(entrySessions)
      .where(and(eq(entrySessions.user_id, userId), inArray(entrySessions.entry_id, ids))),
    d
      .delete(journalEntries)
      .where(and(eq(journalEntries.user_id, userId), inArray(journalEntries.id, ids))),
  ]);
  await pruneUnusedTags(d, userId);
}

// A deleted session must not destroy what the user wrote about it, so only the
// links go and the entry stands on whatever sessions it still has.
export async function unlinkSession(
  db: D1Database,
  userId: string,
  fingerprint: string
): Promise<void> {
  await drizzle(db)
    .delete(entrySessions)
    .where(and(eq(entrySessions.user_id, userId), eq(entrySessions.fingerprint, fingerprint)));
}

export type Discipline = "boulder" | "route";

export type ClimbGrade =
  { scale: "v"; value: number } | { scale: "font" | "yds" | "french"; value: string };

export type UserClimbRow = typeof userClimbs.$inferSelect;

export async function listUserClimbs(db: D1Database, userId: string): Promise<UserClimbRow[]> {
  return drizzle(db).select().from(userClimbs).where(eq(userClimbs.user_id, userId)).all();
}

export type UserClimbInput = {
  name: string;
  name_key: string;
  discipline: Discipline;
  grade_json: string | null;
  area_climb_id: string | null;
};

export async function insertUserClimbs(
  db: D1Database,
  userId: string,
  climbs: UserClimbInput[]
): Promise<void> {
  if (climbs.length === 0) return;
  const now = new Date().toISOString();
  const d = drizzle(db);
  const inserts = climbs.map((c) =>
    d
      .insert(userClimbs)
      .values({ user_id: userId, id: crypto.randomUUID(), ...c, created_at: now, updated_at: now })
      .onConflictDoNothing()
  );
  const [first, ...rest] = inserts;
  if (first !== undefined) await d.batch([first, ...rest]);
}

export async function linkUserClimbs(
  db: D1Database,
  userId: string,
  links: Array<{ id: string; area_climb_id: string }>
): Promise<void> {
  const d = drizzle(db);
  const updates = links.map((l) =>
    d
      .update(userClimbs)
      .set({ area_climb_id: l.area_climb_id })
      .where(and(eq(userClimbs.user_id, userId), eq(userClimbs.id, l.id)))
  );
  const [first, ...rest] = updates;
  if (first !== undefined) await d.batch([first, ...rest]);
}

export type WorkingInput = {
  name_key: string;
  name: string;
  grade?: ClimbGrade;
  discipline?: Discipline;
};

// The log form knows the grade and the Climbs tab knows the discipline, and
// neither overwrites what the other wrote.
export async function markWorking(
  db: D1Database,
  userId: string,
  climb: WorkingInput
): Promise<void> {
  const now = new Date().toISOString();
  const grade_json = climb.grade === undefined ? null : JSON.stringify(climb.grade);
  const discipline =
    climb.discipline ?? (climb.grade === undefined ? "boulder" : disciplineOf(climb.grade.scale));
  const set: Partial<typeof userClimbs.$inferInsert> = {
    name: climb.name,
    working: true,
    updated_at: now,
  };
  if (grade_json !== null) set.grade_json = grade_json;
  if (climb.discipline !== undefined || climb.grade !== undefined) set.discipline = discipline;
  await drizzle(db)
    .insert(userClimbs)
    .values({
      user_id: userId,
      id: crypto.randomUUID(),
      name: climb.name,
      name_key: climb.name_key,
      grade_json,
      discipline,
      area_climb_id: null,
      working: true,
      created_at: now,
      updated_at: now,
    })
    .onConflictDoUpdate({ target: [userClimbs.user_id, userClimbs.name_key], set });
}

export async function stopWorking(
  db: D1Database,
  userId: string,
  nameKey: string
): Promise<boolean> {
  const result = await drizzle(db)
    .update(userClimbs)
    .set({ working: false, updated_at: new Date().toISOString() })
    .where(
      and(
        eq(userClimbs.user_id, userId),
        eq(userClimbs.name_key, nameKey),
        eq(userClimbs.working, true)
      )
    );
  return result.meta.changes > 0;
}

export async function setUserClimbWorking(
  db: D1Database,
  userId: string,
  id: string,
  working: boolean
): Promise<void> {
  await drizzle(db)
    .update(userClimbs)
    .set({ working, updated_at: new Date().toISOString() })
    .where(and(eq(userClimbs.user_id, userId), eq(userClimbs.id, id)));
}

export type ClimbRename = {
  climb: UserClimbRow;
  name: string;
  nameKey: string;
  /** Another of the user's climbs already under the new name, which this one merges into. */
  into: UserClimbRow | null;
  /** Manual sessions whose climbs now carry the surviving id. */
  sessions: Array<{ fingerprint: string; climbs_json: string }>;
};

export async function renameUserClimb(
  db: D1Database,
  userId: string,
  r: ClimbRename
): Promise<void> {
  const d = drizzle(db);
  const now = new Date().toISOString();
  const mine = (id: string): SQL | undefined =>
    and(eq(userClimbs.user_id, userId), eq(userClimbs.id, id));
  const record =
    r.into === null
      ? d
          .update(userClimbs)
          .set({ name: r.name, name_key: r.nameKey, updated_at: now })
          .where(mine(r.climb.id))
      : d.delete(userClimbs).where(mine(r.climb.id));
  const survivor =
    r.into === null
      ? []
      : [
          d
            .update(userClimbs)
            .set({
              working: r.into.working || r.climb.working,
              area_climb_id: r.into.area_climb_id ?? r.climb.area_climb_id,
              updated_at: now,
            })
            .where(mine(r.into.id)),
        ];
  const stamped = r.sessions.map((s) =>
    d
      .update(sessions)
      .set({ climbs_json: s.climbs_json })
      .where(and(eq(sessions.user_id, userId), eq(sessions.fingerprint, s.fingerprint)))
  );
  await d.batch([record, ...survivor, ...stamped]);
}

export type PostableSessionRow = {
  fingerprint: string;
  source: string;
  start_at: string;
  end_at: string;
  rpe: number;
  rpe_source: "user" | "computed" | "none";
  title: string;
  summary: string;
  strava_activity_id: number | null;
};

// Its own query rather than widening sessionListColumns: summary carries the whole
// climb log, which the session list has no reason to ship for 200 rows.
export async function getSessionForPosting(
  db: D1Database,
  userId: string,
  fingerprint: string
): Promise<PostableSessionRow | null> {
  const row = await drizzle(db)
    .select({
      fingerprint: sessions.fingerprint,
      source: sessions.source,
      start_at: sessions.start_at,
      end_at: sessions.end_at,
      rpe: sessions.rpe,
      rpe_source: sessions.rpe_source,
      title: sessions.title,
      summary: sessions.summary,
      strava_activity_id: sessions.strava_activity_id,
    })
    .from(sessions)
    .where(and(eq(sessions.user_id, userId), eq(sessions.fingerprint, fingerprint)))
    .get();
  return row ?? null;
}

export async function markSessionPostPending(
  db: D1Database,
  userId: string,
  fingerprint: string
): Promise<void> {
  await drizzle(db)
    .update(sessions)
    .set({ post_state: "pending", post_error: null })
    .where(and(eq(sessions.user_id, userId), eq(sessions.fingerprint, fingerprint)));
}

export async function markSessionPosted(
  db: D1Database,
  userId: string,
  fingerprint: string,
  activityId: number
): Promise<void> {
  await drizzle(db)
    .update(sessions)
    .set({
      strava_activity_id: activityId,
      posted_at: new Date().toISOString(),
      post_state: "posted",
      post_error: null,
    })
    .where(and(eq(sessions.user_id, userId), eq(sessions.fingerprint, fingerprint)));
}

export async function markSessionPostFailed(
  db: D1Database,
  userId: string,
  fingerprint: string,
  error: string
): Promise<void> {
  await drizzle(db)
    .update(sessions)
    .set({ post_state: "failed", post_error: error })
    .where(and(eq(sessions.user_id, userId), eq(sessions.fingerprint, fingerprint)));
}

export async function setStravaPosting(
  db: D1Database,
  userId: string,
  postingEnabled: boolean,
  postSince: string | null
): Promise<void> {
  await drizzle(db)
    .update(stravaConnections)
    .set({ posting_enabled: postingEnabled ? 1 : 0, post_since: postSince })
    .where(eq(stravaConnections.user_id, userId));
}

export async function setTrainingPosting(
  db: D1Database,
  userId: string,
  enabled: boolean
): Promise<void> {
  await drizzle(db)
    .update(stravaConnections)
    .set({ post_training: enabled })
    .where(eq(stravaConnections.user_id, userId));
}

export async function listSessions(
  db: D1Database,
  userId: string,
  limit: number,
  includeClimbs = false
): Promise<Array<SessionRow & { climbs_json?: string | null }>> {
  const d = drizzle(db);
  const query = includeClimbs
    ? d.select({ ...sessionListColumns, climbs_json: sessions.climbs_json }).from(sessions)
    : d.select(sessionListColumns).from(sessions);
  return query
    .where(eq(sessions.user_id, userId))
    .orderBy(desc(sessions.start_at))
    .limit(limit)
    .all();
}

export async function getSession(
  db: D1Database,
  userId: string,
  fingerprint: string
): Promise<(SessionRow & { climbs_json: string | null }) | null> {
  const row = await drizzle(db)
    .select({ ...sessionListColumns, climbs_json: sessions.climbs_json })
    .from(sessions)
    .where(and(eq(sessions.user_id, userId), eq(sessions.fingerprint, fingerprint)))
    .get();
  return row ?? null;
}

export type GymRow = typeof gyms.$inferSelect;

export type GymWrite = {
  name: string;
  scale: "v" | "font";
  circuits_json: string;
  walls_json: string;
};

export async function listGyms(db: D1Database, userId: string): Promise<GymRow[]> {
  return drizzle(db)
    .select()
    .from(gyms)
    .where(eq(gyms.user_id, userId))
    .orderBy(gyms.created_at)
    .all();
}

export async function getGym(db: D1Database, userId: string, id: string): Promise<GymRow | null> {
  const row = await drizzle(db)
    .select()
    .from(gyms)
    .where(and(eq(gyms.user_id, userId), eq(gyms.id, id)))
    .get();
  return row ?? null;
}

export async function insertGym(
  db: D1Database,
  userId: string,
  id: string,
  gym: GymWrite
): Promise<void> {
  const now = new Date().toISOString();
  await drizzle(db)
    .insert(gyms)
    .values({ id, user_id: userId, ...gym, created_at: now, updated_at: now });
}

export async function updateGym(
  db: D1Database,
  userId: string,
  id: string,
  gym: GymWrite
): Promise<boolean> {
  const result = await drizzle(db)
    .update(gyms)
    .set({ ...gym, updated_at: new Date().toISOString() })
    .where(and(eq(gyms.user_id, userId), eq(gyms.id, id)));
  return result.meta.changes > 0;
}

export async function deleteGym(db: D1Database, userId: string, id: string): Promise<boolean> {
  const result = await drizzle(db)
    .delete(gyms)
    .where(and(eq(gyms.user_id, userId), eq(gyms.id, id)));
  return result.meta.changes > 0;
}

export async function deleteUserData(db: D1Database, userId: string): Promise<void> {
  const d = drizzle(db);
  await d.batch([
    d.delete(sessionTags).where(eq(sessionTags.user_id, userId)),
    d.delete(climbNotes).where(eq(climbNotes.user_id, userId)),
    d.delete(sessionClimbLinks).where(eq(sessionClimbLinks.user_id, userId)),
    d.delete(entryTags).where(eq(entryTags.user_id, userId)),
    d.delete(entrySessions).where(eq(entrySessions.user_id, userId)),
    d.delete(journalEntries).where(eq(journalEntries.user_id, userId)),
    d.delete(tags).where(eq(tags.user_id, userId)),
    d.delete(userClimbs).where(eq(userClimbs.user_id, userId)),
    d.delete(gyms).where(eq(gyms.user_id, userId)),
    d.delete(hangGrips).where(eq(hangGrips.user_id, userId)),
    d.delete(hangDefaultGrips).where(eq(hangDefaultGrips.user_id, userId)),
    d.delete(hangLoads).where(eq(hangLoads.user_id, userId)),
    d.delete(hangSessions).where(eq(hangSessions.user_id, userId)),
    d.delete(hangSettings).where(eq(hangSettings.user_id, userId)),
    d.delete(activities).where(eq(activities.user_id, userId)),
    d.delete(memberships).where(eq(memberships.user_id, userId)),
    d.delete(weekChanges).where(eq(weekChanges.user_id, userId)),
    d.delete(trainingBlocks).where(eq(trainingBlocks.user_id, userId)),
    d.delete(workouts).where(eq(workouts.user_id, userId)),
    d.delete(exercises).where(eq(exercises.user_id, userId)),
    d.delete(sessions).where(eq(sessions.user_id, userId)),
    d.delete(stravaConnections).where(eq(stravaConnections.user_id, userId)),
    d.delete(storeEntitlements).where(eq(storeEntitlements.user_id, userId)),
    // Legacy Aurora rows still hold an encrypted board token for the users who
    // connected one before the integration was discontinued. Deleting the
    // account has to take them too, ahead of the tables being dropped.
    d.delete(boardConnections).where(eq(boardConnections.user_id, userId)),
    d.delete(syncState).where(eq(syncState.user_id, userId)),
    ...purgeAreaContributions(d, userId),
    d.delete(users).where(eq(users.id, userId)),
  ]);
}

const unapproved: Array<"pending" | "deleted"> = ["pending", "deleted"];

// Approved Areas content outlives its author: other people's sends link to it.
// Unapproved content goes, unless something someone else owns hangs off it
// (a moderator's climb under a pending area, a link, a merge), in which case it
// stays for moderation like the approved rows, with the author removed. Runs
// after the user's own session links are deleted.
function purgeAreaContributions(d: DrizzleD1Database, userId: string) {
  const sub = alias(areas, "sub");
  const merged = alias(areaClimbs, "merged");
  const inSubtree = sql`substr(${sub.path}, 1, length(${areas.path})) = ${areas.path}`;
  const gone = (table: typeof areas | typeof areaClimbs, id: SQLiteColumn): SQL =>
    not(exists(d.select({ id: table.id }).from(table).where(eq(table.id, id))));
  const orphaned = (type: SQLiteColumn, id: SQLiteColumn): SQL | undefined =>
    or(and(eq(type, "area"), gone(areas, id)), and(eq(type, "climb"), gone(areaClimbs, id)));
  return [
    d
      .delete(contentRevisions)
      .where(
        and(eq(contentRevisions.submitted_by, userId), eq(contentRevisions.status, "pending"))
      ),
    d.delete(duplicateReports).where(eq(duplicateReports.reporter_id, userId)),
    d.delete(contentReports).where(eq(contentReports.reporter_id, userId)),
    d
      .delete(areaClimbs)
      .where(
        and(
          eq(areaClimbs.created_by, userId),
          inArray(areaClimbs.status, unapproved),
          not(
            exists(
              d
                .select({ id: sessionClimbLinks.climb_id })
                .from(sessionClimbLinks)
                .where(eq(sessionClimbLinks.climb_id, areaClimbs.id))
            )
          ),
          not(
            exists(
              d
                .select({ id: merged.id })
                .from(merged)
                .where(eq(merged.merged_into_id, areaClimbs.id))
            )
          )
        )
      ),
    d.delete(areas).where(
      and(
        eq(areas.created_by, userId),
        inArray(areas.status, unapproved),
        not(
          exists(
            d
              .select({ id: sub.id })
              .from(sub)
              .where(
                and(
                  inSubtree,
                  or(
                    isNull(sub.created_by),
                    ne(sub.created_by, userId),
                    notInArray(sub.status, unapproved)
                  )
                )
              )
          )
        ),
        not(
          exists(
            d
              .select({ id: areaClimbs.id })
              .from(areaClimbs)
              .innerJoin(sub, eq(areaClimbs.area_id, sub.id))
              .where(inSubtree)
          )
        )
      )
    ),
    d
      .delete(contentRevisions)
      .where(orphaned(contentRevisions.entity_type, contentRevisions.entity_id)),
    d.delete(contentReports).where(orphaned(contentReports.entity_type, contentReports.entity_id)),
    d
      .delete(duplicateReports)
      .where(
        or(
          gone(areaClimbs, duplicateReports.keep_climb_id),
          gone(areaClimbs, duplicateReports.duplicate_climb_id)
        )
      ),
    d.update(areas).set({ created_by: null }).where(eq(areas.created_by, userId)),
    d.update(areaClimbs).set({ created_by: null }).where(eq(areaClimbs.created_by, userId)),
    d
      .update(contentRevisions)
      .set({ submitted_by: null })
      .where(eq(contentRevisions.submitted_by, userId)),
    d
      .update(contentRevisions)
      .set({ reviewed_by: null })
      .where(eq(contentRevisions.reviewed_by, userId)),
    d
      .update(duplicateReports)
      .set({ reviewed_by: null })
      .where(eq(duplicateReports.reviewed_by, userId)),
    d
      .update(contentReports)
      .set({ reviewed_by: null })
      .where(eq(contentReports.reviewed_by, userId)),
  ] as const;
}

export type AreaRow = typeof areas.$inferSelect;

export type AreaClimbRow = typeof areaClimbs.$inferSelect;

export async function getViewer(db: D1Database, id: string): Promise<Viewer> {
  const row = await drizzle(db)
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .get();
  return { id, role: row?.role ?? "user" };
}

// The one rule for what anyone may read in Areas: live content, their own
// pending creations, and everything for moderators.
export function visibleTo(t: typeof areas | typeof areaClimbs, viewer: Viewer): SQL | undefined {
  if (viewer.role !== "user") return undefined;
  return or(eq(t.status, "active"), and(eq(t.status, "pending"), eq(t.created_by, viewer.id)));
}

// A slug read also finds merged rows, so the caller can answer with a redirect.
const visibleOrMerged = (t: typeof areas | typeof areaClimbs, viewer: Viewer): SQL | undefined => {
  const visible = visibleTo(t, viewer);
  return visible === undefined ? undefined : or(visible, eq(t.status, "merged"));
};

// A word prefix on the slugged name: "mandala" finds "the-mandala".
const nameMatches = (t: typeof areas | typeof areaClimbs, key: string): SQL | undefined =>
  or(like(t.name_key, `${key}%`), like(t.name_key, `%-${key}%`));

export type Box = { minLat: number; maxLat: number; minLon: number; maxLon: number };

const inBox = (box: Box): SQL | undefined =>
  and(
    gte(areas.lat, box.minLat),
    lte(areas.lat, box.maxLat),
    gte(areas.lon, box.minLon),
    lte(areas.lon, box.maxLon)
  );

export async function getArea(db: D1Database, viewer: Viewer, id: string): Promise<AreaRow | null> {
  const row = await drizzle(db)
    .select()
    .from(areas)
    .where(and(eq(areas.id, id), visibleTo(areas, viewer)))
    .get();
  return row ?? null;
}

export async function getAreaBySlug(
  db: D1Database,
  viewer: Viewer,
  slug: string
): Promise<AreaRow | null> {
  const row = await drizzle(db)
    .select()
    .from(areas)
    .where(and(eq(areas.slug, slug), visibleOrMerged(areas, viewer)))
    .get();
  return row ?? null;
}

export async function areasByIds(
  db: D1Database,
  viewer: Viewer,
  ids: string[]
): Promise<AreaRow[]> {
  if (ids.length === 0) return [];
  return drizzle(db)
    .select()
    .from(areas)
    .where(and(inArray(areas.id, ids), visibleTo(areas, viewer)))
    .orderBy(areas.depth)
    .all();
}

export async function childAreas(
  db: D1Database,
  viewer: Viewer,
  parentId: string | null
): Promise<AreaRow[]> {
  const under = parentId === null ? isNull(areas.parent_id) : eq(areas.parent_id, parentId);
  return drizzle(db)
    .select()
    .from(areas)
    .where(and(under, visibleTo(areas, viewer)))
    .orderBy(areas.name_key)
    .all();
}

export async function searchAreas(
  db: D1Database,
  viewer: Viewer,
  filter: { key?: string; box?: Box },
  limit: number
): Promise<AreaRow[]> {
  return drizzle(db)
    .select()
    .from(areas)
    .where(
      and(
        visibleTo(areas, viewer),
        filter.key === undefined ? undefined : nameMatches(areas, filter.key),
        filter.box === undefined ? undefined : inBox(filter.box)
      )
    )
    .orderBy(areas.depth, areas.name_key)
    .limit(limit)
    .all();
}

export async function areaSlugTaken(db: D1Database, slug: string): Promise<boolean> {
  const row = await drizzle(db)
    .select({ id: areas.id })
    .from(areas)
    .where(eq(areas.slug, slug))
    .get();
  return row !== undefined;
}

export async function insertArea(
  db: D1Database,
  row: Omit<AreaRow, "version" | "merged_into_id" | "region_code" | "review_note">
): Promise<void> {
  await drizzle(db).insert(areas).values(row);
}

export type AreaEdit = Pick<AreaRow, "name" | "name_key" | "description" | "lat" | "lon">;

// Only the creator, only while nobody else can see it: once active, a change
// is a revision for a moderator.
export async function updatePendingArea(
  db: D1Database,
  userId: string,
  id: string,
  edit: AreaEdit
): Promise<boolean> {
  const result = await drizzle(db)
    .update(areas)
    .set({ ...edit, version: sql`${areas.version} + 1`, updated_at: new Date().toISOString() })
    .where(and(eq(areas.id, id), eq(areas.created_by, userId), eq(areas.status, "pending")));
  return result.meta.changes > 0;
}

export async function getAreaClimb(
  db: D1Database,
  viewer: Viewer,
  id: string
): Promise<AreaClimbRow | null> {
  const row = await drizzle(db)
    .select()
    .from(areaClimbs)
    .where(and(eq(areaClimbs.id, id), visibleTo(areaClimbs, viewer)))
    .get();
  return row ?? null;
}

export async function getAreaClimbBySlug(
  db: D1Database,
  viewer: Viewer,
  slug: string
): Promise<AreaClimbRow | null> {
  const row = await drizzle(db)
    .select()
    .from(areaClimbs)
    .where(and(eq(areaClimbs.slug, slug), visibleOrMerged(areaClimbs, viewer)))
    .get();
  return row ?? null;
}

export async function climbsInAreas(
  db: D1Database,
  viewer: Viewer,
  areaIds: string[]
): Promise<AreaClimbRow[]> {
  if (areaIds.length === 0) return [];
  return drizzle(db)
    .select()
    .from(areaClimbs)
    .where(and(inArray(areaClimbs.area_id, areaIds), visibleTo(areaClimbs, viewer)))
    .orderBy(areaClimbs.name_key)
    .all();
}

// `under` is an area path: the range covers exactly its subtree, because the
// character after "/" is "0".
export async function searchAreaClimbs(
  db: D1Database,
  viewer: Viewer,
  filter: { key?: string; under?: string },
  limit: number
): Promise<AreaClimbRow[]> {
  const under = filter.under;
  const subtree =
    under === undefined
      ? undefined
      : inArray(
          areaClimbs.area_id,
          drizzle(db)
            .select({ id: areas.id })
            .from(areas)
            .where(and(gte(areas.path, under), lt(areas.path, `${under.slice(0, -1)}0`)))
        );
  return drizzle(db)
    .select()
    .from(areaClimbs)
    .where(
      and(
        visibleTo(areaClimbs, viewer),
        filter.key === undefined ? undefined : nameMatches(areaClimbs, filter.key),
        subtree
      )
    )
    .orderBy(areaClimbs.name_key)
    .limit(limit)
    .all();
}

export async function areaClimbSlugTaken(db: D1Database, slug: string): Promise<boolean> {
  const row = await drizzle(db)
    .select({ id: areaClimbs.id })
    .from(areaClimbs)
    .where(eq(areaClimbs.slug, slug))
    .get();
  return row !== undefined;
}

export async function insertAreaClimb(
  db: D1Database,
  row: Omit<AreaClimbRow, "version" | "merged_into_id" | "review_note">
): Promise<void> {
  await drizzle(db).insert(areaClimbs).values(row);
}

export type AreaClimbEdit = Omit<
  AreaClimbRow,
  | "id"
  | "area_id"
  | "slug"
  | "status"
  | "merged_into_id"
  | "version"
  | "review_note"
  | "created_by"
  | "created_at"
  | "updated_at"
>;

export async function updatePendingAreaClimb(
  db: D1Database,
  userId: string,
  id: string,
  edit: AreaClimbEdit
): Promise<boolean> {
  const result = await drizzle(db)
    .update(areaClimbs)
    .set({ ...edit, version: sql`${areaClimbs.version} + 1`, updated_at: new Date().toISOString() })
    .where(
      and(
        eq(areaClimbs.id, id),
        eq(areaClimbs.created_by, userId),
        eq(areaClimbs.status, "pending")
      )
    );
  return result.meta.changes > 0;
}

export async function areaClimbsByIds(
  db: D1Database,
  viewer: Viewer,
  ids: string[]
): Promise<AreaClimbRow[]> {
  if (ids.length === 0) return [];
  return drizzle(db)
    .select()
    .from(areaClimbs)
    .where(and(inArray(areaClimbs.id, ids), visibleTo(areaClimbs, viewer)))
    .all();
}

export type RevisionRow = typeof contentRevisions.$inferSelect;

const ownDraft = (userId: string, type: ContentEntity, entityId: string): SQL | undefined =>
  and(
    eq(contentRevisions.submitted_by, userId),
    eq(contentRevisions.entity_type, type),
    eq(contentRevisions.entity_id, entityId),
    eq(contentRevisions.status, "pending")
  );

export async function getDraft(
  db: D1Database,
  userId: string,
  type: ContentEntity,
  entityId: string
): Promise<RevisionRow | null> {
  const row = await drizzle(db)
    .select()
    .from(contentRevisions)
    .where(ownDraft(userId, type, entityId))
    .get();
  return row ?? null;
}

export type DraftWrite = Pick<
  RevisionRow,
  "submitted_by" | "entity_type" | "entity_id" | "proposed_json" | "base_json" | "change_summary"
>;

// One pending draft per user per entity, enforced by the partial unique index:
// saving again replaces it in place.
export async function saveDraft(db: D1Database, draft: DraftWrite): Promise<void> {
  const now = new Date().toISOString();
  await drizzle(db)
    .insert(contentRevisions)
    .values({
      id: crypto.randomUUID(),
      ...draft,
      status: "pending",
      created_at: now,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: [
        contentRevisions.submitted_by,
        contentRevisions.entity_type,
        contentRevisions.entity_id,
      ],
      targetWhere: sql`${contentRevisions.status} = 'pending'`,
      set: {
        proposed_json: draft.proposed_json,
        base_json: draft.base_json,
        change_summary: draft.change_summary,
        updated_at: now,
      },
    });
}

export async function deleteDraft(
  db: D1Database,
  userId: string,
  type: ContentEntity,
  entityId: string
): Promise<boolean> {
  const result = await drizzle(db)
    .delete(contentRevisions)
    .where(ownDraft(userId, type, entityId));
  return result.meta.changes > 0;
}

export type ContentReportRow = typeof contentReports.$inferSelect;

const stamp = (): string => new Date().toISOString();

export type Page<T> = { count: number; rows: T[] };

const countOf = async (query: Promise<{ n: number }[]>): Promise<number> =>
  (await query)[0]?.n ?? 0;

export type ContributionRecord = { approved: number; rejected: number };

// How each contributor's earlier areas and climbs were decided, for the moderator's eye.
export async function contributionRecords(
  db: D1Database,
  userIds: string[]
): Promise<Map<string, ContributionRecord>> {
  const records = new Map<string, ContributionRecord>();
  if (userIds.length === 0) return records;
  const d = drizzle(db);
  const decided = ["active", "deleted"] as const;
  const [areaRows, climbRows] = await Promise.all([
    d
      .select({ user: areas.created_by, status: areas.status, n: count() })
      .from(areas)
      .where(and(inArray(areas.created_by, userIds), inArray(areas.status, decided)))
      .groupBy(areas.created_by, areas.status)
      .all(),
    d
      .select({ user: areaClimbs.created_by, status: areaClimbs.status, n: count() })
      .from(areaClimbs)
      .where(and(inArray(areaClimbs.created_by, userIds), inArray(areaClimbs.status, decided)))
      .groupBy(areaClimbs.created_by, areaClimbs.status)
      .all(),
  ]);
  for (const row of [...areaRows, ...climbRows]) {
    if (row.user === null) continue;
    const record = records.get(row.user) ?? { approved: 0, rejected: 0 };
    record[row.status === "active" ? "approved" : "rejected"] += row.n;
    records.set(row.user, record);
  }
  return records;
}

export async function pendingAreas(db: D1Database, limit: number): Promise<Page<AreaRow>> {
  const d = drizzle(db);
  const pending = eq(areas.status, "pending");
  const [n, rows] = await Promise.all([
    countOf(d.select({ n: count() }).from(areas).where(pending)),
    d.select().from(areas).where(pending).orderBy(asc(areas.created_at)).limit(limit).all(),
  ]);
  return { count: n, rows };
}

export async function pendingAreaClimbs(
  db: D1Database,
  limit: number
): Promise<Page<AreaClimbRow>> {
  const d = drizzle(db);
  const pending = eq(areaClimbs.status, "pending");
  const [n, rows] = await Promise.all([
    countOf(d.select({ n: count() }).from(areaClimbs).where(pending)),
    d
      .select()
      .from(areaClimbs)
      .where(pending)
      .orderBy(asc(areaClimbs.created_at))
      .limit(limit)
      .all(),
  ]);
  return { count: n, rows };
}

export async function pendingRevisions(db: D1Database, limit: number): Promise<Page<RevisionRow>> {
  const d = drizzle(db);
  const pending = eq(contentRevisions.status, "pending");
  const [n, rows] = await Promise.all([
    countOf(d.select({ n: count() }).from(contentRevisions).where(pending)),
    d
      .select()
      .from(contentRevisions)
      .where(pending)
      .orderBy(asc(contentRevisions.updated_at))
      .limit(limit)
      .all(),
  ]);
  return { count: n, rows };
}

export async function getRevision(db: D1Database, id: string): Promise<RevisionRow | null> {
  const row = await drizzle(db)
    .select()
    .from(contentRevisions)
    .where(eq(contentRevisions.id, id))
    .get();
  return row ?? null;
}

// An area that can hold approved content: live, and where the caller last saw it.
const liveArea = (d: Db, id: string, ...extra: (SQL | undefined)[]): SQL =>
  exists(
    d
      .select({ id: areas.id })
      .from(areas)
      .where(and(eq(areas.id, id), eq(areas.status, "active"), ...extra))
  );

// Pending to active, only at the version the moderator reviewed and only once
// its parent is live, so nothing active ever hangs under something hidden.
export async function approveArea(
  db: D1Database,
  row: { id: string; version: number; parentId: string | null }
): Promise<boolean> {
  const d = drizzle(db);
  const result = await d
    .update(areas)
    .set({ status: "active", version: sql`${areas.version} + 1`, updated_at: stamp() })
    .where(
      and(
        eq(areas.id, row.id),
        eq(areas.status, "pending"),
        eq(areas.version, row.version),
        row.parentId === null ? undefined : liveArea(d, row.parentId)
      )
    );
  return result.meta.changes > 0;
}

export async function approveAreaClimb(
  db: D1Database,
  row: { id: string; version: number; areaId: string }
): Promise<boolean> {
  const d = drizzle(db);
  const result = await d
    .update(areaClimbs)
    .set({ status: "active", version: sql`${areaClimbs.version} + 1`, updated_at: stamp() })
    .where(
      and(
        eq(areaClimbs.id, row.id),
        eq(areaClimbs.status, "pending"),
        eq(areaClimbs.version, row.version),
        liveArea(d, row.areaId, isNull(areas.region_code))
      )
    );
  return result.meta.changes > 0;
}

const openStatus = ["active", "pending"] as const;

// Somewhere a pending creation can be put: still open, and where the moderator saw it.
const openArea = (d: Db, id: string, ...extra: (SQL | undefined)[]): SQL =>
  exists(
    d
      .select({ id: areas.id })
      .from(areas)
      .where(and(eq(areas.id, id), inArray(areas.status, openStatus), ...extra))
  );

// A pending area moves with everything inside it, at the version the moderator
// reviewed. Both statements carry the parent guard so neither runs alone.
export async function movePendingArea(
  db: D1Database,
  a: {
    id: string;
    version: number;
    path: string;
    depth: number;
    parent: { id: string; path: string; depth: number };
  }
): Promise<boolean> {
  const d = drizzle(db);
  const parent = openArea(d, a.parent.id, eq(areas.path, a.parent.path));
  const at = exists(
    d
      .select({ id: areas.id })
      .from(areas)
      .where(and(eq(areas.id, a.id), eq(areas.version, a.version), eq(areas.status, "pending")))
  );
  const subtree = d
    .update(areas)
    .set({
      path: sql`${`${a.parent.path}${a.id}/`} || substr(${areas.path}, ${a.path.length + 1})`,
      depth: sql`${areas.depth} + ${(a.parent?.depth ?? -1) + 1 - a.depth}`,
    })
    .where(and(gte(areas.path, a.path), lt(areas.path, `${a.path.slice(0, -1)}0`), at, parent));
  const self = d
    .update(areas)
    .set({ parent_id: a.parent.id, version: sql`${areas.version} + 1`, updated_at: stamp() })
    .where(
      and(
        eq(areas.id, a.id),
        eq(areas.version, a.version),
        eq(areas.status, "pending"),
        eq(areas.path, `${a.parent.path}${a.id}/`)
      )
    );
  const [, result] = await d.batch([subtree, self]);
  return result.meta.changes > 0;
}

export async function movePendingAreaClimb(
  db: D1Database,
  row: { id: string; version: number; areaId: string }
): Promise<boolean> {
  const d = drizzle(db);
  const result = await d
    .update(areaClimbs)
    .set({ area_id: row.areaId, version: sql`${areaClimbs.version} + 1`, updated_at: stamp() })
    .where(
      and(
        eq(areaClimbs.id, row.id),
        eq(areaClimbs.status, "pending"),
        eq(areaClimbs.version, row.version),
        openArea(d, row.areaId, isNull(areas.region_code))
      )
    );
  return result.meta.changes > 0;
}

// Refused while anything open still sits in the area: its children would be
// left under a deleted parent.
export async function rejectArea(
  db: D1Database,
  id: string,
  note: string | null
): Promise<boolean> {
  const d = drizzle(db);
  const result = await d
    .update(areas)
    .set({ status: "deleted", review_note: note, updated_at: stamp() })
    .where(
      and(
        eq(areas.id, id),
        eq(areas.status, "pending"),
        not(
          exists(
            d
              .select({ id: areas.id })
              .from(areas)
              .where(and(eq(areas.parent_id, id), inArray(areas.status, openStatus)))
          )
        ),
        not(
          exists(
            d
              .select({ id: areaClimbs.id })
              .from(areaClimbs)
              .where(and(eq(areaClimbs.area_id, id), inArray(areaClimbs.status, openStatus)))
          )
        )
      )
    );
  return result.meta.changes > 0;
}

// The creator's sessions keep the free-text climb; only the link goes.
export async function rejectAreaClimb(
  db: D1Database,
  id: string,
  note: string | null
): Promise<boolean> {
  const d = drizzle(db);
  const [result] = await d.batch([
    d
      .update(areaClimbs)
      .set({ status: "deleted", review_note: note, updated_at: stamp() })
      .where(and(eq(areaClimbs.id, id), eq(areaClimbs.status, "pending"))),
    d.delete(sessionClimbLinks).where(
      and(
        eq(sessionClimbLinks.climb_id, id),
        exists(
          d
            .select({ id: areaClimbs.id })
            .from(areaClimbs)
            .where(and(eq(areaClimbs.id, id), eq(areaClimbs.status, "deleted")))
        )
      )
    ),
  ]);
  return result.meta.changes > 0;
}

export type AreaRevisionWrite = Pick<
  AreaRow,
  "parent_id" | "name" | "name_key" | "description" | "lat" | "lon"
>;

export type AreaClimbRevisionWrite = AreaClimbEdit & { area_id: string };

type Approval = { revisionId: string; reviewerId: string; id: string; version: number };

const revisionIs = (d: Db, id: string, status: RevisionRow["status"]): SQL =>
  exists(
    d
      .select({ id: contentRevisions.id })
      .from(contentRevisions)
      .where(and(eq(contentRevisions.id, id), eq(contentRevisions.status, status)))
  );

const markApproved = (d: Db, a: Approval, guard: SQL | undefined) =>
  d
    .update(contentRevisions)
    .set({
      status: "approved",
      reviewed_by: a.reviewerId,
      reviewed_at: stamp(),
      updated_at: stamp(),
    })
    .where(
      and(eq(contentRevisions.id, a.revisionId), eq(contentRevisions.status, "pending"), guard)
    );

// One batch, every statement guarded on the state the moderator reviewed: the
// revision flips first, only while the entity is still at `version`; the
// rest only run once it has flipped. Every approval bumps the version, so a
// competing approval fails all three together and the caller answers 409.
export async function approveAreaRevision(
  db: D1Database,
  a: Approval & {
    path: string;
    depth: number;
    parent: { id: string; path: string; depth: number } | null;
    write: AreaRevisionWrite;
  }
): Promise<boolean> {
  const d = drizzle(db);
  const at = exists(
    d
      .select({ id: areas.id })
      .from(areas)
      .where(and(eq(areas.id, a.id), eq(areas.version, a.version), eq(areas.status, "active")))
  );
  const approved = revisionIs(d, a.revisionId, "approved");
  const placed =
    a.parent === null ? undefined : liveArea(d, a.parent.id, eq(areas.path, a.parent.path));
  const flip = markApproved(d, a, and(at, placed));
  const update = d
    .update(areas)
    .set({ ...a.write, version: sql`${areas.version} + 1`, updated_at: stamp() })
    .where(and(eq(areas.id, a.id), eq(areas.version, a.version), approved));
  const path = `${a.parent?.path ?? "/"}${a.id}/`;
  if (path === a.path) {
    const [, result] = await d.batch([flip, update]);
    return result.meta.changes > 0;
  }
  const move = d
    .update(areas)
    .set({
      path: sql`${path} || substr(${areas.path}, ${a.path.length + 1})`,
      depth: sql`${areas.depth} + ${(a.parent?.depth ?? -1) + 1 - a.depth}`,
    })
    .where(and(gte(areas.path, a.path), lt(areas.path, `${a.path.slice(0, -1)}0`), at, approved));
  const [, , result] = await d.batch([flip, move, update]);
  return result.meta.changes > 0;
}

export async function approveAreaClimbRevision(
  db: D1Database,
  a: Approval & { write: AreaClimbRevisionWrite }
): Promise<boolean> {
  const d = drizzle(db);
  const at = exists(
    d
      .select({ id: areaClimbs.id })
      .from(areaClimbs)
      .where(
        and(
          eq(areaClimbs.id, a.id),
          eq(areaClimbs.version, a.version),
          eq(areaClimbs.status, "active")
        )
      )
  );
  const [, result] = await d.batch([
    markApproved(d, a, and(at, liveArea(d, a.write.area_id, isNull(areas.region_code)))),
    d
      .update(areaClimbs)
      .set({ ...a.write, version: sql`${areaClimbs.version} + 1`, updated_at: stamp() })
      .where(
        and(
          eq(areaClimbs.id, a.id),
          eq(areaClimbs.version, a.version),
          revisionIs(d, a.revisionId, "approved")
        )
      ),
  ]);
  return result.meta.changes > 0;
}

export async function rejectRevision(
  db: D1Database,
  id: string,
  reviewerId: string,
  note: string | null
): Promise<boolean> {
  const result = await drizzle(db)
    .update(contentRevisions)
    .set({
      status: "rejected",
      reviewed_by: reviewerId,
      review_note: note,
      reviewed_at: stamp(),
      updated_at: stamp(),
    })
    .where(and(eq(contentRevisions.id, id), eq(contentRevisions.status, "pending")));
  return result.meta.changes > 0;
}

export async function insertContentReport(
  db: D1Database,
  report: Pick<ContentReportRow, "entity_type" | "entity_id" | "reporter_id" | "body">
): Promise<string> {
  const id = crypto.randomUUID();
  await drizzle(db)
    .insert(contentReports)
    .values({ id, ...report, status: "open", created_at: stamp() });
  return id;
}

export async function openReports(db: D1Database, limit: number): Promise<Page<ContentReportRow>> {
  const d = drizzle(db);
  const open = eq(contentReports.status, "open");
  const [n, rows] = await Promise.all([
    countOf(d.select({ n: count() }).from(contentReports).where(open)),
    d
      .select()
      .from(contentReports)
      .where(open)
      .orderBy(asc(contentReports.created_at))
      .limit(limit)
      .all(),
  ]);
  return { count: n, rows };
}

export async function resolveReport(
  db: D1Database,
  id: string,
  reviewerId: string
): Promise<boolean> {
  const result = await drizzle(db)
    .update(contentReports)
    .set({ status: "resolved", reviewed_by: reviewerId, reviewed_at: stamp() })
    .where(and(eq(contentReports.id, id), eq(contentReports.status, "open")));
  return result.meta.changes > 0;
}

export type DuplicateReportRow = typeof duplicateReports.$inferSelect;

// One open report per reporter per duplicate, held by the partial unique index.
export async function insertDuplicateReport(
  db: D1Database,
  report: Pick<DuplicateReportRow, "keep_climb_id" | "duplicate_climb_id" | "reporter_id" | "note">
): Promise<string | null> {
  const id = crypto.randomUUID();
  const result = await drizzle(db)
    .insert(duplicateReports)
    .values({ id, ...report, status: "open", created_at: stamp() })
    .onConflictDoNothing();
  return result.meta.changes > 0 ? id : null;
}

export async function openDuplicateReports(
  db: D1Database,
  limit: number
): Promise<Page<DuplicateReportRow>> {
  const d = drizzle(db);
  const open = eq(duplicateReports.status, "open");
  const [n, rows] = await Promise.all([
    countOf(d.select({ n: count() }).from(duplicateReports).where(open)),
    d
      .select()
      .from(duplicateReports)
      .where(open)
      .orderBy(asc(duplicateReports.created_at))
      .limit(limit)
      .all(),
  ]);
  return { count: n, rows };
}

export async function getDuplicateReport(
  db: D1Database,
  id: string
): Promise<DuplicateReportRow | null> {
  const row = await drizzle(db)
    .select()
    .from(duplicateReports)
    .where(eq(duplicateReports.id, id))
    .get();
  return row ?? null;
}

export async function dismissDuplicateReport(
  db: D1Database,
  id: string,
  reviewerId: string,
  note: string | null
): Promise<boolean> {
  const result = await drizzle(db)
    .update(duplicateReports)
    .set({ status: "dismissed", reviewed_by: reviewerId, review_note: note, reviewed_at: stamp() })
    .where(and(eq(duplicateReports.id, id), eq(duplicateReports.status, "open")));
  return result.meta.changes > 0;
}

export async function linkCounts(db: D1Database, climbIds: string[]): Promise<Map<string, number>> {
  if (climbIds.length === 0) return new Map();
  const rows = await drizzle(db)
    .select({ id: sessionClimbLinks.climb_id, n: count() })
    .from(sessionClimbLinks)
    .where(inArray(sessionClimbLinks.climb_id, climbIds))
    .groupBy(sessionClimbLinks.climb_id)
    .all();
  return new Map(rows.map((r) => [r.id, r.n]));
}

// One batch. The first statement is the guard: the duplicate is open and the
// survivor is open, so neither is merged. Everything after it only runs once
// the duplicate points at this survivor, so a lost race changes nothing.
// Links cannot collide: their key is the logged climb slug, not climb_id.
export async function mergeAreaClimb(
  db: D1Database,
  m: { duplicateId: string; keepId: string; reviewerId: string }
): Promise<boolean> {
  const d = drizzle(db);
  const now = stamp();
  const open = (id: string): SQL =>
    exists(
      d
        .select({ id: areaClimbs.id })
        .from(areaClimbs)
        .where(and(eq(areaClimbs.id, id), inArray(areaClimbs.status, openStatus)))
    );
  const merged = exists(
    d
      .select({ id: areaClimbs.id })
      .from(areaClimbs)
      .where(
        and(
          eq(areaClimbs.id, m.duplicateId),
          eq(areaClimbs.status, "merged"),
          eq(areaClimbs.merged_into_id, m.keepId)
        )
      )
  );
  const openReport = eq(duplicateReports.status, "open");
  const [result] = await d.batch([
    d
      .update(areaClimbs)
      .set({ status: "merged", merged_into_id: m.keepId, updated_at: now })
      .where(
        and(
          eq(areaClimbs.id, m.duplicateId),
          inArray(areaClimbs.status, openStatus),
          not(eq(areaClimbs.id, m.keepId)),
          open(m.keepId)
        )
      ),
    d
      .update(sessionClimbLinks)
      .set({ climb_id: m.keepId })
      .where(and(eq(sessionClimbLinks.climb_id, m.duplicateId), merged)),
    d
      .update(areaClimbs)
      .set({ merged_into_id: m.keepId, updated_at: now })
      .where(and(eq(areaClimbs.merged_into_id, m.duplicateId), merged)),
    d
      .update(contentRevisions)
      .set({ status: "superseded", updated_at: now })
      .where(
        and(
          eq(contentRevisions.entity_type, "climb"),
          eq(contentRevisions.entity_id, m.duplicateId),
          eq(contentRevisions.status, "pending"),
          merged
        )
      ),
    d
      .update(duplicateReports)
      .set({ status: "merged", reviewed_by: m.reviewerId, reviewed_at: now })
      .where(
        and(
          openReport,
          or(
            eq(duplicateReports.duplicate_climb_id, m.duplicateId),
            and(
              eq(duplicateReports.duplicate_climb_id, m.keepId),
              eq(duplicateReports.keep_climb_id, m.duplicateId)
            )
          ),
          merged
        )
      ),
    d
      .update(duplicateReports)
      .set({ keep_climb_id: m.keepId })
      .where(and(openReport, eq(duplicateReports.keep_climb_id, m.duplicateId), merged)),
  ]);
  return result.meta.changes > 0;
}

export type HangGripRow = typeof hangGrips.$inferSelect;
export type HangSessionRow = typeof hangSessions.$inferSelect;
export type HangSettingsRow = typeof hangSettings.$inferSelect;

export type HangRows = {
  grips: HangGripRow[];
  defaultGrips: Array<typeof hangDefaultGrips.$inferSelect>;
  loads: Loads;
  sessions: HangSessionRow[];
  settings: HangSettingsRow | null;
};

const loadsOf = (rows: Array<typeof hangLoads.$inferSelect>): Loads =>
  Object.fromEntries(rows.map((r) => [loadKey(r.workout_id, r.grip_id), r.kg]));

// Everything the hangboard feature reads, in one round trip.
export async function hangRows(db: D1Database, userId: string): Promise<HangRows> {
  const d = drizzle(db);
  const [grips, defaultGrips, loads, hang, settings] = await d.batch([
    d.select().from(hangGrips).where(eq(hangGrips.user_id, userId)).orderBy(hangGrips.created_at),
    d.select().from(hangDefaultGrips).where(eq(hangDefaultGrips.user_id, userId)),
    d.select().from(hangLoads).where(eq(hangLoads.user_id, userId)),
    d
      .select()
      .from(hangSessions)
      .where(eq(hangSessions.user_id, userId))
      .orderBy(desc(hangSessions.date), desc(hangSessions.created_at)),
    d.select().from(hangSettings).where(eq(hangSettings.user_id, userId)),
  ]);
  return {
    grips,
    defaultGrips,
    loads: loadsOf(loads),
    sessions: hang,
    settings: settings[0] ?? null,
  };
}

export async function listHangGrips(db: D1Database, userId: string): Promise<HangGripRow[]> {
  return drizzle(db).select().from(hangGrips).where(eq(hangGrips.user_id, userId)).all();
}

export async function findHangGripByKey(
  db: D1Database,
  userId: string,
  nameKey: string
): Promise<HangGripRow | null> {
  const row = await drizzle(db)
    .select()
    .from(hangGrips)
    .where(and(eq(hangGrips.user_id, userId), eq(hangGrips.name_key, nameKey)))
    .get();
  return row ?? null;
}

export async function getHangGrip(
  db: D1Database,
  userId: string,
  id: string
): Promise<HangGripRow | null> {
  const row = await drizzle(db)
    .select()
    .from(hangGrips)
    .where(and(eq(hangGrips.user_id, userId), eq(hangGrips.id, id)))
    .get();
  return row ?? null;
}

export async function saveHangGrip(
  db: D1Database,
  userId: string,
  grip: { id: string; name: string; nameKey: string }
): Promise<void> {
  await drizzle(db)
    .insert(hangGrips)
    .values({
      user_id: userId,
      id: grip.id,
      name: grip.name,
      name_key: grip.nameKey,
      hidden: false,
      created_at: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: [hangGrips.user_id, hangGrips.id],
      set: { name: grip.name, name_key: grip.nameKey, hidden: false },
    });
}

export async function showHangGrip(db: D1Database, userId: string, id: string): Promise<void> {
  await drizzle(db)
    .update(hangGrips)
    .set({ hidden: false })
    .where(and(eq(hangGrips.user_id, userId), eq(hangGrips.id, id)));
}

/**
 * Frees a deleted grip's name for a rename. A gripKey never holds a newline, so
 * the new key can never match a name again; the grip keeps its name for history.
 */
export async function releaseHangGripName(
  db: D1Database,
  userId: string,
  grip: HangGripRow
): Promise<void> {
  await drizzle(db)
    .update(hangGrips)
    .set({ name_key: `${grip.name_key}\n${grip.id}` })
    .where(and(eq(hangGrips.user_id, userId), eq(hangGrips.id, grip.id)));
}

/**
 * Hides a custom grip from the pickers and drops its explicit default choices.
 * A workout created with it still names it as `grip`; the app's model skips it.
 * Sessions, schedules and loads keep pointing at it, so history keeps its name.
 */
export async function hideHangGrip(db: D1Database, userId: string, id: string): Promise<void> {
  const d = drizzle(db);
  await d.batch([
    d
      .update(hangGrips)
      .set({ hidden: true })
      .where(and(eq(hangGrips.user_id, userId), eq(hangGrips.id, id))),
    d
      .delete(hangDefaultGrips)
      .where(and(eq(hangDefaultGrips.user_id, userId), eq(hangDefaultGrips.grip_id, id))),
  ]);
}

export async function setHangDefaultGrip(
  db: D1Database,
  userId: string,
  workoutId: string,
  gripId: string
): Promise<void> {
  await drizzle(db)
    .insert(hangDefaultGrips)
    .values({ user_id: userId, workout_id: workoutId, grip_id: gripId })
    .onConflictDoUpdate({
      target: [hangDefaultGrips.user_id, hangDefaultGrips.workout_id],
      set: { grip_id: gripId },
    });
}

// D1 binds at most 100 parameters per statement, four per load.
const LOADS_PER_STATEMENT = 25;

export async function mergeHangLoads(db: D1Database, userId: string, loads: Loads): Promise<Loads> {
  const d = drizzle(db);
  const rows = Object.entries(loads).map(([key, kg]) => {
    const [workoutId = "", gripId = ""] = key.split(":");
    return { user_id: userId, workout_id: workoutId, grip_id: gripId, kg };
  });
  for (let i = 0; i < rows.length; i += LOADS_PER_STATEMENT) {
    await d
      .insert(hangLoads)
      .values(rows.slice(i, i + LOADS_PER_STATEMENT))
      .onConflictDoUpdate({
        target: [hangLoads.user_id, hangLoads.workout_id, hangLoads.grip_id],
        set: { kg: sql`excluded.kg` },
      });
  }
  return loadsOf(await d.select().from(hangLoads).where(eq(hangLoads.user_id, userId)).all());
}

export async function getHangSession(
  db: D1Database,
  userId: string,
  id: string
): Promise<HangSessionRow | null> {
  const row = await drizzle(db)
    .select()
    .from(hangSessions)
    .where(and(eq(hangSessions.user_id, userId), eq(hangSessions.id, id)))
    .get();
  return row ?? null;
}

export async function listHangSessions(
  db: D1Database,
  userId: string,
  limit: number
): Promise<HangSessionRow[]> {
  return drizzle(db)
    .select()
    .from(hangSessions)
    .where(eq(hangSessions.user_id, userId))
    .orderBy(desc(hangSessions.date), desc(hangSessions.created_at))
    .limit(limit)
    .all();
}

// The Strava columns are left alone: an edit keeps the activity it was posted as.
export async function saveHangSession(
  db: D1Database,
  userId: string,
  s: HangSession
): Promise<HangSessionRow> {
  const now = new Date().toISOString();
  const fields = {
    workout_id: s.workoutId,
    grip_id: s.gripId,
    date: s.date,
    edge_mm: s.edgeMm,
    load_kg: s.loadKg,
    pct: s.pct,
    misses: s.misses,
    rpe: s.rpe,
    protocol_json: JSON.stringify(s.protocol),
    membership_id: s.membershipId,
    week: s.week,
    done_json: JSON.stringify(s.done),
    updated_at: now,
  };
  return drizzle(db)
    .insert(hangSessions)
    .values({ user_id: userId, id: s.id, ...fields, created_at: now })
    .onConflictDoUpdate({ target: [hangSessions.user_id, hangSessions.id], set: fields })
    .returning()
    .get();
}

export async function deleteHangSession(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const result = await drizzle(db)
    .delete(hangSessions)
    .where(and(eq(hangSessions.user_id, userId), eq(hangSessions.id, id)));
  return result.meta.changes > 0;
}

const hangSession = (userId: string, id: string): SQL | undefined =>
  and(eq(hangSessions.user_id, userId), eq(hangSessions.id, id));

export async function markHangPostPending(
  db: D1Database,
  userId: string,
  id: string
): Promise<void> {
  await drizzle(db)
    .update(hangSessions)
    .set({ post_state: "pending", post_error: null })
    .where(hangSession(userId, id));
}

export async function markHangPosted(
  db: D1Database,
  userId: string,
  id: string,
  activityId: number
): Promise<void> {
  await drizzle(db)
    .update(hangSessions)
    .set({
      strava_activity_id: activityId,
      posted_at: new Date().toISOString(),
      post_state: "posted",
      post_error: null,
    })
    .where(hangSession(userId, id));
}

export async function markHangPostFailed(
  db: D1Database,
  userId: string,
  id: string,
  error: string
): Promise<void> {
  await drizzle(db)
    .update(hangSessions)
    .set({ post_state: "failed", post_error: error })
    .where(hangSession(userId, id));
}

export async function getHangSettings(
  db: D1Database,
  userId: string
): Promise<HangSettingsRow | null> {
  const row = await drizzle(db)
    .select()
    .from(hangSettings)
    .where(eq(hangSettings.user_id, userId))
    .get();
  return row ?? null;
}

export async function saveHangSettings(
  db: D1Database,
  userId: string,
  s: HangSettings
): Promise<void> {
  const fields = {
    units: s.units,
    theme: s.theme,
    reminders: s.reminders,
    reminder_time: s.reminderTime,
    post_to_strava: s.postToStrava,
    reminder_prompt_seen: s.reminderPromptSeen,
    updated_at: new Date().toISOString(),
  };
  await drizzle(db)
    .insert(hangSettings)
    .values({ user_id: userId, ...fields })
    .onConflictDoUpdate({ target: hangSettings.user_id, set: fields });
}

export type ActivityRow = typeof activities.$inferSelect;

export async function listActivities(
  db: D1Database,
  userId: string,
  range: { from?: string; to?: string },
  limit: number
): Promise<ActivityRow[]> {
  return drizzle(db)
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.user_id, userId),
        range.from === undefined ? undefined : gte(activities.date, range.from),
        range.to === undefined ? undefined : lte(activities.date, range.to)
      )
    )
    .orderBy(desc(activities.date), desc(activities.start_time), desc(activities.created_at))
    .limit(limit)
    .all();
}

export async function saveActivity(
  db: D1Database,
  userId: string,
  id: string,
  a: ActivityInput
): Promise<ActivityRow> {
  const now = new Date().toISOString();
  const fields = {
    kind: a.kind,
    title: a.title,
    date: a.date,
    start_time: a.startTime,
    minutes: a.minutes,
    rpe: a.rpe,
    notes: a.notes,
    workout_id: a.workoutId,
    membership_id: a.membershipId,
    week: a.week,
    done_json: JSON.stringify(a.done),
    updated_at: now,
  };
  const d = drizzle(db);
  const [rows] = await d.batch([
    d
      .insert(activities)
      .values({ user_id: userId, id, ...fields, created_at: now })
      .onConflictDoUpdate({ target: [activities.user_id, activities.id], set: fields })
      .returning(),
    ...addExercises(
      d,
      userId,
      a.done.map((e) => ({ name: e.exercise, kind: a.kind, measure: measureOf(a.kind, e.sets) }))
    ),
  ]);
  return only(rows);
}

const activity = (userId: string, id: string): SQL | undefined =>
  and(eq(activities.user_id, userId), eq(activities.id, id));

export async function getActivity(
  db: D1Database,
  userId: string,
  id: string
): Promise<ActivityRow | null> {
  const row = await drizzle(db).select().from(activities).where(activity(userId, id)).get();
  return row ?? null;
}

export async function markActivityPostPending(
  db: D1Database,
  userId: string,
  id: string
): Promise<void> {
  await drizzle(db)
    .update(activities)
    .set({ post_state: "pending", post_error: null })
    .where(activity(userId, id));
}

export async function markActivityPosted(
  db: D1Database,
  userId: string,
  id: string,
  activityId: number
): Promise<void> {
  await drizzle(db)
    .update(activities)
    .set({
      strava_activity_id: activityId,
      posted_at: new Date().toISOString(),
      post_state: "posted",
      post_error: null,
    })
    .where(activity(userId, id));
}

export async function markActivityPostFailed(
  db: D1Database,
  userId: string,
  id: string,
  error: string
): Promise<void> {
  await drizzle(db)
    .update(activities)
    .set({ post_state: "failed", post_error: error })
    .where(activity(userId, id));
}

export async function deleteActivity(db: D1Database, userId: string, id: string): Promise<boolean> {
  const result = await drizzle(db)
    .delete(activities)
    .where(and(eq(activities.user_id, userId), eq(activities.id, id)));
  return result.meta.changes > 0;
}

export type BlockRow = typeof trainingBlocks.$inferSelect;
export type MembershipRow = typeof memberships.$inferSelect;
export type WeekChangeRow = typeof weekChanges.$inferSelect;

export type PlanRows = {
  blocks: BlockRow[];
  memberships: MembershipRow[];
  weekChanges: WeekChangeRow[];
};

// Everything the plan reads, in one round trip.
export async function planRows(db: D1Database, userId: string): Promise<PlanRows> {
  const d = drizzle(db);
  const [blocks, members, changes] = await d.batch([
    d
      .select()
      .from(trainingBlocks)
      .where(eq(trainingBlocks.user_id, userId))
      .orderBy(desc(trainingBlocks.start), trainingBlocks.id),
    d
      .select()
      .from(memberships)
      .where(eq(memberships.user_id, userId))
      .orderBy(memberships.start, memberships.id),
    d
      .select()
      .from(weekChanges)
      .where(eq(weekChanges.user_id, userId))
      .orderBy(weekChanges.membership_id, weekChanges.week, weekChanges.dose, weekChanges.item),
  ]);
  return { blocks, memberships: members, weekChanges: changes };
}

export async function getBlock(
  db: D1Database,
  userId: string,
  id: string
): Promise<BlockRow | null> {
  const row = await drizzle(db)
    .select()
    .from(trainingBlocks)
    .where(and(eq(trainingBlocks.user_id, userId), eq(trainingBlocks.id, id)))
    .get();
  return row ?? null;
}

export async function saveBlock(db: D1Database, userId: string, b: Block): Promise<BlockRow> {
  const fields = {
    name: b.name,
    start: b.start,
    weeks: b.weeks,
    updated_at: new Date().toISOString(),
  };
  return drizzle(db)
    .insert(trainingBlocks)
    .values({ user_id: userId, id: b.id, ...fields })
    .onConflictDoUpdate({ target: [trainingBlocks.user_id, trainingBlocks.id], set: fields })
    .returning()
    .get();
}

const UNLINKED = { membership_id: null, week: null };

/**
 * Takes out the memberships `where` picks, with their week changes. Sessions logged
 * against them keep what was done and lose only the link.
 */
function removeMemberships(d: DrizzleD1Database, userId: string, where: SQL | undefined) {
  const ids = d.select({ id: memberships.id }).from(memberships).where(where);
  const linked = <T extends typeof activities | typeof hangSessions | typeof sessions>(
    table: T
  ): SQL | undefined => and(eq(table.user_id, userId), inArray(table.membership_id, ids));
  return [
    d.update(activities).set(UNLINKED).where(linked(activities)),
    d.update(hangSessions).set(UNLINKED).where(linked(hangSessions)),
    d.update(sessions).set(UNLINKED).where(linked(sessions)),
    d
      .delete(weekChanges)
      .where(and(eq(weekChanges.user_id, userId), inArray(weekChanges.membership_id, ids))),
    d.delete(memberships).where(where),
  ] as const;
}

/** The block goes with its memberships. */
export async function deleteBlock(db: D1Database, userId: string, id: string): Promise<boolean> {
  const d = drizzle(db);
  const results = await d.batch([
    ...removeMemberships(
      d,
      userId,
      and(eq(memberships.user_id, userId), eq(memberships.block_id, id))
    ),
    d
      .delete(trainingBlocks)
      .where(and(eq(trainingBlocks.user_id, userId), eq(trainingBlocks.id, id))),
  ]);
  return results[5].meta.changes > 0;
}

export async function getMembership(
  db: D1Database,
  userId: string,
  id: string
): Promise<MembershipRow | null> {
  const row = await drizzle(db)
    .select()
    .from(memberships)
    .where(and(eq(memberships.user_id, userId), eq(memberships.id, id)))
    .get();
  return row ?? null;
}

export async function saveMembership(
  db: D1Database,
  userId: string,
  m: Membership
): Promise<MembershipRow> {
  const fields = {
    workout_id: m.workoutId,
    block_id: m.blockId,
    weekdays_json: JSON.stringify([...new Set(m.weekdays)].sort()),
    start: m.start,
    updated_at: new Date().toISOString(),
  };
  return drizzle(db)
    .insert(memberships)
    .values({ user_id: userId, id: m.id, ...fields })
    .onConflictDoUpdate({ target: [memberships.user_id, memberships.id], set: fields })
    .returning()
    .get();
}

export async function deleteMembership(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const d = drizzle(db);
  const results = await d.batch(
    removeMemberships(d, userId, and(eq(memberships.user_id, userId), eq(memberships.id, id)))
  );
  return results[4].meta.changes > 0;
}

const weekChangeKey = (userId: string, c: Omit<WeekChange, "change">): SQL | undefined =>
  and(
    eq(weekChanges.user_id, userId),
    eq(weekChanges.membership_id, c.membershipId),
    eq(weekChanges.week, c.week),
    eq(weekChanges.dose, c.dose),
    eq(weekChanges.item, c.item)
  );

/** Sets what one week changes about one item; an empty change puts it back as written. */
export async function saveWeekChange(db: D1Database, userId: string, c: WeekChange): Promise<void> {
  const d = drizzle(db);
  if (Object.keys(c.change).length === 0) {
    await d.delete(weekChanges).where(weekChangeKey(userId, c));
    return;
  }
  const change_json = JSON.stringify(c.change);
  await d
    .insert(weekChanges)
    .values({
      user_id: userId,
      membership_id: c.membershipId,
      week: c.week,
      dose: c.dose,
      item: c.item,
      change_json,
    })
    .onConflictDoUpdate({
      target: [
        weekChanges.user_id,
        weekChanges.membership_id,
        weekChanges.week,
        weekChanges.dose,
        weekChanges.item,
      ],
      set: { change_json },
    });
}

export type WorkoutRow = typeof workouts.$inferSelect;

export async function listWorkouts(db: D1Database, userId: string): Promise<WorkoutRow[]> {
  return drizzle(db)
    .select()
    .from(workouts)
    .where(eq(workouts.user_id, userId))
    .orderBy(workouts.created_at, workouts.id)
    .all();
}

export async function saveWorkout(db: D1Database, userId: string, w: Workout): Promise<WorkoutRow> {
  const now = new Date().toISOString();
  const fields = {
    kind: w.kind,
    name: w.name,
    description: w.description === "" ? null : w.description,
    minutes: w.minutes,
    target_rpe: w.targetRpe,
    items_json: JSON.stringify(w.items),
    exercise_rest_s: w.exerciseRestS,
    updated_at: now,
  };
  const d = drizzle(db);
  const [rows] = await d.batch([
    d
      .insert(workouts)
      .values({ user_id: userId, id: w.id, ...fields, created_at: now })
      .onConflictDoUpdate({ target: [workouts.user_id, workouts.id], set: fields })
      .returning(),
    ...addExercises(d, userId, workoutExercises(w)),
  ]);
  return only(rows);
}

/**
 * The workout leaves every block: its memberships go with it. Works for a built-in
 * too, which has no row of its own but can be planned.
 */
export async function deleteWorkout(db: D1Database, userId: string, id: string): Promise<boolean> {
  const d = drizzle(db);
  const results = await d.batch([
    ...removeMemberships(
      d,
      userId,
      and(eq(memberships.user_id, userId), eq(memberships.workout_id, id))
    ),
    d.delete(workouts).where(and(eq(workouts.user_id, userId), eq(workouts.id, id))),
  ]);
  return results[5].meta.changes > 0;
}

function only<T>(rows: readonly T[]): T {
  const [row] = rows;
  if (row === undefined) throw new Error("expected a returned row");
  return row;
}

/**
 * Plans the block again from `copy.start`: a new block of the same name and length
 * with every membership and week change of the old one, shifted by the same days.
 */
export async function copyBlock(
  db: D1Database,
  userId: string,
  source: BlockRow,
  copy: Block
): Promise<void> {
  const d = drizzle(db);
  const [members, changes] = await d.batch([
    d
      .select()
      .from(memberships)
      .where(and(eq(memberships.user_id, userId), eq(memberships.block_id, source.id))),
    d
      .select()
      .from(weekChanges)
      .where(
        and(
          eq(weekChanges.user_id, userId),
          inArray(
            weekChanges.membership_id,
            d
              .select({ id: memberships.id })
              .from(memberships)
              .where(and(eq(memberships.user_id, userId), eq(memberships.block_id, source.id)))
          )
        )
      ),
  ]);
  const now = new Date().toISOString();
  const shift = daysBetween(source.start, copy.start);
  const ids = new Map(members.map((m) => [m.id, crypto.randomUUID()]));
  await d.batch([
    d.insert(trainingBlocks).values({ user_id: userId, ...copy, updated_at: now }),
    ...members.map((m) =>
      d.insert(memberships).values({
        ...m,
        id: ids.get(m.id) ?? m.id,
        block_id: copy.id,
        start: addDays(m.start, shift),
        updated_at: now,
      })
    ),
    ...changes.map((c) =>
      d
        .insert(weekChanges)
        .values({ ...c, membership_id: ids.get(c.membership_id) ?? c.membership_id })
    ),
  ]);
}

export type ExerciseRow = typeof exercises.$inferSelect;

export async function listExercises(db: D1Database, userId: string): Promise<ExerciseRow[]> {
  return drizzle(db)
    .select()
    .from(exercises)
    .where(eq(exercises.user_id, userId))
    .orderBy(exercises.name_key)
    .all();
}

export async function getExercise(
  db: D1Database,
  userId: string,
  id: string
): Promise<ExerciseRow | null> {
  const row = await drizzle(db)
    .select()
    .from(exercises)
    .where(and(eq(exercises.user_id, userId), eq(exercises.id, id)))
    .get();
  return row ?? null;
}

export async function findExerciseByName(
  db: D1Database,
  userId: string,
  name: string
): Promise<ExerciseRow | null> {
  const row = await drizzle(db)
    .select()
    .from(exercises)
    .where(and(eq(exercises.user_id, userId), eq(exercises.name_key, exerciseNameKey(name))))
    .get();
  return row ?? null;
}

// D1 binds at most 100 parameters a statement, and an exercise row takes 11.
const EXERCISES_PER_INSERT = 9;

const exerciseValues = (userId: string, id: string, e: ExerciseInput, now: string) => ({
  user_id: userId,
  id,
  name: e.name.trim(),
  name_key: exerciseNameKey(e.name),
  kind: e.kind,
  measure: e.measure ?? defaultMeasure(e.kind),
  each_side: e.eachSide ?? false,
  built_in: e.builtIn ?? null,
  archived: false,
  created_at: now,
  updated_at: now,
});

/** Adds the names not yet listed; a name already there, in any case, keeps its row. */
function addExercises(d: DrizzleD1Database, userId: string, list: readonly ExerciseInput[]) {
  const now = new Date().toISOString();
  const rows = [
    ...new Map(
      list
        .filter((e) => e.name.trim() !== "")
        .map((e) => [exerciseNameKey(e.name), exerciseValues(userId, crypto.randomUUID(), e, now)])
    ).values(),
  ];
  return Array.from({ length: Math.ceil(rows.length / EXERCISES_PER_INSERT) }, (_, i) =>
    d
      .insert(exercises)
      .values(rows.slice(i * EXERCISES_PER_INSERT, (i + 1) * EXERCISES_PER_INSERT))
      .onConflictDoNothing()
  );
}

export async function createExercise(
  db: D1Database,
  userId: string,
  id: string,
  e: ExerciseInput
): Promise<ExerciseRow> {
  return drizzle(db)
    .insert(exercises)
    .values(exerciseValues(userId, id, e, new Date().toISOString()))
    .returning()
    .get();
}

/** Brings an archived exercise back into the lists. */
export async function restoreExercise(
  db: D1Database,
  userId: string,
  row: ExerciseRow
): Promise<ExerciseRow> {
  await drizzle(db)
    .update(exercises)
    .set({ archived: false, updated_at: new Date().toISOString() })
    .where(and(eq(exercises.user_id, userId), eq(exercises.id, row.id)));
  return { ...row, archived: false };
}

/** Whether any workout item or logged exercise names it, in any case. */
async function exerciseInUse(d: DrizzleD1Database, userId: string, name: string): Promise<boolean> {
  const key = exerciseNameKey(name);
  const [ws, as] = await d.batch([
    d.select({ json: workouts.items_json }).from(workouts).where(eq(workouts.user_id, userId)),
    d.select({ json: activities.done_json }).from(activities).where(eq(activities.user_id, userId)),
  ]);
  return [...ws, ...as].some((row) =>
    (JSON.parse(row.json) as { exercise: string }[]).some(
      (x) => exerciseNameKey(x.exercise) === key
    )
  );
}

/** Deletes an exercise nothing uses; one in use is archived instead, keeping its history. */
export async function removeExercise(
  db: D1Database,
  userId: string,
  row: ExerciseRow
): Promise<"deleted" | "archived"> {
  const d = drizzle(db);
  const where = and(eq(exercises.user_id, userId), eq(exercises.id, row.id));
  if (await exerciseInUse(d, userId, row.name)) {
    await d
      .update(exercises)
      .set({ archived: true, updated_at: new Date().toISOString() })
      .where(where);
    return "archived";
  }
  await d.delete(exercises).where(where);
  return "deleted";
}

/**
 * Writes `name` over every item and logged exercise named `from` in any case, in the
 * user's workouts and activities, in one batch with `then`.
 */
async function renameEverywhere(
  d: DrizzleD1Database,
  userId: string,
  from: string,
  name: string,
  then: BatchItem<"sqlite">
): Promise<void> {
  const key = exerciseNameKey(from);
  const hit = (x: { exercise: string }): boolean => exerciseNameKey(x.exercise) === key;
  const renamed = <T extends { exercise: string }>(x: T): T =>
    hit(x) ? { ...x, exercise: name } : x;
  const [ws, as] = await d.batch([
    d
      .select({ id: workouts.id, kind: workouts.kind, json: workouts.items_json })
      .from(workouts)
      .where(eq(workouts.user_id, userId)),
    d
      .select({ id: activities.id, json: activities.done_json })
      .from(activities)
      .where(eq(activities.user_id, userId)),
  ]);
  const now = new Date().toISOString();
  const workoutWrites = ws.flatMap((w) => {
    const items = JSON.parse(w.json) as Item[];
    if (exerciseKindOf(w.kind) === null || !items.some(hit)) return [];
    const json = JSON.stringify(items.map(renamed));
    return [
      d
        .update(workouts)
        .set({ items_json: json, updated_at: now })
        .where(and(eq(workouts.user_id, userId), eq(workouts.id, w.id))),
    ];
  });
  const activityWrites = as.flatMap((a) => {
    const done = JSON.parse(a.json) as ItemDone[];
    if (!done.some(hit)) return [];
    return [
      d
        .update(activities)
        .set({ done_json: JSON.stringify(done.map(renamed)), updated_at: now })
        .where(and(eq(activities.user_id, userId), eq(activities.id, a.id))),
    ];
  });
  await d.batch([then, ...workoutWrites, ...activityWrites]);
}

/** Saves the exercise, shown again if archived, and renames every workout and log that names it. */
export async function updateExercise(
  db: D1Database,
  userId: string,
  row: ExerciseRow,
  e: ExerciseInput
): Promise<ExerciseRow> {
  const d = drizzle(db);
  const where = and(eq(exercises.user_id, userId), eq(exercises.id, row.id));
  const fields = {
    name: e.name,
    name_key: exerciseNameKey(e.name),
    kind: e.kind,
    measure: e.measure ?? row.measure,
    each_side: e.eachSide ?? row.each_side,
    built_in: e.builtIn === undefined ? row.built_in : e.builtIn,
    archived: false,
    updated_at: new Date().toISOString(),
  };
  await renameEverywhere(d, userId, row.name, e.name, d.update(exercises).set(fields).where(where));
  return { ...row, ...fields };
}

/** Folds `from` into `into`: every workout and log naming it takes `into`'s name. */
export async function mergeExercise(
  db: D1Database,
  userId: string,
  from: ExerciseRow,
  into: ExerciseRow
): Promise<void> {
  const d = drizzle(db);
  await renameEverywhere(
    d,
    userId,
    from.name,
    into.name,
    d.delete(exercises).where(and(eq(exercises.user_id, userId), eq(exercises.id, from.id)))
  );
}
