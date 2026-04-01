-- name: ListSessionsBySettingsId :many
SELECT
    id,
    title,
    session_time
FROM sessions
WHERE settings_id = ?
ORDER BY session_time, id;

-- name: CreateSession :execresult
INSERT INTO sessions (
    id,
    settings_id,
    title,
	session_time
) VALUES (
   ?, ?, ?, ?
);

-- name: UpdateSession :execresult
UPDATE sessions
SET
    title = ?,
    session_time = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND settings_id = ?;

-- name: DeleteSession :execresult
DELETE FROM sessions
WHERE id = ? AND settings_id = ?;
