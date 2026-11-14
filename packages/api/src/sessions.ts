import type { Context } from "hono";
import type { Env } from "./bindings";
import { type AppEnv, captureEvent, postAfterResponse } from "./context";
import { isOpen, isRegion } from "./lib/areas";
import {
  applyProjectFlags,
  climbNotesOf,
  climbResolver,
  climbSlug,
  placeLoggedClimbs,
  withClimbNotes,
} from "./lib/climbs";
import { importFingerprint } from "@sendtally/core/import";
import { manualBodyOf, sha256Hex, type ImportSessionBody } from "./lib/import";
import {
  buildManualSession,
  climbLinksOf,
  historySession,
  normalisedNote,
  parseClimbs,
  type ManualSessionBody,
} from "./lib/manual";
import { syncSessionToStrava } from "./lib/posting";
import * as repo from "./lib/repo";

export const areaIdsOnPath = (path: string): string[] => path.split("/").filter((id) => id !== "");

export const sessionResponse = async (env: Env, userId: string, fingerprint: string) => {
  const [row, viewer] = await Promise.all([
    repo.getSession(env.DB, userId, fingerprint),
    repo.getViewer(env.DB, userId),
  ]);
  if (row === null) return null;
  const { climbs_json, notes: _legacyNotes, ...rest } = row;
  const [tags, entries, climbNotes, links, records] = await Promise.all([
    repo.getSessionTags(env.DB, userId, fingerprint),
    entriesResponse(env, userId, (e) => e.fingerprints.includes(fingerprint)),
    repo.getSessionClimbNotes(env.DB, userId, fingerprint),
    repo.getSessionLinks(env.DB, viewer, fingerprint, row.area_id),
    repo.listUserClimbs(env.DB, userId),
  ]);
  const record = climbResolver(records.filter((r) => r.deleted_at === null));
  const climbs = parseClimbs(climbs_json);
  const areaIdOf = (climb: (typeof climbs)[number]): string | null =>
    climbSlug(climb.name.trim()) === "" ? null : (record(climb)?.area_id ?? null);
  const places = new Map(
    (await repo.areasByIds(env.DB, viewer, [...new Set(climbs.flatMap((c) => areaIdOf(c) ?? []))]))
      .filter(isOpen)
      .map((a) => [a.id, { id: a.id, name: a.name, slug: a.slug }])
  );
  const placeOf = (climb: (typeof climbs)[number]) => places.get(areaIdOf(climb) ?? "") ?? null;
  const climbAreas = [
    ...new Map(climbs.flatMap((c) => placeOf(c) ?? []).map((a) => [a.id, a])).values(),
  ];
  const areas = climbAreas.length > 0 ? climbAreas : links.area === null ? [] : [links.area];
  // `notes` is the log form's single field, now the session's first note entry.
  // Kept on the response so the session page and the edit form need no change.
  const notes = entries.find((e) => e.kind === "journal" && e.parent_id === null)?.body ?? null;
  return {
    ...rest,
    notes,
    tags,
    entries,
    areas,
    area: areas[0] ?? null,
    climbs: withClimbNotes(climbs, climbNotes).map((climb) => ({
      ...climb,
      area: placeOf(climb),
      link: links.climbs.get(climbSlug(climb.name.trim())) ?? null,
    })),
  };
};

// Every area must be a live, visible area below the regions, and every linked
// climb live and visible, so nobody links to someone else's pending creation.
// A linked climb sits at its Areas climb's area, and nowhere else.
export const placedClimbs = async (
  db: D1Database,
  userId: string,
  form: ManualSessionBody
): Promise<{ error: string } | { form: ManualSessionBody }> => {
  const viewer = await repo.getViewer(db, userId);
  const areaIds = [...new Set(form.climbs.flatMap((climb) => climb.areaId ?? []))];
  const areas = (await repo.areasByIds(db, viewer, areaIds)).filter(
    (area) => !isRegion(area) && isOpen(area)
  );
  if (areas.length !== areaIds.length) return { error: "unknown area" };
  const ids = [...new Set(climbLinksOf(form.climbs).map((l) => l.climb_id))];
  const found = (await repo.areaClimbsByIds(db, viewer, ids)).filter(isOpen);
  if (found.length !== ids.length) return { error: "unknown climb" };
  const areaOfClimb = new Map(found.map((climb) => [climb.id, climb.area_id]));
  const linkedAreas = await repo.areasByIds(db, viewer, [...new Set(areaOfClimb.values())]);
  const pathOf = new Map(linkedAreas.map((area) => [area.id, areaIdsOnPath(area.path)]));
  // Areas search covers the sectors under the picked area, so a climb found in one sits there.
  const linkedAt = (climb: ManualSessionBody["climbs"][number]): string | undefined =>
    climb.climbId === undefined ? undefined : areaOfClimb.get(climb.climbId);
  const misplaced = form.climbs.some((climb) => {
    const at = linkedAt(climb);
    return (
      at !== undefined &&
      climb.areaId !== undefined &&
      !(pathOf.get(at) ?? [at]).includes(climb.areaId)
    );
  });
  const climbs = form.climbs.map((climb) => {
    const at = linkedAt(climb);
    return at === undefined ? climb : { ...climb, areaId: at };
  });
  return misplaced ? { error: "climb is at another area" } : { form: { ...form, climbs } };
};

// One read of the user's entries, tagged, filtered in memory. There are never
// many, and the alternative is a per-entry tag query.
export type EntryResponse = repo.EntryRow & { tags: repo.TagRow[]; fingerprints: string[] };

export const entriesResponse = async (
  env: Env,
  userId: string,
  keep: (entry: EntryResponse) => boolean = () => true
): Promise<EntryResponse[]> => {
  const [rows, tagsByEntry, sessionsByEntry] = await Promise.all([
    repo.listEntries(env.DB, userId),
    repo.tagsByEntry(env.DB, userId),
    repo.sessionsByEntry(env.DB, userId),
  ]);
  return rows
    .map((entry) => ({
      ...entry,
      tags: tagsByEntry.get(entry.id) ?? [],
      fingerprints: sessionsByEntry.get(entry.id) ?? [],
    }))
    .filter(keep);
};

export const saveManualSession = async (
  c: Context<AppEnv>,
  fingerprint: string,
  form: ManualSessionBody,
  created: boolean
) => {
  await writeManualSession(c, fingerprint, form, created);
  const userId = c.get("userId");
  const body = { session: await sessionResponse(c.env, userId, fingerprint) };
  // Already posted sessions get the activity patched, never a second one.
  postAfterResponse(c, fingerprint, () => syncSessionToStrava(c.env, userId, fingerprint));
  return body;
};

export type SessionEdit = { session: SessionResponse } | { error: string; status: 400 | 404 | 409 };

export type SessionResponse = NonNullable<Awaited<ReturnType<typeof sessionResponse>>>;

// Legacy board rows are read-only history, so only manual sessions are re-scored.
export const editManualSession = async (
  c: Context<AppEnv>,
  fingerprint: string,
  form: ManualSessionBody
): Promise<SessionEdit> => {
  const userId = c.get("userId");
  const [existing, placed] = await Promise.all([
    repo.getSession(c.env.DB, userId, fingerprint),
    placedClimbs(c.env.DB, userId, form),
  ]);
  if (existing === null) return { error: "not found", status: 404 };
  if (existing.source !== "manual") {
    return { error: "only manually logged sessions can be edited", status: 409 };
  }
  if ("error" in placed) return { error: placed.error, status: 400 };
  const { session } = await saveManualSession(c, fingerprint, placed.form, false);
  return session === null ? { error: "not found", status: 404 } : { session };
};

// Strava is left alone: an activity already posted stays on Strava.
export const deleteOwnSession = async (
  c: Context<AppEnv>,
  fingerprint: string
): Promise<boolean> => {
  const userId = c.get("userId");
  const existing = await repo.getSession(c.env.DB, userId, fingerprint);
  if (existing === null) return false;
  await repo.deleteSession(c.env.DB, userId, fingerprint);
  await repo.unlinkSession(c.env.DB, userId, fingerprint);
  await captureEvent(c, "manual_session_deleted", { session_source: existing.source });
  return true;
};

const manualScoringHistory = async (
  db: D1Database,
  userId: string,
  excludeFingerprint?: string
) => {
  const rows = await repo.listSessions(db, userId, true);
  return rows
    .filter((r) => r.fingerprint !== excludeFingerprint && r.rpe_source !== "none")
    .map(historySession)
    .filter((s): s is NonNullable<typeof s> => s !== null);
};

export const gymIdsByName = async (db: D1Database, userId: string): Promise<Map<string, string>> =>
  new Map((await repo.listGyms(db, userId)).map((g) => [g.name.toLowerCase(), g.id]));

export const writeManualSession = async (
  c: Context<AppEnv>,
  fingerprint: string,
  form: ManualSessionBody,
  created: boolean
): Promise<void> => {
  const db = c.env.DB;
  const userId = c.get("userId");
  const history = await manualScoringHistory(db, userId, fingerprint);
  const input = buildManualSession(fingerprint, form, history);
  const links = climbLinksOf(form.climbs);
  if (created) await repo.insertManualSession(db, userId, input, links);
  else await repo.updateManualSession(db, userId, input, links);
  // The rows around a session live in their own tables, so they are written side by side.
  await Promise.all([
    repo.upsertSessionNote(db, userId, fingerprint, form.date, normalisedNote(form.notes)),
    repo.setSessionTags(db, userId, fingerprint, form.tags ?? []),
    repo
      .restoreUserClimbs(db, userId, {
        nameKeys: form.climbs.map((climb) => climbSlug(climb.name)).filter((key) => key !== ""),
        ids: form.climbs.flatMap((climb) => climb.userClimbId ?? []),
      })
      .then(() => placeLoggedClimbs(db, userId, form.climbs))
      .then(() => applyProjectFlags(db, userId, form.climbs)),
    repo.setClimbNotes(db, userId, fingerprint, climbNotesOf(form.climbs)),
  ]);
  await captureEvent(c, created ? "manual_session_created" : "manual_session_updated", {
    session_source: "manual",
  });
};

// Scored oldest first so each one sees the ones before it as history, and
// skipped when its fingerprint is already there, so a file imported twice adds
// nothing. Never posted to Strava.
export const importSessions = async (
  c: Context<AppEnv>,
  sessions: ImportSessionBody[]
): Promise<{ imported: number; skipped: number }> => {
  const userId = c.get("userId");
  await repo.ensureUser(c.env.DB, userId);
  const gymIdByName = await gymIdsByName(c.env.DB, userId);
  const history = await manualScoringHistory(c.env.DB, userId);
  const ordered = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  let imported = 0;
  let skipped = 0;
  for (const session of ordered) {
    const fingerprint = await importFingerprint(session, sha256Hex);
    if ((await repo.getSession(c.env.DB, userId, fingerprint)) !== null) {
      skipped++;
      continue;
    }
    const form = manualBodyOf(session, gymIdByName);
    const input = buildManualSession(fingerprint, form, history);
    await repo.insertManualSession(c.env.DB, userId, input);
    await repo.upsertSessionNote(
      c.env.DB,
      userId,
      fingerprint,
      form.date,
      normalisedNote(form.notes)
    );
    if (form.tags !== undefined)
      await repo.setSessionTags(c.env.DB, userId, fingerprint, form.tags);
    await repo.setClimbNotes(c.env.DB, userId, fingerprint, climbNotesOf(form.climbs));
    const scored = historySession(input);
    if (scored !== null) history.push(scored);
    imported++;
  }
  await captureEvent(c, "sessions_imported", {
    imported: String(imported),
    skipped: String(skipped),
  });
  return { imported, skipped };
};
