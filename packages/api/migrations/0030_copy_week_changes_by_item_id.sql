-- Data-only: week changes move from an item's place to its id. Items saved before ids read
-- their place as their id, so each change keeps pointing at the item it was made for.
INSERT INTO item_week_changes (user_id, membership_id, week, dose, item_id, change_json)
SELECT user_id, membership_id, week, variation, CAST(item AS TEXT), change_json
FROM week_changes;
