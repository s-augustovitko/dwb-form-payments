-- name: ListFormResponsesPaged :many
SELECT
    *
FROM form_responses
WHERE
    settings_id = ?
ORDER BY created_at
LIMIT ?
OFFSET ?;

-- name: ListAllFormResponses :many
SELECT
    *
FROM form_responses
WHERE
    settings_id = ?
ORDER BY created_at;

-- name: ListSuccessFormResponses :many
SELECT
    *
FROM form_responses
WHERE
    settings_id = ? AND
    payment_status IN ('NOT_NEEDED', 'SUCCESS')
ORDER BY created_at;
