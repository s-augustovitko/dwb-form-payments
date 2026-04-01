-- name: CreateSettings :execresult
INSERT INTO settings (
    id,
    title,
    description,
    form_type,
    start_date,
    end_date,
    meal_price_pen,
    meal_price_usd,
    session_price_pen,
    session_price_usd
) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
);

-- name: ListSettingsPaged :many
SELECT
    sett.id as id,
    sett.form_type,
    sett.title,
    sett.start_date,
    sett.end_date,
    active
FROM settings sett
ORDER BY sett.active DESC, sett.start_date DESC, sett.id
LIMIT ?
OFFSET ?;

-- name: CountSettings :one
SELECT COUNT(*)
FROM settings;

-- name: GetSettingsByID :one
SELECT
    id,
    title,
    description,
    form_type,
    start_date,
    end_date,
    meal_price_pen,
    meal_price_usd,
    session_price_pen,
    session_price_usd,
    disclaimer,
    active
FROM settings
WHERE
    id = ?;

-- name: UpdateSettings :execresult
UPDATE settings
SET
    title = ?,
    description = ?,
    start_date = ?,
    end_date = ?,
    meal_price_pen = ?,
    meal_price_usd = ?,
    session_price_pen = ?,
    session_price_usd = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- name: DeleteSettings :execresult
DELETE FROM settings
WHERE id = ?;

-- name: UpdateActiveSettings :execresult
UPDATE settings
SET
    active = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

