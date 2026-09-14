-- Data-only migration: the single notes column on a session becomes a journal
-- entry of its own, dated to the session and linked to it. Hand-written
-- because drizzle-kit diffs schema, not rows; nothing here changes the schema.
-- sessions.notes is left in place and stops being written; a later migration
-- drops it once production is confirmed.
INSERT INTO journal_entries (
  user_id, id, kind, occurred_at, ends_at, title, body,
  parent_id, severity, status, created_at, updated_at
)
SELECT
  s.user_id,
  'note-' || s.fingerprint,
  'journal',
  substr(s.start_at, 1, 10),
  NULL,
  NULL,
  s.notes,
  NULL,
  NULL,
  NULL,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM sessions s
WHERE s.notes IS NOT NULL
  AND trim(s.notes) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM journal_entries e
    WHERE e.user_id = s.user_id AND e.id = 'note-' || s.fingerprint
  );
--> statement-breakpoint
INSERT INTO entry_sessions (user_id, entry_id, fingerprint)
SELECT s.user_id, 'note-' || s.fingerprint, s.fingerprint
FROM sessions s
WHERE s.notes IS NOT NULL
  AND trim(s.notes) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM entry_sessions es
    WHERE es.user_id = s.user_id AND es.entry_id = 'note-' || s.fingerprint
  );
