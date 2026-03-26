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
    COALESCE(m.meal_count, 0) AS meal_count,
    COALESCE(s.session_count, 0) AS session_count,
    active
FROM settings sett
LEFT JOIN (
    SELECT settings_id, COUNT(*) AS meal_count
    FROM meals
    GROUP BY settings_id
) m ON sett.id = m.settings_id
LEFT JOIN (
    SELECT settings_id, COUNT(*) AS session_count
    FROM sessions
    GROUP BY settings_id
) s ON sett.id = s.settings_id
WHERE sett.end_date > NOW()
ORDER BY sett.start_date, sett.id
LIMIT ?
OFFSET ?;

-- name: CountSettings :one
SELECT COUNT(*)
FROM settings
WHERE end_date > NOW();

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

