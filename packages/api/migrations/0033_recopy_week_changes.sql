-- Data-only: week changes saved to the old table while an older Worker still ran after 0030
-- copied it. Rows already copied keep their item_week_changes version.
INSERT OR IGNORE INTO item_week_changes (user_id, membership_id, week, dose, item_id, change_json)
SELECT user_id, membership_id, week, variation, CAST(item AS TEXT), change_json
FROM week_changes;
