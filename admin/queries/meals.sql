-- name: CreateMeal :execresult
INSERT INTO meals (
    id,
    settings_id,
    title
) VALUES (
   ?, ?, ?
);

-- name: UpdateMeal :execresult
UPDATE meals
SET
    title = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND settings_id = ?;

-- name: DeleteMeal :execresult
DELETE FROM meals
WHERE id = ? AND settings_id = ?;

