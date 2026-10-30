-- Data-only: planning v2 moves every workout onto one shape (variations of items,
-- each with a dose) and every plan onto memberships of library workouts.
-- Hand-written because drizzle-kit diffs schema, not rows. The next migration
-- drops what this one has copied out of.

-- A plan item with its own template, or whose workout is gone, gets a workout
-- of its own to link: built-in ids live in the apps, so they count as existing.
INSERT OR IGNORE INTO workouts (
  user_id, id, name, category, description, tags_json, minutes, target_rpe,
  body_kind, body_json, created_at, updated_at
)
SELECT
  p.user_id, 'plan-' || p.id, p.title, p.kind, NULL, '[]', p.minutes, p.target_rpe,
  p.template_kind, p.template_json, p.updated_at, p.updated_at
FROM plan_items p
WHERE (p.workout_id IS NULL OR (
    p.workout_id NOT IN (
      'strength-5x5', 'strength-antagonist', 'strength-extensors', 'mobility-hips',
      'yoga-climbers', 'run-tempo', 'other-core', 'climb-limit', 'climb-4x4', 'climb-arc'
    )
    AND NOT EXISTS (
      SELECT 1 FROM workouts w WHERE w.user_id = p.user_id AND w.id = p.workout_id
    )
  ))
  AND (p.block_id IS NOT NULL OR p."end" IS NULL OR p."end" > date('now'));
--> statement-breakpoint

-- Five kinds: run folds into other, yoga into mobility.
UPDATE workouts
SET
  kind = CASE category
    WHEN 'climb' THEN 'climbing'
    WHEN 'strength' THEN 'strength'
    WHEN 'mobility' THEN 'mobility'
    WHEN 'yoga' THEN 'mobility'
    ELSE 'other'
  END,
  pattern_json = '[0]',
  variations_json = json_array(json_object(
    'label', '',
    'items', json(CASE json_extract(body_json, '$.kind')
      WHEN 'sets' THEN (
        SELECT json_group_array(json_object(
          'exercise', json_extract(e.value, '$.name'),
          'dose', json_patch('{}', json_object(
            'sets', max(1, json_array_length(e.value, '$.sets')),
            'reps', json_extract(e.value, '$.sets[0].reps'),
            'weightKg', json_extract(e.value, '$.sets[0].loadKg'),
            'onS', json_extract(e.value, '$.sets[0].seconds')
          ))
        ))
        FROM json_each(body_json, '$.exercises') e
      )
      WHEN 'checklist' THEN (
        SELECT json_group_array(json_object(
          'exercise', json_extract(i.value, '$.text'),
          'dose', json_object('sets', 1)
        ))
        FROM json_each(body_json, '$.items') i
      )
      WHEN 'intervals' THEN (
        SELECT json_group_array(json_object(
          'exercise', json_extract(s.value, '$.label'),
          'dose', json_patch('{}', json_object(
            'sets', json_extract(body_json, '$.rounds'),
            'reps', json_extract(s.value, '$.count'),
            'onS', json_extract(s.value, '$.seconds'),
            'offS', nullif(json_extract(s.value, '$.restAfter'), 0),
            'weightKg', json_extract(s.value, '$.loadKg')
          ))
        ))
        FROM json_each(body_json, '$.steps') s
      )
      ELSE '[]'
    END)
  ));
--> statement-breakpoint

-- Hangboard workouts join the one library: one item, its grip, its protocol.
INSERT OR IGNORE INTO workouts (
  user_id, id, name, category, description, tags_json, minutes, target_rpe,
  kind, variations_json, pattern_json, created_at, updated_at
)
SELECT
  user_id, id, name, 'other', NULL, '[]', NULL, NULL, 'hangboard',
  json_array(json_object(
    'label', '',
    'items', json_array(json_object(
      'exercise', grip,
      'dose', json_patch('{}', json_object(
        'sets', sets,
        'reps', reps,
        'onS', CASE WHEN kind = 'hang' THEN hang_s END,
        'offS', CASE WHEN kind = 'hang' AND rest_s > 0 THEN rest_s END,
        'setRestS', nullif(set_rest_s, 0)
      ))
    ))
  )),
  '[0]', created_at, updated_at
FROM hang_workouts;
--> statement-breakpoint

-- Plan items become memberships under the same id. Weekdays only: a weekly
-- count spreads over the week. Finished plans outside a block are left out.
INSERT OR IGNORE INTO memberships (user_id, id, workout_id, block_id, weekdays_json, start, updated_at)
SELECT
  p.user_id,
  p.id,
  CASE
    WHEN EXISTS (SELECT 1 FROM workouts w WHERE w.user_id = p.user_id AND w.id = 'plan-' || p.id)
      THEN 'plan-' || p.id
    ELSE p.workout_id
  END,
  p.block_id,
  CASE
    WHEN p.per_week IS NULL THEN p.days_json
    WHEN p.per_week = 1 THEN '[0]'
    WHEN p.per_week = 2 THEN '[0,3]'
    WHEN p.per_week = 3 THEN '[0,2,4]'
    WHEN p.per_week = 4 THEN '[0,1,3,4]'
    WHEN p.per_week = 5 THEN '[0,1,2,3,4]'
    WHEN p.per_week = 6 THEN '[0,1,2,3,4,5]'
    ELSE '[0,1,2,3,4,5,6]'
  END,
  p.start,
  p.updated_at
FROM plan_items p
WHERE p.block_id IS NOT NULL OR p."end" IS NULL OR p."end" > date('now');
--> statement-breakpoint

-- Hangboard schedules too. The grip and planned setup were per schedule; the
-- workout's grip and the last session's setup take over.
INSERT OR IGNORE INTO memberships (user_id, id, workout_id, block_id, weekdays_json, start, updated_at)
SELECT user_id, id, workout_id, block_id, days_json, start, updated_at
FROM hang_schedules
WHERE block_id IS NOT NULL OR "end" IS NULL OR "end" > date('now');
--> statement-breakpoint

-- A block ended early keeps the weeks it ran.
UPDATE training_blocks
SET weeks = max(1, (CAST(julianday(ended_on) - julianday(start) AS INTEGER) + 6) / 7)
WHERE ended_on IS NOT NULL AND ended_on < date(start, '+' || (weeks * 7) || ' days');
--> statement-breakpoint

-- Activities: the five kinds, the plan they ran, and what was done as sets.
UPDATE activities
SET
  kind = CASE kind WHEN 'run' THEN 'other' WHEN 'yoga' THEN 'mobility' ELSE kind END,
  workout_id = COALESCE(workout_id, (
    SELECT m.workout_id FROM memberships m
    WHERE m.user_id = activities.user_id AND m.id = activities.plan_item_id
  )),
  membership_id = (
    SELECT m.id FROM memberships m
    WHERE m.user_id = activities.user_id AND m.id = activities.plan_item_id
  ),
  done_json = CASE json_extract(detail_json, '$.kind')
    WHEN 'sets' THEN (
      SELECT json_group_array(json_object(
        'item', e.key,
        'exercise', json_extract(e.value, '$.name'),
        'sets', json((
          SELECT json_group_array(json_patch('{}', json_object(
            'reps', json_extract(st.value, '$.reps'),
            'weightKg', json_extract(st.value, '$.loadKg'),
            'onS', json_extract(st.value, '$.seconds')
          )))
          FROM json_each(e.value, '$.sets') st
          WHERE json_extract(st.value, '$.done') = 1
        ))
      ))
      FROM json_each(detail_json, '$.exercises') e
    )
    WHEN 'checklist' THEN (
      SELECT json_group_array(json_object(
        'item', i.key,
        'exercise', json_extract(i.value, '$.text'),
        'sets', json(CASE WHEN json_extract(i.value, '$.done') = 1 THEN '[{}]' ELSE '[]' END)
      ))
      FROM json_each(detail_json, '$.items') i
    )
    WHEN 'intervals' THEN (
      SELECT json_group_array(json_object(
        'item', s.key,
        'exercise', json_extract(s.value, '$.label'),
        'sets', json((
          SELECT json_group_array(json_patch('{}', json_object(
            'onS', COALESCE(json_extract(d.value, '$.heldSeconds'), json_extract(s.value, '$.seconds')),
            'reps', json_extract(s.value, '$.count'),
            'weightKg', json_extract(s.value, '$.loadKg')
          )))
          FROM json_each(detail_json, '$.stepsDone') d
          WHERE json_extract(d.value, '$.step') = s.key
        ))
      ))
      FROM json_each(detail_json, '$.steps') s
    )
    ELSE '[]'
  END;
