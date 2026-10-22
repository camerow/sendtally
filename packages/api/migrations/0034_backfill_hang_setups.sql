-- Data-only: edge depth and added weight move off the workout and onto each use.
-- Hand-written because drizzle-kit diffs schema, not rows. Nothing is removed:
-- hang_workouts.edge_mm and hang_loads stay for app builds that still read them.

-- A session's edge was snapshotted in its protocol.
UPDATE hang_sessions
SET edge_mm = COALESCE(json_extract(protocol_json, '$.edgeMm'), 0);
--> statement-breakpoint

-- A schedule plans what its workout and grip held: the workout's edge (library
-- hangs are on 20 mm, ground pulls on none) and the grip's load, when one was set.
UPDATE hang_schedules
SET
  edge_mm = COALESCE(
    (
      SELECT w.edge_mm FROM hang_workouts w
      WHERE w.user_id = hang_schedules.user_id AND w.id = hang_schedules.workout_id
    ),
    CASE
      WHEN workout_id IN ('rep73', 'max10', 'density', 'assist') THEN 20
      WHEN workout_id IN ('block', 'lowpull') THEN 0
    END
  ),
  load_kg = (
    SELECT l.kg FROM hang_loads l
    WHERE l.user_id = hang_schedules.user_id
      AND l.workout_id = hang_schedules.workout_id
      AND l.grip_id = hang_schedules.grip_id
  );
