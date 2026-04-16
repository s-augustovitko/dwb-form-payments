-- name: CreateForm :exec
INSERT INTO forms (
    id, 
    title, 
    description, 
    form_type,
    start_date, 
    end_date
) VALUES (
    ?, 
    ?, 
    ?, 
    ?, 
    ?, 
    ? 
);

-- name: ListForms :many
SELECT 
    id, 
    title, 
    form_type, 
    start_date, 
    end_date, 
    active
FROM forms
WHERE active = ?
ORDER BY start_date DESC, id DESC
LIMIT ?
OFFSET ?;

-- name: CountForms :one
SELECT COUNT(*)
FROM forms
WHERE active = ?;

-- name: UpdateForm :exec
UPDATE forms
SET 
    form_type = ?,
    title = ?,
    description = ?,
    start_date = ?,
    end_date = ?
WHERE id = ?;

-- name: UpdateFormStatus :exec
UPDATE forms
SET active = ?
WHERE id = ?;

-- name: GetFormByID :one
SELECT
    id,
    title,
    form_type,
    description,
    start_date,
    end_date
FROM forms
WHERE id = ?;
