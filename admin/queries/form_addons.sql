-- name: UpsertAddon :exec
INSERT INTO addons (
    id, 
    form_id, 
    title, 
    addon_type, 
    sort_order, 
    price, 
    currency, 
    date_time, 
    hint
) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?
) ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    price = VALUES(price),
    currency = VALUES(currency),
    sort_order = VALUES(sort_order),
    date_time = VALUES(date_time),
    hint = VALUES(hint);

-- name: CreateAddon :copyfrom
INSERT INTO addons (
    id, 
    form_id, 
    title, 
    addon_type, 
    sort_order, 
    price, 
    currency, 
    date_time, 
    hint
) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?
);

-- name: UpdateAddonStatus :exec
UPDATE addons
SET active = ?
WHERE id = ?;

-- name: DeleteAddon :exec
DELETE FROM addons
WHERE id = ? AND form_id = ?;

-- name: GetAddonsByFormID :many
SELECT 
    id, 
    title,
    addon_type, 
    sort_order, 
    price,
    currency, 
    date_time, 
    hint,
    active
FROM addons
WHERE form_id = ?
ORDER BY addon_type DESC, sort_order ASC;

