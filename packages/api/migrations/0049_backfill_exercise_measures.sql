-- Data-only: each exercise takes its measure from the sets logged under its name,
-- else from the doses its workouts write, else its kind's default, as measureOf in
-- @sendtally/core reads them: weight with time or reps, then time (rounds for other
-- and climbing), then reps.
UPDATE exercises
SET measure = coalesce(
  (
    SELECT CASE
      WHEN max(json_type(s.value, '$.weightKg') IS NOT NULL) = 1 THEN
        CASE WHEN max(json_type(s.value, '$.onS') IS NOT NULL) = 1
          THEN 'secondsWeight' ELSE 'repsWeight' END
      WHEN max(json_type(s.value, '$.onS') IS NOT NULL) = 1 THEN
        CASE WHEN exercises.kind IN ('other', 'climbing') THEN 'rounds' ELSE 'seconds' END
      WHEN max(json_type(s.value, '$.reps') IS NOT NULL) = 1 THEN 'reps'
    END
    FROM activities a, json_each(a.done_json) d, json_each(d.value, '$.sets') s
    WHERE a.user_id = exercises.user_id
      AND lower(trim(json_extract(d.value, '$.exercise'))) = exercises.name_key
  ),
  (
    SELECT CASE
      WHEN max(json_type(s.value, '$.weightKg') IS NOT NULL) = 1 THEN
        CASE WHEN max(json_type(s.value, '$.onS') IS NOT NULL) = 1
          THEN 'secondsWeight' ELSE 'repsWeight' END
      WHEN max(json_type(s.value, '$.onS') IS NOT NULL) = 1 THEN
        CASE WHEN exercises.kind IN ('other', 'climbing') THEN 'rounds' ELSE 'seconds' END
      WHEN max(json_type(s.value, '$.reps') IS NOT NULL) = 1 THEN 'reps'
    END
    FROM workouts w, json_each(w.items_json) i, json_each(i.value, '$.doses') s
    WHERE w.user_id = exercises.user_id
      AND w.kind != 'hangboard'
      AND lower(trim(json_extract(i.value, '$.exercise'))) = exercises.name_key
  ),
  CASE exercises.kind
    WHEN 'strength' THEN 'repsWeight'
    WHEN 'mobility' THEN 'seconds'
    ELSE 'rounds'
  END
);
