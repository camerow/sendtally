-- Data-only migration: the single notes column on a session becomes a journal
-- entry of its own, dated to the session and attached to it. Hand-written
-- because drizzle-kit diffs schema, not rows; nothing here changes the schema.
-- sessions.notes is left in place and stops being written; a later migration
-- drops it once production is confirmed.
INSERT INTO journal_entries (
  user_id, id, kind, occurred_at, ends_at, title, body,
  fingerprint, parent_id, severity, status, created_at, updated_at
)
SELECT
  s.user_id,
  lower(hex(randomblob(16))),
  'note',
  substr(s.start_at, 1, 10),
  NULL,
  NULL,
  s.notes,
  s.fingerprint,
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
    WHERE e.user_id = s.user_id AND e.fingerprint = s.fingerprint
  );
