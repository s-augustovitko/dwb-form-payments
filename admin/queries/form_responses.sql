-- name: ListFormResponsesPaged :many
SELECT
    *
FROM form_responses
WHERE
    settings_id = ?
LIMIT ?
OFFSET ?;

-- name: ListAllFormResponses :many
SELECT
    *
FROM form_responses
WHERE
    settings_id = ?;

-- name: ListSuccessFormResponses :many
SELECT
    *
FROM form_responses
WHERE
    settings_id = ? AND
    payment_status IN ('NOT_NEEDED', 'SUCCESS');
