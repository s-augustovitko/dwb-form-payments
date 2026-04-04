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
ORDER BY active DESC, start_date DESC, id DESC
LIMIT ?
OFFSET ?;

-- name: CountForms :one
SELECT COUNT(*)
FROM forms;

-- name: UpdateForm :exec
UPDATE forms
SET 
    title = ?,
    description = ?,
    start_date = ?,
    end_date = ?
WHERE id = ?;

-- name: UpdateFormStatus :exec
UPDATE forms
SET active = ?
WHERE id = ?;

