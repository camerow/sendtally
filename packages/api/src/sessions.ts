import type { Context } from "hono";
import { type AppEnv, captureEvent } from "./context";
import { applyProjectFlags, climbNotesOf, climbSlug, placeLoggedClimbs } from "./lib/climbs";
import { importFingerprint, manualBodyOf, type ImportSessionBody } from "./lib/import";
import {
  buildManualSession,
  climbLinksOf,
  historySession,
  normalisedNote,
  type ManualSessionBody,
} from "./lib/manual";
import * as repo from "./lib/repo";

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
  const gymIdByName = new Map(
    (await repo.listGyms(c.env.DB, userId)).map((g) => [g.name.toLowerCase(), g.id])
  );
  const history = await manualScoringHistory(c.env.DB, userId);
  const ordered = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  let imported = 0;
  let skipped = 0;
  for (const session of ordered) {
    const fingerprint = await importFingerprint(session);
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
